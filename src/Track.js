export class Track {
    constructor() {
        this.points = [];
        this.width = 100;
        this.generate();
    }

    generate() {
        this.points = [];
        const numPoints = 20;
        const margin = 400; // Keep away from edges
        const width = 3000; // Virtual world size
        const height = 3000;

        // Generate random points scattered widely
        const randomPoints = [];
        for (let i = 0; i < numPoints; i++) {
            randomPoints.push({
                x: Math.random() * (width - margin * 2) + margin,
                y: Math.random() * (height - margin * 2) + margin
            });
        }

        // 1. Start with Convex Hull (Guaranteed loop)
        let hull = this.convexHull(randomPoints);

        // 2. Perturb the hull to create concavities and complexity
        // We do this by subdividing edges and displacing the midpoints
        let complexShape = this.perturb(hull);

        // 3. Smooth the track
        // Run smoothing more times for a fluid driving line
        this.points = this.smoothTrack(complexShape, 5);
    }

    perturb(points) {
        const newPoints = [];
        const center = this.getCentroid(points);

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            newPoints.push(p1);

            // Calculate edge properties
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            // Only perturb if segment is long enough
            if (dist > 300) {
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                // Vector from center to midpoint
                const toCenterX = center.x - midX;
                const toCenterY = center.y - midY;
                const lenToCenter = Math.hypot(toCenterX, toCenterY);

                // Normalize
                const normX = toCenterX / lenToCenter;
                const normY = toCenterY / lenToCenter;

                // Displace!
                // Randomly push INWARD (towards center) or OUTWARD
                // Bias towards inward to create "bends" in the oval
                const pushInward = Math.random() > 0.3;
                const magnitude = (Math.random() * 0.6 + 0.2) * dist * 0.5; // Proportional to edge length

                const dir = pushInward ? 1 : -0.5; // Push in or slightly out

                newPoints.push({
                    x: midX + normX * magnitude * dir,
                    y: midY + normY * magnitude * dir
                });
            }
        }
        return newPoints;
    }

    getCentroid(points) {
        let x = 0, y = 0;
        for (let p of points) {
            x += p.x;
            y += p.y;
        }
        return { x: x / points.length, y: y / points.length };
    }

    convexHull(points) {
        points.sort((a, b) => a.x - b.x);
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

        const lower = [];
        for (let p of points) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                lower.pop();
            }
            lower.push(p);
        }

        const upper = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                upper.pop();
            }
            upper.push(p);
        }

        upper.pop();
        lower.pop();
        return lower.concat(upper);
    }

    smoothTrack(points, iterations = 3) {
        let smoothed = points;

        for (let k = 0; k < iterations; k++) {
            const nextSmoothed = [];
            for (let i = 0; i < smoothed.length; i++) {
                const p0 = smoothed[(i - 1 + smoothed.length) % smoothed.length];
                const p1 = smoothed[i];
                const p2 = smoothed[(i + 1) % smoothed.length];

                // Catmull-Rom-ish smoothing (averaging neighbors)
                nextSmoothed.push({
                    x: p1.x * 0.5 + p0.x * 0.25 + p2.x * 0.25,
                    y: p1.y * 0.5 + p0.y * 0.25 + p2.y * 0.25
                });

                // Subdivision: Add midpoint for higher resolution
                if (k < 2) { // Only subdivide in early passes to avoid too many points
                    nextSmoothed.push({
                        x: (p1.x + p2.x) / 2,
                        y: (p1.y + p2.y) / 2
                    });
                }
            }
            smoothed = nextSmoothed;
        }

        return smoothed;
    }

    draw(ctx) {
        // Draw Grass (background is green in Game.js, but let's be explicit if needed)

        // Draw Track Asphalt
        ctx.beginPath();
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (!this.asphaltPattern) {
            this.asphaltPattern = this.createNoisePattern(ctx);
        }
        ctx.strokeStyle = this.asphaltPattern;

        if (this.points.length > 0) {
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Draw Curbs/Borders
        ctx.lineWidth = this.width + 10;
        ctx.strokeStyle = "white"; // Outer border
        ctx.stroke();

        ctx.lineWidth = this.width - 10;
        ctx.strokeStyle = this.asphaltPattern; // Redraw asphalt over white border to create outline
        ctx.stroke();

        // Center Line
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.setLineDash([20, 20]);
        if (this.points.length > 0) {
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw Finish Line
        if (this.points.length > 1) {
            const p0 = this.points[0];
            const p1 = this.points[1];
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const angle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(p0.x, p0.y);
            ctx.rotate(angle);

            const rows = 2;
            const cols = 10;
            const checkSize = this.width / cols;

            ctx.fillStyle = "white";
            ctx.fillRect(0, -this.width / 2, checkSize * 2, this.width);

            ctx.fillStyle = "black";
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(j * checkSize, -this.width / 2 + i * checkSize, checkSize, checkSize);
                    }
                }
            }

            ctx.restore();
        }
    }

    createNoisePattern(ctx) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const c = canvas.getContext('2d');

        c.fillStyle = "#333";
        c.fillRect(0, 0, 100, 100);

        for (let i = 0; i < 500; i++) {
            c.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
            c.fillRect(Math.random() * 100, Math.random() * 100, 2, 2);
            c.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
            c.fillRect(Math.random() * 100, Math.random() * 100, 2, 2);
        }

        return ctx.createPattern(canvas, 'repeat');
    }

    isPointOnTrack(x, y) {
        const halfWidth = this.width / 2;

        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];

            const dist = this.distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (dist <= halfWidth) {
                return true;
            }
        }
        return false;
    }

    distanceToSegment(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) // in case of 0 length line
            param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

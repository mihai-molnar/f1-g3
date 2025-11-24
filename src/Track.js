export class Track {
    constructor() {
        this.points = [];
        this.width = 100;
        this.generate();
    }

    generate() {
        this.points = [];
        const numPoints = 15;
        const margin = 200;
        const width = 2000;
        const height = 2000;

        // Generate random points
        const randomPoints = [];
        for (let i = 0; i < numPoints; i++) {
            randomPoints.push({
                x: Math.random() * (width - margin * 2) + margin,
                y: Math.random() * (height - margin * 2) + margin
            });
        }

        // Compute Convex Hull to ensure loop
        this.points = this.convexHull(randomPoints);

        // Add some noise/push points out to make it more interesting? 
        // For now, convex hull gives a safe base.

        // Smooth the track using Catmull-Rom splines (simplified by just adding more points)
        this.points = this.smoothTrack(this.points);
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

    smoothTrack(points) {
        // Simple subdivision smoothing
        let smoothed = [];
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];

            smoothed.push(p1);
            smoothed.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            });
        }

        // Run a few times
        for (let k = 0; k < 3; k++) {
            const nextSmoothed = [];
            for (let i = 0; i < smoothed.length; i++) {
                const p0 = smoothed[(i - 1 + smoothed.length) % smoothed.length];
                const p1 = smoothed[i];
                const p2 = smoothed[(i + 1) % smoothed.length];

                nextSmoothed.push({
                    x: p1.x * 0.5 + p0.x * 0.25 + p2.x * 0.25,
                    y: p1.y * 0.5 + p0.y * 0.25 + p2.y * 0.25
                });
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
        ctx.strokeStyle = "#333"; // Dark asphalt

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
        ctx.strokeStyle = "#333"; // Redraw asphalt over white border to create outline
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

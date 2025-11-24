import { ParticleSystem } from './ParticleSystem.js';

export class Car {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 8; // Reduced by ~10%
        this.acceleration = 0.2;
        this.friction = 0.05;
        this.turnSpeed = 0.06;

        this.width = 20;
        this.height = 40;

        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.particles = new ParticleSystem();
        this.setupInputs();
    }

    setupInputs() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case "ArrowUp": this.controls.forward = true; break;
                case "ArrowDown": this.controls.backward = true; break;
                case "ArrowLeft": this.controls.left = true; break;
                case "ArrowRight": this.controls.right = true; break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case "ArrowUp": this.controls.forward = false; break;
                case "ArrowDown": this.controls.backward = false; break;
                case "ArrowLeft": this.controls.left = false; break;
                case "ArrowRight": this.controls.right = false; break;
            }
        });
    }

    update() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.backward) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

        if (this.speed > 0) {
            this.speed -= this.friction;
        } else if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (this.controls.left) {
                this.angle += this.turnSpeed * flip;
            }
            if (this.controls.right) {
                this.angle -= this.turnSpeed * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;

        // Emit particles if turning hard or accelerating
        if (Math.abs(this.speed) > 2 && (this.controls.left || this.controls.right)) {
            this.particles.emit(this.x, this.y, "rgba(100, 100, 100, 0.5)");
        }
        this.particles.update();
    }

    draw(ctx) {
        this.particles.draw(ctx);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        // Shadows
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Suspension Arms
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2;
        // Front
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-12, -20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(12, -20); ctx.stroke();
        // Rear
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(-12, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(12, 12); ctx.stroke();

        // --- Main Body (Chassis) ---
        // Modern F1 shape: Narrow nose, wide sidepods, tight rear (coke bottle)

        // 1. Floor / Undertray (Black carbon fiber look)
        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath();
        ctx.moveTo(-9, -8);
        ctx.lineTo(9, -8);
        ctx.lineTo(9, 18);
        ctx.lineTo(-9, 18);
        ctx.fill();

        // 2. Main Body Gradient (Red/White Livery)
        const gradient = ctx.createLinearGradient(-6, 0, 6, 0);
        gradient.addColorStop(0, "#D32F2F");   // Red Side
        gradient.addColorStop(0.3, "#D32F2F");
        gradient.addColorStop(0.35, "#FFFFFF"); // White Stripe
        gradient.addColorStop(0.65, "#FFFFFF");
        gradient.addColorStop(0.7, "#D32F2F");  // Red Side
        gradient.addColorStop(1, "#D32F2F");
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, -24); // Nose tip (longer)
        ctx.lineTo(3, -15);
        ctx.lineTo(4, -5);  // Cockpit start
        ctx.lineTo(9, 0);   // Sidepod flare
        ctx.lineTo(9, 12);  // Sidepod end
        ctx.lineTo(5, 18);  // Rear tight
        ctx.lineTo(-5, 18);
        ctx.lineTo(-9, 12);
        ctx.lineTo(-9, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-3, -15);
        ctx.closePath();
        ctx.fill();

        // 3. Sidepods (Air Intakes) - Darker Red for depth
        ctx.fillStyle = "#B71C1C";
        ctx.beginPath();
        ctx.moveTo(-9, 2);
        ctx.lineTo(-5, 2);
        ctx.lineTo(-5, 10);
        ctx.lineTo(-8, 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(9, 2);
        ctx.lineTo(5, 2);
        ctx.lineTo(5, 10);
        ctx.lineTo(8, 8);
        ctx.fill();

        // --- Cockpit Area ---
        // Driver
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.ellipse(0, -2, 3.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Helmet (White/Red design)
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, -2, 2.8, 0, Math.PI * 2);
        ctx.fill();
        // Helmet Stripe
        ctx.fillStyle = "#D32F2F";
        ctx.beginPath();
        ctx.arc(0, -2, 2.8, -Math.PI / 4, Math.PI / 4);
        ctx.fill();

        // Halo (Safety Device)
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -2, 5, Math.PI, 0); // Arc around driver
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -7); // Center pillar
        ctx.lineTo(0, -4);
        ctx.stroke();

        // --- Wings ---
        // Front Wing (Swept back, complex)
        ctx.fillStyle = "#212121"; // Dark Carbon
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(14, -20);
        ctx.lineTo(14, -16);
        ctx.lineTo(2, -21);
        ctx.lineTo(-2, -21);
        ctx.lineTo(-14, -16);
        ctx.lineTo(-14, -20);
        ctx.closePath();
        ctx.fill();

        // Front Wing Flaps (Red tips)
        ctx.fillStyle = "#D32F2F";
        ctx.fillRect(-14, -19, 6, 2);
        ctx.fillRect(8, -19, 6, 2);

        // Rear Wing (Wider, lower)
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.roundRect(-12, 16, 24, 6, 1);
        ctx.fill();

        // Rear Wing Endplates (Red)
        ctx.fillStyle = "#D32F2F";
        ctx.fillRect(-12, 16, 2, 6);
        ctx.fillRect(10, 16, 2, 6);

        // DRS Flap (White)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-10, 17, 20, 2);

        // Wheels with tire tread detail
        ctx.fillStyle = "#1a1a1a";
        const drawWheel = (x, y) => {
            ctx.save();
            ctx.translate(x, y);

            // Tire
            ctx.fillStyle = "#1a1a1a";
            ctx.beginPath();
            ctx.roundRect(-4, -6, 8, 12, 2);
            ctx.fill();

            // Subtle highlight for roundness
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(-2, -6, 2, 12);

            // Yellow soft compound stripe (visible on edge)
            ctx.fillStyle = "#FFEB3B";
            ctx.fillRect(-4, -2, 1, 4);
            ctx.fillRect(3, -2, 1, 4);

            ctx.restore();
        };

        drawWheel(-15, -20); // FL
        drawWheel(15, -20);  // FR
        drawWheel(-15, 12);  // RL
        drawWheel(15, 12);   // RR

        ctx.restore();
    }

    getCorners() {
        const corners = [];
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const hw = this.width / 2;
        const hh = this.height / 2;

        // FL
        corners.push({
            x: this.x - sin * (-hh) - cos * (-hw),
            y: this.y - cos * (-hh) + sin * (-hw)
        });
        // FR
        corners.push({
            x: this.x - sin * (-hh) - cos * (hw),
            y: this.y - cos * (-hh) + sin * (hw)
        });
        // RL
        corners.push({
            x: this.x - sin * (hh) - cos * (-hw),
            y: this.y - cos * (hh) + sin * (-hw)
        });
        // RR
        corners.push({
            x: this.x - sin * (hh) - cos * (hw),
            y: this.y - cos * (hh) + sin * (hw)
        });

        return corners;
    }
}

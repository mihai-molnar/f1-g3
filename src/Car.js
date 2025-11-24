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
        ctx.ellipse(0, 0, 12, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Suspension Arms
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 2;
        // Front
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-11, -18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(11, -18); ctx.stroke();
        // Rear
        ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(-11, 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(11, 8); ctx.stroke();

        // Main Body (Chassis)
        const gradient = ctx.createLinearGradient(-10, 0, 10, 0);
        gradient.addColorStop(0, "#B71C1C");
        gradient.addColorStop(0.5, "#D32F2F");
        gradient.addColorStop(1, "#B71C1C");
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(-4, -20); // Nose tip
        ctx.lineTo(4, -20);
        ctx.lineTo(6, -5); // Cockpit start
        ctx.lineTo(8, 5); // Sidepods start
        ctx.lineTo(8, 15); // Rear
        ctx.lineTo(-8, 15);
        ctx.lineTo(-8, 5);
        ctx.lineTo(-6, -5);
        ctx.closePath();
        ctx.fill();

        // Sidepods (Air intakes)
        ctx.fillStyle = "#8E0000";
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-6, 10);
        ctx.lineTo(-8, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(6, 10);
        ctx.lineTo(8, 10);
        ctx.fill();

        // Cockpit / Driver
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.ellipse(0, -2, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = "#FFEB3B";
        ctx.beginPath();
        ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Visor
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-1.5, -3);
        ctx.lineTo(1.5, -3);
        ctx.stroke();

        // Front Wing
        ctx.fillStyle = "#212121";
        ctx.beginPath();
        ctx.roundRect(-12, -24, 24, 4, 2);
        ctx.fill();
        // Wing Flaps
        ctx.fillStyle = "#424242";
        ctx.fillRect(-12, -23, 8, 2);
        ctx.fillRect(4, -23, 8, 2);

        // Rear Wing
        ctx.fillStyle = "#212121";
        ctx.beginPath();
        ctx.roundRect(-11, 14, 22, 5, 1);
        ctx.fill();
        // DRS Flap
        ctx.fillStyle = "#424242";
        ctx.fillRect(-10, 15, 20, 2);

        // Wheels with tire tread detail
        ctx.fillStyle = "#1a1a1a";
        const drawWheel = (x, y) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.roundRect(-3, -5, 6, 10, 2);
            ctx.fill();
            // Rim
            ctx.fillStyle = "#333";
            ctx.fillRect(-1, -2, 2, 4);
            ctx.restore();
        };

        drawWheel(-14, -18); // FL
        drawWheel(14, -18);  // FR
        drawWheel(-14, 11);  // RL
        drawWheel(14, 11);   // RR

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

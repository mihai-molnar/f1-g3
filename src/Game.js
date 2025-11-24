import { Car } from './Car.js';
import { Track } from './Track.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.track = new Track();
        // Start car at the first track point
        this.car = new Car(this.track.points[0].x, this.track.points[0].y);

        this.currentCheckpoint = 0;
        this.raceStarted = false;
        this.lapStartTime = 0;
        this.lastLapTime = 0;
        this.bestLapTime = 0;

        this.lastTime = 0;
        this.gameOver = false;
        this.paused = false;
        this.shake = 0;

        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameOver) this.restart(false);
            }
            if (e.key === 'n' || e.key === 'N') {
                if (this.gameOver) this.restart(true);
                if (this.paused) {
                    this.togglePause();
                    this.restart(true);
                }
            }
            if (e.key === 'Escape') {
                if (!this.gameOver) {
                    this.togglePause();
                }
            }
        });

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    update(deltaTime) {
        this.car.update();

        if (!this.raceStarted && (this.car.speed !== 0 || this.car.controls.forward)) {
            this.raceStarted = true;
            this.lapStartTime = performance.now();
        }

        // Camera shake decay
        if (this.shake > 0) {
            this.shake -= 0.2;
            if (this.shake < 0) this.shake = 0;
        }

        // Trigger shake on high speed or off-track
        const corners = this.car.getCorners();
        let wheelsOff = 0;
        for (let p of corners) {
            if (!this.track.isPointOnTrack(p.x, p.y)) {
                wheelsOff++;
                // Emit grass/dirt particles
                if (Math.abs(this.car.speed) > 1) {
                    this.car.particles.emit(p.x, p.y, "rgba(60, 40, 20, 0.8)");
                }
            }
        }
        if (wheelsOff > 0) {
            this.shake = Math.min(this.shake + 0.8, 5);
        }
    }

    draw() {
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();

        // Apply shake
        const shakeX = (Math.random() - 0.5) * this.shake;
        const shakeY = (Math.random() - 0.5) * this.shake;

        // Center camera on car
        this.ctx.translate(this.width / 2 - this.car.x + shakeX, this.height / 2 - this.car.y + shakeY);

        this.track.draw(this.ctx);
        this.car.draw(this.ctx);

        this.ctx.restore();
    }

    togglePause() {
        this.paused = !this.paused;
        const pauseMenu = document.getElementById('pause-menu');

        if (this.paused) {
            pauseMenu.classList.remove('hidden');
            this.pauseStartTime = performance.now();

            // Update pause menu stats
            let current = "0.00";
            if (this.raceStarted) {
                current = ((performance.now() - this.lapStartTime) / 1000).toFixed(2);
            }
            document.getElementById('pause-current').textContent = current;
            document.getElementById('pause-last').textContent = this.lastLapTime.toFixed(2);
            document.getElementById('pause-best').textContent = this.bestLapTime.toFixed(2);
        } else {
            pauseMenu.classList.add('hidden');
            // Adjust lap start time by adding the duration we were paused
            const pauseDuration = performance.now() - this.pauseStartTime;
            if (this.raceStarted) {
                this.lapStartTime += pauseDuration;
            }
            this.lastTime = performance.now();
        }
    }

    loop(timestamp) {
        if (this.paused) {
            requestAnimationFrame(this.loop);
            return;
        }

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.checkTrackLimits();
        this.checkCheckpoints();
        this.draw();
        this.updateHUD();



        requestAnimationFrame(this.loop);
    }

    checkCheckpoints() {
        if (this.gameOver || !this.raceStarted) return;

        // Simple checkpoint logic: must be within a certain distance of the next point
        const nextPointIndex = (this.currentCheckpoint + 1) % this.track.points.length;
        const nextPoint = this.track.points[nextPointIndex];

        const dist = Math.hypot(this.car.x - nextPoint.x, this.car.y - nextPoint.y);

        // Checkpoint radius can be large, just need to pass generally near it
        if (dist < this.track.width * 1.5) {
            this.currentCheckpoint = nextPointIndex;

            if (this.currentCheckpoint === 0) {
                this.completeLap();
            }
        }
    }

    completeLap() {
        const now = performance.now();
        const lapTime = (now - this.lapStartTime) / 1000;
        this.lastLapTime = lapTime;
        if (this.bestLapTime === 0 || lapTime < this.bestLapTime) {
            this.bestLapTime = lapTime;
        }
        this.lapStartTime = now;
    }

    updateHUD() {
        // Speed
        const displaySpeed = (Math.abs(this.car.speed) / this.car.maxSpeed) * 375;
        document.getElementById('speed-value').textContent = displaySpeed.toFixed(0);

        // Time
        let currentLapTime = "0.00";
        if (this.raceStarted) {
            currentLapTime = ((performance.now() - this.lapStartTime) / 1000).toFixed(2);
        }
        document.getElementById('current-time').textContent = currentLapTime;

        if (this.lastLapTime > 0) {
            document.getElementById('last-time').textContent = this.lastLapTime.toFixed(2);
        }
        if (this.bestLapTime > 0) {
            document.getElementById('best-time').textContent = this.bestLapTime.toFixed(2);
        }

        // Game Over Screen
        const gameOverEl = document.getElementById('game-over');
        if (this.gameOver) {
            gameOverEl.classList.remove('hidden');
        } else {
            gameOverEl.classList.add('hidden');
        }
    }

    checkTrackLimits() {
        if (this.gameOver) return;

        const corners = this.car.getCorners();
        let wheelsOff = 0;
        for (let p of corners) {
            if (!this.track.isPointOnTrack(p.x, p.y)) {
                wheelsOff++;
            }
        }

        if (wheelsOff === 4) {
            this.gameOver = true;
        }
    }

    restart(newTrack = false) {
        if (newTrack) {
            this.track = new Track();
            this.bestLapTime = 0;
            this.lastLapTime = 0;
            document.getElementById('best-time').textContent = "0.00";
            document.getElementById('last-time').textContent = "0.00";
        }
        // If not new track, keep existing this.track

        this.car = new Car(this.track.points[0].x, this.track.points[0].y);
        this.gameOver = false;
        this.raceStarted = false;
        this.currentCheckpoint = 0;
        this.lapStartTime = 0;
        this.lastTime = performance.now();
    }
}

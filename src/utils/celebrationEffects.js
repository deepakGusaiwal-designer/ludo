/**
 * High-performance full-screen Canvas Celebration Engine:
 * - Multi-Angle Confetti Cannons (Token Enters Center)
 * - Multi-Burst Fireworks Extravaganza + Continuous Confetti (Game Victory)
 */

const CONFETTI_COLORS = [
  "#f43f5e", // Rose / Red
  "#10b981", // Emerald / Green
  "#eab308", // Yellow / Gold
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#ffd700", // Bright Gold
  "#ffffff", // Shimmer White
];

const FIREWORK_COLORS = {
  red: ["#ff2a2a", "#ff6b6b", "#ffd700", "#ff8e53", "#ffffff"],
  green: ["#10b981", "#34d399", "#a7f3d0", "#ffd700", "#ffffff"],
  yellow: ["#fbbf24", "#f59e0b", "#fef08a", "#ff7b00", "#ffffff"],
  blue: ["#3b82f6", "#60a5fa", "#93c5fd", "#ffd700", "#ffffff"],
  default: ["#ffd700", "#ff4081", "#00e5ff", "#76ff03", "#ff9100", "#ffffff"],
};

class CelebrationEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.confettiParticles = [];
    this.fireworkRockets = [];
    this.fireworkSparks = [];
    this.animId = null;
    this.isVictoryActive = false;
    this.victoryTimer = null;
    this.winnerColor = "default";
    this.lastWidth = 0;
    this.lastHeight = 0;
  }

  ensureCanvas() {
    if (this.canvas && document.body.contains(this.canvas)) return;

    this.canvas = document.createElement("canvas");
    this.canvas.id = "celebration-fullscreen-canvas";
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100vh";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "99999";
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");
    this.resize();

    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.lastWidth = window.innerWidth;
    this.lastHeight = window.innerHeight;
    this.canvas.width = this.lastWidth * dpr;
    this.canvas.height = this.lastHeight * dpr;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /**
   * Spawns a full-screen multi-angle confetti explosion.
   * Perfect when a token enters the center home square!
   */
  triggerCenterConfetti(intensity = 1.0) {
    this.ensureCanvas();
    const w = this.lastWidth;
    const h = this.lastHeight;

    const count = Math.floor(140 * intensity);

    // 1. Left Cannon (Shooting upward right)
    for (let i = 0; i < count * 0.45; i++) {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.55; // ~45 deg
      const speed = 14 + Math.random() * 22;
      this.confettiParticles.push(
        this.createConfettiPiece(
          0,
          h * 0.9,
          Math.cos(angle) * speed,
          -Math.sin(angle) * speed,
        ),
      );
    }

    // 2. Right Cannon (Shooting upward left)
    for (let i = 0; i < count * 0.45; i++) {
      const angle = (3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.55; // ~135 deg
      const speed = 14 + Math.random() * 22;
      this.confettiParticles.push(
        this.createConfettiPiece(
          w,
          h * 0.9,
          Math.cos(angle) * speed,
          -Math.sin(angle) * speed,
        ),
      );
    }

    // 3. Center High Burst (Shooting all directions)
    for (let i = 0; i < count * 0.4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 16;
      this.confettiParticles.push(
        this.createConfettiPiece(
          w * 0.5,
          h * 0.35,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 5,
        ),
      );
    }

    this.startLoop();
  }

  createConfettiPiece(x, y, vx, vy) {
    const isStar = Math.random() < 0.2;
    const isCircle = Math.random() < 0.25;
    return {
      x,
      y,
      vx,
      vy,
      width: isStar ? 12 : 8 + Math.random() * 8,
      height: isStar ? 12 : 12 + Math.random() * 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.25,
      wobble: Math.random() * Math.PI * 2,
      vWobble: 0.08 + Math.random() * 0.1,
      gravity: 0.38 + Math.random() * 0.22,
      drag: 0.965,
      alpha: 1.0,
      decay: 0.006 + Math.random() * 0.007,
      type: isStar ? "star" : isCircle ? "circle" : "rect",
    };
  }

  /**
   * Starts non-stop victory celebration with fireworks rockets and cascading confetti!
   */
  startVictoryCelebration(winnerColor = "yellow") {
    this.ensureCanvas();
    this.isVictoryActive = true;
    this.winnerColor = winnerColor;

    // Initial massive confetti burst
    this.triggerCenterConfetti(1.8);

    // Initial fireworks volley
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this.isVictoryActive) this.launchRocket();
      }, i * 320);
    }

    // Repeating celebration scheduler
    const scheduleNext = () => {
      if (!this.isVictoryActive) return;

      // Launch 1-3 fireworks
      const fireworkCount = Math.floor(1 + Math.random() * 2);
      for (let i = 0; i < fireworkCount; i++) {
        setTimeout(() => {
          if (this.isVictoryActive) this.launchRocket();
        }, i * 260);
      }

      // Occasional confetti wave
      if (Math.random() < 0.6) {
        this.triggerCenterConfetti(0.7);
      }

      const nextDelay = 700 + Math.random() * 900;
      this.victoryTimer = setTimeout(scheduleNext, nextDelay);
    };

    this.victoryTimer = setTimeout(scheduleNext, 1200);
    this.startLoop();
  }

  launchRocket() {
    const w = this.lastWidth;
    const h = this.lastHeight;

    const startX = w * 0.15 + Math.random() * w * 0.7;
    const targetY = h * 0.12 + Math.random() * h * 0.42;
    const targetX = startX + (Math.random() - 0.5) * (w * 0.25);

    const colors = FIREWORK_COLORS[this.winnerColor] || FIREWORK_COLORS.default;
    const color = colors[Math.floor(Math.random() * colors.length)];

    const duration = 38 + Math.random() * 18;
    const vx = (targetX - startX) / duration;
    const vy = (targetY - h) / duration;

    this.fireworkRockets.push({
      x: startX,
      y: h,
      vx,
      vy,
      targetY,
      color,
      trail: [],
    });
  }

  explodeRocket(x, y, color) {
    const colors = FIREWORK_COLORS[this.winnerColor] || FIREWORK_COLORS.default;
    const sparkCount = 95 + Math.floor(Math.random() * 45);

    // Multi-ring spherical burst
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 9;
      const sparkColor =
        Math.random() < 0.6
          ? color
          : colors[Math.floor(Math.random() * colors.length)];

      this.fireworkSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.18,
        drag: 0.955,
        alpha: 1.0,
        decay: 0.012 + Math.random() * 0.014,
        size: 2.2 + Math.random() * 2.2,
        color: sparkColor,
        twinkle: Math.random() < 0.35,
      });
    }

    // Secondary glittering crackle sparks
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.fireworkSparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.12,
        drag: 0.94,
        alpha: 1.0,
        decay: 0.008 + Math.random() * 0.008,
        size: 3.5,
        color: "#ffffff",
        twinkle: true,
      });
    }
  }

  stopVictoryCelebration() {
    this.isVictoryActive = false;
    if (this.victoryTimer) {
      clearTimeout(this.victoryTimer);
      this.victoryTimer = null;
    }
  }

  startLoop() {
    if (this.animId) return;

    const render = () => {
      if (!this.ctx || !this.canvas) return;

      const w = this.lastWidth;
      const h = this.lastHeight;

      this.ctx.clearRect(0, 0, w, h);

      // --- 1. Update & Render Firework Rockets ---
      for (let i = this.fireworkRockets.length - 1; i >= 0; i--) {
        const r = this.fireworkRockets[i];
        r.x += r.vx;
        r.y += r.vy;

        // Spark trail
        r.trail.push({ x: r.x, y: r.y, alpha: 0.9 });
        if (r.trail.length > 7) r.trail.shift();

        // Render trail
        this.ctx.save();
        for (const t of r.trail) {
          this.ctx.fillStyle = r.color;
          this.ctx.globalAlpha = t.alpha;
          this.ctx.beginPath();
          this.ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
          t.alpha -= 0.12;
        }
        this.ctx.restore();

        // Rocket head
        this.ctx.save();
        this.ctx.fillStyle = "#ffffff";
        this.ctx.shadowColor = r.color;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        if (r.y <= r.targetY || r.vy >= 0) {
          this.explodeRocket(r.x, r.y, r.color);
          this.fireworkRockets.splice(i, 1);
        }
      }

      // --- 2. Update & Render Firework Sparks ---
      for (let i = this.fireworkSparks.length - 1; i >= 0; i--) {
        const s = this.fireworkSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= s.drag;
        s.vy = s.vy * s.drag + s.gravity;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          this.fireworkSparks.splice(i, 1);
          continue;
        }

        const renderAlpha =
          s.twinkle && Math.random() < 0.4 ? s.alpha * 0.3 : s.alpha;

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, renderAlpha);
        this.ctx.fillStyle = s.color;
        this.ctx.shadowColor = s.color;
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      // --- 3. Update & Render Confetti ---
      for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
        const p = this.confettiParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.rotation += p.vRot;
        p.wobble += p.vWobble;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > h + 30) {
          this.confettiParticles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.scale(Math.cos(p.wobble), 1);
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;

        if (p.type === "rect") {
          this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        } else if (p.type === "circle") {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (p.type === "star") {
          this.drawStar(this.ctx, 0, 0, 5, p.width * 0.7, p.width * 0.35);
        }

        this.ctx.restore();
      }

      const hasActive =
        this.confettiParticles.length > 0 ||
        this.fireworkRockets.length > 0 ||
        this.fireworkSparks.length > 0 ||
        this.isVictoryActive;

      if (hasActive) {
        this.animId = requestAnimationFrame(render);
      } else {
        this.ctx.clearRect(0, 0, w, h);
        this.animId = null;
      }
    };

    this.animId = requestAnimationFrame(render);
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}

export const celebration = new CelebrationEngine();

import { TAU, clamp } from './math.js';

class Particle {
  constructor(o) {
    this.x = o.x; this.y = o.y; this.z = o.z || 0;
    this.vx = o.vx || 0; this.vy = o.vy || 0; this.vz = o.vz || 0;
    this.life = o.life || 0.4;
    this.maxLife = this.life;
    this.size = o.size || 3;
    this.color = o.color || '#fff';
    this.gravity = o.gravity ?? 900;
    this.kind = o.kind || 'rect';
    this.drag = o.drag ?? 1.5;
    this.spin = o.spin || 0;
    this.rot = o.rot || 0;
    this.fade = o.fade ?? true;
    this.glow = o.glow || null;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;
    this.vz -= this.gravity * dt;
    this.vx *= Math.max(0, 1 - this.drag * dt);
    this.vy *= Math.max(0, 1 - this.drag * dt);
    if (this.z < 0) {
      this.z = 0;
      this.vz *= -0.32;
      this.vx *= 0.6;
      this.vy *= 0.6;
      if (Math.abs(this.vz) < 20) this.vz = 0;
    }
    this.rot += this.spin * dt;
    return this.life > 0;
  }

  draw(ctx, camX) {
    const sx = this.x - camX;
    const sy = this.y - this.z;
    const t = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = this.fade ? t : 1;
    if (this.glow) {
      ctx.shadowColor = this.glow;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = this.color;
    if (this.kind === 'plus') {
      const s = this.size;
      ctx.fillRect(sx - s * 1.5, sy - s * 0.5, s * 3, s);
      ctx.fillRect(sx - s * 0.5, sy - s * 1.5, s, s * 3);
    } else if (this.kind === 'star') {
      ctx.translate(sx, sy);
      ctx.rotate(this.rot);
      const s = this.size;
      ctx.fillRect(-s, -1, s * 2, 2);
      ctx.fillRect(-1, -s, 2, s * 2);
      ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
    } else if (this.kind === 'ring') {
      const r = (1 - t) * this.size * 5 + 2;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, 3 * t);
      ctx.beginPath();
      ctx.ellipse(sx, this.y, r, r * 0.38, 0, 0, TAU);
      ctx.stroke();
    } else if (this.kind === 'spark') {
      ctx.translate(sx, sy);
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.fillRect(0, -this.size * 0.3, this.size * 3.2 * (0.5 + t), this.size * 0.6);
    } else if (this.kind === 'pixel') {
      ctx.fillRect(Math.round(sx) - this.size / 2, Math.round(sy) - this.size / 2, this.size, this.size);
    } else {
      ctx.fillRect(Math.round(sx), Math.round(sy), this.size, this.size);
    }
    ctx.restore();
  }
}

/* ------------------------------------------------------------
   Small canvas helpers
   ------------------------------------------------------------ */

export { Particle };

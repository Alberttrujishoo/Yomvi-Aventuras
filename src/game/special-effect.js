import { TAU, clamp } from '../engine/math.js';
import { Assets } from '../media/assets.js';

// Texture regions in special-effect.webp. Keeping the image in one atlas lets
// the game render both depths of the slash and all four props from one decode.
const BACK_ARC = [0, 0, 384, 61];
const FRONT_ARC = [0, 61, 384, 67];
const BOTTLE = [0, 132, 32, 81];
const COMPOTE = [40, 132, 60, 66];

const THROWS = [
  { sprite: BOTTLE, w: 21, h: 51, direction: -1, delay: 0.045, reach: 161, height: 121, spin: -4.8 },
  { sprite: BOTTLE, w: 19, h: 48, direction: 1, delay: 0.17, reach: 158, height: 103, spin: 4.2 },
  { sprite: COMPOTE, w: 34, h: 35, direction: 1, delay: 0.06, reach: 182, height: 147, spin: 3.8 },
  { sprite: COMPOTE, w: 33, h: 34, direction: -1, delay: 0.21, reach: 168, height: 88, spin: -3.4 },
];

const SPARKS = Array.from({ length: 22 }, (_, index) => {
  const angle = index * 2.399;
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    delay: index % 4 * 0.018,
    reach: 126 + index % 6 * 9,
    color: index % 5 === 0 ? '#ff78b2' : index % 3 === 0 ? '#ff9d49' : '#fff0a8',
    width: index % 4 === 0 ? 3 : 2,
  };
});

class SpecialEffect {
  constructor(x, y, { compact, reducedMotion }) {
    this.x = x;
    this.y = y;
    this.time = 0;
    this.duration = reducedMotion ? 0.36 : 0.85;
    this.reducedMotion = reducedMotion;
    this.sparkCount = compact ? 12 : SPARKS.length;
  }

  update(dt) {
    this.time += dt;
    return this.time < this.duration;
  }

  drawBehind(ctx, camX) {
    const x = this.x - camX;
    if (!this.reducedMotion && this.time < 0.06) {
      const windUp = 1 - this.time / 0.06;
      ctx.save();
      ctx.strokeStyle = '#ffdc88';
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, this.y - 3, 5 + 58 * windUp, 4 + 14 * windUp, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    this.drawArcs(ctx, x, false);
  }

  drawFront(ctx, camX) {
    const x = this.x - camX;
    this.drawArcs(ctx, x, true);
    if (!this.reducedMotion) this.drawSparks(ctx, x);
    this.drawProps(ctx, x);
  }

  drawArcs(ctx, x, front) {
    const texture = Assets.specialEffect;
    const region = front ? FRONT_ARC : BACK_ARC;
    const span = front ? 0.47 : 0.41;
    const reduced = this.reducedMotion;

    for (const delay of reduced ? [0] : [0.018, 0.19]) {
      const progress = (this.time - delay) / (reduced ? this.duration : span);
      if (progress < 0 || progress >= 1) continue;
      const grow = reduced ? 0.62 : 1 - (1 - progress) ** 3;
      const width = (front ? 165 : 110) + grow * (front ? 145 : 152);
      const height = width * (front ? 0.31 : 0.23);
      ctx.save();
      ctx.translate(x, this.y - (front ? 49 : 85) + 19 * grow);
      if (!reduced) ctx.rotate((front ? 0.09 : -0.14) * (1 - progress));
      ctx.globalAlpha *= (reduced ? 0.8 : Math.min(1, progress * 12 + 0.32)) * (1 - progress) ** 1.3;
      if (texture) {
        ctx.drawImage(texture, ...region, -width / 2, front ? 0 : -height / 2, width, height / 2);
      } else {
        ctx.strokeStyle = front ? '#ffe69a' : '#ffa34d';
        ctx.lineWidth = front ? 5 : 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, width / 2, height / 2, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawProps(ctx, x) {
    const texture = Assets.specialEffect;
    if (!texture) return;
    for (const prop of THROWS) {
      const p = (this.time - prop.delay) / 0.63;
      if (!this.reducedMotion && (p < 0 || p >= 1)) continue;
      const travel = this.reducedMotion ? 0.45 : p;
      const lift = this.reducedMotion ? prop.height * 0.5 : prop.height * 4 * p * (1 - p);
      ctx.save();
      ctx.translate(x + prop.direction * (43 + prop.reach * travel), this.y - 56 - lift + travel * 27);
      ctx.rotate(prop.direction * 0.23 + (this.reducedMotion ? 0 : prop.spin * p));
      ctx.globalAlpha *= this.reducedMotion
        ? clamp(1 - this.time / this.duration, 0, 1)
        : Math.min(1, p * 24 + 0.4, (1 - p) * 7);
      ctx.drawImage(texture, ...prop.sprite, -prop.w / 2, -prop.h / 2, prop.w, prop.h);
      ctx.restore();
    }
  }

  drawSparks(ctx, x) {
    ctx.save();
    const opacity = ctx.globalAlpha;
    for (let i = 0; i < this.sparkCount; i++) {
      const spark = SPARKS[i];
      const p = (this.time - spark.delay) / 0.62;
      if (p < 0 || p >= 1) continue;
      const travel = (0.26 + (1 - (1 - p) ** 2) * 0.74) * spark.reach;
      const tail = travel - 13 * (1 - p);
      const y = this.y - 57 - p * 45;
      ctx.globalAlpha = opacity * (1 - p) * 0.9;
      ctx.strokeStyle = spark.color;
      ctx.lineWidth = spark.width;
      ctx.beginPath();
      ctx.moveTo(x + spark.x * tail, y + spark.y * tail * 0.34);
      ctx.lineTo(x + spark.x * travel, y + spark.y * travel * 0.34);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export { SpecialEffect };

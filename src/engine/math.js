const CFG = {
  W: 960,
  H: 540,
  FLOOR_TOP: 332,
  FLOOR_BOTTOM: 492,
  DEPTH_TOL: 22,
  GRAVITY: 1500,
  CHAR_SCALE: 1.2,
};

const TAU = Math.PI * 2;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
const approach = (cur, target, step) => {
  if (cur < target) return Math.min(cur + step, target);
  if (cur > target) return Math.max(cur - step, target);
  return target;
};
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const padScore = (n) => String(Math.max(0, Math.floor(n))).padStart(7, '0');

export { CFG, TAU, approach, chance, choice, clamp, damp, lerp, padScore, rand, sign };

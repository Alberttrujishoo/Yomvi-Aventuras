import { makeArt, spriteFrom } from '../../media/sprites.js';

function streetLeg(P, x, hipY, st, pants, pantsSh, shoe, sole) {
  const k = Math.round(st * 2);
  P(x, hipY, 6, 11, pants);
  P(x, hipY, 1, 11, pantsSh);
  P(x + k, hipY + 10, 6, 9, pants);
  P(x + k, hipY + 10, 1, 9, pantsSh);
  P(x + k - 1, hipY + 18, 8, 4, shoe);
  P(x + k - 1, hipY + 21, 8, 1, sole);
}

function streetArm(P, x, y, sw, sleeve, sleeveSh, skin, skinSh) {
  const s = Math.round(sw * 5);
  P(x, y, 5, 8, sleeve);
  P(x, y, 1, 8, sleeveSh);
  P(x + s, y + 7, 5, 6, sleeve);
  P(x + s, y + 12, 5, 4, skin);
  P(x + s + 1, y + 13, 3, 2, skinSh || skin);
}

/* ------------------------------------------------------------
   ENEMIES — COMENSAL / CALLEJERO / BOUNCER CALLEJERO
   ------------------------------------------------------------ */
function dinerArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#c98f5f', skinSh = '#a9713f', skinHi = '#e3b07c';
  const shirt = '#e8e2d0', shirtSh = '#c9c1ac';
  const jacket = '#c94a4a', jacketSh = '#9c3333';
  const shorts = '#3b4a68', shortsSh = '#2b3852';
  const shoe = '#efe6d0', sole = '#4a4438';
  const hair = '#2a1d17';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  streetLeg(P, 14, 40, -step, shorts, shortsSh, shoe, sole);
  if (atk == null) streetArm(P, 7, 22 + b, -swing, jacket, jacketSh, skin, skinSh);

  // open shirt over a dirty tank top
  P(10, 21 + b, 20, 8, shirt);
  P(9, 28 + b, 22, 10, shirt);
  P(11, 37 + b, 18, 3, shirtSh);
  P(9, 21 + b, 5, 17, jacket);
  P(26, 21 + b, 5, 17, jacket);
  P(14, 22 + b, 12, 12, '#f4efe2');
  P(15, 23 + b, 10, 9, '#e5dfcf');
  P(19, 27 + b, 2, 5, '#b8b09c');
  P(9, 21 + b, 5, 2, jacketSh);
  P(26, 21 + b, 5, 2, jacketSh);
  P(12, 38 + b, 16, 2, '#2a2a36');

  streetLeg(P, 23, 40, step, shorts, shortsSh, shoe, sole);

  // head
  P(14, 8 + b, 14, 13, skin);
  P(14, 8 + b, 14, 1, skinSh);
  P(14, 9 + b, 1, 8, skinSh);
  P(15, 9 + b, 2, 2, skinHi);
  P(16, 13 + b, 2, 2, '#21161a');
  P(24, 13 + b, 2, 2, '#21161a');
  P(21, 17 + b, 5, 1, '#7a4a34');
  P(18, 19 + b, 8, 1, '#54301f');
  P(13, 12 + b, 1, 5, skinSh);
  P(28, 12 + b, 1, 5, skinSh);
  // short messy hair + tiny moustache
  P(13, 4 + b, 16, 5, hair);
  P(13, 4 + b, 16, 1, '#433028');
  P(12, 6 + b, 2, 3, hair);
  P(14, 3 + b, 5, 2, hair);
  P(23, 3 + b, 4, 1, hair);
  P(17, 16 + b, 8, 1, '#3a2318');

  if (atk != null) {
    P(28, 22 + b, 8, 4, jacket);
    P(35, 23 + b, 6, 5, skin);
    P(40, 22 + b, 4, 7, '#d8d2c2'); // paper tray
    P(7, 26 + b, 4, 4, skin);
  } else {
    streetArm(P, 28, 22 + b, swing, jacket, jacketSh, skin, skinSh);
  }

  if (p.hurt) P(30, 11 + b, 2, 2, '#8ee6ff');
}

function buildDiner() {
  const idle = [
    makeArt(42, 64, (P) => dinerArt(P, { bob: 0 })),
    makeArt(42, 64, (P) => dinerArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(42, 64, (P) => dinerArt(P, { leg: -1, arm: 1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: 1, arm: -1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(42, 64, (P) => dinerArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(42, 64, (P) => dinerArt(P, { atk: 0, leg: -0.4 })),
    makeArt(42, 64, (P) => dinerArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(42, 64, (P) => dinerArt(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(42, 64, (P) => dinerArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 124);
}

function toughArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#94603a', skinSh = '#734526', skinHi = '#b07a4c';
  const tee = '#26232e', teeSh = '#17151d';
  const denim = '#2c4874', denimSh = '#1e3356';
  const bandana = '#c8313e', bandanaSh = '#92202b';
  const shoe = '#1b1920', sole = '#3a3644';
  const chain = '#e8c56a';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  streetLeg(P, 14, 42, -step, denim, denimSh, shoe, sole);
  if (atk == null) streetArm(P, 7, 23 + b, -swing, tee, teeSh, skin, skinSh);

  // torn black tee + denim vest
  P(10, 22 + b, 20, 9, tee);
  P(9, 29 + b, 22, 11, tee);
  P(11, 39 + b, 18, 2, teeSh);
  P(15, 31 + b, 10, 8, '#3b3846');
  P(17, 32 + b, 3, 3, '#0f0e13');
  P(24, 32 + b, 3, 3, '#0f0e13');
  P(9, 22 + b, 4, 15, '#3b4f74');
  P(27, 22 + b, 4, 15, '#3b4f74');
  P(9, 22 + b, 4, 2, '#587198');
  P(27, 22 + b, 4, 2, '#587198');
  P(12, 22 + b, 16, 2, chain);
  P(17, 24 + b, 6, 1, chain);
  P(19, 25 + b, 2, 3, chain);

  streetLeg(P, 23, 42, step, denim, denimSh, shoe, sole);

  // head + red bandana
  P(14, 8 + b, 14, 13, skin);
  P(14, 8 + b, 14, 1, skinSh);
  P(14, 9 + b, 1, 8, skinSh);
  P(15, 9 + b, 2, 2, skinHi);
  P(16, 12 + b, 2, 2, '#171016');
  P(24, 12 + b, 2, 2, '#171016');
  P(21, 16 + b, 5, 1, '#58301f');
  P(17, 19 + b, 8, 1, '#2b1810');
  P(13, 12 + b, 1, 5, skinSh);
  P(28, 12 + b, 1, 5, skinSh);
  P(13, 5 + b, 16, 4, bandana);
  P(13, 5 + b, 16, 1, '#e8545c');
  P(12, 7 + b, 3, 3, bandanaSh);
  P(28, 7 + b, 4, 2, bandanaSh);
  P(13, 3 + b, 16, 2, '#191018');
  P(15, 10 + b, 1, 3, '#2b1810'); // scar

  if (atk != null) {
    P(28, 23 + b, 9, 4, tee);
    P(36, 23 + b, 6, 5, skin);
    P(7, 27 + b, 4, 4, skin);
  } else {
    streetArm(P, 28, 23 + b, swing, tee, teeSh, skin, skinSh);
  }

  if (p.hurt) P(30, 11 + b, 2, 2, '#8ee6ff');
}

function buildTough() {
  const idle = [
    makeArt(44, 66, (P) => toughArt(P, { bob: 0 })),
    makeArt(44, 66, (P) => toughArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(44, 66, (P) => toughArt(P, { leg: -1, arm: 1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: 1, arm: -1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(44, 66, (P) => toughArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(44, 66, (P) => toughArt(P, { atk: 0, leg: -0.4 })),
    makeArt(44, 66, (P) => toughArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(44, 66, (P) => toughArt(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(44, 66, (P) => toughArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 134);
}

function streetBouncerArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#8a5634', skinSh = '#693d22', skinHi = '#a86f46';
  const shirt = '#e2b23f', shirtSh = '#b58c28';
  const vest = '#24222b', vestSh = '#15141a';
  const pants = '#2a2c3a', pantsSh = '#1c1e28';
  const shoe = '#17151c', sole = '#39344a';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  streetLeg(P, 19, 48, -step, pants, pantsSh, shoe, sole);
  if (atk == null) streetArm(P, 7, 25 + b, -swing, shirt, shirtSh, skin, skinSh);

  // huge torso, yellow tee + black vest
  P(12, 21 + b, 32, 10, shirt);
  P(10, 29 + b, 36, 14, shirt);
  P(13, 42 + b, 30, 7, shirt);
  P(10, 29 + b, 7, 20, vest);
  P(37, 29 + b, 7, 20, vest);
  P(10, 29 + b, 7, 3, vestSh);
  P(37, 29 + b, 7, 3, vestSh);
  P(17, 22 + b, 22, 16, shirt);
  P(20, 24 + b, 16, 10, shirtSh);
  P(23, 38 + b, 10, 8, pantsSh); // belt buckle area
  P(22, 43 + b, 12, 3, '#15141a');
  P(25, 42 + b, 6, 4, '#d8b45c');
  P(12, 48 + b, 32, 2, pantsSh);

  streetLeg(P, 31, 48, step, pants, pantsSh, shoe, sole);

  // head, bald with goatee
  P(19, 7 + b, 18, 15, skin);
  P(19, 7 + b, 18, 1, skinSh);
  P(19, 8 + b, 1, 9, skinSh);
  P(20, 8 + b, 3, 2, skinHi);
  P(21, 12 + b, 2, 2, '#171016');
  P(32, 12 + b, 2, 2, '#171016');
  P(27, 16 + b, 3, 2, skinSh);
  P(23, 19 + b, 9, 2, '#2a1a12');
  P(24, 21 + b, 7, 2, '#22150f');
  P(18, 11 + b, 1, 6, skinSh);
  P(37, 11 + b, 1, 5, skinSh);
  P(20, 2 + b, 15, 3, '#2a1a12');       // bald head highlight/tuft shadow

  if (atk != null) {
    P(40, 25 + b, 10, 5, shirt);
    P(49, 26 + b, 6, 6, skin);
    P(8, 29 + b, 5, 5, skin);
  } else {
    streetArm(P, 40, 25 + b, swing, shirt, shirtSh, skin, skinSh);
  }

  if (p.hurt) P(36, 11 + b, 2, 2, '#8ee6ff');
}

function buildStreetBouncer() {
  const idle = [
    makeArt(52, 72, (P) => streetBouncerArt(P, { bob: 0 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: -1, arm: 1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: 1, arm: -1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(52, 72, (P) => streetBouncerArt(P, { atk: 0, leg: -0.4 })),
    makeArt(52, 72, (P) => streetBouncerArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(52, 72, (P) => streetBouncerArt(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(52, 72, (P) => streetBouncerArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 150);
}

/* ------------------------------------------------------------
   NPC — muchacho de polo gris, lentes y jean azul
   ------------------------------------------------------------ */
function npcGuyArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#a8763f', skinSh = '#865a2c', skinHi = '#c4915a';
  const polo = '#8d9199', poloSh = '#6d7178', poloHi = '#a9adb5';
  const jeans = '#2f5f9e', jeansSh = '#204677';
  const shoe = '#f1f0ea', sole = '#4a4650';
  const hair = '#211711', glass = '#16131c';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  streetLeg(P, 14, 40, -step, jeans, jeansSh, shoe, sole);
  if (atk == null) streetArm(P, 7, 22 + b, -swing, polo, poloSh, skin, skinSh);

  // grey polo
  P(10, 21 + b, 20, 8, polo);
  P(9, 28 + b, 22, 11, polo);
  P(11, 38 + b, 18, 3, poloSh);
  P(9, 21 + b, 4, 17, poloSh);
  P(9, 21 + b, 8, 2, poloHi);
  P(17, 21 + b, 6, 3, '#72767d');       // collar
  P(19, 22 + b, 2, 4, '#5c6068');
  P(13, 25 + b, 2, 8, '#7d8189');       // button placket
  P(13, 28 + b, 1, 1, '#c8ccd2');
  P(13, 32 + b, 1, 1, '#c8ccd2');
  P(25, 29 + b, 4, 4, poloSh);          // chest pocket
  P(12, 38 + b, 16, 2, '#2a2a36');      // belt

  streetLeg(P, 23, 40, step, jeans, jeansSh, shoe, sole);

  // head
  P(14, 8 + b, 14, 13, skin);
  P(14, 8 + b, 14, 1, skinSh);
  P(14, 9 + b, 1, 8, skinSh);
  P(15, 9 + b, 2, 2, skinHi);
  P(21, 16 + b, 5, 1, '#6d472c');
  P(17, 19 + b, 8, 1, '#4f2f1c');
  P(13, 12 + b, 1, 5, skinSh);
  P(28, 12 + b, 1, 5, skinSh);
  // glasses
  P(15, 12 + b, 5, 1, glass);
  P(23, 12 + b, 5, 1, glass);
  P(19, 12 + b, 1, 1, glass);
  P(15, 13 + b, 5, 2, '#8fc6dd');
  P(23, 13 + b, 5, 2, '#8fc6dd');
  P(16, 13 + b, 1, 1, '#e6f6ff');
  P(24, 13 + b, 1, 1, '#e6f6ff');
  P(20, 12 + b, 2, 1, glass);
  // short dark hair
  P(13, 4 + b, 16, 5, hair);
  P(13, 4 + b, 16, 1, '#3a2a20');
  P(12, 6 + b, 2, 3, hair);
  P(14, 3 + b, 5, 2, hair);
  P(23, 3 + b, 5, 1, hair);

  if (atk != null) {
    P(28, 22 + b, 8, 4, polo);
    P(35, 23 + b, 6, 5, skin);
    P(7, 26 + b, 4, 4, skin);
  } else {
    streetArm(P, 28, 22 + b, swing, polo, poloSh, skin, skinSh);
  }

  if (p.hurt) P(30, 11 + b, 2, 2, '#8ee6ff');
}

function buildNpcGuy() {
  const idle = [
    makeArt(42, 62, (P) => npcGuyArt(P, { bob: 0 })),
    makeArt(42, 62, (P) => npcGuyArt(P, { bob: 1, arm: 0.18 })),
  ];
  const walk = [
    makeArt(42, 62, (P) => npcGuyArt(P, { leg: -1, arm: 1 })),
    makeArt(42, 62, (P) => npcGuyArt(P, { leg: -0.2, arm: 0.2, bob: -1 })),
    makeArt(42, 62, (P) => npcGuyArt(P, { leg: 1, arm: -1 })),
    makeArt(42, 62, (P) => npcGuyArt(P, { leg: 0.2, arm: -0.2, bob: -1 })),
  ];
  return spriteFrom({
    idle, walk, attack: idle,
    hurt: [makeArt(42, 62, (P) => npcGuyArt(P, { hurt: 1, bob: -1 }))],
    jump: [idle[0]],
  }, 118);
}

/* ------------------------------------------------------------
   GAYTELOS — fallback: grey hoodie, cap, glasses, blue jeans
   (JEFE3.PNG is used whenever the smart loader succeeds)
   ------------------------------------------------------------ */
function boss3Art(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#b07d52', skinSh = '#8d5f38', skinHi = '#caa070';
  const hoodie = '#767a82', hoodieSh = '#565a63', hoodieHi = '#9aa0a8';
  const jeans = '#2b456e', jeansSh = '#1c3152';
  const shoe = '#e6e0d6', sole = '#3a3630';
  const cap = '#34373f', capHi = '#5b5f68';
  const hair = '#1e1712', glass = '#14121a', gold = '#e8c56a';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 2);
    P(x, hipY, 8, 10, jeans);
    P(x + k, hipY + 9, 8, 10, jeans);
    P(x + k, hipY + 9, 2, 10, jeansSh);
    P(x + k - 1, hipY + 18, 10, 4, shoe);
    P(x + k - 1, hipY + 21, 10, 1, sole);
  };

  leg(14, 46, -step);
  if (atk == null) {
    P(6, 26 + b, 9, 8, hoodie);
    P(4, 33 + b, 8, 8, skin);
    P(4, 39 + b, 8, 4, skinSh);
  }

  // oversized hoodie
  P(9, 22 + b, 34, 9, hoodie);
  P(7, 28 + b, 38, 13, hoodie);
  P(9, 40 + b, 34, 7, hoodie);
  P(7, 28 + b, 4, 15, hoodieSh);
  P(41, 28 + b, 4, 15, hoodieSh);
  P(12, 23 + b, 12, 2, hoodieHi);
  P(18, 20 + b, 16, 5, hoodie);          // hood behind head
  P(16, 20 + b, 20, 2, hoodieSh);
  P(20, 29 + b, 12, 9, hoodieSh);        // kangaroo pocket
  P(21, 29 + b, 10, 1, hoodieHi);
  P(22, 24 + b, 2, 7, '#d8d8e0');        // drawstrings
  P(28, 24 + b, 2, 7, '#d8d8e0');
  P(20, 33 + b, 12, 2, gold);            // gold chain
  P(24, 35 + b, 4, 2, gold);
  P(9, 46 + b, 34, 3, jeansSh);

  leg(28, 46, step);

  // head
  P(17, 8 + b, 19, 14, skin);
  P(17, 8 + b, 19, 1, skinSh);
  P(17, 9 + b, 1, 9, skinSh);
  P(18, 9 + b, 3, 2, skinHi);
  P(18, 13 + b, 7, 2, glass);
  P(27, 13 + b, 7, 2, glass);
  P(19, 13 + b, 2, 1, '#cfe8ff');
  P(29, 13 + b, 2, 1, '#cfe8ff');
  P(25, 13 + b, 1, 2, glass);
  P(26, 15 + b, 2, 2, skinSh);
  P(22, 20 + b, 9, 1, '#5a3624');
  P(22, 21 + b, 8, 1, '#3a2216');
  P(18, 19 + b, 3, 1, '#3a2216');
  P(31, 19 + b, 3, 1, '#3a2216');
  P(16, 12 + b, 1, 4, skin);
  // short dark hair
  P(16, 4 + b, 20, 6, hair);
  P(16, 4 + b, 20, 1, '#3a2a20');
  P(15, 7 + b, 2, 3, hair);
  P(18, 3 + b, 5, 2, hair);
  P(28, 3 + b, 5, 1, hair);
  // cap
  P(15, 1 + b, 21, 5, cap);
  P(15, 1 + b, 21, 1, capHi);
  P(14, 4 + b, 25, 2, cap);
  P(31, 5 + b, 10, 2, cap);
  P(33, 6 + b, 8, 1, '#20232a');

  if (atk != null) {
    P(41, 26 + b, 10, 5, hoodie);
    P(50, 27 + b, 6, 6, skin);
    P(6, 30 + b, 5, 5, skin);
  } else if (swing) {
    P(6, 30 + b, 5, 5, skin);
  }

  if (p.hurt) P(33, 11 + b, 2, 2, '#8ee6ff');
}

function buildBoss3() {
  const idle = [
    makeArt(56, 78, (P) => boss3Art(P, { bob: 0 })),
    makeArt(56, 78, (P) => boss3Art(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(56, 78, (P) => boss3Art(P, { leg: -1, arm: 1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: 1, arm: -1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(56, 78, (P) => boss3Art(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(56, 78, (P) => boss3Art(P, { atk: 0, leg: -0.4 })),
    makeArt(56, 78, (P) => boss3Art(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(56, 78, (P) => boss3Art(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(56, 78, (P) => boss3Art(P, { leg: 1, arm: 1, bob: -3 }))],
  }, 158);
}

/* ------------------------------------------------------------
   Street props + high-healing food items
   ------------------------------------------------------------ */
function buildTrashCan() {
  return makeArt(22, 32, (P) => {
    P(4, 4, 14, 26, '#3f6d4c');
    P(4, 4, 2, 26, '#2c5037');
    P(14, 4, 4, 26, '#578862');
    P(2, 1, 18, 4, '#6d9c74');
    P(3, 0, 16, 2, '#8ab98f');
    P(5, 10, 12, 2, '#2c5037');
    P(5, 18, 12, 2, '#2c5037');
    P(5, 29, 12, 2, '#24422f');
    P(10, 6, 2, 22, '#7fa886');
    // pizza box sticking out
    P(8, -4, 8, 6, '#d8b98a');
    P(9, -3, 6, 2, '#c04a3a');
  });
}

function buildCooler() {
  return makeArt(30, 24, (P) => {
    P(2, 6, 26, 16, '#c84a44');
    P(2, 6, 26, 3, '#e5675f');
    P(4, 9, 22, 11, '#b23c37');
    P(1, 2, 28, 6, '#f1f0ea');
    P(3, 3, 24, 2, '#ffffff');
    P(5, 12, 20, 2, '#8e2a27');
    P(13, 2, 4, 6, '#b23c37');
    P(14, 1, 2, 2, '#f1f0ea');
    P(24, 19, 4, 2, '#7e2421');
    P(2, 21, 26, 2, '#6f201d');
  });
}

function buildStreetTable() {
  return makeArt(50, 38, (P) => {
    // plastic table top
    P(2, 4, 46, 5, '#e9e4d4');
    P(2, 4, 46, 1, '#ffffff');
    P(4, 9, 42, 3, '#c7c1ae');
    P(5, 12, 4, 24, '#b9b4a3');
    P(41, 12, 4, 24, '#b9b4a3');
    P(5, 12, 1, 24, '#928d7e');
    P(41, 12, 1, 24, '#928d7e');
    P(5, 33, 8, 3, '#7e796b');
    P(37, 33, 8, 3, '#7e796b');
    // cups + napkins
    P(12, 0, 4, 6, '#e24a4a');
    P(12, 0, 4, 1, '#f4f4f8');
    P(30, 1, 5, 4, '#f2ead8');
    P(32, 1, 2, 2, '#d8b45c');
    P(21, 1, 3, 5, '#5ab0d8');
    P(21, 1, 3, 1, '#bfe6f5');
  });
}

function buildBurgerCouch() {
  return makeArt(62, 44, (P) => {
    // background burger bun back
    P(8, 2, 46, 12, '#e2a24e');
    P(10, 0, 42, 6, '#f0b769');
    P(12, 0, 6, 3, '#ffd08a');
    P(30, 1, 5, 2, '#ffd08a');
    P(47, 2, 4, 2, '#ffd08a');
    // sesame seeds
    P(17, 3, 2, 1, '#fff3d6');
    P(25, 2, 2, 1, '#fff3d6');
    P(34, 4, 2, 1, '#fff3d6');
    P(43, 3, 2, 1, '#fff3d6');
    // lettuce frill
    P(6, 13, 50, 4, '#5fae3e');
    for (let i = 0; i < 9; i++) P(7 + i * 5.4, 16, 3, 3, '#78c94f');
    // patty + cheese
    P(6, 19, 50, 5, '#8a4a26');
    P(8, 20, 46, 2, '#a65c30');
    P(9, 23, 44, 3, '#f2c14e');
    // bottom bun / seat
    P(4, 26, 54, 12, '#d38f3f');
    P(6, 27, 50, 9, '#e2a24e');
    P(8, 29, 46, 6, '#c97f34');
    // arms
    P(0, 24, 8, 15, '#d38f3f');
    P(54, 24, 8, 15, '#d38f3f');
    P(1, 25, 6, 5, '#f0b769');
    P(55, 25, 6, 5, '#f0b769');
    // feet
    P(6, 38, 10, 5, '#3a2a1c');
    P(46, 38, 10, 5, '#3a2a1c');
  });
}

function buildBurgerTable() {
  return makeArt(54, 36, (P) => {
    P(6, 3, 42, 9, '#e2a24e');
    P(8, 1, 38, 4, '#f0b769');
    P(14, 2, 2, 1, '#fff3d6');
    P(26, 2, 2, 1, '#fff3d6');
    P(38, 2, 2, 1, '#fff3d6');
    P(4, 12, 46, 3, '#5fae3e');
    for (let i = 0; i < 8; i++) P(5 + i * 5.6, 15, 3, 2, '#78c94f');
    P(5, 17, 44, 4, '#8a4a26');
    P(7, 17, 40, 1, '#a65c30');
    P(4, 21, 46, 6, '#d38f3f');
    P(4, 21, 46, 1, '#f0b769');
    P(10, 27, 5, 8, '#8c5a2a');
    P(39, 27, 5, 8, '#8c5a2a');
    P(9, 34, 7, 2, '#5c3a1c');
    P(38, 34, 7, 2, '#5c3a1c');
    P(20, 4, 5, 4, '#f2ead8');
    P(21, 5, 3, 2, '#c04a3a');
    P(32, 4, 4, 5, '#5ab0d8');
  });
}

function buildBurger() {
  return makeArt(22, 18, (P) => {
    P(3, 8, 16, 4, '#5fae3e');
    for (let i = 0; i < 5; i++) P(3 + i * 3.4, 11, 2, 2, '#78c94f');
    P(2, 11, 18, 3, '#8a4a26');
    P(4, 10, 14, 1, '#a65c30');
    P(3, 13, 16, 4, '#d38f3f');
    P(5, 14, 12, 2, '#e2a24e');
    P(2, 2, 18, 8, '#e2a24e');
    P(4, 0, 14, 4, '#f0b769');
    P(7, 1, 2, 1, '#fff3d6');
    P(12, 2, 2, 1, '#fff3d6');
    P(16, 1, 2, 1, '#fff3d6');
    P(9, 4, 2, 1, '#c97f34');
  });
}

function buildHotdog() {
  return makeArt(26, 16, (P) => {
    P(2, 8, 22, 5, '#d8a257');
    P(3, 7, 20, 2, '#efc27f');
    P(4, 12, 18, 2, '#c58a3e');
    P(5, 5, 16, 4, '#b8483c');
    P(6, 4, 14, 2, '#d4604f');
    // zig-zag mustard
    P(6, 5, 2, 1, '#f2c14e');
    P(9, 6, 2, 1, '#f2c14e');
    P(12, 5, 2, 1, '#f2c14e');
    P(15, 6, 2, 1, '#f2c14e');
    P(18, 5, 2, 1, '#f2c14e');
    P(2, 2, 2, 6, '#efe6d0');
    P(22, 2, 2, 6, '#efe6d0');
  });
}

/* ------------------------------------------------------------
   Register Stage 3 art with the procedural art factory.
   ------------------------------------------------------------ */
function buildStreetArt() {
  return {
    enemies: {
      diner: buildDiner(),
      tough: buildTough(),
      streetbouncer: buildStreetBouncer(),
    },
    props: {
      trashcan: buildTrashCan(),
      cooler: buildCooler(),
      streettable: buildStreetTable(),
      burgercouch: buildBurgerCouch(),
      burgertable: buildBurgerTable(),
    },
    items: {
      burger: buildBurger(),
      hotdog: buildHotdog(),
    },
    npcGuy: buildNpcGuy(),
    boss3: buildBoss3(),
  };
}

export { buildStreetArt };

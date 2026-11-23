import { buildHospitalArt } from '../levels/hospital/art.js';
import { buildStreetArt } from '../levels/street/art.js';
import { makeArt, makePortrait, spriteFrom } from './sprites.js';

function heroArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#eab68c', skinSh = '#c98f68', skinHi = '#ffd3a8';
  const suit = '#5d4c28', suitHi = '#77622f', suitSh = '#453a1f';
  const pants = '#94825d', pantsSh = '#736445';
  const shirt = '#f1e2b0', tie = '#b9873a', tieHi = '#d9a94c';
  const hat = '#6d4c2a', hatSh = '#4a3118', band = '#291c11';
  const shoe = '#241e2c';
  const glass = '#15131d', glint = '#86d8ef';

  const step = p.leg || 0;
  const swing = p.arm || 0;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 2.2);
    P(x, hipY, 6, 11, pants);
    P(x, hipY, 1, 11, pantsSh);
    P(x + k, hipY + 10, 6, 9, pants);
    P(x + k, hipY + 10, 1, 9, pantsSh);
    P(x + k - 1, hipY + 18, 8, 4, shoe);
    P(x + k - 1, hipY + 21, 8, 1, '#0c0910');
  };

  const arm = (x, y, sw, sleeve, sleeveSh, hand, forearm) => {
    const s = Math.round(sw * 2);
    P(x, y, 5, 8, sleeve);
    P(x, y, 1, 8, sleeveSh);
    P(x + s, y + 7, 5, 6, sleeve);
    P(x + s, y + 12, 5, 4, hand);
    P(x + s + 1, y + 13, 3, 2, forearm || hand);
  };

  const isAttack = p.atk != null;
  const attackFrame = p.atk || 0;

  /* back leg + arm */
  leg(16, 42, -step);
  if (!isAttack) arm(8, 22 + b, -swing, suit, suitSh, skin);

  /* torso */
  P(12, 21 + b, 22, 21, suit);
  P(12, 21 + b, 2, 21, suitSh);
  P(31, 21 + b, 3, 21, suitSh);
  P(13, 22 + b, 2, 5, suitHi);
  P(16, 21 + b, 5, 6, suitSh);       // left lapel
  P(27, 21 + b, 5, 6, suitSh);       // right lapel
  P(19, 21 + b, 7, 14, shirt);       // shirt front
  P(19, 21 + b, 7, 1, '#d9c88f');
  P(22, 23 + b, 2, 13, tie);
  P(22, 23 + b, 1, 13, tieHi);
  P(17, 34 + b, 2, 2, '#d3ae56');    // button
  P(17, 38 + b, 2, 2, '#d3ae56');
  P(13, 40 + b, 20, 2, suitSh);      // jacket hem
  P(14, 41 + b, 18, 1, band);        // belt

  /* front leg */
  leg(25, 42, step);

  /* head */
  P(16, 8 + b, 14, 13, skin);
  P(16, 8 + b, 14, 1, skinSh);
  P(16, 9 + b, 1, 8, skinSh);
  P(29, 9 + b, 1, 9, skinSh);
  P(17, 9 + b, 2, 2, skinHi);
  P(15, 12 + b, 1, 5, skin);         // ear
  P(15, 12 + b, 1, 4, skinSh);
  P(30, 12 + b, 1, 5, skinSh);
  /* glasses */
  P(16, 12 + b, 14, 2, glass);
  P(17, 12 + b, 2, 1, glint);
  P(25, 12 + b, 2, 1, glint);
  P(19, 12 + b, 1, 2, glass);
  P(23, 12 + b, 1, 2, glass);
  P(22, 13 + b, 1, 1, '#26222e');
  /* nose + mouth */
  P(22, 14 + b, 2, 2, skinSh);
  P(21, 18 + b, 4, 1, '#a06c50');
  P(21, 18 + b, 1, 1, '#7d4e3a');
  P(23, 16 + b, 2, 1, skinSh);

  /* hat */
  P(11, 6 + b, 22, 2, hatSh);
  P(12, 5 + b, 20, 1, hat);
  P(14, 2 + b, 16, 4, hat);
  P(14, 2 + b, 16, 1, '#7d5a33');
  P(14, 5 + b, 16, 2, band);
  P(15, 3 + b, 3, 1, hatSh);
  P(20, 2 + b, 1, 3, hatSh);

  /* front arm / attacks */
  if (isAttack) {
    if (attackFrame === 0) {
      // wind-up: fist pulled back
      P(28, 24 + b, 7, 5, suit);
      P(30, 28 + b, 6, 4, suit);
      P(35, 29 + b, 4, 4, skin);
      P(13, 21 + b, 5, 8, suit);
      P(9, 26 + b, 4, 4, skin);
    } else if (attackFrame === 1) {
      // jab
      P(31, 26 + b, 10, 4, suit);
      P(38, 26 + b, 2, 4, suitHi);
      P(41, 25 + b, 4, 5, skin);
      P(44, 26 + b, 2, 3, '#d89b72');
      P(8, 27 + b, 4, 5, skin);
    } else {
      // heavy briefcase backhand
      P(30, 25 + b, 10, 4, suit);
      P(39, 24 + b, 4, 5, skin);
      P(43, 27 + b, 9, 7, '#6b3a1c');
      P(43, 27 + b, 9, 1, '#8c532b');
      P(45, 25 + b, 4, 2, '#3e2311');
      P(46, 34 + b, 6, 1, '#3e2311');
      P(46, 29 + b, 2, 2, '#e2bc63');
      P(9, 26 + b, 4, 5, skin);
    }
  } else {
    arm(30, 22 + b, swing, suit, suitSh, skin);
  }

  /* motion flourish */
  if (p.tilt) {
    P(33, 20 + b, 1, 10, '#f4e6b8');
    P(35, 21 + b, 1, 7, '#d9c88f');
  }

  if (p.hurt) {
    P(31, 9 + b, 2, 2, '#8ee6ff');
    P(33, 12 + b, 1, 2, '#8ee6ff');
  }
}

function heroJumpArt(P) {
  const skin = '#eab68c', skinSh = '#c98f68';
  const suit = '#5d4c28', suitSh = '#453a1f';
  const pants = '#94825d', shoe = '#241e2c', shirt = '#f1e2b0';
  const hat = '#6d4c2a', hatSh = '#4a3118', band = '#291c11';

  P(18, 26, 5, 10, pants);           // tucked back leg
  P(21, 33, 6, 4, shoe);
  P(24, 40, 5, 10, pants);
  P(27, 47, 7, 4, shoe);

  P(9, 16, 5, 10, suit);
  P(9, 23, 4, 4, skin);

  P(13, 20, 21, 19, suit);
  P(13, 20, 2, 19, suitSh);
  P(31, 20, 3, 19, suitSh);
  P(19, 20, 7, 13, shirt);
  P(22, 22, 2, 11, '#b9873a');
  P(13, 37, 21, 2, suitSh);

  P(26, 16, 5, 9, suit);
  P(30, 13, 5, 5, skin);

  P(16, 7, 14, 12, skin);
  P(16, 8, 14, 1, skinSh);
  P(16, 11, 14, 2, '#15131d');
  P(17, 11, 2, 1, '#86d8ef');
  P(26, 11, 2, 1, '#86d8ef');
  P(22, 13, 2, 2, skinSh);
  P(21, 17, 4, 1, '#a06c50');
  P(11, 5, 22, 2, hatSh);
  P(13, 4, 20, 1, hat);
  P(14, 1, 16, 4, hat);
  P(14, 4, 16, 2, band);
}

function buildHero() {
  const idle = [
    makeArt(44, 66, (P) => heroArt(P, { bob: 0 })),
    makeArt(44, 66, (P) => heroArt(P, { bob: 1, arm: 0.25 })),
  ];
  const walk = [
    makeArt(44, 66, (P) => heroArt(P, { leg: -1, arm: 1, bob: 0 })),
    makeArt(44, 66, (P) => heroArt(P, { leg: -0.25, arm: 0.3, bob: -1 })),
    makeArt(44, 66, (P) => heroArt(P, { leg: 1, arm: -1, bob: 0 })),
    makeArt(44, 66, (P) => heroArt(P, { leg: 0.25, arm: -0.3, bob: -1 })),
  ];
  const attack = [
    makeArt(44, 66, (P) => heroArt(P, { atk: 0, tilt: 1 })),
    makeArt(44, 66, (P) => heroArt(P, { atk: 1 })),
    makeArt(44, 66, (P) => heroArt(P, { atk: 2 })),
  ];
  const hurt = [makeArt(44, 66, (P) => heroArt(P, { hurt: 1, leg: -1, arm: 1, bob: -1 }))];
  const jump = [makeArt(44, 66, heroJumpArt)];

  return spriteFrom({ idle, walk, attack, hurt, jump, special: attack }, 122, {
    portrait: makePortrait(idle[0], 0.52, 0.7, 0.44),
  });
}

/* ============================================================
   JORGE SALINAS "ARTHAS" — fallback: heavy-set skater
   ============================================================ */
function bossArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#f0c6a4', skinSh = '#d2a17f', skinHi = '#ffdcbd';
  const tee = '#cf2233', teeSh = '#9a1424', teeHi = '#ef4450';
  const shorts = '#23222e', shortsSh = '#15141d';
  const shoe = '#e8e8f0', shoeSh = '#a9adc4', sole = '#3a3c50';
  const cap = '#1d1c26', capSh = '#111019';
  const gold = '#f3c74b';
  const step = p.leg || 0;
  const swing = p.arm || 0;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 2);
    P(x, hipY, 9, 8, shorts);
    P(x + k, hipY + 7, 10, 9, shorts);
    P(x + k, hipY + 7, 10, 1, shortsSh);
    P(x + k + 1, hipY + 15, 8, 5, skin);
    P(x + k, hipY + 20, 10, 4, shoe);
    P(x + k, hipY + 24, 10, 2, sole);
    P(x + k + 2, hipY + 21, 5, 1, shoeSh);
  };

  const arm = (x, y, sw, front) => {
    const s = Math.round(sw * 2);
    P(x, y, 8, 6, tee);
    P(x, y, 8, 1, teeHi);
    P(x + s, y + 5, 7, 8, skin);
    P(x + s, y + 12, 7, 5, skinSh);
    P(x + s + (front ? 1 : 0), y + 16, 6, 4, skin);
  };

  const isAttack = p.atk != null;
  const af = p.atk || 0;

  leg(14, 46, -step);
  if (!isAttack) arm(4, 26 + b, -swing, false);

  /* giant tee body */
  P(8, 24 + b, 36, 8, tee);
  P(6, 29 + b, 40, 12, tee);
  P(8, 40 + b, 36, 7, tee);
  P(12, 46 + b, 28, 3, teeSh);
  P(8, 24 + b, 4, 22, teeSh);
  P(38, 25 + b, 6, 21, teeSh);
  P(10, 25 + b, 10, 2, teeHi);
  P(22, 30 + b, 15, 9, '#8f1220');     // graphic panel
  P(24, 32 + b, 8, 2, '#ffcb45');
  P(24, 35 + b, 2, 3, '#ffcb45');
  P(30, 35 + b, 2, 3, '#ffcb45');
  P(26, 31 + b, 2, 7, '#e8e6f2');
  P(30, 34 + b, 6, 1, '#e8e6f2');
  /* chain */
  P(19, 24 + b, 12, 1, gold);
  P(21, 26 + b, 1, 3, gold);
  P(28, 26 + b, 1, 3, gold);
  P(23, 29 + b, 3, 2, gold);
  /* shorts */
  P(13, 48 + b, 26, 3, shortsSh);

  leg(30, 46, step);

  /* head */
  P(17, 10 + b, 19, 14, skin);
  P(17, 10 + b, 19, 1, skinSh);
  P(17, 11 + b, 1, 9, skinSh);
  P(35, 11 + b, 1, 10, skinSh);
  P(18, 11 + b, 3, 2, skinHi);
  P(16, 14 + b, 1, 4, skin);
  P(36, 14 + b, 1, 4, skinSh);
  P(21, 15 + b, 3, 2, '#241a20');       // eyes
  P(30, 15 + b, 3, 2, '#241a20');
  P(22, 15 + b, 1, 1, '#fff');
  P(31, 15 + b, 1, 1, '#fff');
  P(26, 17 + b, 3, 2, skinSh);          // nose
  P(22, 21 + b, 11, 2, '#7c4034');      // grin
  P(23, 21 + b, 8, 1, '#fff4e6');
  P(23, 23 + b, 9, 1, skinSh);          // chin shade
  P(19, 23 + b, 3, 1, skinSh);
  P(32, 23 + b, 3, 1, skinSh);
  /* backwards cap */
  P(18, 6 + b, 16, 5, cap);
  P(18, 6 + b, 16, 1, '#2e2c3c');
  P(29, 8 + b, 13, 3, cap);
  P(29, 8 + b, 13, 1, capSh);
  P(19, 10 + b, 14, 1, capSh);
  P(24, 7 + b, 4, 1, '#4a465c');
  P(33, 9 + b, 6, 1, '#35324a');

  if (isAttack) {
    if (af === 0) {
      P(31, 27 + b, 6, 6, tee);
      P(35, 32 + b, 7, 6, skin);
      P(8, 30 + b, 4, 6, skin);
      P(6, 35 + b, 4, 3, skin);
    } else if (af === 1) {
      P(33, 28 + b, 11, 5, tee);
      P(42, 27 + b, 7, 6, skin);
      P(49, 28 + b, 2, 4, skinSh);
      P(4, 29 + b, 4, 6, tee);
      P(1, 33 + b, 4, 4, skin);
    } else {
      P(30, 24 + b, 10, 6, tee);
      P(40, 20 + b, 8, 7, skin);
      P(42, 18 + b, 6, 4, '#e6d36b');   // gold knuckles / board
      P(6, 30 + b, 5, 6, skin);
    }
  } else {
    arm(40, 26 + b, swing, true);
  }

  if (p.hurt) {
    P(37, 12 + b, 2, 2, '#8ee6ff');
    P(35, 15 + b, 1, 2, '#8ee6ff');
  }
}

function bossJumpArt(P) {
  const skin = '#f0c6a4', skinSh = '#d2a17f';
  const tee = '#cf2233', teeSh = '#9a1424', shorts = '#23222e';
  const shoe = '#e8e8f0', cap = '#1d1c26', gold = '#f3c74b';
  P(15, 42, 9, 9, shorts);
  P(20, 49, 9, 5, skin);
  P(19, 54, 10, 4, shoe);
  P(29, 42, 9, 9, shorts);
  P(34, 49, 9, 5, skin);
  P(33, 54, 10, 4, shoe);
  P(5, 24, 7, 12, tee);
  P(2, 33, 6, 5, skin);
  P(40, 24, 7, 12, tee);
  P(46, 32, 6, 5, skin);
  P(8, 22, 36, 8, tee);
  P(6, 27, 40, 12, tee);
  P(8, 38, 36, 8, tee);
  P(22, 27, 15, 10, '#8f1220');
  P(24, 29, 8, 2, '#ffcb45');
  P(19, 22, 12, 1, gold);
  P(17, 10, 19, 14, skin);
  P(21, 15, 3, 2, '#241a20');
  P(30, 15, 3, 2, '#241a20');
  P(22, 22, 11, 2, '#7c4034');
  P(23, 22, 8, 1, '#fff4e6');
  P(18, 6, 16, 5, cap);
  P(29, 8, 13, 3, cap);
}

function buildBoss() {
  const idle = [
    makeArt(52, 72, (P) => bossArt(P, { bob: 0 })),
    makeArt(52, 72, (P) => bossArt(P, { bob: 1, arm: 0.3 })),
  ];
  const walk = [
    makeArt(52, 72, (P) => bossArt(P, { leg: -1, arm: 1 })),
    makeArt(52, 72, (P) => bossArt(P, { leg: -0.2, arm: 0.2, bob: -1 })),
    makeArt(52, 72, (P) => bossArt(P, { leg: 1, arm: -1 })),
    makeArt(52, 72, (P) => bossArt(P, { leg: 0.2, arm: -0.2, bob: -1 })),
  ];
  const attack = [
    makeArt(52, 72, (P) => bossArt(P, { atk: 0, leg: -0.5 })),
    makeArt(52, 72, (P) => bossArt(P, { atk: 1, leg: 0.4 })),
    makeArt(52, 72, (P) => bossArt(P, { atk: 2, leg: 0.6, bob: -1 })),
  ];
  const hurt = [makeArt(52, 72, (P) => bossArt(P, { hurt: 1, leg: -1, arm: 1, bob: -1 }))];
  const jump = [makeArt(52, 72, bossJumpArt)];

  return spriteFrom({ idle, walk, attack, hurt, jump, special: attack }, 132, {
    portrait: makePortrait(idle[0], 0.5, 0.72, 0.42),
  });
}

/* ============================================================
   ENEMY 1 — Mall Punk / Skate Kid
   ============================================================ */
function punkArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#d9a074', skinSh = '#b47c55', skinHi = '#f0c08f';
  const hair = '#f0459a', hairSh = '#b02168';
  const tee = '#f4d048', teeSh = '#c9a22b';
  const vest = '#3d3a72', vestSh = '#282550';
  const jeans = '#2e4b66', jeansSh = '#1e3448';
  const shoe = '#e6e9f5', sole = '#3b3e52';
  const step = p.leg || 0;
  const swing = p.arm || 0;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 2.5);
    P(x, hipY, 5, 9, jeans);
    P(x + k, hipY + 8, 5, 9, jeans);
    P(x + k, hipY + 8, 5, 1, jeansSh);
    P(x + k - 1, hipY + 17, 6, 3, shoe);
    P(x + k - 1, hipY + 20, 6, 1, sole);
    P(x + k, hipY + 18, 2, 1, '#9aa4c0');
    /* rollerblade wheels */
    P(x + k - 1, hipY + 21, 2, 1, '#7df0d4');
    P(x + k + 3, hipY + 21, 2, 1, '#7df0d4');
  };

  const arm = (x, y, sw) => {
    const s = Math.round(sw * 2);
    P(x, y, 4, 5, tee);
    P(x + s, y + 4, 3, 7, skin);
    P(x + s, y + 10, 3, 3, skinSh);
    P(x, y + 4, 4, 1, teeSh);
  };

  leg(14, 38, -step);
  if (p.atk == null) arm(7, 23 + b, -swing);

  /* tee + vest */
  P(10, 21 + b, 18, 7, tee);
  P(9, 26 + b, 20, 11, tee);
  P(11, 35 + b, 16, 4, tee);
  P(10, 21 + b, 5, 14, vest);
  P(25, 21 + b, 4, 14, vest);
  P(10, 21 + b, 1, 14, vestSh);
  P(28, 21 + b, 1, 14, vestSh);
  P(17, 27, 5, 5, '#20202e');        // skull graphic
  P(18, 28, 1, 1, '#f0459a');
  P(20, 28, 1, 1, '#f0459a');
  P(16, 38, 1, 2, vestSh);           // rips
  P(23, 39, 2, 1, jeansSh);

  P(17, 39 + b, 6, 2, '#20202e');    // belt

  leg(22, 38, step);

  /* head */
  P(14, 9 + b, 13, 12, skin);
  P(14, 9 + b, 2, 10, skinSh);
  P(26, 10 + b, 1, 9, skinSh);
  P(15, 10 + b, 2, 2, skinHi);
  P(16, 13 + b, 2, 2, '#20161c');
  P(22, 13 + b, 2, 2, '#20161c');
  P(16, 13 + b, 1, 1, '#fff');
  P(22, 13 + b, 1, 1, '#fff');
  P(19, 15 + b, 2, 2, skinSh);
  P(18, 18 + b, 4, 1, '#8d4c3c');
  P(13, 12 + b, 1, 4, skin);         // ear
  /* spiky pink hair */
  P(13, 5 + b, 15, 6, hair);
  P(13, 5 + b, 15, 2, hairSh);
  P(12, 3 + b, 3, 4, hair);
  P(16, 1 + b, 3, 5, hair);
  P(20, 2 + b, 3, 4, hair);
  P(24, 4 + b, 3, 3, hair);
  P(27, 6 + b, 3, 3, hair);
  P(15, 4 + b, 2, 1, '#ff8fc4');
  P(25, 8 + b, 4, 1, '#20202e');     // headband edge

  if (p.atk != null) {
    if (p.atk === 0) {
      P(26, 24 + b, 5, 4, tee);
      P(29, 27 + b, 6, 4, skin);
      P(7, 27 + b, 3, 4, skin);
    } else {
      P(27, 24 + b, 8, 3, tee);
      P(34, 24 + b, 3, 4, skin);
      P(37, 24 + b, 2, 3, skinSh);
      P(6, 27 + b, 3, 4, skin);
    }
  } else {
    arm(28, 23 + b, swing);
  }

  if (p.hurt) {
    P(30, 12 + b, 2, 2, '#8ee6ff');
  }
}

function buildPunk() {
  const idle = [
    makeArt(40, 62, (P) => punkArt(P, { bob: 0 })),
    makeArt(40, 62, (P) => punkArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(40, 62, (P) => punkArt(P, { leg: -1, arm: 1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: 1, arm: -1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(40, 62, (P) => punkArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(40, 62, (P) => punkArt(P, { atk: 0, leg: -0.4 })),
    makeArt(40, 62, (P) => punkArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(40, 62, (P) => punkArt(P, { hurt: 1, leg: -0.5, arm: 1 }))],
    jump: [makeArt(40, 62, (P) => punkArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 102);
}

/* ============================================================
   ENEMY 2 — Overzealous Mall Security Guard
   ============================================================ */
function guardArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#e0ab7e', skinSh = '#bb855c';
  const navy = '#293a63', navySh = '#1b2746', navyHi = '#3b4f7d';
  const shirt = '#9fb8d6', shirtSh = '#7e98b8';
  const gold = '#f2c14e';
  const belt = '#1a1a26';
  const shoe = '#14131c';
  const step = p.leg || 0;
  const swing = p.arm || 0;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 2);
    P(x, hipY, 6, 9, navy);
    P(x + k, hipY + 8, 6, 9, navy);
    P(x + k, hipY + 8, 2, 9, navySh);
    P(x + k - 1, hipY + 17, 8, 3, shoe);
    P(x + k, hipY + 18, 6, 1, '#2a2a38');
  };

  const arm = (x, y, sw) => {
    const s = Math.round(sw * 1.6);
    P(x, y, 5, 7, shirt);
    P(x + s, y + 6, 4, 6, skin);
    P(x + s, y + 11, 4, 3, skinSh);
  };

  leg(13, 40, -step);
  if (p.atk == null) arm(7, 23 + b, -swing);

  /* torso with belly */
  P(10, 21 + b, 22, 7, shirt);
  P(9, 26 + b, 24, 12, shirt);
  P(11, 37 + b, 20, 4, shirtSh);
  P(10, 21 + b, 3, 16, shirtSh);
  P(19, 22 + b, 2, 14, '#f0f3f7');   // shirt placket
  P(12, 25 + b, 2, 2, gold);         // badges
  P(15, 23 + b, 3, 2, gold);
  P(10, 38 + b, 22, 3, belt);
  P(20, 38 + b, 3, 3, gold);         // buckle
  P(16, 39 + b, 4, 2, '#2b2b3a');

  leg(24, 40, step);

  /* head */
  P(14, 9 + b, 14, 12, skin);
  P(14, 9 + b, 1, 10, skinSh);
  P(27, 10 + b, 1, 9, skinSh);
  P(15, 10 + b, 2, 2, skin);
  P(16, 13 + b, 3, 2, '#1e1a20');
  P(23, 13 + b, 3, 2, '#1e1a20');
  P(17, 13 + b, 1, 1, '#fff');
  P(24, 13 + b, 1, 1, '#fff');
  P(20, 15 + b, 3, 2, skinSh);
  P(17, 18 + b, 8, 1, '#5c3a2c');   // mustache
  P(18, 18 + b, 7, 2, '#6b4434');
  P(19, 20 + b, 4, 1, '#8d5c48');
  P(13, 12 + b, 1, 4, skin);

  /* peaked cap */
  P(12, 5 + b, 18, 6, navy);
  P(12, 5 + b, 18, 1, navyHi);
  P(12, 9 + b, 18, 2, navySh);
  P(10, 10 + b, 23, 2, navy);
  P(10, 10 + b, 23, 1, '#0f1526');
  P(20, 6 + b, 5, 3, gold);
  P(21, 7 + b, 3, 1, '#8a6520');

  if (p.atk != null) {
    if (p.atk === 0) {
      P(27, 24 + b, 7, 4, shirt);
      P(32, 26 + b, 5, 4, skin);
      P(36, 27 + b, 6, 1, '#d8c98f');   // baton raised
      P(7, 27 + b, 3, 4, skin);
    } else {
      P(28, 25 + b, 7, 4, shirt);
      P(35, 26 + b, 7, 4, skin);
      P(41, 27 + b, 13, 2, '#20202a');  // baton thrust
      P(52, 27 + b, 3, 2, '#c8cfdd');
      P(7, 27 + b, 3, 4, skin);
    }
  } else {
    arm(27, 23 + b, swing);
    // baton resting in hand
    P(33, 34 + b, 2, 8, '#20202a');
    P(32, 41 + b, 4, 1, '#c8cfdd');
  }

  if (p.hurt) {
    P(30, 12 + b, 2, 2, '#8ee6ff');
  }
}

function buildGuard() {
  const idle = [
    makeArt(44, 66, (P) => guardArt(P, { bob: 0 })),
    makeArt(44, 66, (P) => guardArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(44, 66, (P) => guardArt(P, { leg: -1, arm: 1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: 1, arm: -1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(44, 66, (P) => guardArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(44, 66, (P) => guardArt(P, { atk: 0, leg: -0.4 })),
    makeArt(44, 66, (P) => guardArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(44, 66, (P) => guardArt(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(44, 66, (P) => guardArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 112);
}

/* ============================================================
   ENEMY 3 — Heavy Bouncer / Ice Rink Bruiser
   ============================================================ */
function bouncerArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#c98a62', skinSh = '#a56a47', skinHi = '#e8ab7f';
  const tank = '#2b2b38', tankSh = '#1a1a24';
  const shorts = '#b7343e', shortsSh = '#85222b';
  const boot = '#3a2c25', bootHi = '#5a4638';
  const gold = '#f2c14e';
  const step = p.leg || 0;
  const swing = p.arm || 0;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 1.6);
    P(x, hipY, 9, 10, shorts);
    P(x + k, hipY + 9, 9, 8, skin);
    P(x + k, hipY + 16, 10, 6, boot);
    P(x + k, hipY + 20, 10, 2, '#1c1714');
    P(x + k, hipY + 17, 10, 1, '#7a5a44');
  };

  const arm = (x, y, sw) => {
    const s = Math.round(sw * 1.5);
    P(x, y, 10, 9, skin);
    P(x, y, 10, 3, skinHi);
    P(x + s, y + 8, 8, 9, skin);
    P(x + s, y + 15, 8, 4, skinSh);
    P(x + s, y + 8, 8, 2, gold);   // wristband
    P(x + s + 1, y + 17, 7, 4, skin);
  };

  leg(14, 50, -step);
  if (p.atk == null) arm(2, 27 + b, -swing);

  /* massive torso */
  P(9, 23 + b, 36, 7, tank);
  P(6, 27 + b, 42, 12, tank);
  P(8, 37 + b, 38, 10, tank);
  P(12, 47 + b, 30, 3, tankSh);
  P(6, 27 + b, 6, 15, tankSh);
  P(40, 28 + b, 5, 13, tankSh);
  P(13, 24 + b, 5, 4, gold);       // chain
  P(36, 24 + b, 5, 4, gold);
  P(18, 26 + b, 18, 2, gold);
  P(24, 28 + b, 6, 4, '#e9b84a');
  P(14, 32 + b, 4, 4, skinSh);     // chest hair
  P(30, 34 + b, 4, 4, skinSh);
  P(16, 45 + b, 22, 2, '#3f3f4e');

  /* belt */
  P(12, 49 + b, 28, 3, '#17161e');
  P(23, 49 + b, 6, 3, gold);

  leg(28, 50, step);

  /* head — bald with stubble */
  P(17, 10 + b, 16, 13, skin);
  P(17, 10 + b, 16, 1, skinSh);
  P(17, 11 + b, 1, 9, skinSh);
  P(32, 11 + b, 1, 10, skinSh);
  P(18, 11 + b, 3, 2, skinHi);
  P(18, 15 + b, 14, 4, '#2a1d20');  // sunglasses
  P(19, 15 + b, 4, 2, '#141018');
  P(27, 15 + b, 4, 2, '#141018');
  P(20, 15 + b, 1, 1, '#8ee6ff');
  P(28, 15 + b, 1, 1, '#8ee6ff');
  P(24, 16 + b, 2, 3, skinSh);      // nose
  P(21, 21 + b, 9, 1, '#5c3328');   // mouth
  P(17, 23 + b, 16, 1, '#3c2a2a');  // jaw stubble
  P(18, 22 + b, 2, 1, '#3c2a2a');
  P(30, 22 + b, 2, 1, '#3c2a2a');
  P(16, 13 + b, 1, 4, skin);
  P(33, 13 + b, 1, 4, skinSh);
  /* earring */
  P(33, 16 + b, 2, 2, gold);

  if (p.atk != null) {
    if (p.atk === 0) {
      P(38, 24 + b, 8, 8, skin);
      P(42, 18 + b, 8, 6, skin);
      P(3, 30 + b, 5, 7, skin);
    } else {
      P(38, 26 + b, 10, 6, skin);
      P(46, 27 + b, 8, 7, skinSh);
      P(2, 32 + b, 5, 7, skin);
    }
  } else {
    arm(40, 27 + b, swing);
  }

  if (p.hurt) {
    P(35, 12 + b, 2, 2, '#8ee6ff');
  }
}

function buildBouncer() {
  const idle = [
    makeArt(54, 74, (P) => bouncerArt(P, { bob: 0 })),
    makeArt(54, 74, (P) => bouncerArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(54, 74, (P) => bouncerArt(P, { leg: -1, arm: 0.8 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: -0.55, arm: 0.5, bob: -1 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: 0.45, arm: -0.5, bob: -1 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: 1, arm: -0.8 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(54, 74, (P) => bouncerArt(P, { leg: -0.45, arm: 0.5, bob: -1 })),
  ];
  const attack = [
    makeArt(54, 74, (P) => bouncerArt(P, { atk: 0, leg: -0.3 })),
    makeArt(54, 74, (P) => bouncerArt(P, { atk: 1, leg: 0.4 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(54, 74, (P) => bouncerArt(P, { hurt: 1, leg: -0.4, arm: 0.8 }))],
    jump: [makeArt(54, 74, (P) => bouncerArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 124);
}

/* ============================================================
   PROPS + PICKUPS
   ============================================================ */
function buildBench() {
  return makeArt(38, 20, (P) => {
    P(2, 6, 34, 3, '#c07a42');
    P(2, 10, 34, 3, '#a9662f');
    P(2, 14, 34, 3, '#8e5427');
    P(2, 6, 34, 1, '#e29a5c');
    P(5, 17, 3, 3, '#2c2c38');
    P(30, 17, 3, 3, '#2c2c38');
    P(3, 3, 3, 4, '#3a3a48');
    P(32, 3, 3, 4, '#3a3a48');
    P(1, 2, 36, 2, '#4a4a58');
    P(7, 17, 24, 1, '#5c3a20');
  });
}

function buildTrash() {
  return makeArt(18, 24, (P) => {
    P(2, 5, 14, 17, '#3c7f80');
    P(2, 5, 14, 2, '#57a3a0');
    P(4, 8, 3, 12, '#4e9996');
    P(12, 8, 2, 12, '#2b5e60');
    P(1, 2, 16, 4, '#2c5c5e');
    P(2, 1, 14, 2, '#4c8a8b');
    P(7, 0, 4, 2, '#2c5c5e');
    P(5, 10, 8, 2, '#e9e4c8');
    P(6, 13, 6, 1, '#a8b0a0');
    P(3, 20, 12, 2, '#243f42');
    P(6, 3, 6, 1, '#8fb8b3');
  });
}

function buildPalm() {
  return makeArt(46, 84, (P) => {
    // pot
    P(15, 70, 18, 10, '#a9603d');
    P(15, 70, 18, 2, '#c67a4c');
    P(13, 67, 22, 4, '#c67a4c');
    P(13, 67, 22, 1, '#e09565');
    P(17, 76, 14, 3, '#854229');
    // trunk
    P(22, 42, 5, 26, '#8a6a3e');
    P(22, 42, 2, 26, '#a08050');
    P(24, 48, 3, 2, '#6c4f2c');
    P(22, 55, 3, 2, '#6c4f2c');
    P(24, 62, 3, 2, '#6c4f2c');
    // fronds
    P(23, 38, 4, 4, '#2f8f4c');
    P(8, 34, 16, 4, '#2f9e57');
    P(4, 30, 8, 4, '#2f9e57');
    P(1, 27, 6, 4, '#247c44');
    P(24, 33, 14, 4, '#37b565');
    P(35, 28, 8, 4, '#2f9e57');
    P(41, 25, 5, 4, '#247c44');
    P(14, 40, 10, 3, '#247c44');
    P(28, 40, 10, 3, '#247c44');
    P(18, 30, 8, 3, '#3ecf78');
    P(26, 27, 8, 3, '#3ecf78');
    P(24, 24, 5, 4, '#3ecf78');
    P(24, 24, 2, 2, '#55e08c');
    // coconuts
    P(21, 40, 3, 2, '#6c4a25');
    P(26, 40, 3, 2, '#6c4a25');
  });
}

function buildPlanter() {
  return makeArt(26, 26, (P) => {
    P(9, 13, 9, 11, '#a9603d');
    P(5, 10, 16, 4, '#c67a4c');
    P(5, 10, 16, 1, '#e09565');
    P(11, 19, 5, 3, '#854229');
    P(7, 3, 12, 8, '#2f8f4c');
    P(4, 6, 5, 6, '#37b565');
    P(17, 5, 5, 7, '#37b565');
    P(9, 1, 7, 5, '#3ecf78');
    P(11, 4, 2, 2, '#55e08c');
    P(2, 9, 4, 3, '#247c44');
  });
}

function buildCrate() {
  return makeArt(24, 22, (P) => {
    P(2, 4, 20, 16, '#b9803f');
    P(2, 4, 20, 2, '#d79a55');
    P(2, 18, 20, 2, '#8a5a2a');
    P(2, 4, 2, 16, '#8a5a2a');
    P(20, 4, 2, 16, '#8a5a2a');
    P(4, 6, 16, 2, '#6d4522');
    P(4, 16, 16, 2, '#6d4522');
    P(4, 6, 2, 12, '#d79a55');
    P(18, 6, 2, 12, '#d79a55');
    P(9, 8, 6, 6, '#f2c14e');
    P(10, 9, 4, 4, '#c99a2e');
  });
}

function buildStool() {
  return makeArt(18, 20, (P) => {
    P(3, 3, 12, 3, '#d0445a');
    P(3, 3, 12, 1, '#f26a7d');
    P(4, 6, 10, 2, '#8c2335');
    P(7, 8, 2, 9, '#42424f');
    P(11, 8, 2, 9, '#2c2c38');
    P(4, 16, 10, 2, '#2c2c38');
    P(8, 9, 2, 1, '#9393a8');
  });
}

function buildPastelito() {
  return makeArt(16, 12, (P) => {
    P(1, 4, 14, 5, '#e7a33f');
    P(2, 3, 12, 2, '#f6c265');
    P(3, 8, 10, 2, '#c47a25');
    P(5, 4, 6, 2, '#a85e1c');
    P(1, 3, 3, 1, '#f6c265');
    P(12, 3, 3, 1, '#f6c265');
    P(4, 2, 3, 1, '#fff0c0');
  });
}

function buildTequeño() {
  return makeArt(20, 10, (P) => {
    P(1, 4, 18, 4, '#e0a13a');
    P(1, 3, 18, 2, '#f8c96b');
    P(1, 6, 18, 1, '#b97722');
    P(3, 4, 5, 1, '#f8c96b');
    P(11, 4, 4, 1, '#fff0c0');
    P(18, 3, 2, 5, '#fff4d8');
    P(0, 4, 2, 4, '#fff4d8');
    P(6, 7, 3, 1, '#8a5416');
  });
}

function buildSoda() {
  return makeArt(10, 16, (P) => {
    P(2, 2, 6, 12, '#d9303e');
    P(2, 2, 2, 12, '#f2555f');
    P(6, 2, 2, 12, '#a81f2c');
    P(1, 1, 8, 2, '#c7ccd8');
    P(2, 0, 6, 1, '#8f95a3');
    P(3, 5, 4, 3, '#fff5e0');
    P(4, 6, 2, 1, '#d9303e');
    P(2, 9, 6, 2, '#f2a23c');
    P(2, 14, 6, 1, '#7d1520');
    P(7, 2, 1, 12, '#fbe3e5');
  });
}

const Art = {
  built: false,
  hero: null,
  boss: null,
  enemies: {},
  props: {},
  items: {},
  loadedLevels: new Set(),

  build() {
    if (this.built) return this;
    this.hero = buildHero();
    this.boss = buildBoss();
    this.enemies = {
      punk: buildPunk(),
      guard: buildGuard(),
      bouncer: buildBouncer(),
    };
    this.props = {
      bench: buildBench(),
      trash: buildTrash(),
      palm: buildPalm(),
      planter: buildPlanter(),
      crate: buildCrate(),
      stool: buildStool(),
    };
    this.items = {
      pastelito: buildPastelito(),
      tequeño: buildTequeño(),
      soda: buildSoda(),
    };
    this.built = true;
    return this;
  },
  buildLevel(stageId) {
    if (stageId === 1 || this.loadedLevels.has(stageId)) return;
    const art = stageId === 2 ? buildHospitalArt() : buildStreetArt();
    for (const group of ['enemies', 'props', 'items']) Object.assign(this[group], art[group]);
    if (stageId === 2) {
      this.npcGirl = art.npcGirl;
      this.boss2 = art.boss2;
    } else {
      this.npcGuy = art.npcGuy;
      this.boss3 = art.boss3;
    }
    this.loadedLevels.add(stageId);
  },
};

export { Art };

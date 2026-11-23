import { makeArt, spriteFrom } from '../../media/sprites.js';

function hLeg(P, x, hipY, st, pants, pantsSh, shoe, sole) {
  const k = Math.round(st * 2.2);
  P(x, hipY, 6, 11, pants);
  P(x, hipY, 1, 11, pantsSh);
  P(x + k, hipY + 10, 6, 9, pants);
  P(x + k, hipY + 10, 1, 9, pantsSh);
  P(x + k - 1, hipY + 18, 8, 4, shoe);
  P(x + k - 1, hipY + 21, 8, 1, sole);
}

function hArm(P, x, y, sw, sleeve, sleeveSh, skin, skinSh) {
  const s = Math.round(sw * 2);
  P(x, y, 5, 8, sleeve);
  P(x, y, 1, 8, sleeveSh);
  P(x + s, y + 7, 5, 6, sleeve);
  P(x + s, y + 12, 5, 4, skin);
  P(x + s + 1, y + 13, 3, 2, skinSh || skin);
}

/* ------------------------------------------------------------
   ORDERLY — teal scrubs, surgical mask, aggressive
   ------------------------------------------------------------ */
function orderlyArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#d9a074', skinSh = '#b47c55', hair = '#2b2028';
  const scrubs = '#2f9e9a', scrubsSh = '#1f7471', scrubsHi = '#5cc9c2';
  const mask = '#eef8f4', maskSh = '#c7ded9';
  const shoe = '#e8eef5', sole = '#3a3e4a';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  hLeg(P, 14, 40, -step, scrubs, scrubsSh, shoe, sole);
  if (atk == null) hArm(P, 7, 22 + b, -swing, scrubs, scrubsSh, skin, skinSh);

  // scrubs torso
  P(10, 21 + b, 20, 8, scrubs);
  P(9, 28 + b, 22, 10, scrubs);
  P(11, 37 + b, 18, 3, scrubsSh);
  P(10, 21 + b, 3, 16, scrubsSh);
  P(9, 21 + b, 8, 2, scrubsHi);
  P(17, 22 + b, 6, 5, '#e8f4f0');            // V-neck undershirt
  P(18, 21 + b, 4, 2, maskSh);
  P(25, 28 + b, 4, 4, scrubsSh);              // pocket
  P(13, 26 + b, 3, 2, '#ffd166');             // badge
  P(12, 39 + b, 18, 2, '#e8f4f0');            // drawstring

  hLeg(P, 23, 40, step, scrubs, scrubsSh, shoe, sole);

  // head + mask
  P(14, 8 + b, 14, 13, skin);
  P(14, 8 + b, 14, 1, skinSh);
  P(14, 9 + b, 1, 8, skinSh);
  P(15, 9 + b, 2, 2, '#f0c08f');
  P(15, 12 + b, 3, 2, '#20161c');
  P(24, 12 + b, 3, 2, '#20161c');
  P(16, 12 + b, 1, 1, '#fff');
  P(25, 12 + b, 1, 1, '#fff');
  P(14, 15 + b, 14, 6, mask);
  P(14, 15 + b, 14, 1, maskSh);
  P(18, 17 + b, 6, 2, maskSh);
  P(14, 14 + b, 2, 1, maskSh);
  P(27, 14 + b, 1, 4, skinSh);
  P(13, 11 + b, 1, 5, skin);                  // ear
  // short dark hair
  P(13, 5 + b, 16, 5, hair);
  P(13, 5 + b, 16, 1, '#443340');
  P(12, 7 + b, 2, 3, hair);
  P(14, 4 + b, 5, 2, hair);
  P(22, 4 + b, 5, 1, hair);

  if (atk != null) {
    if (atk === 0) {
      P(27, 23 + b, 6, 4, scrubs);
      P(31, 26 + b, 5, 4, skin);
      P(8, 26 + b, 4, 4, skin);
    } else {
      P(28, 23 + b, 9, 4, scrubs);
      P(36, 23 + b, 4, 5, skin);
      P(39, 24 + b, 6, 2, '#c8d2dc');          // syringe
      P(44, 23 + b, 2, 4, '#a8e6ff');
      P(7, 26 + b, 4, 4, skin);
    }
  } else {
    hArm(P, 27, 22 + b, swing, scrubs, scrubsSh, skin, skinSh);
  }

  if (p.hurt) P(30, 11 + b, 2, 2, '#8ee6ff');
}

function buildOrderly() {
  const idle = [
    makeArt(42, 64, (P) => orderlyArt(P, { bob: 0 })),
    makeArt(42, 64, (P) => orderlyArt(P, { bob: 1, arm: 0.25 })),
  ];
  const walk = [
    makeArt(42, 64, (P) => orderlyArt(P, { leg: -1, arm: 1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: 1, arm: -1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(42, 64, (P) => orderlyArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(42, 64, (P) => orderlyArt(P, { atk: 0, leg: -0.4 })),
    makeArt(42, 64, (P) => orderlyArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(42, 64, (P) => orderlyArt(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(42, 64, (P) => orderlyArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 124);
}

/* ------------------------------------------------------------
   DOCTOR — white lab coat, stethoscope, clipboard
   ------------------------------------------------------------ */
function doctorArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#e0ab7e', skinSh = '#bb855c', hair = '#3a2a24';
  const coat = '#f2f5f7', coatSh = '#d2dbe2', coatHi = '#ffffff';
  const shirt = '#a8d0e8', tie = '#2f5a8a', pants = '#30364a', pantsSh = '#222738';
  const shoe = '#1a1922', glass = '#171520', metal = '#c8d2dc';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  hLeg(P, 15, 42, -step, pants, pantsSh, shoe, '#0c0b12');
  if (atk == null) hArm(P, 8, 24 + b, -swing, coat, coatSh, skin, skinSh);

  // coat torso
  P(11, 21 + b, 22, 20, coat);
  P(11, 21 + b, 3, 20, coatSh);
  P(31, 21 + b, 2, 20, coatSh);
  P(12, 22 + b, 2, 6, coatHi);
  P(16, 22 + b, 12, 16, shirt);
  P(17, 22 + b, 2, 13, tie);
  P(17, 22 + b, 1, 13, '#4f83bd');
  P(18, 24 + b, 2, 2, coatHi);                 // stethoscope
  P(18, 26 + b, 1, 7, '#30343c');
  P(22, 33 + b, 2, 2, metal);
  P(14, 35 + b, 6, 1, coatSh);
  P(26, 35 + b, 6, 1, coatSh);
  P(27, 29 + b, 4, 4, coatHi);                 // pocket
  P(12, 39 + b, 20, 2, coatSh);

  hLeg(P, 25, 42, step, pants, pantsSh, shoe, '#0c0b12');

  // head
  P(16, 8 + b, 14, 13, skin);
  P(16, 8 + b, 14, 1, skinSh);
  P(16, 9 + b, 1, 8, skinSh);
  P(17, 9 + b, 2, 2, '#f0c08f');
  P(17, 11 + b, 12, 2, glass);
  P(18, 11 + b, 2, 1, '#9fe8ff');
  P(25, 11 + b, 2, 1, '#9fe8ff');
  P(22, 13 + b, 2, 2, skinSh);
  P(20, 17 + b, 5, 1, '#8d5c48');
  P(15, 12 + b, 1, 4, skin);
  // hair + sideburns
  P(15, 5 + b, 16, 5, hair);
  P(15, 5 + b, 16, 1, '#54413a');
  P(18, 3 + b, 9, 3, hair);
  P(16, 8 + b, 2, 2, hair);
  P(29, 8 + b, 2, 3, hair);

  if (atk != null) {
    if (atk === 0) {
      P(30, 24 + b, 6, 5, coat);
      P(34, 27 + b, 5, 5, skin);
      P(8, 26 + b, 4, 4, skin);
    } else {
      P(30, 24 + b, 10, 5, coat);
      P(39, 24 + b, 4, 5, skin);
      P(42, 23 + b, 9, 8, '#b98a4a');          // clipboard
      P(43, 24 + b, 7, 5, '#f4f1e2');
      P(44, 25 + b, 5, 1, '#8d9aa8');
      P(44, 28 + b, 5, 1, '#8d9aa8');
      P(7, 26 + b, 4, 4, skin);
    }
  } else {
    hArm(P, 29, 23 + b, swing, coat, coatSh, skin, skinSh);
    P(33, 34 + b, 8, 10, '#b98a4a');           // clipboard at side
    P(34, 35 + b, 6, 7, '#f4f1e2');
  }

  if (p.hurt) P(31, 11 + b, 2, 2, '#8ee6ff');
}

function buildDoctor() {
  const idle = [
    makeArt(46, 68, (P) => doctorArt(P, { bob: 0 })),
    makeArt(46, 68, (P) => doctorArt(P, { bob: 1, arm: 0.25 })),
  ];
  const walk = [
    makeArt(46, 68, (P) => doctorArt(P, { leg: -1, arm: 1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: 1, arm: -1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(46, 68, (P) => doctorArt(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(46, 68, (P) => doctorArt(P, { atk: 0, leg: -0.4 })),
    makeArt(46, 68, (P) => doctorArt(P, { atk: 1, leg: 0.5 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(46, 68, (P) => doctorArt(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(46, 68, (P) => doctorArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 138);
}

/* ------------------------------------------------------------
   HOSPITAL SECURITY — heavy navy guard with baton
   ------------------------------------------------------------ */
function hospitalSecurityArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#c98a62', skinSh = '#a56a47';
  const navy = '#24324f', navySh = '#172238', navyHi = '#3b5077';
  const shirt = '#9fb8d6', shirtSh = '#7e98b8';
  const gold = '#f2c14e', belt = '#12141c', boot = '#1a1a24';
  const step = p.leg || 0, swing = p.arm || 0;
  const atk = p.atk;

  const leg = (x, hipY, st) => {
    const k = Math.round(st * 1.8);
    P(x, hipY, 9, 10, navy);
    P(x + k, hipY + 9, 9, 9, navy);
    P(x + k, hipY + 9, 2, 9, navySh);
    P(x + k - 1, hipY + 18, 11, 5, boot);
    P(x + k - 1, hipY + 22, 11, 1, '#09090f');
  };

  leg(13, 48, -step);
  if (atk == null) {
    P(5, 25 + b, 9, 10, shirt);
    P(3, 32 + b, 7, 8, skin);
    P(3, 38 + b, 7, 4, skinSh);
  }

  // big security torso
  P(9, 22 + b, 36, 8, shirt);
  P(7, 28 + b, 40, 12, shirt);
  P(9, 39 + b, 36, 8, shirt);
  P(7, 28 + b, 4, 16, shirtSh);
  P(41, 28 + b, 4, 16, shirtSh);
  P(20, 23 + b, 2, 14, '#e8edf5');             // shirt placket
  P(22, 24 + b, 3, 3, gold);                    // badge
  P(30, 24 + b, 4, 2, '#d9e2ee');
  P(11, 39 + b, 34, 3, belt);
  P(25, 39 + b, 6, 3, gold);
  P(9, 45 + b, 37, 3, navySh);

  leg(27, 48, step);

  // head + peaked cap
  P(17, 9 + b, 16, 13, skin);
  P(17, 9 + b, 16, 1, skinSh);
  P(17, 10 + b, 1, 9, skinSh);
  P(18, 12 + b, 3, 2, '#1e1a20');
  P(27, 12 + b, 3, 2, '#1e1a20');
  P(18, 17 + b, 9, 1, '#5c3a2c');
  P(19, 18 + b, 7, 2, '#6b4434');
  P(23, 15 + b, 2, 2, skinSh);
  P(33, 11 + b, 1, 5, skinSh);
  P(12, 4 + b, 22, 6, navy);
  P(12, 4 + b, 22, 1, navyHi);
  P(10, 9 + b, 27, 2, navySh);
  P(21, 5 + b, 5, 3, gold);
  P(22, 6 + b, 3, 1, '#8a6520');

  if (atk != null) {
    if (atk === 0) {
      P(38, 24 + b, 8, 7, skin);
      P(42, 18 + b, 8, 6, skin);
      P(3, 29 + b, 5, 7, skin);
    } else {
      P(38, 26 + b, 10, 6, skin);
      P(47, 26 + b, 6, 6, skinSh);
      P(2, 30 + b, 5, 7, skin);
    }
  } else if (atk == null) {
    P(40, 27 + b, 7, 9, skin);
    P(42, 30 + b, 2, 9, '#20202a');            // baton
    P(41, 37 + b, 4, 1, '#c8cfdd');
  }

  if (p.hurt) P(35, 11 + b, 2, 2, '#8ee6ff');
}

function buildHospitalSecurity() {
  const idle = [
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { bob: 0 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: -1, arm: 0.8 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: -0.55, arm: 0.5, bob: -1 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: 0.45, arm: -0.5, bob: -1 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: 1, arm: -0.8 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: -0.45, arm: 0.5, bob: -1 })),
  ];
  const attack = [
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { atk: 0, leg: -0.3 })),
    makeArt(54, 74, (P) => hospitalSecurityArt(P, { atk: 1, leg: 0.4 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(54, 74, (P) => hospitalSecurityArt(P, { hurt: 1, leg: -0.4, arm: 0.8 }))],
    jump: [makeArt(54, 74, (P) => hospitalSecurityArt(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 152);
}

/* ------------------------------------------------------------
   NPC — shorter woman, white t-shirt, black jeans
   ------------------------------------------------------------ */
function npcGirlArt(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#e2b08a', skinSh = '#c18c68';
  const shirt = '#f4f4f8', shirtSh = '#d8d9e2';
  const jeans = '#20202b', jeansSh = '#13131b';
  const hair = '#3b241d', hairHi = '#58352a';
  const shoe = '#f4f4f8', sole = '#46465c';
  const step = p.leg || 0, swing = p.arm || 0;
  const leg = (x, hipY, st) => {
    const k = Math.round(st * 2);
    P(x, hipY, 5, 11, jeans);
    P(x + k, hipY + 10, 5, 10, jeans);
    P(x + k, hipY + 10, 1, 10, jeansSh);
    P(x + k - 1, hipY + 19, 6, 3, shoe);
    P(x + k - 1, hipY + 21, 6, 1, sole);
  };
  const arm = (x, y, sw) => {
    const s = Math.round(sw * 1.6);
    P(x, y, 4, 4, shirt);
    P(x + s, y + 3, 3, 8, skin);
    P(x + s, y + 9, 3, 3, skinSh);
  };

  leg(13, 38, -step);
  if (p.atk == null) arm(7, 22 + b, -swing);
  // white tee
  P(9, 20 + b, 18, 8, shirt);
  P(8, 26 + b, 20, 11, shirt);
  P(10, 36 + b, 16, 3, shirtSh);
  P(9, 20 + b, 3, 15, shirtSh);
  P(15, 24 + b, 5, 4, '#e84393');            // small graphic
  P(9, 38 + b, 18, 2, '#2a2a36');
  leg(20, 38, step);
  // head + long hair
  P(13, 8 + b, 12, 12, skin);
  P(13, 8 + b, 2, 10, skinSh);
  P(14, 9 + b, 2, 2, '#f5c7a0');
  P(15, 12 + b, 2, 2, '#241a20');
  P(21, 12 + b, 2, 2, '#241a20');
  P(19, 14 + b, 2, 2, skinSh);
  P(16, 18 + b, 4, 1, '#a0614d');
  P(11, 8 + b, 3, 20, hair);
  P(24, 8 + b, 3, 20, hair);
  P(12, 4 + b, 12, 5, hair);
  P(13, 3 + b, 4, 2, hairHi);
  P(21, 5 + b, 3, 2, hairHi);
  P(24, 12 + b, 2, 12, '#2d1c18');

  if (p.atk != null) {
    P(26, 23 + b, 7, 3, shirt);
    P(32, 23 + b, 3, 4, skin);
    P(6, 26 + b, 3, 4, skin);
  } else {
    arm(26, 22 + b, swing);
  }
  if (p.hurt) P(24, 10 + b, 2, 2, '#8ee6ff');
}

function buildNpcGirl() {
  const idle = [
    makeArt(36, 60, (P) => npcGirlArt(P, { bob: 0 })),
    makeArt(36, 60, (P) => npcGirlArt(P, { bob: 1, arm: 0.2 })),
  ];
  const walk = [
    makeArt(36, 60, (P) => npcGirlArt(P, { leg: -1, arm: 1 })),
    makeArt(36, 60, (P) => npcGirlArt(P, { leg: -0.2, arm: 0.2, bob: -1 })),
    makeArt(36, 60, (P) => npcGirlArt(P, { leg: 1, arm: -1 })),
    makeArt(36, 60, (P) => npcGirlArt(P, { leg: 0.2, arm: -0.2, bob: -1 })),
  ];
  return spriteFrom({
    idle, walk, attack: idle,
    hurt: [makeArt(36, 60, (P) => npcGirlArt(P, { hurt: 1, bob: -1 }))],
    jump: [idle[0]],
  }, 112);
}

/* ------------------------------------------------------------
   CRYPTOCINO — fallback: gray hoodie, glasses, dark jeans
   ------------------------------------------------------------ */
function boss2Art(P, p) {
  const b = Math.round(p.bob || 0);
  const skin = '#e0ab7e', skinSh = '#bb855c', skinHi = '#f0c08f';
  const hoodie = '#6f727a', hoodieSh = '#4d5058', hoodieHi = '#8c8f98';
  const jeans = '#20202a', jeansSh = '#121218';
  const shoe = '#b99363', sole = '#3c3428';
  const hair = '#2b2222', glass = '#171520';
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

  // hoodie body
  P(9, 22 + b, 34, 9, hoodie);
  P(7, 28 + b, 38, 13, hoodie);
  P(9, 40 + b, 34, 7, hoodie);
  P(7, 28 + b, 4, 15, hoodieSh);
  P(41, 28 + b, 4, 15, hoodieSh);
  P(12, 23 + b, 12, 2, hoodieHi);
  P(18, 20 + b, 16, 5, hoodie);                 // hood behind head
  P(16, 20 + b, 20, 2, hoodieSh);
  P(20, 29 + b, 12, 9, hoodieSh);               // front pocket
  P(21, 29 + b, 10, 1, hoodieHi);
  P(22, 24 + b, 2, 7, '#d8d8e0');               // drawstrings
  P(28, 24 + b, 2, 7, '#d8d8e0');
  P(9, 46 + b, 34, 3, jeansSh);

  leg(28, 46, step);

  // head
  P(17, 8 + b, 19, 14, skin);
  P(17, 8 + b, 19, 1, skinSh);
  P(17, 9 + b, 1, 9, skinSh);
  P(18, 9 + b, 3, 2, skinHi);
  P(18, 13 + b, 7, 2, glass);
  P(27, 13 + b, 7, 2, glass);
  P(19, 13 + b, 2, 1, '#9fe8ff');
  P(29, 13 + b, 2, 1, '#9fe8ff');
  P(25, 13 + b, 1, 2, glass);
  P(26, 15 + b, 2, 2, skinSh);
  P(22, 20 + b, 9, 1, '#6b4034');
  P(22, 21 + b, 8, 1, '#4a2a22');               // stubble
  P(18, 19 + b, 3, 1, '#4a2a22');
  P(31, 19 + b, 3, 1, '#4a2a22');
  P(16, 12 + b, 1, 4, skin);
  // messy dark hair
  P(16, 4 + b, 20, 6, hair);
  P(17, 2 + b, 6, 3, hair);
  P(24, 2 + b, 5, 3, hair);
  P(30, 5 + b, 4, 3, hair);
  P(16, 8 + b, 3, 3, hair);
  P(33, 9 + b, 2, 4, hair);

  if (atk != null) {
    if (atk === 0) {
      P(39, 27 + b, 7, 6, hoodie);
      P(43, 32 + b, 6, 6, skin);
      P(5, 31 + b, 5, 6, skin);
    } else if (atk === 1) {
      P(40, 26 + b, 8, 5, hoodie);
      P(47, 25 + b, 5, 6, skin);
      P(50, 22 + b, 9, 8, '#3a3d46');           // laptop
      P(52, 23 + b, 6, 5, '#67e8ff');
      P(51, 29 + b, 8, 2, '#20222a');
      P(4, 30 + b, 5, 6, skin);
    } else {
      P(36, 24 + b, 10, 6, skin);
      P(45, 20 + b, 7, 7, skinSh);
      P(4, 32 + b, 5, 6, skin);
    }
  } else {
    P(42, 28 + b, 7, 7, hoodie);
    P(44, 34 + b, 6, 6, skin);
  }

  if (p.hurt) P(36, 11 + b, 2, 2, '#8ee6ff');
}

function buildBoss2() {
  const idle = [
    makeArt(52, 74, (P) => boss2Art(P, { bob: 0 })),
    makeArt(52, 74, (P) => boss2Art(P, { bob: 1, arm: 0.25 })),
  ];
  const walk = [
    makeArt(52, 74, (P) => boss2Art(P, { leg: -1, arm: 1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: -0.55, arm: 0.6, bob: -1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: -0.1, arm: 0.15, bob: -1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: 0.45, arm: -0.45, bob: -1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: 1, arm: -1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: 0.5, arm: -0.5, bob: -1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: 0.1, arm: -0.15, bob: -1 })),
    makeArt(52, 74, (P) => boss2Art(P, { leg: -0.45, arm: 0.45, bob: -1 })),
  ];
  const attack = [
    makeArt(52, 74, (P) => boss2Art(P, { atk: 0, leg: -0.4 })),
    makeArt(52, 74, (P) => boss2Art(P, { atk: 1, leg: 0.4 })),
    makeArt(52, 74, (P) => boss2Art(P, { atk: 2, leg: 0.6 })),
  ];
  return spriteFrom({
    idle, walk, attack,
    hurt: [makeArt(52, 74, (P) => boss2Art(P, { hurt: 1, leg: -0.6, arm: 1 }))],
    jump: [makeArt(52, 74, (P) => boss2Art(P, { leg: 1, arm: 1, bob: -2 }))],
  }, 146);
}

/* ------------------------------------------------------------
   HOSPITAL PROPS + PICKUPS
   ------------------------------------------------------------ */
function buildMedCart() {
  return makeArt(36, 28, (P) => {
    P(4, 6, 28, 16, '#c7d3dd');
    P(4, 6, 28, 2, '#eef5f8');
    P(4, 20, 28, 3, '#8d9aa8');
    P(7, 9, 22, 3, '#dbe5ec');
    P(8, 13, 7, 5, '#f2f4f7');
    P(18, 13, 4, 5, '#7de0ff');
    P(24, 13, 4, 5, '#ff7a7a');
    P(12, 2, 12, 4, '#e24a4a');
    P(15, 1, 6, 2, '#ff7a7a');
    P(17, 3, 2, 3, '#ffffff');
    P(15, 4, 6, 1, '#ffffff');
    P(5, 23, 4, 4, '#1a1a24');
    P(27, 23, 4, 4, '#1a1a24');
    P(8, 22, 3, 1, '#8d9aa8');
  });
}

function buildBin() {
  return makeArt(20, 28, (P) => {
    P(3, 7, 14, 18, '#d7b23d');
    P(3, 7, 14, 2, '#f2d064');
    P(2, 3, 16, 4, '#a98420');
    P(4, 2, 12, 2, '#d7b23d');
    P(8, 0, 4, 2, '#222');
    P(8, 12, 4, 2, '#3a2b08');
    P(7, 15, 6, 2, '#3a2b08');
    P(9, 18, 2, 2, '#3a2b08');
    P(4, 23, 12, 2, '#7b5f17');
    P(6, 9, 3, 1, '#f2d064');
    P(12, 10, 2, 1, '#f2d064');
  });
}

function buildHospitalChair() {
  return makeArt(28, 22, (P) => {
    P(3, 4, 20, 4, '#5b86a8');
    P(3, 4, 20, 1, '#8db3cc');
    P(3, 8, 20, 9, '#4a7595');
    P(3, 8, 3, 9, '#7fa6c2');
    P(22, 8, 3, 9, '#36596f');
    P(5, 17, 3, 4, '#2c2c3a');
    P(20, 17, 3, 4, '#2c2c3a');
    P(4, 16, 20, 2, '#8d9aa8');
    P(3, 2, 20, 2, '#8db3cc');
  });
}

function buildIVStand() {
  return makeArt(18, 50, (P) => {
    P(8, 10, 2, 34, '#b8c4cd');
    P(7, 44, 4, 2, '#8d9aa8');
    P(2, 46, 14, 2, '#4a4a58');
    P(4, 47, 2, 2, '#222');
    P(12, 47, 2, 2, '#222');
    P(6, 4, 7, 8, '#e8f4ff');
    P(7, 5, 5, 6, '#8fe0ff');
    P(9, 2, 2, 3, '#d7e7f5');
    P(9, 12, 1, 10, '#c7d3dd');
    P(6, 20, 3, 1, '#e24a4a');
  });
}

function buildGurney() {
  return makeArt(44, 28, (P) => {
    P(2, 8, 40, 5, '#dfe8ef');
    P(4, 6, 36, 3, '#f4f8fb');
    P(2, 12, 40, 2, '#9fb0be');
    P(4, 4, 4, 8, '#c0ccd6');
    P(36, 4, 4, 8, '#c0ccd6');
    P(6, 16, 2, 10, '#8d9aa8');
    P(36, 16, 2, 10, '#8d9aa8');
    P(4, 25, 5, 3, '#2a2a36');
    P(35, 25, 5, 3, '#2a2a36');
    P(14, 5, 12, 1, '#c7d3dd');
    P(30, 5, 6, 1, '#c7d3dd');
    P(0, 10, 3, 1, '#8d9aa8');
  });
}

function buildFirstAid() {
  return makeArt(16, 12, (P) => {
    P(1, 2, 14, 9, '#f2f4f7');
    P(1, 2, 14, 1, '#ffffff');
    P(1, 10, 14, 1, '#c7d3dd');
    P(6, 4, 4, 5, '#e24a4a');
    P(4, 6, 8, 2, '#e24a4a');
    P(2, 3, 2, 2, '#d8e2ea');
    P(3, 11, 10, 1, '#a8b4be');
  });
}

function buildJuice() {
  return makeArt(12, 17, (P) => {
    P(2, 4, 8, 12, '#ff9f43');
    P(2, 4, 8, 2, '#ffd166');
    P(2, 13, 8, 2, '#d9771f');
    P(1, 3, 10, 2, '#ffb347');
    P(5, 5, 2, 7, '#ffffff');
    P(6, 0, 1, 5, '#e24a4a');
    P(3, 8, 6, 1, '#ffe066');
    P(9, 7, 1, 1, '#fff');
  });
}

/* ------------------------------------------------------------
   Register hospital art with the procedural art factory.
   ------------------------------------------------------------ */
function buildHospitalArt() {
  return {
    enemies: {
      orderly: buildOrderly(),
      doctor: buildDoctor(),
      security: buildHospitalSecurity(),
    },
    props: {
      medcart: buildMedCart(),
      bin: buildBin(),
      chair: buildHospitalChair(),
      iv: buildIVStand(),
      gurney: buildGurney(),
    },
    items: {
      firstaid: buildFirstAid(),
      juice: buildJuice(),
    },
    npcGirl: buildNpcGirl(),
    boss2: buildBoss2(),
  };
}

export { buildHospitalArt };

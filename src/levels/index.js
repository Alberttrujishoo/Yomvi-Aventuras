import { Boss } from './mall/boss.js';
import { Boss2 } from './hospital/boss.js';
import { makeHospitalLocks, makeHospitalRoamers } from './hospital/encounters.js';
import { makeMallLocks, makeMallRoamers } from './mall/encounters.js';
import { Boss3 } from './street/boss.js';
import { makeStreetLocks, makeStreetRoamers } from './street/encounters.js';

// The game owns transitions. Each level supplies its encounters and presentation.
const LEVELS = {
  1: {
    boss: Boss,
    makeLocks: makeMallLocks,
    makeRoamers: makeMallRoamers,
    firstEnemy: ['punk', 720, 410],
    banner: ['PASILLO CENTRAL', 'GALERÍAS MALL · MARACAIBO 1991', '#ffd166', 3.2],
    startInvulnerability: 1,
    track: 'level',
    music: ['mall.mp3'],
    bossSheet: 'arthas.jpg',
  },
  2: {
    boss: Boss2,
    makeLocks: makeHospitalLocks,
    makeRoamers: makeHospitalRoamers,
    firstEnemy: ['orderly', 700, 410],
    banner: ['HOSPITAL GENERAL', 'STAGE 2 · RECEPCIÓN / SALA DE ESPERA', '#8fe6ff', 3.4],
    debugBanner: ['HOSPITAL GENERAL', 'DEBUG · STAGE 2 DIRECTO', '#8fe6ff', 2.4],
    startInvulnerability: 1.2,
    track: 'level2',
    music: ['hospital.mp3', 'hospital-original.mp3'],
    bossSheet: 'cryptocino.jpg',
  },
  3: {
    boss: Boss3,
    makeLocks: makeStreetLocks,
    makeRoamers: makeStreetRoamers,
    firstEnemy: ['diner', 700, 410],
    banner: ['CALLE GALERÍAS MALL', 'STAGE 3 · AFUERA DEL GALERÍAS MALL', '#ffb347', 3.4],
    debugBanner: ['CALLE GALERÍAS', 'DEBUG · STAGE 3 DIRECTO', '#ffb347', 2.4],
    startInvulnerability: 1.2,
    track: 'level3',
    music: ['street.mp3'],
    bossSheet: 'gaytelos.jpg',
  },
};

export { LEVELS };

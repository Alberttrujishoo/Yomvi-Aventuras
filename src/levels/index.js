import { Boss } from './mall/boss.js';
import { Boss2 } from './hospital/boss.js';
import { makeHospitalLocks, makeHospitalRoamers } from './hospital/encounters.js';
import { makeMallLocks, makeMallRoamers } from './mall/encounters.js';
import { Boss3 } from './street/boss.js';
import { makeStreetLocks, makeStreetRoamers } from './street/encounters.js';

import { hospitalScenery } from './hospital/scenery.js';
import { mallScenery } from './mall/scenery.js';
import { streetScenery } from './street/scenery.js';

// The game owns transitions. Each level supplies its encounters and presentation.
const LEVELS = {
  1: {
    boss: Boss,
    scenery: mallScenery,
    nextStage: 2,
    bossDefeatScore: 6000,
    stageClearScore: 10000,
    bossSprite: 'bossSprite',
    bossFallbackTrack: 'boss',
    fallbackTrack: z => z.key === 'ice' ? 'ice' : 'mall',
    bossBanner: ['ARTHAS - JORGE SALINAS', 'EL REY DEL ARCADE · FASE 1', '#ff2e63', 2.8],
    arenaBanner: ['ARENA FINAL', 'EL REY DEL ARCADE TE ESPERA', '#ff5fae'],
    ambushTitle: '¡EMBOSCADA!',
    teaser: { name: 'ARTHICAS', title: 'EL REY DEL ARCADE', glow: 'rgba(90, 210, 255, 0.55)' },
    makeLocks: makeMallLocks,
    makeRoamers: makeMallRoamers,
    firstEnemy: ['punk', 720, 410],
    banner: ['PASILLO CENTRAL', 'GALERÍAS MALL · MARACAIBO 1991', '#ffd166', 3.2],
    startInvulnerability: 1,
    track: 'level',
    music: ['mall.mp3'],
    bossSheet: 'arthas.jpg',
    bossRecoveryItem: 'pastelito',
  },
  2: {
    boss: Boss2,
    scenery: hospitalScenery,
    nextStage: 3,
    bossDefeatScore: 15000,
    stageClearScore: 15000,
    bossSprite: 'boss2Sprite',
    bossFallbackTrack: 'boss2',
    fallbackTrack: () => 'hospital',
    bossBanner: ['CRYPTOCINO', 'EL REY CRYPTO · FASE 1', '#ff8a3d', 2.8],
    arenaBanner: ['HABITACIÓN 302', 'CRYPTOCINO TE ESPERA', '#ff8a3d'],
    ambushTitle: '¡EMBOSCADA HOSPITALARIA!',
    teaser: { name: 'CRYPTOCINO', title: 'EL REY CRYPTO', glow: 'rgba(255, 138, 61, 0.55)' },
    makeLocks: makeHospitalLocks,
    makeRoamers: makeHospitalRoamers,
    firstEnemy: ['orderly', 700, 410],
    banner: ['HOSPITAL GENERAL', 'STAGE 2 · RECEPCIÓN / SALA DE ESPERA', '#8fe6ff', 3.4],
    debugBanner: ['HOSPITAL GENERAL', 'DEBUG · STAGE 2 DIRECTO', '#8fe6ff', 2.4],
    startInvulnerability: 1.2,
    track: 'level2',
    music: ['hospital.mp3', 'hospital-original.mp3'],
    bossSheet: 'cryptocino.jpg',
    bossRecoveryItem: 'firstaid',
  },
  3: {
    boss: Boss3,
    scenery: streetScenery,
    nextStage: null,
    bossDefeatScore: 25000,
    stageClearScore: 25000,
    bossSprite: 'boss3Sprite',
    bossFallbackTrack: 'burger',
    fallbackTrack: () => 'street',
    bossBanner: ['GAYTELOS', 'EL REY DE LA BURGER ROOM · FASE 1', '#ff5fae', 2.8],
    arenaBanner: ['BURGER ROOM', 'GAYTELOS TE ESPERA', '#ff5fae'],
    ambushTitle: '¡EMBOSCADA CALLEJERA!',
    teaser: { name: 'GAYTELOS', title: 'EL REY DE LA BURGER ROOM', glow: 'rgba(255, 95, 174, 0.6)' },
    makeLocks: makeStreetLocks,
    makeRoamers: makeStreetRoamers,
    firstEnemy: ['diner', 700, 410],
    banner: ['CALLE GALERÍAS MALL', 'STAGE 3 · AFUERA DEL GALERÍAS MALL', '#ffb347', 3.4],
    debugBanner: ['CALLE GALERÍAS', 'DEBUG · STAGE 3 DIRECTO', '#ffb347', 2.4],
    startInvulnerability: 1.2,
    track: 'level3',
    music: ['street.mp3'],
    bossSheet: 'gaytelos.jpg',
    bossRecoveryItem: 'burger',
  },
};

export { LEVELS };

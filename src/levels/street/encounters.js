function makeStreetLocks() {
  return [
    {
      id: 0, camX: 620, triggerX: 1000, cleared: false, started: false, timer: 0,
      wave: [
        { type: 'diner', delay: 0.05, y: 392 },
        { type: 'diner', delay: 0.55, y: 452 },
        { type: 'tough', delay: 1.05, y: 410 },
        { type: 'streetbouncer', delay: 1.7, y: 442 },
      ],
    },
    {
      id: 1, camX: 3700, triggerX: 4160, cleared: false, started: false, timer: 0, event: 'npc',
      wave: [
        { type: 'diner', delay: 0.05, y: 386 },
        { type: 'tough', delay: 0.5, y: 452 },
        { type: 'diner', delay: 1.0, y: 420 },
        { type: 'streetbouncer', delay: 1.55, y: 400 },
        { type: 'tough', delay: 2.15, y: 456 },
      ],
    },
    {
      id: 2, camX: 7440, triggerX: 7920, cleared: false, started: false, timer: 0, boss: true,
      wave: [],
    },
  ];
}

function makeStreetRoamers() {
  return [
    { at: 1800, type: 'diner', spawned: false },
    { at: 2620, type: 'tough', spawned: false },
    { at: 4660, type: 'diner', spawned: false },
    { at: 5360, type: 'tough', spawned: false },
  ];
}

export { makeStreetLocks, makeStreetRoamers };

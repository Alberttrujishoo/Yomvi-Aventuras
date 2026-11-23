function makeMallLocks() {
  return [
    {
      id: 0, camX: 660, triggerX: 1010, cleared: false, started: false, timer: 0, boss: false,
      wave: [
        { type: 'punk', delay: 0.05, y: 392 },
        { type: 'punk', delay: 0.55, y: 460 },
        { type: 'guard', delay: 1.05, y: 420 },
        { type: 'punk', delay: 1.65, y: 442 },
      ],
    },
    {
      id: 1, camX: 2100, triggerX: 2450, cleared: false, started: false, timer: 0, boss: false,
      wave: [
        { type: 'punk', delay: 0.05, y: 392 },
        { type: 'punk', delay: 0.5, y: 455 },
        { type: 'guard', delay: 1.0, y: 410 },
        { type: 'bouncer', delay: 1.55, y: 440 },
        { type: 'punk', delay: 2.15, y: 380 },
      ],
    },
    {
      id: 2, camX: 3500, triggerX: 3850, cleared: false, started: false, timer: 0, boss: false,
      wave: [
        { type: 'punk', delay: 0.05, y: 380 },
        { type: 'guard', delay: 0.45, y: 452 },
        { type: 'punk', delay: 0.9, y: 420 },
        { type: 'bouncer', delay: 1.5, y: 400 },
        { type: 'guard', delay: 2.1, y: 455 },
      ],
    },
    {
      id: 3, camX: 4900, triggerX: 5250, cleared: false, started: false, timer: 0, boss: false,
      wave: [
        { type: 'guard', delay: 0.05, y: 400 },
        { type: 'punk', delay: 0.45, y: 460 },
        { type: 'bouncer', delay: 1.0, y: 410 },
        { type: 'bouncer', delay: 1.7, y: 450 },
        { type: 'punk', delay: 2.25, y: 380 },
        { type: 'guard', delay: 2.85, y: 430 },
      ],
    },
    {
      id: 4, camX: 6960, triggerX: 7600, cleared: false, started: false, timer: 0, boss: true,
      wave: [],
    },
  ];
}

function makeMallRoamers() {
  return [
    { at: 1700, type: 'punk', spawned: false },
    { at: 2900, type: 'guard', spawned: false },
    { at: 4600, type: 'punk', spawned: false },
    { at: 5700, type: 'guard', spawned: false },
    { at: 6350, type: 'bouncer', spawned: false },
    { at: 6680, type: 'punk', spawned: false },
  ];
}

export { makeMallLocks, makeMallRoamers };

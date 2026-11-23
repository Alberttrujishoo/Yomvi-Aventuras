function makeHospitalLocks() {
  return [
    {
      id: 0, camX: 620, triggerX: 1000, cleared: false, started: false, timer: 0,
      wave: [
        { type: 'orderly', delay: 0.05, y: 392 },
        { type: 'orderly', delay: 0.55, y: 452 },
        { type: 'doctor', delay: 1.05, y: 410 },
        { type: 'security', delay: 1.7, y: 440 },
      ],
    },
    {
      id: 1, camX: 2900, triggerX: 3350, cleared: false, started: false, timer: 0, event: 'npc',
      wave: [
        { type: 'orderly', delay: 0.05, y: 385 },
        { type: 'doctor', delay: 0.5, y: 450 },
        { type: 'orderly', delay: 1.0, y: 420 },
        { type: 'security', delay: 1.55, y: 400 },
        { type: 'doctor', delay: 2.15, y: 455 },
      ],
    },
    {
      id: 2, camX: 6200, triggerX: 6600, cleared: false, started: false, timer: 0, boss: true,
      wave: [],
    },
  ];
}

function makeHospitalRoamers() {
  return [
    { at: 1800, type: 'orderly', spawned: false },
    { at: 4300, type: 'doctor', spawned: false },
    { at: 5100, type: 'security', spawned: false },
  ];
}

export { makeHospitalLocks, makeHospitalRoamers };

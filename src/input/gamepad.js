const DIRECTIONS = [
  ['left', 14, 0, -1], ['right', 15, 0, 1],
  ['up', 12, 1, -1], ['down', 13, 1, 1],
];

const MENU_STATES = new Set(['title', 'briefing', 'stageselect', 'paused', 'continue', 'victory']);
const STANDARD_BUTTONS = [0, 1, 2, 8, 9];
const GENERIC_BUTTONS = [0, 1, 2, 3, 8, 9];

function readBrowserGamepads() {
  try {
    return navigator.getGamepads?.() ?? [];
  } catch {
    return [];
  }
}

function isPressed(gamepad, index) {
  const button = gamepad.buttons[index];
  return Boolean(button?.pressed || button?.value >= 0.5);
}

function createGamepadInput(input, read = readBrowserGamepads) {
  const pads = new Map();
  let suppressButtons = false;
  let focused = true;

  function release(pad) {
    for (const direction of pad.directions) input.release(direction, pad.source);
    pad.directions.clear();
  }

  return {
    suspend() {
      suppressButtons = true;
      for (const pad of pads.values()) {
        release(pad);
        input.releaseCharge(pad.source, false);
      }
    },

    setFocused(active) {
      if (focused === active) return;
      focused = active;
      this.suspend();
    },

    poll(state) {
      if (!focused) return;
      const connected = new Set();
      for (const gamepad of read()) {
        if (!gamepad?.connected) continue;
        connected.add(gamepad.index);

        let pad = pads.get(gamepad.index);
        if (!pad) {
          pad = { source: Symbol('gamepad'), directions: new Set(), buttons: new Set() };
          pads.set(gamepad.index, pad);
        }

        const standard = gamepad.mapping === 'standard';
        const physicalButtons = standard ? STANDARD_BUTTONS : GENERIC_BUTTONS;
        const buttons = new Set(physicalButtons.filter(index => isPressed(gamepad, index)));
        const hit = index => !suppressButtons && buttons.has(index) && !pad.buttons.has(index);
        const menu = hit(9) || (!standard && hit(3));
        if (state === 'playing') {
          // Standard physical layout: south jumps, west attacks, east uses the special.
          if (menu) input.tap('pause');
          if (hit(0)) input.tap('jump');
          if (hit(2)) input.beginCharge(pad.source, 'attack');
          if (pad.buttons.has(2) && !buttons.has(2)) input.releaseCharge(pad.source);
          if (hit(1)) input.tap('special');
        } else if (state === 'intro') {
          if (menu || hit(0)) input.tap('skipIntro');
        } else if (MENU_STATES.has(state)) {
          if (menu || hit(0)) input.tap('start');
          if (state === 'stageselect' && (hit(1) || hit(8))) input.tap('pause');
        }
        pad.buttons = buttons;

        if (state !== 'playing' && state !== 'stageselect') {
          release(pad);
          continue;
        }
        for (const [direction, index, axis, sign] of DIRECTIONS) {
          const held = pad.directions.has(direction);
          // A wider threshold to engage than to release prevents flicker near center.
          const active = isPressed(gamepad, index) || (gamepad.axes[axis] ?? 0) * sign > (held ? 0.25 : 0.4);
          if (active) {
            input.press(direction, pad.source);
            pad.directions.add(direction);
          } else if (held) {
            input.release(direction, pad.source);
            pad.directions.delete(direction);
          }
        }
      }
      for (const [index, pad] of pads) {
        if (!connected.has(index)) {
          release(pad);
          input.releaseCharge(pad.source, false);
          pads.delete(index);
        }
      }
      suppressButtons = false;
    },
  };
}

export { createGamepadInput };

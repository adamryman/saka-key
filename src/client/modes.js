import { Extension } from 'modes/extension/client';

let currentMode;
let modes = {};

export function initModes (startMode, availableModes) {
  currentMode = startMode;
  modes = availableModes;
  if (SAKA_DEBUG) console.log(`Start mode: ${currentMode}`);
  installEventListeners();
}

export function modeAction ({ action, arg }, src) {
  handleEvent({ type: 'msg', action, arg, src });
}

function installEventListeners () {
  const eventTypes = [
    'keydown',
    'keypress',
    'keyup',
    'focusin',
    'focusout',
    'click',
    'mousedown',
    'scroll'
  ];
  eventTypes.forEach((eventType) => {
    document.addEventListener(eventType, handleEvent, true);
  });
  window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded');
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  });
  window.addEventListener('load', (event) => {
    console.log('load');
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  });
}

async function handleEvent (event) {
  let nextMode = await (modes[currentMode].handle(event));
  if (!nextMode) {
    for (const fallback of modes[currentMode].fallbacks) {
      nextMode = await (modes[fallback].handle(event));
      if (nextMode) break;
    }
  }
  if (SAKA_DEBUG && !nextMode) {
    throw Error(`Mode ${currentMode} is missing a handler for ${event.type} events`);
  }
  if (SAKA_DEBUG && !modes[nextMode]) {
    throw Error(`Event ${event.type} in mode ${currentMode} results in invalid next mode ${nextMode}`);
  }
  if (nextMode !== currentMode) {
    if (SAKA_DEBUG) {
      console.log(`mode changed from ${currentMode} to ${nextMode} on event:`, event);
    }
    await modes[currentMode].onExit(event);
    await modes[nextMode].onEnter(event);
  }
  currentMode = nextMode;
}

export function addExtension (name) {
  modes[name] = new Extension(name);
}
// Placeholder synthesized SFX via Web Audio. Phase 8 replaces these with real assets.

let ctx = null;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function blip({ type = 'square', startFreq, endFreq, duration, volume = 0.05 }) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.01);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

export function playShootPlaceholder() {
  blip({ startFreq: 880, endFreq: 220, duration: 0.05 });
}

export function playPlayerHurtPlaceholder() {
  blip({ type: 'sawtooth', startFreq: 440, endFreq: 110, duration: 0.18, volume: 0.08 });
}

export function playPlayerDeathPlaceholder() {
  blip({ type: 'sawtooth', startFreq: 220, endFreq: 60, duration: 0.6, volume: 0.1 });
}

export function playVictoryPlaceholder() {
  // Two-note rising blip.
  blip({ type: 'triangle', startFreq: 660, endFreq: 660, duration: 0.12, volume: 0.08 });
  setTimeout(() => blip({ type: 'triangle', startFreq: 990, endFreq: 990, duration: 0.18, volume: 0.08 }), 130);
}

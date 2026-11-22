// FORGEBOUND — tiny synthesized sound effects. No audio files: every
// sound is an oscillator through the Web Audio API, so the game stays
// offline and the whole of game/ stays a few small text files.
let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  deal() { tone(440, 0.06, 'triangle', 0.1); tone(587, 0.06, 'triangle', 0.08, 0.05); },
  play() { tone(523, 0.1, 'sine', 0.16); tone(784, 0.12, 'sine', 0.14, 0.07); },
  surge() { tone(523, 0.09, 'square', 0.1); tone(659, 0.09, 'square', 0.1, 0.08); tone(880, 0.16, 'square', 0.12, 0.16); },
  damage() { tone(110, 0.22, 'sawtooth', 0.2); tone(82, 0.28, 'sawtooth', 0.16, 0.05); },
  heal() { tone(392, 0.12, 'sine', 0.14); tone(523, 0.12, 'sine', 0.14, 0.09); tone(659, 0.2, 'sine', 0.14, 0.18); },
  shield() { tone(330, 0.14, 'triangle', 0.14); tone(415, 0.18, 'triangle', 0.12, 0.08); },
  turn() { tone(587, 0.09, 'triangle', 0.1); tone(740, 0.12, 'triangle', 0.1, 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.13)); },
  loss() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'sawtooth', 0.12, i * 0.16)); },
};

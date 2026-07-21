// Web Audio synth engine — zero asset files. All cues built from oscillators,
// gain envelopes and noise buffers. AudioContext is created/resumed on the
// first user gesture (iOS requirement).
import { soundOn } from './settings.js';

let ctx = null;
let master = null;
let unlocked = false;
let spinNodes = null;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);
  return ctx;
}

/** Call from a user-gesture handler to satisfy autoplay policies. */
export function unlock() {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  unlocked = true;
}

function now() { return ctx.currentTime; }

function tone({ freq = 440, type = 'sine', dur = 0.15, gain = 0.3, attack = 0.005, decay = null, slideTo = null, delay = 0 }) {
  if (!ctx) return;
  const t0 = now() + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (decay ?? dur));
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + (decay ?? dur) + 0.02);
}

function noiseBurst({ dur = 0.2, gain = 0.2, delay = 0, hp = 300 }) {
  if (!ctx) return;
  const t0 = now() + delay;
  const frames = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

const CUES = {
  tap:    () => tone({ freq: 660, type: 'triangle', dur: 0.08, gain: 0.18 }),
  tick:   () => tone({ freq: 880, type: 'square', dur: 0.03, gain: 0.08 }),
  pop:    () => tone({ freq: 520, type: 'sine', dur: 0.12, gain: 0.25, slideTo: 900 }),
  whoosh: () => noiseBurst({ dur: 0.35, gain: 0.15, hp: 500 }),
  ding:   () => { tone({ freq: 880, dur: 0.4, gain: 0.25 }); tone({ freq: 1320, dur: 0.5, gain: 0.15, delay: 0.02 }); },
  select: () => tone({ freq: 587, type: 'triangle', dur: 0.1, gain: 0.2, slideTo: 784 }),
  countdown: () => tone({ freq: 440, type: 'sine', dur: 0.25, gain: 0.22 }),
  go:     () => { tone({ freq: 660, dur: 0.15, gain: 0.25 }); tone({ freq: 990, dur: 0.3, gain: 0.2, delay: 0.05 }); },
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.35, gain: 0.22, delay: i * 0.09 }));
  },
  cheer:  () => {
    [659, 784, 988, 1319].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.3, gain: 0.2, delay: i * 0.07 }));
    noiseBurst({ dur: 0.5, gain: 0.08, delay: 0.1, hp: 800 });
  },
  encourage: () => { tone({ freq: 440, type: 'sine', dur: 0.25, gain: 0.2, slideTo: 550 }); tone({ freq: 660, dur: 0.3, gain: 0.15, delay: 0.12 }); },
  levelup: () => {
    [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.22, delay: i * 0.08 }));
  },
  coin:   () => { tone({ freq: 988, type: 'square', dur: 0.06, gain: 0.15 }); tone({ freq: 1319, type: 'square', dur: 0.12, gain: 0.15, delay: 0.05 }); },
};

export function play(name) {
  if (!soundOn() || !unlocked) return;
  ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  CUES[name]?.();
}

/** Looping spin "whir" that speeds down; call stopSpin() to end. */
export function startSpin() {
  if (!soundOn() || !unlocked || !ensureContext()) return;
  stopSpin();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 120;
  g.gain.value = 0.04;
  osc.connect(g).connect(master);
  osc.start();
  spinNodes = { osc, g };
}

export function rampSpinDown(seconds = 3.2) {
  if (!spinNodes || !ctx) return;
  const t = now();
  spinNodes.osc.frequency.setValueAtTime(spinNodes.osc.frequency.value, t);
  spinNodes.osc.frequency.exponentialRampToValueAtTime(40, t + seconds);
}

export function stopSpin() {
  if (spinNodes) {
    try {
      const t = now();
      spinNodes.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      spinNodes.osc.stop(t + 0.2);
    } catch {}
    spinNodes = null;
  }
}

export function setVolume(v) { if (master) master.gain.value = Math.max(0, Math.min(1, v)); }

export default { unlock, play, startSpin, rampSpinDown, stopSpin, setVolume };

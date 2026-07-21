// Voice narration via the Web Speech API (speechSynthesis) — offline, no deps.
// Degrades silently when unavailable. Controlled by the settings narration flag
// plus explicit per-card speaker taps.
import { narrationOn } from './settings.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let preferredVoice = null;

export function available() { return !!synth; }

function pickVoice() {
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;
  // Prefer a friendly English voice; fall back to first English, then any.
  const byName = voices.find((v) => /(samantha|karen|moira|google us english|female)/i.test(v.name) && /^en/i.test(v.lang));
  const enVoice = voices.find((v) => /^en/i.test(v.lang));
  preferredVoice = byName || enVoice || voices[0];
  return preferredVoice;
}

if (synth) {
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

/**
 * Speak text. `force` bypasses the narration setting (used by the speaker button).
 * `interrupt` cancels anything currently speaking.
 */
export function speak(text, { force = false, interrupt = true, rate = 0.92, pitch = 1.1 } = {}) {
  if (!synth || !text) return;
  if (!force && !narrationOn()) return;
  if (interrupt) synth.cancel();
  const clean = String(text).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  if (preferredVoice) u.voice = preferredVoice;
  u.rate = rate;
  u.pitch = pitch;
  u.volume = 1;
  try { synth.speak(u); } catch {}
}

export function stop() { try { synth?.cancel(); } catch {} }

export default { available, speak, stop };

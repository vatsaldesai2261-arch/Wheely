// Voice narration via the Web Speech API (speechSynthesis) — offline, no deps.
// Degrades silently when unavailable. A soft voice can be chosen in Settings;
// speech is chunked by sentence and paced gently for fluency.
import { narrationOn, getSetting } from './settings.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let allVoices = [];
let chosenVoice = null;

export function available() { return !!synth; }

// Indian-English voice names across platforms (soft, clear, simple).
const INDIAN_RE = /(indian|india|rishi|veena|neel|priya|ravi|aditi|heera|kavya|isha|madhur|kalpana|hemant|swara|prabhat|google हिन्दी|google.*india)/i;
// Softer general English voices as a fallback pool.
const SOFT_RE = /(samantha|karen|moira|tessa|serena|allison|ava|susan|zoe|fiona|female|libby|aria|jenny|sonia|nova)/i;

function refreshVoices() {
  if (!synth) return;
  allVoices = synth.getVoices() || [];
  applyChoice();
}

/** Prefer Indian-English voices for the Settings picker (~5), then other soft English. */
export function softVoices() {
  const enIN = allVoices.filter((v) => /^en[-_]?in/i.test(v.lang) || INDIAN_RE.test(v.name));
  const otherEn = allVoices.filter((v) => /^en/i.test(v.lang) && !enIN.includes(v));
  const soft = otherEn.filter((v) => SOFT_RE.test(v.name));
  const rest = otherEn.filter((v) => !SOFT_RE.test(v.name));
  const ordered = [...enIN, ...soft, ...rest];
  const seen = new Set();
  const out = [];
  for (const v of ordered) { if (!seen.has(v.name)) { seen.add(v.name); out.push(v); } if (out.length >= 6) break; }
  return out.map((v) => ({ id: v.voiceURI || v.name, name: friendlyName(v) + (/^en[-_]?in/i.test(v.lang) || INDIAN_RE.test(v.name) ? ' 🇮🇳' : ''), lang: v.lang }));
}

function friendlyName(v) {
  return v.name.replace(/Microsoft |Google |Apple |\(.*?\)/g, '').replace(/\s+/g, ' ').trim() || v.name;
}

function applyChoice() {
  const wanted = getSetting('voiceId');
  chosenVoice = (wanted && allVoices.find((v) => (v.voiceURI || v.name) === wanted))
    || allVoices.find((v) => /^en[-_]?in/i.test(v.lang) || INDIAN_RE.test(v.name)) // prefer Indian English
    || allVoices.find((v) => /^en/i.test(v.lang) && SOFT_RE.test(v.name))
    || allVoices.find((v) => /^en/i.test(v.lang))
    || allVoices[0] || null;
}

if (synth) {
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
}

export function setVoice(id) { chosenVoice = allVoices.find((v) => (v.voiceURI || v.name) === id) || chosenVoice; }

function clean(text) {
  return String(text)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speak text fluently: split into sentences and queue them with gentle pacing.
 * `force` bypasses the narration setting (used by the speaker button).
 */
export function speak(text, { force = false, interrupt = true, rate, pitch } = {}) {
  if (!synth || !text) return;
  if (!force && !narrationOn()) return;
  if (interrupt) synth.cancel();
  const body = clean(text);
  if (!body) return;
  if (!chosenVoice) applyChoice();

  const r = rate ?? 0.9;
  const p = pitch ?? 1.08;
  // Split into sentence-ish chunks for smoother delivery + natural pauses.
  const chunks = body.match(/[^.!?…]+[.!?…]*/g) || [body];
  for (const chunk of chunks) {
    const c = chunk.trim();
    if (!c) continue;
    const u = new SpeechSynthesisUtterance(c);
    if (chosenVoice) u.voice = chosenVoice;
    u.rate = r; u.pitch = p; u.volume = 1;
    try { synth.speak(u); } catch {}
  }
}

export function stop() { try { synth?.cancel(); } catch {} }

export default { available, speak, stop, softVoices, setVoice };

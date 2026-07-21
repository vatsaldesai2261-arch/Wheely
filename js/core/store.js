// The ONLY module that touches localStorage.
// Namespaced keys, versioned, quota-aware, with an in-memory fallback for
// private-mode / storage-denied browsers.
import { emit } from './bus.js';

const PREFIX = 'wheely.v1.';
const SCHEMA_VERSION = 3;

const DOMAINS = {
  settings:     { poseTimer: 10, gameTimer: 15, sound: true, narration: false, theme: 'forest', includeAdvanced: false, tutorialSeen: false, reducedMotion: 'auto', descTiming: 'before' },
  players:      [],
  wheels:       [],
  progress:     {},   // pools + daily marks, keyed by player/wheel/mode
  stats:        {},   // per-player aggregates
  achievements: {},   // per-player unlocked ids
  poseOverrides:{ edited: {}, added: {}, hidden: [] },
  admin:        { passHash: null, seeded: false },
  shop:         {},   // playerId -> { owned:[itemId], equipped:{slot:itemId} }
  stickers:     {},   // playerId -> [stickerId]
  quests:       {},   // weekKey -> { ids:[], progress:{}, claimed:[] }
  mystery:      {},   // playerId -> [claimed trigger ids]
  goalTemplates:[],   // [{id,name,metric,target,reward}] reusable, assign to kids
  routines:     [],   // [{id,name,emoji,poseIds:[]}] named pose sets
  gallery:      [],   // [{id, ref, playerId?, caption?, at}] photo memories (ref in IDB)
  meta:         { schemaVersion: SCHEMA_VERSION },
};

let memoryOnly = false;
const memory = new Map();

function backend() {
  if (memoryOnly) return null;
  try {
    const t = '__wheely_probe__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return localStorage;
  } catch {
    memoryOnly = true;
    emit('store:unavailable');
    return null;
  }
}

function rawGet(key) {
  const b = backend();
  if (b) { try { return b.getItem(key); } catch { return memory.get(key) ?? null; } }
  return memory.get(key) ?? null;
}

function rawSet(key, value) {
  const b = backend();
  if (b) {
    try { b.setItem(key, value); return true; }
    catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        emit('store:quota');
        memory.set(key, value); // keep this session working
        return false;
      }
      memory.set(key, value);
      return false;
    }
  }
  memory.set(key, value);
  return true;
}

function clone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

export function get(domain, fallback) {
  const raw = rawGet(PREFIX + domain);
  if (raw == null) return fallback !== undefined ? fallback : clone(DOMAINS[domain]);
  try { return JSON.parse(raw); }
  catch { return fallback !== undefined ? fallback : clone(DOMAINS[domain]); }
}

export function set(domain, value) {
  return rawSet(PREFIX + domain, JSON.stringify(value));
}

export function update(domain, fn) {
  const current = get(domain);
  const next = fn(current) ?? current;
  set(domain, next);
  return next;
}

export function isMemoryOnly() { return memoryOnly; }

/** Approximate bytes used by all wheely.* keys. */
export function usageBytes() {
  let bytes = 0;
  const b = backend();
  if (b) {
    for (let i = 0; i < b.length; i++) {
      const k = b.key(i);
      if (k && k.startsWith(PREFIX)) bytes += k.length + (b.getItem(k)?.length || 0);
    }
  } else {
    for (const [k, v] of memory) bytes += k.length + (v?.length || 0);
  }
  return bytes * 2; // UTF-16 approximation
}

/** Full snapshot for Backup export. */
export function exportAll() {
  const data = {};
  for (const domain of Object.keys(DOMAINS)) data[domain] = get(domain);
  return { app: 'wheely', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}

/** Restore from a Backup envelope. Returns {ok, error}. */
export function importAll(envelope) {
  if (!envelope || envelope.app !== 'wheely' || !envelope.data) {
    return { ok: false, error: 'This does not look like a Yoga Wheel backup file.' };
  }
  for (const [domain, value] of Object.entries(envelope.data)) {
    if (domain in DOMAINS) set(domain, value);
  }
  return { ok: true };
}

export function seedDefaults() {
  const meta = get('meta');
  if (!meta || meta.schemaVersion !== SCHEMA_VERSION) {
    // Additive migration: new domains simply seed below; existing data is kept.
    set('meta', { schemaVersion: SCHEMA_VERSION });
  }
  for (const domain of Object.keys(DOMAINS)) {
    if (rawGet(PREFIX + domain) == null) set(domain, clone(DOMAINS[domain]));
  }
}

export default { get, set, update, exportAll, importAll, usageBytes, seedDefaults, isMemoryOnly };

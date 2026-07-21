// Loads the built-in 500+ pose dataset (sharded JSON) and merges the
// localStorage override overlay. The dataset itself is NEVER written to
// localStorage — only the user's deltas (edited / added / hidden) are.
import store from '../core/store.js';

let builtinMap = null;         // id -> pose (as shipped)
let categories = [];
let effective = null;          // id -> pose (built-in ⊕ overrides), cached
let loadPromise = null;

const BASE = new URL('../../data/poses/', import.meta.url);

async function fetchJson(file) {
  const res = await fetch(new URL(file, BASE));
  if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
  return res.json();
}

export function load() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const index = await fetchJson('index.json');
    categories = index.categories || [];
    const shards = await Promise.all(index.shards.map((s) => fetchJson(s)));
    builtinMap = new Map();
    for (const shard of shards) {
      for (const pose of shard) builtinMap.set(pose.id, Object.freeze({ ...pose, source: 'builtin' }));
    }
    rebuild();
    return effective;
  })();
  return loadPromise;
}

function overlay() { return store.get('poseOverrides'); }

function rebuild() {
  const ov = overlay();
  const map = new Map();
  for (const [id, pose] of builtinMap) {
    if (ov.hidden?.includes(id)) continue;
    const edits = ov.edited?.[id];
    map.set(id, edits ? { ...pose, ...edits, id, source: 'edited' } : pose);
  }
  for (const [id, pose] of Object.entries(ov.added || {})) {
    map.set(id, { ...pose, id, source: 'custom' });
  }
  effective = map;
}

function ensure() { if (!effective) throw new Error('pose-loader.load() not awaited'); }

export function all() { ensure(); return [...effective.values()]; }

/** All poses including hidden ones (each tagged with _hidden). For admin. */
export function allIncludingHidden() {
  ensure();
  const ov = overlay();
  const hidden = new Set(ov.hidden || []);
  const out = [];
  for (const [id, pose] of builtinMap) {
    const edits = ov.edited?.[id];
    const merged = edits ? { ...pose, ...edits, id, source: 'edited' } : pose;
    out.push({ ...merged, _hidden: hidden.has(id) });
  }
  for (const [id, pose] of Object.entries(ov.added || {})) {
    out.push({ ...pose, id, source: 'custom', _hidden: hidden.has(id) });
  }
  return out;
}
export function byId(id) { ensure(); return effective.get(id) || null; }
export function byCategory(cat) { ensure(); return all().filter((p) => p.category === cat); }
export function getCategories() { return categories; }
export function count() { ensure(); return effective.size; }

export function search(q) {
  ensure();
  const s = q.trim().toLowerCase();
  if (!s) return all();
  return all().filter((p) =>
    p.english.toLowerCase().includes(s) ||
    (p.sanskrit || '').toLowerCase().includes(s) ||
    (p.animalName || '').toLowerCase().includes(s) ||
    p.category.includes(s)
  );
}

/**
 * Filter helper for wheel building.
 * opts: { categories:[], difficulties:[], includeAdvanced:false, animalsOnly:false }
 */
export function filterPoses(opts = {}) {
  ensure();
  const { categories: cats, difficulties, includeAdvanced = false, animalsOnly = false } = opts;
  return all().filter((p) => {
    if (cats && cats.length && !cats.includes(p.category)) return false;
    if (difficulties && difficulties.length && !difficulties.includes(p.difficulty)) return false;
    if (!includeAdvanced && p.difficulty === 'advanced') return false;
    if (animalsOnly && !p.animalName) return false;
    return true;
  });
}

// ---- Admin mutations (persist to overlay only) ----
export function upsertOverride(pose) {
  store.update('poseOverrides', (ov) => {
    if (builtinMap.has(pose.id)) {
      ov.edited = { ...ov.edited, [pose.id]: pose };
    } else {
      ov.added = { ...ov.added, [pose.id]: pose };
    }
    return ov;
  });
  rebuild();
}

export function resetOverride(id) {
  store.update('poseOverrides', (ov) => {
    if (ov.edited) delete ov.edited[id];
    if (ov.added) delete ov.added[id];
    ov.hidden = (ov.hidden || []).filter((h) => h !== id);
    return ov;
  });
  rebuild();
}

export function hidePose(id, hide = true) {
  store.update('poseOverrides', (ov) => {
    const set = new Set(ov.hidden || []);
    hide ? set.add(id) : set.delete(id);
    ov.hidden = [...set];
    return ov;
  });
  rebuild();
}

export function isBuiltin(id) { return builtinMap?.has(id); }
export function refresh() { rebuild(); }

export default {
  load, all, allIncludingHidden, byId, byCategory, getCategories, count, search, filterPoses,
  upsertOverride, resetOverride, hidePose, isBuiltin, refresh,
};

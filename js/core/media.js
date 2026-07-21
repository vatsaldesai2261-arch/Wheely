// IndexedDB media store — holds player photos and pose photos/videos as Blobs.
// localStorage is too small for media; IndexedDB holds far more. Dependency-free.
// Media is referenced elsewhere as `media:<id>`; blobs never touch localStorage.
import { emit } from './bus.js';

const DB_NAME = 'wheely-media';
const STORE = 'blobs';
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no-idb')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export function available() { return 'indexedDB' in window; }

const REF = 'media:';
export const isRef = (v) => typeof v === 'string' && v.startsWith(REF);
export const idOf = (v) => (isRef(v) ? v.slice(REF.length) : v);
export const toRef = (id) => REF + id;

function newId() {
  return 'm-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Store a Blob; returns a `media:<id>` reference string. */
export async function put(blob, meta = {}) {
  const id = newId();
  const store = await tx('readwrite');
  await new Promise((resolve, reject) => {
    const r = store.put({ id, blob, type: blob.type, size: blob.size, kind: meta.kind || 'image', createdAt: Date.now() });
    r.onsuccess = resolve; r.onerror = () => reject(r.error);
  });
  emit('media:changed');
  return toRef(id);
}

async function getRecord(ref) {
  if (!ref) return null;
  const id = idOf(ref);
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const r = store.get(id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}

const urlCache = new Map(); // ref -> objectURL
/** Resolve a `media:<id>` ref to a usable object URL (cached). Null if missing. */
export async function getURL(ref) {
  if (!isRef(ref)) return isRef(ref) ? null : ref; // pass through non-refs
  if (urlCache.has(ref)) return urlCache.get(ref);
  try {
    const rec = await getRecord(ref);
    if (!rec) return null;
    const url = URL.createObjectURL(rec.blob);
    urlCache.set(ref, url);
    return url;
  } catch { return null; }
}

export async function del(ref) {
  if (!isRef(ref)) return;
  const id = idOf(ref);
  if (urlCache.has(ref)) { URL.revokeObjectURL(urlCache.get(ref)); urlCache.delete(ref); }
  const store = await tx('readwrite');
  await new Promise((resolve) => { const r = store.delete(id); r.onsuccess = resolve; r.onerror = resolve; });
  emit('media:changed');
}

export async function usageBytes() {
  try {
    const store = await tx('readonly');
    return await new Promise((resolve) => {
      let total = 0;
      const req = store.openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { total += c.value.size || 0; c.continue(); } else resolve(total); };
      req.onerror = () => resolve(total);
    });
  } catch { return 0; }
}

export async function count() {
  try {
    const store = await tx('readonly');
    return await new Promise((resolve) => { const r = store.count(); r.onsuccess = () => resolve(r.result); r.onerror = () => resolve(0); });
  } catch { return 0; }
}

// ---- Helpers for capturing/downscaling media ----

/** Downscale an image File to a JPEG Blob (<= maxPx on the long edge). */
export function downscaleImage(file, maxPx = 640, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('encode')), 'image/jpeg', quality);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('decode'));
    img.src = URL.createObjectURL(file);
  });
}

export const VIDEO_MAX_BYTES = 6 * 1024 * 1024; // ~6 MB cap for short offline clips

/** Validate a video File against the size cap. Returns {ok, error}. */
export function checkVideo(file) {
  if (!file.type.startsWith('video/')) return { ok: false, error: 'That is not a video file.' };
  if (file.size > VIDEO_MAX_BYTES) return { ok: false, error: `Video is too big (max ${(VIDEO_MAX_BYTES / 1024 / 1024) | 0} MB). Try a shorter clip.` };
  return { ok: true };
}

export default { available, isRef, idOf, toRef, put, getURL, del, usageBytes, count, downscaleImage, checkVideo, VIDEO_MAX_BYTES };

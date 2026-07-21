// Hidden admin gate. Unlock is in-memory only (relocks on reload).
// Password stored as SHA-256 hex. Default password: "admin".
import store from '../core/store.js';

let unlocked = false;

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function init() {
  const admin = store.get('admin');
  if (!admin.seeded || !admin.passHash) {
    const passHash = await sha256('admin');
    store.set('admin', { passHash, seeded: true });
  }
}

export function isUnlocked() { return unlocked; }

export async function tryUnlock(password) {
  const admin = store.get('admin');
  const hash = await sha256(password || '');
  if (hash === admin.passHash) { unlocked = true; return true; }
  return false;
}

export async function changePassword(oldPw, newPw) {
  const ok = await tryUnlock(oldPw);
  if (!ok) return { ok: false, error: 'Current password is incorrect.' };
  if (!newPw || newPw.length < 3) return { ok: false, error: 'New password must be at least 3 characters.' };
  const passHash = await sha256(newPw);
  store.update('admin', (a) => ({ ...a, passHash }));
  return { ok: true };
}

export function lock() { unlocked = false; }

export default { init, isUnlocked, tryUnlock, changePassword, lock };

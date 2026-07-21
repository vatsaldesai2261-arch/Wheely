// Typed accessor over the settings domain in store.
import store from './store.js';
import { emit } from './bus.js';

export function all() { return store.get('settings'); }

export function getSetting(key) { return all()[key]; }

export function setSetting(key, value) {
  const next = store.update('settings', (s) => ({ ...s, [key]: value }));
  emit('settings:changed', { key, value, settings: next });
  return next;
}

// Convenience typed getters used across the app.
export const poseTimer = () => Number(all().poseTimer) || 10;
export const gameTimerMinutes = () => Number(all().gameTimer) || 15;
export const soundOn = () => all().sound !== false;
export const narrationOn = () => all().narration === true;
export const includeAdvanced = () => all().includeAdvanced === true;
export const tutorialSeen = () => all().tutorialSeen === true;

export function reducedMotion() {
  const pref = all().reducedMotion || 'auto';
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default { all, getSetting, setSetting, poseTimer, gameTimerMinutes, soundOn, narrationOn, includeAdvanced, tutorialSeen, reducedMotion };

// Applies the chosen color theme by stamping data-theme on <html>.
import { getSetting } from './settings.js';
import { on } from './bus.js';

export const THEMES = [
  { id: 'olive', name: '🌿 Meadow (kaya haus)' },
  { id: 'ocean', name: '🌊 Ocean' },
  { id: 'candy', name: '🍭 Candy' },
  { id: 'space', name: '🚀 Space' },
];

export function apply(theme) {
  const t = theme || getSetting('theme') || 'olive';
  if (t === 'olive') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

export function init() {
  apply();
  on('settings:changed', ({ key, value }) => { if (key === 'theme') apply(value); });
}

export default { THEMES, apply, init };

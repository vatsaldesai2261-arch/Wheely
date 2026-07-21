// Hash-based screen manager. Screens register once; go() swaps the active one.
import { qs, clear } from './dom.js';

const screens = new Map();
let root;
let currentId = null;
let currentScreen = null;
let guard = null; // (id) => allowed | redirect-id

export function init(rootEl) {
  root = rootEl;
  window.addEventListener('hashchange', () => route());
}

export function register(screen) {
  screens.set(screen.id, screen);
}

export function setGuard(fn) { guard = fn; }

export function current() { return currentId; }

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const id = path || 'splash';
  const params = {};
  if (query) for (const pair of query.split('&')) {
    const [k, v] = pair.split('=');
    params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return { id, params };
}

export function go(id, params = {}) {
  const q = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  const target = q ? `#/${id}?${q}` : `#/${id}`;
  if (location.hash === target) route(); // same hash → force re-route
  else location.hash = target;
}

export function back() { history.back(); }

async function route() {
  let { id, params } = parseHash();

  if (guard) {
    const verdict = guard(id, params);
    if (verdict && verdict !== true && verdict !== id) { go(verdict); return; }
    if (verdict === false) { go('home'); return; }
  }

  const screen = screens.get(id) || screens.get('home');
  if (!screen) return;

  if (currentScreen && currentScreen.onLeave) {
    try { currentScreen.onLeave(); } catch (e) { console.error(e); }
  }

  clear(root);
  const container = document.createElement('section');
  container.className = 'screen';
  container.dataset.screen = screen.id;
  root.append(container);

  // landscape lock for gameplay-heavy screens
  document.body.toggleAttribute('data-needs-landscape', !!screen.needsLandscape);

  try {
    await screen.mount(container, params);
  } catch (e) {
    console.error(`screen "${screen.id}" failed to mount`, e);
  }

  requestAnimationFrame(() => container.classList.add('is-active'));

  if (screen.onEnter) { try { screen.onEnter(params); } catch (e) { console.error(e); } }
  currentId = screen.id;
  currentScreen = screen;
}

export function start() {
  if (!location.hash) location.hash = '#/splash';
  else route();
}

export default { init, register, setGuard, go, back, current, start };

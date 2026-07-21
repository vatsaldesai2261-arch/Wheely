// Deterministic XP / coins / stars / belts. No randomness.
import store from '../core/store.js';
import { emit } from '../core/bus.js';
import stats from '../stats/stats.js';

let belts = null;
export async function loadBelts() {
  if (belts) return belts;
  const res = await fetch(new URL('../../data/belts.json', import.meta.url));
  belts = await res.json();
  return belts;
}
// Synchronous fallback ladder (kept in sync with data/belts.json) so reward
// math never blocks on a fetch mid-game.
const BELT_FALLBACK = [
  { id: 'white', name: 'White Belt', minXp: 0 }, { id: 'yellow', name: 'Yellow Belt', minXp: 100 },
  { id: 'orange', name: 'Orange Belt', minXp: 250 }, { id: 'green', name: 'Green Belt', minXp: 500 },
  { id: 'blue', name: 'Blue Belt', minXp: 900 }, { id: 'purple', name: 'Purple Belt', minXp: 1400 },
  { id: 'brown', name: 'Brown Belt', minXp: 2000 }, { id: 'red', name: 'Red Belt', minXp: 2800 },
  { id: 'black', name: 'Black Belt', minXp: 3800 },
];
function ladder() { return belts || BELT_FALLBACK; }

const DIFF_BONUS = { easy: 0, medium: 5, hard: 10, advanced: 15 };

export function beltFor(xp) {
  const l = ladder();
  let belt = l[0];
  for (const b of l) if (xp >= b.minXp) belt = b;
  return belt;
}

export function nextBelt(xp) {
  const l = ladder();
  return l.find((b) => b.minXp > xp) || null;
}

export function starsForRate(rate) {
  if (rate >= 0.9) return 3;
  if (rate >= 0.7) return 2;
  if (rate >= 0.4) return 1;
  return 0;
}

/** Apply a decision's reward to the player, persist, emit level-up. */
export function awardForDecision(player, pose, result, { multiplier = 1 } = {}) {
  let xp = 0, coins = 0;
  if (result === 'pass') {
    xp = Math.round((10 + (DIFF_BONUS[pose.difficulty] || 0)) * multiplier);
    coins = Math.floor(xp / 5) + 1;
  } else {
    xp = 2; coins = 0; // effort points
  }

  const before = beltFor(player.xp || 0);
  applyToPlayer(player.id, (pl) => {
    pl.xp = (pl.xp || 0) + xp;
    pl.coins = (pl.coins || 0) + coins;
    if (result === 'pass') pl.completed = (pl.completed || 0) + 1; else pl.missed = (pl.missed || 0) + 1;
    pl.belt = beltFor(pl.xp).name;
    return pl;
  });
  const updated = getPlayer(player.id);
  if (updated) { player.xp = updated.xp; player.coins = updated.coins; player.belt = updated.belt; }

  const after = beltFor(player.xp || 0);
  if (after.id !== before.id) emit('player:levelup', { player, belt: after });

  // feed stats + achievements
  stats.recordDecision(player.id, pose, result);
  emit(result === 'pass' ? 'pose:completed' : 'pose:missed', { playerId: player.id, pose });

  return { xp, coins };
}

function getPlayer(id) { return store.get('players').find((p) => p.id === id); }
function applyToPlayer(id, fn) {
  store.update('players', (list) => list.map((p) => (p.id === id ? fn({ ...p }) : p)));
}

export default { loadBelts, beltFor, nextBelt, starsForRate, awardForDecision };

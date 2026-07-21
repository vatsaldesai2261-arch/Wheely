// Custom per-kid goals: a grown-up sets a target + a real-life reward text.
// Progress is read from live player/stat data; completion fires a celebration.
import store from '../core/store.js';
import { emit, on } from '../core/bus.js';
import stats from '../stats/stats.js';

// A goal lives on the player object: { goal: { type, target, reward, reachedAt } }
export const GOAL_TYPES = [
  { id: 'xp', label: 'Reach XP', unit: 'XP' },
  { id: 'poses', label: 'Complete poses', unit: 'poses' },
  { id: 'sessions', label: 'Play games', unit: 'games' },
  { id: 'streak', label: 'Best streak', unit: 'in a row' },
  { id: 'days', label: 'Practice days in a row', unit: 'days' },
];

export function currentValue(player) {
  const s = stats.forPlayer(player.id);
  switch (player.goal?.type) {
    case 'xp': return player.xp || 0;
    case 'poses': return s.posesCompleted;
    case 'sessions': return s.sessionsPlayed;
    case 'streak': return s.bestStreak;
    case 'days': return s.dayStreak;
    default: return 0;
  }
}

export function progress(player) {
  if (!player.goal) return null;
  const value = currentValue(player);
  const pct = Math.min(1, value / (player.goal.target || 1));
  return { value, target: player.goal.target, pct, reached: value >= player.goal.target, reward: player.goal.reward };
}

export function init() {
  on('pose:completed', ({ playerId }) => check(playerId));
  on('stats:session', ({ playerId }) => check(playerId));
  on('player:levelup', ({ player }) => check(player.id));
}

function check(playerId) {
  const players = store.get('players');
  const player = players.find((p) => p.id === playerId);
  if (!player || !player.goal || player.goal.reachedAt) return;
  const p = progress(player);
  if (p && p.reached) {
    store.update('players', (arr) => arr.map((x) => x.id === playerId ? { ...x, goal: { ...x.goal, reachedAt: Date.now() } } : x));
    emit('goal:reached', { player, reward: player.goal.reward });
  }
}

export default { GOAL_TYPES, currentValue, progress, init };

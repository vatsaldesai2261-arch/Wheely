// Custom goals. Two layers:
//  1. Reusable GOAL TEMPLATES (store domain `goalTemplates`) created in the
//     admin Goals editor: { id, name, metric, target, reward }.
//  2. Players assign templates via `player.goalIds: []`, and/or keep a legacy
//     inline `player.goal`. Reaching any goal fires `goal:reached`.
import store from '../core/store.js';
import { emit, on } from '../core/bus.js';
import stats from '../stats/stats.js';

export const GOAL_TYPES = [
  { id: 'xp', label: 'Reach XP', unit: 'XP' },
  { id: 'poses', label: 'Complete poses', unit: 'poses' },
  { id: 'sessions', label: 'Play games', unit: 'games' },
  { id: 'streak', label: 'Best streak', unit: 'in a row' },
  { id: 'days', label: 'Practice days in a row', unit: 'days' },
  { id: 'minutes', label: 'Practice minutes', unit: 'min' },
];

function valueFor(metric, player) {
  const s = stats.forPlayer(player.id);
  switch (metric) {
    case 'xp': return player.xp || 0;
    case 'poses': return s.posesCompleted;
    case 'sessions': return s.sessionsPlayed;
    case 'streak': return s.bestStreak;
    case 'days': return s.dayStreak;
    case 'minutes': return s.minutesPracticed;
    default: return 0;
  }
}

export function currentValue(player) { return valueFor(player.goal?.type, player); }

/** Progress for one goal definition {type/metric, target, reward}. */
export function progressOf(player, def) {
  const metric = def.metric || def.type;
  const value = valueFor(metric, player);
  return { value, target: def.target, pct: Math.min(1, value / (def.target || 1)), reached: value >= def.target, reward: def.reward, name: def.name };
}

/** All active goals for a player (assigned templates + legacy inline goal). */
export function goalsFor(player) {
  const templates = store.get('goalTemplates');
  const assigned = (player.goalIds || []).map((id) => templates.find((t) => t.id === id)).filter(Boolean);
  const list = assigned.map((t) => ({ ...t, _key: 't:' + t.id }));
  if (player.goal) list.push({ ...player.goal, name: player.goal.name || 'Goal', metric: player.goal.type, _key: 'inline' });
  return list;
}

// Backward-compatible single-goal progress (used by results card).
export function progress(player) {
  if (player.goal) return progressOf(player, { ...player.goal, metric: player.goal.type });
  const g = goalsFor(player)[0];
  return g ? progressOf(player, g) : null;
}

export function init() {
  on('pose:completed', ({ playerId }) => check(playerId));
  on('stats:session', ({ playerId }) => check(playerId));
  on('player:levelup', ({ player }) => check(player.id));
}

// Track which goals we've already celebrated (per player+goal key) in the reached map.
function reachedKey(player) { return player.goalReached || {}; }

function check(playerId) {
  const players = store.get('players');
  const player = players.find((p) => p.id === playerId);
  if (!player) return;
  const reached = { ...reachedKey(player) };
  let changed = false;
  for (const g of goalsFor(player)) {
    const pr = progressOf(player, g);
    if (pr.reached && !reached[g._key]) {
      reached[g._key] = Date.now();
      changed = true;
      emit('goal:reached', { player, reward: g.reward, goalName: g.name });
    }
  }
  // keep legacy reachedAt working too
  if (player.goal && progressOf(player, { ...player.goal, metric: player.goal.type }).reached && !player.goal.reachedAt) {
    changed = true;
  }
  if (changed) {
    store.update('players', (arr) => arr.map((p) => p.id === playerId ? {
      ...p, goalReached: reached,
      goal: p.goal ? { ...p.goal, reachedAt: p.goal.reachedAt || (progressOf(p, { ...p.goal, metric: p.goal.type }).reached ? Date.now() : undefined) } : p.goal,
    } : p));
  }
}

export default { GOAL_TYPES, currentValue, progress, progressOf, goalsFor, init };

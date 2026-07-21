// Declarative achievement engine. Evaluates data/achievements.json conditions
// against player stats after pose/session events; persists unlocked ids and
// emits achievement:unlocked (UI turns that into a toast + confetti).
import store from '../core/store.js';
import { on, emit } from '../core/bus.js';
import stats from '../stats/stats.js';
import rewards from './rewards.js';

let defs = [];
let ready = false;

export async function init() {
  if (ready) return;
  try {
    const res = await fetch(new URL('../../data/achievements.json', import.meta.url));
    defs = await res.json();
  } catch { defs = []; }
  ready = true;

  on('pose:completed', ({ playerId }) => evaluate(playerId, {}));
  on('pose:missed', ({ playerId }) => evaluate(playerId, {}));
  on('player:levelup', ({ player }) => evaluate(player.id, {}));
  on('engine:decision', ({ player, result, streak, comeback }) => {
    evaluate(player.id, { streak, comeback, lastResult: result });
  });
}

export function definitions() { return defs; }

export function unlockedFor(playerId) {
  const all = store.get('achievements');
  return new Set(all[playerId] || []);
}

function unlock(playerId, def) {
  store.update('achievements', (all) => {
    const set = new Set(all[playerId] || []);
    set.add(def.id);
    all[playerId] = [...set];
    return all;
  });
  emit('achievement:unlocked', { playerId, achievement: def });
}

function player(playerId) { return store.get('players').find((p) => p.id === playerId); }

/** ctx carries transient values (in-session streak, comeback flag, session summary). */
export function evaluate(playerId, ctx = {}) {
  if (!ready) return;
  const s = stats.forPlayer(playerId);
  const pl = player(playerId) || { xp: 0 };
  const already = unlockedFor(playerId);

  for (const def of defs) {
    if (already.has(def.id)) continue;
    if (matches(def.condition, { s, pl, ctx })) unlock(playerId, def);
  }
}

function matches(cond, { s, pl, ctx }) {
  switch (cond.type) {
    case 'counter': {
      const map = { posesCompleted: s.posesCompleted, coinsTotal: pl.coins || 0, minutesPracticed: s.minutesPracticed, sessionsPlayed: s.sessionsPlayed };
      return (map[cond.stat] ?? 0) >= cond.gte;
    }
    case 'category-counter': return (s.perCategory[cond.category] || 0) >= cond.gte;
    case 'difficulty-counter': return (s.perDifficulty[cond.difficulty] || 0) >= cond.gte;
    case 'distinct-categories': return (s.distinctCategories?.length || 0) >= cond.gte;
    case 'streak': return (ctx.streak || 0) >= cond.gte;
    case 'day-streak': return (s.dayStreak || 0) >= cond.gte;
    case 'belt': return rewards.beltFor(pl.xp || 0).id === cond.belt || beltReached(pl.xp || 0, cond.belt);
    case 'mode': return (s.perMode?.[cond.mode] || 0) >= (cond.sessionsGte || 1);
    case 'session': return sessionCheck(cond, ctx);
    default: return false;
  }
}

function beltReached(xp, beltId) {
  const order = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black'];
  const cur = rewards.beltFor(xp).id;
  return order.indexOf(cur) >= order.indexOf(beltId);
}

function sessionCheck(cond, ctx) {
  const sum = ctx.sessionSummary;
  if (cond.check === 'comeback') return !!ctx.comeback;
  if (!sum) return false;
  if (cond.check === 'perfect') return sum.missed === 0 && sum.completed > 0;
  if (cond.check === 'posesGte') return (sum.completed + sum.missed) >= cond.value;
  return false;
}

/** Called at session end with each player's summary for session-scoped checks. */
export function evaluateSession(playerId, sessionSummary) {
  evaluate(playerId, { sessionSummary });
}

export default { init, definitions, unlockedFor, evaluate, evaluateSession };

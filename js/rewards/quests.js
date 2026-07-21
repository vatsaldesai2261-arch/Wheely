// Weekly quests — 3 rotating quests per ISO week, shared across the family,
// with coin rewards. Progress read from aggregate stats. Deterministic pick.
import store from '../core/store.js';
import { emit } from '../core/bus.js';
import stats from '../stats/stats.js';

let pool = null;
export async function loadPool() {
  if (pool) return pool;
  const res = await fetch(new URL('../../data/quests.json', import.meta.url));
  pool = await res.json();
  return pool;
}

export function weekKey(date = new Date()) {
  // ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((d - firstThu) / 86400000 - 3) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function seededPick(list, n, seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  const idx = [...list.keys()];
  // Fisher-Yates with the seed
  for (let i = idx.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507); h >>>= 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => list[i]);
}

export function activeQuests() {
  if (!pool) return [];
  const wk = weekKey();
  return seededPick(pool, 3, wk);
}

/** Aggregate progress across all players for this week. */
function questValue(q) {
  const players = store.get('players');
  let total = 0;
  for (const p of players) {
    const s = stats.forPlayer(p.id);
    switch (q.type) {
      case 'posesCompleted': total += s.posesCompleted; break;
      case 'category': total += s.perCategory?.[q.category] || 0; break;
      case 'sessions': total += s.sessionsPlayed; break;
      case 'minutes': total += s.minutesPracticed; break;
      case 'streak': total = Math.max(total, s.bestStreak); break;
      default: break;
    }
  }
  return total;
}

export function questProgress() {
  const wk = weekKey();
  const rec = store.get('quests')[wk] || { baseline: {}, claimed: [] };
  return activeQuests().map((q) => {
    const base = rec.baseline?.[q.id] || 0;
    const value = Math.max(0, questValue(q) - base);
    return { ...q, value, pct: Math.min(1, value / q.target), done: value >= q.target, claimed: (rec.claimed || []).includes(q.id) };
  });
}

/** Snapshot baselines at the start of a week so progress counts *this* week. */
export function ensureWeek() {
  const wk = weekKey();
  store.update('quests', (all) => {
    if (!all[wk]) {
      const baseline = {};
      for (const q of activeQuests()) baseline[q.id] = questValue(q);
      all[wk] = { baseline, claimed: [] };
    }
    return all;
  });
}

export function claim(q) {
  const wk = weekKey();
  store.update('quests', (all) => {
    const rec = all[wk] || { baseline: {}, claimed: [] };
    if (!rec.claimed.includes(q.id)) rec.claimed.push(q.id);
    all[wk] = rec;
    return all;
  });
  // reward coins to all active players (shared family quest)
  store.update('players', (arr) => arr.map((p) => p.active !== false ? { ...p, coins: (p.coins || 0) + q.reward } : p));
  emit('quest:claimed', { quest: q });
}

export default { loadPool, activeQuests, questProgress, ensureWeek, claim, weekKey };

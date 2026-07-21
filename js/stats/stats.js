// Bounded per-player aggregates + a capped ring buffer of session summaries.
// Never stores unbounded per-event logs.
import store from '../core/store.js';
import { emit } from '../core/bus.js';

const MAX_SESSIONS = 50;

function blank() {
  return {
    posesCompleted: 0, posesMissed: 0, coinsTotal: 0, minutesPracticed: 0,
    sessionsPlayed: 0, bestStreak: 0, perCategory: {}, perDifficulty: {},
    perMode: {}, distinctCategories: [], dayStreak: 0, lastPlayedDay: null,
    recentSessions: [],
  };
}

export function forPlayer(id) {
  const all = store.get('stats');
  return { ...blank(), ...(all[id] || {}) };
}

function save(id, fn) {
  store.update('stats', (all) => {
    const cur = { ...blank(), ...(all[id] || {}) };
    all[id] = fn(cur) || cur;
    return all;
  });
}

export function recordDecision(playerId, pose, result) {
  save(playerId, (s) => {
    if (result === 'pass') {
      s.posesCompleted++;
      s.perCategory[pose.category] = (s.perCategory[pose.category] || 0) + 1;
      s.perDifficulty[pose.difficulty] = (s.perDifficulty[pose.difficulty] || 0) + 1;
      if (!s.distinctCategories.includes(pose.category)) s.distinctCategories.push(pose.category);
    } else {
      s.posesMissed++;
    }
    return s;
  });
  emit('stats:updated', { playerId });
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayDiff(a, b) {
  const [ay, am, ad] = a.split('-').map(Number), [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function recordSession(playerSummary, meta) {
  save(playerSummary.id, (s) => {
    s.sessionsPlayed++;
    s.coinsTotal += playerSummary.coins || 0;
    s.minutesPracticed += Math.round((meta.durationSec || 0) / 60);
    s.bestStreak = Math.max(s.bestStreak, playerSummary.bestStreak || 0);
    s.perMode[meta.mode] = (s.perMode[meta.mode] || 0) + 1;

    const today = todayKey();
    if (s.lastPlayedDay !== today) {
      if (s.lastPlayedDay && dayDiff(s.lastPlayedDay, today) === 1) s.dayStreak++;
      else s.dayStreak = 1;
      s.lastPlayedDay = today;
    }

    s.recentSessions.unshift({
      date: today, mode: meta.mode, completed: playerSummary.completed,
      missed: playerSummary.missed, stars: playerSummary.stars, xp: playerSummary.xp,
    });
    if (s.recentSessions.length > MAX_SESSIONS) s.recentSessions.length = MAX_SESSIONS;
    return s;
  });
  emit('stats:session', { playerId: playerSummary.id });
}

export function leaderboard(metric = 'xp') {
  const players = store.get('players');
  return players.map((p) => {
    const s = forPlayer(p.id);
    const value =
      metric === 'xp' ? (p.xp || 0) :
      metric === 'poses' ? s.posesCompleted :
      metric === 'streak' ? s.bestStreak :
      metric === 'coins' ? (p.coins || 0) : (p.xp || 0);
    return { id: p.id, name: p.name, avatar: p.avatar, belt: p.belt, value, xp: p.xp || 0 };
  }).sort((a, b) => b.value - a.value);
}

export default { forPlayer, recordDecision, recordSession, leaderboard };

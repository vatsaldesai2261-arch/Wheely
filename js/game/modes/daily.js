// Daily Challenge — a date-seeded 5-pose sequence, the same for everyone that
// day. One scored attempt per player per day; replays are unscored. Bonus XP.
import poseLoader from '../../data/pose-loader.js';
import store from '../../core/store.js';

const SEQ_LEN = 5;

function hashDate(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dailySequence() {
  const rng = hashDate(todayKey());
  const pool = poseLoader.filterPoses({ difficulties: ['easy', 'medium'], includeAdvanced: false });
  const picks = [];
  const used = new Set();
  while (picks.length < SEQ_LEN && used.size < pool.length) {
    const i = (rng() * pool.length) | 0;
    if (!used.has(i)) { used.add(i); picks.push(pool[i].id); }
  }
  return picks;
}

export default {
  id: 'daily',
  name: 'Daily Challenge',
  icon: '🎯',
  blurb: "Today's special 5 poses. Come back every day for a new set!",
  xpMultiplier: 1.5,
  fixedPoseCount: SEQ_LEN,

  buildPools(players) {
    const seq = dailySequence();
    const map = new Map();
    for (const p of players) map.set(p.id, { source: seq, remaining: [...seq], lastDrawn: null, cycle: 1, sequence: true });
    return map;
  },

  nextDraw(session, pool) {
    if (!pool.remaining.length) return null;
    const id = pool.remaining.shift();
    pool.lastDrawn = id;
    return id;
  },

  onDecision() {},

  isOver(session) {
    // over when every player's sequence is exhausted
    return [...session.poolsByPlayer.values()].every((p) => !p.remaining.length);
  },

  markScored(playerId) {
    store.update('progress', (prog) => {
      const daily = (prog.dailyScored ||= {});
      daily[playerId] = todayKey();
      return prog;
    });
  },

  alreadyScoredToday(playerId) {
    const prog = store.get('progress');
    return prog.dailyScored?.[playerId] === todayKey();
  },

  resultsExtras(session) {
    return { type: 'daily', date: todayKey(), poses: session.log.length };
  },
};

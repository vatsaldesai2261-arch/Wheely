// Balance Boss — a balance-skill challenge. Only balance poses, held a little
// longer than usual to build focus and steadiness. Curated set (own pools), so
// the group/wheel picker is hidden in Setup.
import poseLoader from '../../data/pose-loader.js';
import { createPool, draw } from '../pool.js';
import classic from './classic.js';

export default {
  ...classic,
  id: 'balance-boss',
  name: 'Balance Boss',
  icon: '🦩',
  blurb: 'Wibble, wobble, hold it steady — a balance challenge for brave yogis!',
  poseTimerOverride: 15, // hold longer to really test the balance

  buildPools(players, wheelConfig) {
    let eligible = poseLoader.filterPoses({ categories: ['balance'], includeAdvanced: wheelConfig.includeAdvanced });
    if (eligible.length < 4) eligible = poseLoader.filterPoses({ categories: ['balance'], includeAdvanced: true });
    const ids = eligible.map((p) => p.id);
    const map = new Map();
    for (const p of players) map.set(p.id, createPool(ids));
    return map;
  },

  nextDraw(session, pool) { return draw(pool); },

  resultsExtras(session) {
    let steady = 0;
    for (const r of Object.values(session.turnResults)) steady = Math.max(steady, r.bestStreak);
    return { type: 'balance', steady };
  },
};

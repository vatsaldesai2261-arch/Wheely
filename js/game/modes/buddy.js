// Buddy Up — partner & group poses done together. Only "Together Time" poses,
// so two (or more) kids strike each shape side by side. Curated set (own pools),
// so the group/wheel picker is hidden in Setup.
import poseLoader from '../../data/pose-loader.js';
import { createPool, draw } from '../pool.js';
import classic from './classic.js';

function totalCompleted(session) {
  return Object.values(session.turnResults).reduce((n, r) => n + r.completed, 0);
}

export default {
  ...classic,
  id: 'buddy',
  name: 'Buddy Up',
  icon: '🧑‍🤝‍🧑',
  blurb: 'Grab a friend! Partner poses you strike together as a team.',
  groupScoring: true,

  buildPools(players, wheelConfig) {
    let eligible = poseLoader.filterPoses({ categories: ['partner-group'], includeAdvanced: wheelConfig.includeAdvanced });
    if (eligible.length < 4) eligible = poseLoader.filterPoses({ categories: ['partner-group'], includeAdvanced: true });
    const ids = eligible.map((p) => p.id);
    const map = new Map();
    for (const p of players) map.set(p.id, createPool(ids));
    return map;
  },

  nextDraw(session, pool) { return draw(pool); },

  resultsExtras(session) {
    return { type: 'buddy', poses: totalCompleted(session) };
  },
};

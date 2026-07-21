// Classic mode — the baseline strategy every other mode specializes from.
import poseLoader from '../../data/pose-loader.js';
import { createPool, draw } from '../pool.js';

export default {
  id: 'classic',
  name: 'Classic',
  icon: '🎡',
  blurb: 'Spin, pose, and earn stars. The original adventure!',

  buildPools(players, wheelConfig) {
    const eligible = poseLoader.filterPoses({
      categories: wheelConfig.categories,
      difficulties: wheelConfig.difficulties,
      includeAdvanced: wheelConfig.includeAdvanced,
    });
    let ids = eligible.map((p) => p.id);
    if (!ids.length) ids = poseLoader.filterPoses({ includeAdvanced: false }).map((p) => p.id);
    const map = new Map();
    for (const p of players) map.set(p.id, createPool(ids));
    return map;
  },

  nextDraw(session, pool) { return draw(pool); },
  decorate() { return {}; },
  onDecision() {},
  isOver() { return false; },
  resultsExtras() { return null; },
};

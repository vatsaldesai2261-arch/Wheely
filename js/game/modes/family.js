// Family mode — each player gets a pool tuned to their own goal/difficulty
// preset, so a 5-year-old and a grown-up can play the same game fairly.
import poseLoader from '../../data/pose-loader.js';
import { createPool, draw } from '../pool.js';
import classic from './classic.js';

const PRESET_DIFF = {
  gentle: ['easy'],
  balanced: ['easy', 'medium'],
  challenge: ['easy', 'medium', 'hard'],
  everything: ['easy', 'medium', 'hard', 'advanced'],
};

export default {
  ...classic,
  id: 'family',
  name: 'Family',
  icon: '👨‍👩‍👧',
  blurb: 'Everyone plays together — each yogi gets poses that fit them.',

  buildPools(players, wheelConfig) {
    const map = new Map();
    for (const p of players) {
      const diffs = PRESET_DIFF[p.goalPreset] || wheelConfig.difficulties || ['easy', 'medium'];
      const includeAdvanced = wheelConfig.includeAdvanced && diffs.includes('advanced');
      let ids = poseLoader.filterPoses({ categories: wheelConfig.categories, difficulties: diffs, includeAdvanced }).map((x) => x.id);
      if (!ids.length) ids = poseLoader.filterPoses({ difficulties: diffs, includeAdvanced }).map((x) => x.id);
      map.set(p.id, createPool(ids));
    }
    return map;
  },

  nextDraw(session, pool) { return draw(pool); },
};

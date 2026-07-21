// Belt Test — a special challenge session. A curated set of poses across
// groups; pass most of them to "pass your belt test" with a celebration and
// bonus XP. Extends classic (shares draw/anti-repeat).
import poseLoader from '../../data/pose-loader.js';
import classic from './classic.js';

const TEST_SIZE = 6;

function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

export default {
  ...classic,
  id: 'belt-test',
  name: 'Belt Test',
  icon: '🥋',
  blurb: 'A special challenge! Pass the poses to earn your belt test badge.',
  xpMultiplier: 1.5,
  fixedPoseCount: TEST_SIZE,

  buildPools(players, wheelConfig) {
    // One balanced set per kid: a spread across a few friendly groups.
    const groups = ['standing', 'balance', 'backbend', 'seated', 'forward-fold', 'core', 'warmup-fun'];
    const map = new Map();
    for (const p of players) {
      const focus = (p.focusPoses || []).filter((id) => poseLoader.byId(id));
      let ids;
      if (focus.length >= TEST_SIZE) ids = shuffle(focus).slice(0, TEST_SIZE);
      else {
        const picks = [];
        for (const g of shuffle(groups)) {
          const inG = poseLoader.filterPoses({ categories: [g], difficulties: ['easy', 'medium'], includeAdvanced: false });
          if (inG.length) picks.push(inG[(Math.random() * inG.length) | 0].id);
          if (picks.length >= TEST_SIZE) break;
        }
        ids = picks.length ? picks : poseLoader.filterPoses({ difficulties: ['easy', 'medium'] }).slice(0, TEST_SIZE).map((x) => x.id);
      }
      // sequence pool (fixed order, no refill) so the test is exactly N poses
      map.set(p.id, { source: ids, remaining: [...ids], lastDrawn: null, cycle: 1, sequence: true });
    }
    return map;
  },

  nextDraw(session, pool) {
    if (!pool.remaining.length) return null;
    const id = pool.remaining.shift();
    pool.lastDrawn = id;
    return id;
  },

  isOver(session) {
    return [...session.poolsByPlayer.values()].every((p) => !p.remaining.length);
  },

  resultsExtras(session) {
    // Determine pass: ≥ 70% of the test passed for the top player.
    let best = 0, total = TEST_SIZE;
    for (const r of Object.values(session.turnResults)) {
      const done = r.completed;
      best = Math.max(best, done);
    }
    const passed = best / total >= 0.7;
    return { type: 'belt-test', passed, best, total };
  },
};

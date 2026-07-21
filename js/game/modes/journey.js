// Around the World — a passport journey that visits one pose from every "land"
// (pose category) in one trip. A fixed sequence (no refill) so each journey is
// exactly one stop per land; results show the stamps collected. Curated set, so
// the group/wheel picker is hidden in Setup.
import poseLoader from '../../data/pose-loader.js';
import classic from './classic.js';

function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

export default {
  ...classic,
  id: 'journey',
  name: 'Around the World',
  icon: '🌍',
  blurb: 'A passport adventure — one pose from every land! Collect all the stamps.',
  xpMultiplier: 1.25,

  buildPools(players, wheelConfig) {
    // One friendly pose per category, in a shuffled travel order.
    const cats = poseLoader.getCategories();
    const stops = [];
    for (const c of shuffle(cats)) {
      const inC = poseLoader.filterPoses({ categories: [c.id], difficulties: ['easy', 'medium'], includeAdvanced: false });
      if (inC.length) stops.push(inC[(Math.random() * inC.length) | 0].id);
    }
    const ids = stops.length ? stops : poseLoader.filterPoses({ difficulties: ['easy', 'medium'] }).slice(0, 8).map((x) => x.id);
    const map = new Map();
    // Each kid travels their own copy of the same-length itinerary.
    for (const p of players) {
      const route = shuffle(ids);
      map.set(p.id, { source: route, remaining: [...route], lastDrawn: null, cycle: 1, sequence: true });
    }
    return map;
  },

  nextDraw(session, pool) {
    if (!pool.remaining.length) return null;
    const id = pool.remaining.shift();
    pool.lastDrawn = id;
    return id;
  },

  onDecision(session, player, pose) {
    // Stamp the passport with the land (category) just visited.
    const passport = (session.modeState.passport ||= []);
    if (!pose || passport.some((s) => s.id === pose.category)) return;
    const cat = poseLoader.getCategories().find((c) => c.id === pose.category);
    if (cat) passport.push({ id: cat.id, name: cat.name, emoji: cat.emoji });
  },

  isOver(session) {
    return [...session.poolsByPlayer.values()].every((p) => !p.remaining.length);
  },

  resultsExtras(session) {
    return { type: 'journey', stamps: session.modeState.passport || [] };
  },
};

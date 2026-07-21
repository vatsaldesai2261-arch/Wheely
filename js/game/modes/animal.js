// Animal Adventure — only animal poses. Passing a pose "rescues" that animal
// into the player's collection, shown filling a habitat on the results screen.
import poseLoader from '../../data/pose-loader.js';
import { createPool, draw } from '../pool.js';

export default {
  id: 'animal',
  name: 'Animal Adventure',
  icon: '🦁',
  blurb: 'Meet wild friends! Every pose you strike rescues an animal.',
  theme: 'jungle',

  buildPools(players, wheelConfig) {
    let eligible = poseLoader.filterPoses({
      categories: wheelConfig.categories?.length ? wheelConfig.categories : null,
      includeAdvanced: wheelConfig.includeAdvanced,
      animalsOnly: true,
    });
    if (eligible.length < 6) eligible = poseLoader.filterPoses({ animalsOnly: true, includeAdvanced: false });
    const ids = eligible.map((p) => p.id);
    const map = new Map();
    for (const p of players) map.set(p.id, createPool(ids));
    return map;
  },

  nextDraw(session, pool) { return draw(pool); },
  decorate() { return { theme: 'jungle' }; },

  onDecision(session, player, pose, result) {
    if (result !== 'pass' || !pose.animalName) return;
    const state = (session.modeState.collections ||= {});
    const set = (state[player.id] ||= []);
    if (!set.find((a) => a.name === pose.animalName)) {
      set.push({ name: pose.animalName, emoji: pose.emoji || '🐾' });
    }
  },

  isOver() { return false; },

  resultsExtras(session) {
    const collections = session.modeState.collections || {};
    const rescued = {};
    for (const [pid, list] of Object.entries(collections)) rescued[pid] = list;
    return { type: 'animal-collection', rescued };
  },
};

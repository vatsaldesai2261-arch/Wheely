// Story Adventure — chapters from stories.json gate the pool. A narration card
// shows between chapters. Progress advances as poses are passed.
import poseLoader from '../../data/pose-loader.js';
import { createPool, draw } from '../pool.js';

let storiesCache = null;
async function loadStories() {
  if (storiesCache) return storiesCache;
  const res = await fetch(new URL('../../../data/stories.json', import.meta.url));
  storiesCache = await res.json();
  return storiesCache;
}

export default {
  id: 'story',
  name: 'Story Adventure',
  icon: '📖',
  blurb: 'Play through a magical tale, one pose at a time.',
  needsStory: true,
  loadStories,

  buildPools(players, wheelConfig) {
    const story = wheelConfig.story;
    const map = new Map();
    const allIds = poseLoader.filterPoses({ includeAdvanced: wheelConfig.includeAdvanced }).map((p) => p.id);
    for (const p of players) {
      map.set(p.id, createPool(allIds)); // full pool; nextDraw restricts by chapter
    }
    // seed chapter progress
    map.forEach((_, pid) => {});
    return map;
  },

  init(session) {
    session.modeState.story = session.wheelConfig.story;
    session.modeState.chapterIndex = 0;
    session.modeState.chapterPasses = 0;
  },

  chapterPoolIds(session) {
    const st = session.modeState.story;
    const ch = st.chapters[session.modeState.chapterIndex];
    const ids = poseLoader.filterPoses({
      categories: ch.categories,
      includeAdvanced: false,
    }).map((p) => p.id);
    return ids.length ? ids : poseLoader.filterPoses({ includeAdvanced: false }).map((p) => p.id);
  },

  nextDraw(session, pool) {
    // Rebuild a chapter-scoped pool lazily.
    const key = `${session.modeState.chapterIndex}`;
    if (session.modeState.chapterPoolKey !== key) {
      const ids = this.chapterPoolIds(session);
      pool.source = ids;
      pool.remaining = [...ids].sort(() => Math.random() - 0.5);
      pool.lastDrawn = null;
      session.modeState.chapterPoolKey = key;
    }
    return draw(pool);
  },

  currentChapter(session) {
    return session.modeState.story.chapters[session.modeState.chapterIndex];
  },

  onDecision(session, player, pose, result) {
    if (result === 'pass') session.modeState.chapterPasses++;
    const ch = this.currentChapter(session);
    if (session.modeState.chapterPasses >= (ch.count || 3)) {
      session.modeState.chapterPasses = 0;
      session.modeState.chapterIndex++;
      session.modeState.chapterJustAdvanced = true;
    }
  },

  isOver(session) {
    return session.modeState.chapterIndex >= session.modeState.story.chapters.length;
  },

  resultsExtras(session) {
    const st = session.modeState.story;
    const done = Math.min(session.modeState.chapterIndex, st.chapters.length);
    return { type: 'story', title: st.title, emoji: st.emoji, chaptersDone: done, chaptersTotal: st.chapters.length };
  },
};

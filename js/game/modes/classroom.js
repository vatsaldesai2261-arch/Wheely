// Classroom mode — many kids, quick turns, group-win framing (no individual
// leaderboard pressure). Shorter default hold; everyone celebrates together.
import classic from './classic.js';

export default {
  ...classic,
  id: 'classroom',
  name: 'Classroom',
  icon: '🏫',
  blurb: 'Perfect for a whole group. Quick turns, everyone wins together!',
  poseTimerOverride: 8,
  quickAdvance: true,
  groupScoring: true,

  resultsExtras(session) {
    let completed = 0;
    for (const r of Object.values(session.turnResults)) completed += r.completed;
    return { headline: `Our class struck ${completed} poses together! 🎉`, group: true };
  },
};

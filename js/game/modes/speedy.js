// Speedy Flow — beat-the-clock quick poses. Shorter holds keep the energy high
// and get the wiggles out. Inherits classic pools (the group pick still applies).
import classic from './classic.js';

function totalCompleted(session) {
  return Object.values(session.turnResults).reduce((n, r) => n + r.completed, 0);
}

export default {
  ...classic,
  id: 'speedy',
  name: 'Speedy Flow',
  icon: '⚡',
  blurb: 'Quick poses, fast and fun — how many can you flow through?',
  poseTimerOverride: 6, // short, snappy holds

  resultsExtras(session) {
    return { type: 'speedy', poses: totalCompleted(session) };
  },
};

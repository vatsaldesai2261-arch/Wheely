// Freeze Dance — the classic musical-statues game, yoga style. Gentle music
// plays; when the wheel stops the screen flashes "DANCE… FREEZE!" and the kid
// holds the shown pose. Inherits classic pools (the group pick still applies).
// The `music` + `freeze` flags are read by the game screen (game.js).
import classic from './classic.js';

function totalCompleted(session) {
  return Object.values(session.turnResults).reduce((n, r) => n + r.completed, 0);
}

export default {
  ...classic,
  id: 'freeze',
  name: 'Freeze Dance',
  icon: '🕺',
  blurb: 'Dance to the music… then FREEZE into the pose! 🥶',
  music: true,
  freeze: true,

  resultsExtras(session) {
    return { type: 'freeze', poses: totalCompleted(session) };
  },
};

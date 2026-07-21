// Team Match — split the active players into two teams; every pass scores for
// that kid's team. Results show the winning team. Great for camps & classes.
import classic from './classic.js';

export default {
  ...classic,
  id: 'team',
  name: 'Team Match',
  icon: '🤝',
  blurb: 'Two teams, one goal — strike poses to win points for your team!',
  groupScoring: true,

  init(session) {
    // Alternate players into Team A / Team B.
    const teams = { A: [], B: [] };
    session.players.forEach((p, i) => { (i % 2 === 0 ? teams.A : teams.B).push(p.id); });
    session.modeState.teams = teams;
    session.modeState.teamNames = { A: '🔵 Blue Team', B: '🔴 Red Team' };
  },

  onDecision(session, player, pose, result) {
    if (result !== 'pass') return;
    const teams = session.modeState.teams;
    const scores = (session.modeState.teamScores ||= { A: 0, B: 0 });
    if (teams.A.includes(player.id)) scores.A++;
    else scores.B++;
  },

  resultsExtras(session) {
    const scores = session.modeState.teamScores || { A: 0, B: 0 };
    const names = session.modeState.teamNames || { A: 'Team A', B: 'Team B' };
    const teams = session.modeState.teams || { A: [], B: [] };
    const rosterNames = (ids) => session.players.filter((p) => ids.includes(p.id)).map((p) => p.name);
    let winner;
    if (scores.A > scores.B) winner = names.A;
    else if (scores.B > scores.A) winner = names.B;
    else winner = "It's a tie! 🤝";
    return {
      type: 'team',
      scores, names, winner,
      rosters: { A: rosterNames(teams.A), B: rosterNames(teams.B) },
    };
  },
};

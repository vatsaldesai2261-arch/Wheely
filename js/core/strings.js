// Central UI string table. English only for now; structured so a second
// language can be dropped in later without touching screen code.
const en = {
  appName: 'Yoga Adventure Wheel',
  tagline: 'Spin the wheel, strike a pose!',
  tapToBegin: 'Tap to begin',
  play: 'Play',
  start: 'Start',
  home: 'Home',
  back: 'Back',
  next: 'Next',
  done: 'Done',
  cancel: 'Cancel',
  save: 'Save',
  close: 'Close',
  howToPlay: 'How to Play',
  chooseMode: 'Choose an Adventure',
  choosePlayers: 'Who is playing?',
  spin: 'Spin the Wheel!',
  spinning: 'Spinning…',
  getReady: 'Get ready',
  holdPose: 'Hold the pose!',
  startPose: "I'm ready — start!",
  pass: 'Great job! ⭐',
  needsPractice: "Let's practice 💪",
  monitorPrompt: 'Grown-up: how did that go?',
  celebrate: 'Woohoo!',
  encourage: 'Nice try — keep going!',
  results: 'Results',
  playAgain: 'Play Again',
  pause: 'Pause',
  resume: 'Resume',
  quit: 'Quit Game',
  leaderboard: 'Leaderboard',
  achievements: 'Achievements',
  statistics: 'Statistics',
  settings: 'Settings',
  admin: 'Grown-Up Zone',
  poseLibrary: 'Pose Library',
  players: 'Players',
  wheelBuilder: 'Wheel Builder',
  backup: 'Backup & Restore',
  funFact: 'Fun Fact',
  benefits: 'Good For',
  safety: 'Safety First',
};

let current = en;

export function t(key) { return current[key] ?? key; }
export function strings() { return current; }
export default { t, strings };

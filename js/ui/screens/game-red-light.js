// Red Light, Green Light — Yoga edition. On GREEN, wiggle and flow. On RED,
// freeze into the shown pose and hold super still! Held it? Earn the pose.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { mascot } from '../components/mascot.js';
import { burst } from '../components/confetti.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn, rewardPose, endPlay } from './game-kit.js';

const ROUNDS = 8;
let state = null;
let greenT = null;

function clearT() { if (greenT) { clearTimeout(greenT); greenT = null; } }

export default {
  id: 'red-light',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🚦 Red Light, Green Light', 'On GREEN, wiggle and dance! On RED, FREEZE into the pose and hold as still as a statue. If you can freeze without wobbling, you earn the pose. A giggly game of stop-and-go.');
    await ready();
    state = { round: 0, held: 0, pool: kidPoses() };
    intro(stage);
  },
  onLeave() { clearT(); audio.stopMusic(); speech.stop(); endPlay(); state = null; },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🚦'),
    el('h2', {}, 'Red Light, Green Light'),
    el('p', {}, 'Dance on green… freeze on red!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => green(stage) }, 'Start 🟢'),
  ]));
}

function green(stage) {
  if (!state) return;
  if (state.round >= ROUNDS) return finish(stage);
  clearT();
  audio.startMusic();
  clear(stage);
  stage.append(el('div.game-panel.rl-green', {}, [
    el('div.game-progress', {}, `Round ${state.round + 1} of ${ROUNDS}`),
    el('div.rl-light.green', {}, '🟢'),
    el('div', {}, [mascot({ mood: 'cheer', size: 130 })]),
    el('h2', {}, 'GREEN — wiggle & dance! 🎶'),
  ]));
  const wait = 2200 + (Math.random() * 2600) | 0;
  greenT = setTimeout(() => red(stage), wait);
}

function red(stage) {
  if (!state) return;
  clearT();
  audio.stopMusic();
  audio.play('ding');
  state.round++;
  const pose = randOf(state.pool);
  speech.speak(`Red light! Freeze like a ${pose.english}!`, { force: true });
  clear(stage);
  stage.append(el('div.game-panel.rl-red', {}, [
    el('div.rl-light.red', {}, '🔴'),
    el('h2.freeze-title', {}, '🔴 FREEZE!'),
    figure(pose, 170),
    el('h3', {}, pose.english),
    el('p.game-hint', {}, 'Hold as still as you can!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary', { type: 'button', onClick: () => { rewardPose(pose); state.held++; audio.play('coin'); green(stage); } }, 'Held still! 🧊'),
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { audio.play('encourage'); green(stage); } }, 'We wobbled 🙈'),
    ]),
  ]));
}

function finish(stage) {
  clearT();
  clear(stage);
  const great = state.held >= ROUNDS - 2;
  if (great) burst({ count: 80, origin: { x: 0.5, y: 0.35 } });
  audio.play(great ? 'fanfare' : 'ding');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, great ? '🏆' : '🚦'),
    el('h2', {}, `You froze ${state.held} of ${ROUNDS} times!`),
    el('p', {}, great ? 'Statue superstar! 🌟' : 'Great giggles — play again!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { state.round = 0; state.held = 0; green(stage); } }, 'Play again 🔁'),
      homeBtn(),
    ]),
  ]));
}

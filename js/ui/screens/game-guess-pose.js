// Guess the Pose — a gentle learning game. See a yoga figure, pick its name
// from a few choices. Learn pose names the fun way.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { burst } from '../components/confetti.js';
import { ready, kidPoses, shuffle, randOf, figure, gameShell, homeBtn } from './game-kit.js';

const ROUNDS = 8;
let state = null;

export default {
  id: 'guess-pose',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🃏 Guess the Pose', 'Look at the yoga figure and tap its name! A fun way to learn what each pose is called. Get it right for a happy cheer.');
    await ready();
    state = { round: 0, score: 0, pool: kidPoses() };
    intro(stage);
  },
  onLeave() { speech.stop(); state = null; },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🃏'),
    el('h2', {}, 'Guess the Pose'),
    el('p', {}, 'Can you name each yoga pose?'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => nextRound(stage) }, 'Start 🎯'),
  ]));
}

function nextRound(stage) {
  if (!state) return;
  if (state.round >= ROUNDS) return finish(stage);
  state.round++;
  const answer = randOf(state.pool);
  const wrong = shuffle(state.pool.filter((p) => p.english !== answer.english)).slice(0, 2);
  const options = shuffle([answer, ...wrong]);
  clear(stage);
  audio.play('pop');
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, `Question ${state.round} of ${ROUNDS} · Score ${state.score}`),
    figure(answer, 190),
    el('p.game-hint', {}, 'What pose is this?'),
    el('div.guess-options', {}, options.map((o) => el('button.btn.btn-secondary.guess-opt', { type: 'button', onClick: (e) => pick(stage, e.currentTarget, o.english === answer.english, answer) }, o.english))),
  ]));
}

function pick(stage, btn, correct, answer) {
  const opts = stage.querySelectorAll('.guess-opt');
  opts.forEach((b) => { b.disabled = true; });
  if (correct) {
    btn.classList.add('is-right');
    state.score++;
    audio.play('coin');
    burst({ count: 30, origin: { x: 0.5, y: 0.4 } });
  } else {
    btn.classList.add('is-wrong');
    audio.play('encourage');
    opts.forEach((b) => { if (b.textContent === answer.english) b.classList.add('is-right'); });
  }
  speech.speak(answer.english, { force: false });
  setTimeout(() => nextRound(stage), 1200);
}

function finish(stage) {
  clear(stage);
  const great = state.score >= ROUNDS - 2;
  if (great) burst({ count: 80, origin: { x: 0.5, y: 0.35 } });
  audio.play(great ? 'fanfare' : 'ding');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, great ? '🏆' : '🃏'),
    el('h2', {}, `You got ${state.score} of ${ROUNDS}!`),
    el('p', {}, great ? 'Yoga name master! 🌟' : 'Nice work — play again to learn more!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { state.round = 0; state.score = 0; nextRound(stage); } }, 'Play again 🔁'),
      homeBtn(),
    ]),
  ]));
}

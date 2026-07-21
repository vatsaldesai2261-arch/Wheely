// Copycat Mirror — a visual spotting game. See the big pose, then find its exact
// twin among the little figures. Sharpens body-shape awareness. Earn the pose.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { burst } from '../components/confetti.js';
import { yogiSVG } from '../../data/yogi.js';
import { ready, kidPoses, shuffle, randOf, figure, gameShell, homeBtn, rewardPose, endPlay } from './game-kit.js';

const ROUNDS = 8;
let state = null;

export default {
  id: 'copycat',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🪞 Copycat Mirror', 'Look at the big pose at the top, then find its matching twin below and tap it! A fun way to notice how each pose looks. Strike the pose too to earn it.');
    await ready();
    state = { round: 0, score: 0, pool: kidPoses() };
    intro(stage);
  },
  onLeave() { speech.stop(); endPlay(); state = null; },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🪞'),
    el('h2', {}, 'Copycat Mirror'),
    el('p', {}, 'Find the pose that matches — then be it!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => nextRound(stage) }, 'Start 🪞'),
  ]));
}

function nextRound(stage) {
  if (!state) return;
  if (state.round >= ROUNDS) return finish(stage);
  state.round++;
  const target = randOf(state.pool);
  const decoys = shuffle(state.pool.filter((p) => p.english !== target.english)).slice(0, 3);
  const options = shuffle([target, ...decoys]);
  clear(stage);
  audio.play('pop');
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, `Round ${state.round} of ${ROUNDS} · Score ${state.score}`),
    figure(target, 170),
    el('p.game-hint', {}, 'Which little yogi matches?'),
    el('div.copycat-options', {}, options.map((o) => el('button.copycat-opt', { type: 'button', html: yogiSVG(o, { size: 90 }), onClick: (e) => pick(stage, e.currentTarget, o.english === target.english, target) }))),
  ]));
}

function pick(stage, btn, correct, target) {
  const opts = stage.querySelectorAll('.copycat-opt');
  opts.forEach((b) => { b.disabled = true; });
  if (correct) {
    btn.classList.add('is-right');
    state.score++;
    rewardPose(target);
    burst({ count: 26, origin: { x: 0.5, y: 0.4 } });
    speech.speak(`Yes! ${target.english}!`, { force: true });
  } else {
    btn.classList.add('is-wrong');
    audio.play('encourage');
  }
  setTimeout(() => nextRound(stage), 1100);
}

function finish(stage) {
  clear(stage);
  const great = state.score >= ROUNDS - 2;
  if (great) burst({ count: 80, origin: { x: 0.5, y: 0.35 } });
  audio.play(great ? 'fanfare' : 'ding');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, great ? '🏆' : '🪞'),
    el('h2', {}, `You matched ${state.score} of ${ROUNDS}!`),
    el('p', {}, great ? 'Eagle eyes! 🦅' : 'Nice spotting — play again!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { state.round = 0; state.score = 0; nextRound(stage); } }, 'Play again 🔁'),
      homeBtn(),
    ]),
  ]));
}

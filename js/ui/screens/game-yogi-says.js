// Yogi Says — a Simon-Says listening game with yoga poses. The app calls out a
// pose; strike it only when "Yogi says". Sometimes it's a trick — stay still!
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { burst } from '../components/confetti.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn } from './game-kit.js';

const ROUNDS = 8;
let state = null;

export default {
  id: 'yogi-says',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🙊 Yogi Says', 'Listen carefully! When you hear "Yogi says", strike the pose. If Yogi did NOT say it, it\'s a trick — stay super still! Great for listening and body control.');
    await ready();
    state = { round: 0, score: 0, poses: kidPoses() };
    intro(stage);
  },
  onLeave() { speech.stop(); state = null; },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🙊'),
    el('h2', {}, 'Yogi Says!'),
    el('p', {}, 'I\'ll call out a pose. Only do it if I say "Yogi says"!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => nextRound(stage) }, 'Start 🎬'),
  ]));
}

function nextRound(stage) {
  if (!state) return;
  if (state.round >= ROUNDS) return finish(stage);
  state.round++;
  const pose = randOf(state.poses);
  const yogiSays = Math.random() > 0.32; // ~68% real commands
  clear(stage);
  audio.play(yogiSays ? 'go' : 'pop');
  const call = yogiSays ? `Yogi says: be a ${pose.english}!` : `Be a ${pose.english}!`;
  speech.speak(call, { force: true });
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, `Round ${state.round} of ${ROUNDS}`),
    figure(pose, 180),
    el('h2.ys-call', { class: yogiSays ? 'is-say' : 'is-trick' }, call),
    el('p.game-hint', {}, 'Did you do the right thing?'),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary', { type: 'button', onClick: () => judge(stage, yogiSays, true) }, 'We did the pose! ✅'),
      el('button.btn.btn-secondary', { type: 'button', onClick: () => judge(stage, yogiSays, false) }, 'We stayed still 🧊'),
    ]),
  ]));
}

function judge(stage, yogiSays, didIt) {
  const correct = yogiSays === didIt;
  if (correct) { state.score++; audio.play('coin'); }
  else audio.play('encourage');
  const banner = el('div.ys-feedback', { class: correct ? 'ok' : 'no' }, correct ? '⭐ Nice listening!' : (yogiSays ? 'Yogi DID say — that one was real!' : 'Trick! Yogi didn\'t say that one.'));
  const existing = stage.querySelector('.game-actions');
  if (existing) clear(existing);
  stage.append(banner);
  setTimeout(() => nextRound(stage), 1100);
}

function finish(stage) {
  clear(stage);
  const great = state.score >= ROUNDS - 2;
  if (great) burst({ count: 80, origin: { x: 0.5, y: 0.35 } });
  audio.play(great ? 'fanfare' : 'ding');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, great ? '🏆' : '🙊'),
    el('h2', {}, `You caught ${state.score} of ${ROUNDS}!`),
    el('p', {}, great ? 'Amazing listening, little yogi!' : 'Good try — play again to catch even more!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { state.round = 0; state.score = 0; nextRound(stage); } }, 'Play again 🔁'),
      homeBtn(),
    ]),
  ]));
}

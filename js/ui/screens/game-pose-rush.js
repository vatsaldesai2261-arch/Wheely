// Pose Rush — beat the clock! Do as many poses as you can in 60 seconds.
// Each pose earns XP; the timer keeps the energy high.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { burst } from '../components/confetti.js';
import { createTimer } from '../../game/timer.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn, rewardPose, endPlay } from './game-kit.js';

const SECONDS = 60;
let timer = null;
let pool = [];

export default {
  id: 'pose-rush',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '⏱️ Pose Rush', 'How many poses can you strike before the timer runs out? Do the pose, tap "Done!", and the next one appears. Fast, fun, and great for a burst of energy!');
    await ready();
    pool = kidPoses();
    intro(stage);
  },
  onLeave() { if (timer) { timer.cancel(); timer = null; } speech.stop(); endPlay(); },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '⏱️'),
    el('h2', {}, 'Pose Rush'),
    el('p', {}, `Do as many poses as you can in ${SECONDS} seconds!`),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => play(stage) }, 'Go! 🏁'),
  ]));
}

function play(stage) {
  let done = 0;
  const clock = el('div.rush-clock', {}, `${SECONDS}s`);
  const figWrap = el('div.rush-figure');
  const name = el('h2');
  const countEl = el('div.game-progress', {}, 'Poses: 0');
  const nextPose = () => {
    const p = randOf(pool);
    figWrap.replaceChildren(figure(p, 180));
    name.textContent = p.english;
    audio.play('pop');
    return p;
  };
  let current = null;
  const doneBtn = el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => {
    if (!timer || !timer.running) return;
    rewardPose(current);
    done++; countEl.textContent = `Poses: ${done}`;
    current = nextPose();
  } }, 'Done! ✅');
  clear(stage);
  stage.append(el('div.game-panel', {}, [clock, countEl, figWrap, name, doneBtn]));
  current = nextPose();
  audio.play('go');
  timer = createTimer({ seconds: SECONDS, onTick: (n) => { clock.textContent = `${n}s`; if (n <= 5) clock.classList.add('low'); }, onDone: () => finish(stage, done) });
  timer.start();
}

function finish(stage, done) {
  if (timer) { timer.cancel(); timer = null; }
  clear(stage);
  audio.play('fanfare');
  burst({ count: 90, origin: { x: 0.5, y: 0.35 } });
  speech.speak(`Time! You did ${done} poses. Awesome!`, { force: true });
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🏁'),
    el('h2', {}, `You did ${done} poses!`),
    el('p', {}, 'Phew — what a rush! 💨'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => play(stage) }, 'Rush again 🔁'),
      homeBtn(),
    ]),
  ]));
}

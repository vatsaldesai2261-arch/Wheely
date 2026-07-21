// Pose Memory — watch a growing sequence of poses, then copy it back in order.
// One more pose is added each round. Builds focus and body memory.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import settings from '../../core/settings.js';
import { burst } from '../components/confetti.js';
import { ready, kidPoses, shuffle, figure, gameShell, homeBtn, rewardFlat, endPlay } from './game-kit.js';

let state = null;

export default {
  id: 'pose-memory',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🧠 Pose Memory', 'Watch the poses light up one by one, then copy them in the same order! Each round adds one more pose. How long a sequence can you remember?');
    await ready();
    state = { seq: [], pool: shuffle(kidPoses()), round: 0 };
    intro(stage);
  },
  onLeave() { endPlay(); speech.stop(); state = null; },
};

function best() { return Number(settings.getSetting('memoryBest')) || 0; }

function intro(stage) {
  clear(stage);
  const b = best();
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🧠'),
    el('h2', {}, 'Pose Memory'),
    el('p', {}, 'Watch the sequence, then copy it in order!'),
    b ? el('p.game-hint', {}, `⭐ Best so far: ${b} poses`) : null,
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => nextRound(stage) }, 'Start 🧩'),
  ]));
}

function nextRound(stage) {
  if (!state) return;
  // add one pose to the sequence
  const next = state.pool[state.seq.length % state.pool.length];
  state.seq.push(next);
  showSequence(stage, 0);
}

async function showSequence(stage, i) {
  if (!state) return;
  clear(stage);
  if (i >= state.seq.length) return promptCopy(stage);
  const pose = state.seq[i];
  audio.play('pop');
  speech.speak(pose.english, { force: false });
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, `Watch! ${i + 1} / ${state.seq.length}`),
    figure(pose, 190),
    el('h2', {}, pose.english),
  ]));
  setTimeout(() => showSequence(stage, i + 1), 1500);
}

function promptCopy(stage) {
  clear(stage);
  audio.play('select');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🤸'),
    el('h2', {}, `Now copy all ${state.seq.length}!`),
    el('p', {}, 'Strike each pose in the same order.'),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary', { type: 'button', onClick: () => won(stage) }, 'We did it! ⭐'),
      el('button.btn.btn-ghost', { type: 'button', onClick: () => showSequence(stage, 0) }, 'Show again 👀'),
      el('button.btn.btn-secondary', { type: 'button', onClick: () => end(stage) }, 'Oops, all done 🙈'),
    ]),
  ]));
}

function won(stage) {
  const len = state.seq.length;
  if (len > best()) settings.setSetting('memoryBest', len);
  audio.play('levelup');
  rewardFlat(len * 3, len); // longer remembered sequence → bigger reward
  burst({ count: 40, origin: { x: 0.5, y: 0.4 } });
  nextRound(stage);
}

function end(stage) {
  const len = state.seq.length - 1;
  clear(stage);
  audio.play('ding');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🧠'),
    el('h2', {}, len > 0 ? `You remembered ${len} in a row!` : 'Good try!'),
    el('p', {}, `⭐ Best: ${best()} poses`),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { state.seq = []; state.pool = shuffle(state.pool); nextRound(stage); } }, 'Play again 🔁'),
      homeBtn(),
    ]),
  ]));
}

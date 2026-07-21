// Yoga Bingo — a 3×3 card of poses. Tap a square, do that pose, and mark it.
// Complete a line (row, column or diagonal) to score BINGO and a bonus!
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { burst } from '../components/confetti.js';
import { yogiSVG } from '../../data/yogi.js';
import { ready, kidPoses, shuffle, figure, gameShell, homeBtn, rewardPose, rewardFlat, endPlay } from './game-kit.js';

const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let state = null;

export default {
  id: 'yoga-bingo',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🅱️ Yoga Bingo', 'Tap a square, strike that pose, then mark it off. Fill a whole row, column or diagonal to shout BINGO and win a bonus! Fill the whole card for a super prize.');
    await ready();
    intro(stage);
  },
  onLeave() { speech.stop(); endPlay(); state = null; },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🅱️'),
    el('h2', {}, 'Yoga Bingo'),
    el('p', {}, 'Do the poses and fill a line to win!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => deal(stage) }, 'New card 🅱️'),
  ]));
}

function deal(stage) {
  const cells = shuffle(kidPoses()).slice(0, 9);
  state = { cells, done: new Array(9).fill(false), lines: new Set() };
  renderCard(stage);
}

function renderCard(stage) {
  clear(stage);
  const grid = el('div.bingo-grid');
  state.cells.forEach((p, i) => {
    const cell = el('button.bingo-cell' + (state.done[i] ? '.is-done' : ''), { type: 'button', onClick: () => doPose(stage, i) }, [
      el('div.bingo-fig', { html: yogiSVG(p, { size: 72 }) }),
      el('span.bingo-name', {}, p.english),
      state.done[i] ? el('span.bingo-stamp', {}, '⭐') : null,
    ]);
    grid.append(cell);
  });
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, `Marked ${state.done.filter(Boolean).length} of 9`),
    grid,
  ]));
}

function doPose(stage, i) {
  if (!state || state.done[i]) return;
  const p = state.cells[i];
  audio.play('pop');
  speech.speak(`Be a ${p.english}!`, { force: true });
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    figure(p, 200),
    el('h2', {}, p.english),
    el('p.flow-cue', {}, p.description || 'Strike the pose, then mark it off!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { rewardPose(p); mark(stage, i); } }, 'Did it! ⭐'),
      el('button.btn.btn-ghost', { type: 'button', onClick: () => renderCard(stage) }, '← Back to card'),
    ]),
  ]));
}

function mark(stage, i) {
  state.done[i] = true;
  // check for any newly-completed line
  let newLine = false;
  LINES.forEach((ln, idx) => { if (!state.lines.has(idx) && ln.every((n) => state.done[n])) { state.lines.add(idx); newLine = true; } });
  if (state.done.every(Boolean)) return fullHouse(stage);
  if (newLine) {
    audio.play('levelup');
    rewardFlat(15, 5);
    burst({ count: 70, origin: { x: 0.5, y: 0.4 } });
    speech.speak('Bingo!', { force: true });
  }
  renderCard(stage);
}

function fullHouse(stage) {
  audio.play('fanfare');
  rewardFlat(25, 8);
  burst({ count: 120, origin: { x: 0.5, y: 0.35 } });
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🏆'),
    el('h2', {}, 'FULL CARD BINGO!'),
    el('p', {}, 'You did every pose on the card. Superstar yogi! 🌟'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => deal(stage) }, 'New card 🔁'),
      homeBtn(),
    ]),
  ]));
}

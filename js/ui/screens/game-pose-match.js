// Match the Pose — a memory-pairs card game. Flip cards to find matching yoga
// figures. Clear the board to win. Classic kids memory fun, yoga themed.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import { burst } from '../components/confetti.js';
import { yogiSVG } from '../../data/yogi.js';
import { ready, kidPoses, shuffle, gameShell, homeBtn, rewardPose, rewardFlat, endPlay } from './game-kit.js';

const PAIRS = 6;
let board = null;
let flipTimer = null;

export default {
  id: 'pose-match',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🃏 Match the Pose', 'Flip two cards to find matching poses. Remember where they are and match all the pairs! Great for memory and pose spotting.');
    await ready();
    intro(stage);
  },
  onLeave() { if (flipTimer) { clearTimeout(flipTimer); flipTimer = null; } endPlay(); board = null; },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🃏'),
    el('h2', {}, 'Match the Pose'),
    el('p', {}, 'Find all the matching pose pairs!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => deal(stage) }, 'Deal 🃏'),
  ]));
}

function deal(stage) {
  const picks = shuffle(kidPoses()).slice(0, PAIRS);
  const cards = shuffle(picks.flatMap((p) => [{ p, key: p.id + 'a' }, { p, key: p.id + 'b' }]));
  board = { cards, first: null, matched: 0, moves: 0, busy: false };
  clear(stage);
  const grid = el('div.match-grid');
  cards.forEach((c) => {
    const inner = el('div.match-inner', {}, [
      el('div.match-back', {}, '🧘'),
      el('div.match-front', { html: yogiSVG(c.p, { size: 88 }) }),
    ]);
    const card = el('button.match-card', { type: 'button', dataset: { id: c.p.id }, onClick: () => flip(stage, card, c) }, [inner]);
    c.el = card;
    grid.append(card);
  });
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress.match-moves', {}, 'Moves: 0'),
    grid,
  ]));
}

function flip(stage, card, c) {
  if (!board || board.busy || card.classList.contains('is-up') || card.classList.contains('is-done')) return;
  card.classList.add('is-up');
  audio.play('tap');
  if (!board.first) { board.first = { card, c }; return; }
  board.moves++;
  stage.querySelector('.match-moves').textContent = `Moves: ${board.moves}`;
  const a = board.first; board.first = null;
  if (a.c.p.id === c.p.id) {
    a.card.classList.add('is-done'); card.classList.add('is-done');
    board.matched++;
    rewardPose(c.p); // found the pair → earn the pose
    if (board.matched === PAIRS) return win(stage);
  } else {
    board.busy = true;
    audio.play('pop');
    flipTimer = setTimeout(() => { a.card.classList.remove('is-up'); card.classList.remove('is-up'); board.busy = false; flipTimer = null; }, 900);
  }
}

function win(stage) {
  audio.play('fanfare');
  rewardFlat(10, 3); // clear-the-board bonus
  burst({ count: 100, origin: { x: 0.5, y: 0.35 } });
  const moves = board.moves;
  setTimeout(() => {
    clear(stage);
    stage.append(el('div.game-panel', {}, [
      el('div.game-emoji', {}, '🏆'),
      el('h2', {}, 'You matched them all!'),
      el('p', {}, `Done in ${moves} moves. Super memory!`),
      el('div.game-actions', {}, [
        el('button.btn.btn-secondary', { type: 'button', onClick: () => deal(stage) }, 'Play again 🔁'),
        homeBtn(),
      ]),
    ]));
  }, 700);
}

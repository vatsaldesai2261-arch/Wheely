// Balance Statue — hold a balance pose as long as you can. A stopwatch counts
// up; try to beat your best time. Wobble? Tap stop. Builds focus and steadiness.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import settings from '../../core/settings.js';
import { burst } from '../components/confetti.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn, rewardPose, endPlay } from './game-kit.js';

let ticker = null;
let poses = [];

function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

export default {
  id: 'balance-statue',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🦩 Balance Statue', 'Strike the balance pose and hold as still as a statue! The timer counts up — try to beat your best time. Wobble or put your foot down? Tap Stop. Great for focus and balance.');
    await ready();
    poses = kidPoses({ categories: ['balance'] });
    intro(stage);
  },
  onLeave() { stopTicker(); speech.stop(); endPlay(); },
};

function best() { return Number(settings.getSetting('statueBest')) || 0; }

function intro(stage) {
  clear(stage);
  const b = best();
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🦩'),
    el('h2', {}, 'Balance Statue'),
    el('p', {}, 'Hold the pose as long as you can!'),
    b ? el('p.game-hint', {}, `⭐ Best: ${b}s`) : null,
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => play(stage, randOf(poses)) }, 'Pick a pose 🎯'),
  ]));
}

function play(stage, pose) {
  stopTicker();
  clear(stage);
  audio.play('go');
  speech.speak(`Balance like a ${pose.english}. Hold as still as you can!`, { force: true });
  const clock = el('div.statue-clock', {}, '0.0s');
  let start = performance.now();
  stage.append(el('div.game-panel', {}, [
    figure(pose, 190),
    el('h2', {}, pose.english),
    clock,
    el('div.game-actions', {}, [
      el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => stop(stage, pose, (performance.now() - start) / 1000) }, 'Wobbled! 🛑'),
    ]),
  ]));
  ticker = setInterval(() => { clock.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's'; audio.play('tick'); }, 1000);
}

function stop(stage, pose, secs) {
  stopTicker();
  const s = Math.floor(secs);
  const record = s > best();
  if (record) settings.setSetting('statueBest', s);
  rewardPose(pose, { multiplier: Math.min(3, 0.5 + s / 10) }); // longer hold → more XP
  audio.play(record ? 'fanfare' : 'ding');
  if (record) burst({ count: 90, origin: { x: 0.5, y: 0.35 } });
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, record ? '🏆' : '🦩'),
    el('h2', {}, `You held it ${s} second${s === 1 ? '' : 's'}!`),
    el('p', {}, record ? 'A brand-new record! 🌟' : `⭐ Best: ${best()}s`),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary', { type: 'button', onClick: () => play(stage, randOf(poses)) }, 'New pose 🎯'),
      el('button.btn.btn-secondary', { type: 'button', onClick: () => play(stage, pose) }, 'Try again 🔁'),
      homeBtn(),
    ]),
  ]));
}

// Freeze Dance — dance to the music, then FREEZE into the pose when it stops.
// A looping movement game. No wheel, no scoring pressure — just fun.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { mascot } from '../components/mascot.js';
import { createTimer } from '../../game/timer.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn } from './game-kit.js';

let alive = false;
let danceT = null;
let holdTimer = null;

function clearTimers() { if (danceT) { clearTimeout(danceT); danceT = null; } if (holdTimer) { holdTimer.cancel(); holdTimer = null; } }

export default {
  id: 'freeze-dance',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🕺 Freeze Dance', 'Dance and wiggle while the music plays. When the music stops — FREEZE into the pose on screen and hold it! Then dance again. A super-fun way to move and giggle.');
    await ready();
    alive = true;
    intro(stage, kidPoses());
  },
  onLeave() { alive = false; clearTimers(); audio.stopMusic(); speech.stop(); },
};

function intro(stage, poses) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🕺'),
    el('h2', {}, 'Freeze Dance!'),
    el('p', {}, 'Dance to the music… then FREEZE into the pose!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => dance(stage, poses, 1) }, 'Let\'s dance! 🎶'),
  ]));
}

function dance(stage, poses, round) {
  if (!alive) return;
  clearTimers();
  audio.startMusic();
  clear(stage);
  stage.append(el('div.game-panel.dance-panel', {}, [
    el('div.game-progress', {}, `Round ${round}`),
    el('div.dance-mascot', {}, [mascot({ mood: 'cheer', size: 140 })]),
    el('h2', {}, '🎶 Dance & wiggle! 🎶'),
    el('p.game-hint', {}, 'Get ready to freeze…'),
    el('button.btn.btn-ghost', { type: 'button', onClick: () => freeze(stage, poses, round) }, 'Freeze now! ⏸'),
  ]));
  const wait = 2600 + (Math.random() * 2600) | 0; // 2.6–5.2s of dancing
  danceT = setTimeout(() => freeze(stage, poses, round), wait);
}

function freeze(stage, poses, round) {
  if (!alive) return;
  clearTimers();
  audio.stopMusic();
  audio.play('ding');
  const pose = randOf(poses);
  speech.speak(`Freeze! Be a ${pose.english}!`, { force: true });
  clear(stage);
  const ring = el('div.timer-ring.freeze-ring');
  const num = el('div.timer-num', {}, '6');
  ring.append(num);
  stage.append(el('div.game-panel', {}, [
    el('h2.freeze-title', {}, '🥶 FREEZE!'),
    figure(pose, 170),
    el('h3', {}, pose.english),
    ring,
    el('button.btn.btn-secondary', { type: 'button', onClick: () => dance(stage, poses, round + 1) }, 'Dance again 🎶'),
  ]));
  holdTimer = createTimer({ seconds: 6, onTick: (n) => { num.textContent = String(n); ring.style.setProperty('--pct', String((6 - n) / 6)); }, onDone: () => { if (alive) { audio.play('cheer'); dance(stage, poses, round + 1); } } });
  holdTimer.start();
  // Home/Done option in the header already exists; add an end button too.
  stage.append(el('div.game-actions', {}, [homeBtn('Stop 🏠')]));
}

// Calm Down — a gentle guided-breathing activity to relax. Core to kids' yoga.
import { el, clear } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { breathe } from '../components/breathing.js';
import { backHeader } from './leaderboard.js';

export default {
  id: 'calm',
  needsLandscape: false,
  mount(container) {
    const stage = el('div.calm-stage');
    const view = el('div.subscreen', {}, [
      backHeader('😌 Calm Down', { text: 'A quiet, cozy moment to relax. Follow the growing and shrinking circle: breathe in as it grows, breathe out as it shrinks. Great for the end of a session or any time you feel wiggly!' }),
      stage,
    ]);
    container.append(view);
    start(stage);
  },
};

async function start(stage) {
  clear(stage);
  stage.append(el('div.calm-intro', {}, [
    el('div.calm-emoji', {}, '🌸'),
    el('h2', {}, 'Let\'s breathe together'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => run(stage) }, 'Start breathing'),
  ]));
}

async function run(stage) {
  clear(stage);
  audio.play('select');
  speech.speak('Let us breathe together. Breathe in slowly, and breathe out.', { force: false });
  await breathe(stage, { breaths: 5 });
  clear(stage);
  stage.append(el('div.calm-intro', {}, [
    el('div.calm-emoji', {}, '🧘'),
    el('h2', {}, 'Aaah… all calm!'),
    el('p', {}, 'Great job relaxing your body and mind.'),
    el('div.calm-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => run(stage) }, 'Again'),
      el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => router.go('home') }, 'Done 🌟'),
    ]),
  ]));
}

// Breathing Games — a menu of fun guided breaths for kids. Each runs the shared
// breathing animation with its own pace and a playful prompt.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { breathe } from '../components/breathing.js';
import { gameShell, homeBtn, rewardFlat, endPlay } from './game-kit.js';

const BREATHS = [
  { emoji: '🎈', name: 'Balloon Breath', say: 'Breathe in and fill your tummy like a big balloon. Then let it all go.', breaths: 5, inhale: 4000, exhale: 4200 },
  { emoji: '🐝', name: 'Bumblebee Breath', say: 'Breathe in, then hum like a buzzy bee as you breathe out. Bzzzz!', breaths: 5, inhale: 3000, exhale: 4500 },
  { emoji: '🐰', name: 'Bunny Breath', say: 'Take three quick bunny sniffs in, then one big breath out.', breaths: 6, inhale: 2200, exhale: 3000 },
  { emoji: '⭐', name: 'Star Breath', say: 'Trace a star with your breath. Breathe in up, breathe out down.', breaths: 5, inhale: 3600, exhale: 3600 },
  { emoji: '🐍', name: 'Snake Breath', say: 'Breathe in through your nose, then hiss like a snake. Ssssss!', breaths: 5, inhale: 3000, exhale: 5000 },
];

export default {
  id: 'breathing',
  needsLandscape: false,
  mount(container) {
    const stage = gameShell(container, '🌬️ Breathing Games', 'Pick a fun breathing game! Follow the growing circle — breathe in as it grows, breathe out as it shrinks. A calm, happy way to relax the body and mind.');
    menu(stage);
  },
  onLeave() { endPlay(); speech.stop(); },
};

function menu(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('h2', {}, 'Choose a breath 🌬️'),
    el('div.breath-menu', {}, BREATHS.map((b) => el('button.breath-card.glass', { type: 'button', onClick: () => run(stage, b) }, [
      el('span.breath-emoji', {}, b.emoji),
      el('span.breath-name', {}, b.name),
    ]))),
    homeBtn(),
  ]));
}

async function run(stage, b) {
  clear(stage);
  audio.play('select');
  speech.speak(b.say, { force: true });
  stage.append(el('div.game-panel', {}, [el('div.game-emoji', {}, b.emoji), el('h2', {}, b.name)]));
  await breathe(stage, { breaths: b.breaths, inhale: b.inhale, exhale: b.exhale });
  clear(stage);
  rewardFlat(5, 1); // calm, focused breathing earns a gentle reward
  audio.play('ding');
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '😌'),
    el('h2', {}, 'Aaah… all calm!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => run(stage, b) }, 'Again 🔁'),
      el('button.btn.btn-primary', { type: 'button', onClick: () => menu(stage) }, 'Pick another 🌬️'),
      homeBtn(),
    ]),
  ]));
}

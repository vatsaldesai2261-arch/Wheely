// Pose Dice — tap to roll a pose to try. A quick, no-wheel randomizer: the dice
// shuffles through poses and lands on one for you to strike.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn } from './game-kit.js';

let rolling = null;
let pool = [];

export default {
  id: 'pose-dice',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '🎲 Pose Dice', 'Tap to roll the dice and get a surprise pose to try! Hold it, then roll again. A quick, fun way to practise lots of poses.');
    await ready();
    pool = kidPoses();
    intro(stage);
  },
  onLeave() { if (rolling) { clearInterval(rolling); rolling = null; } speech.stop(); },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji.dice-emoji', {}, '🎲'),
    el('h2', {}, 'Pose Dice'),
    el('p', {}, 'Roll the dice for a surprise pose!'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => roll(stage) }, 'Roll! 🎲'),
  ]));
}

function roll(stage) {
  if (rolling) return;
  clear(stage);
  const fig = el('div.dice-figure', { html: '' });
  const name = el('h2', {}, '🎲 …');
  stage.append(el('div.game-panel', {}, [fig, name]));
  audio.play('whoosh');
  let ticks = 0;
  const total = 12 + ((Math.random() * 6) | 0);
  rolling = setInterval(() => {
    const p = randOf(pool);
    fig.replaceChildren(figure(p, 170));
    name.textContent = p.english;
    audio.play('tick');
    if (++ticks >= total) {
      clearInterval(rolling); rolling = null;
      land(stage, randOf(pool));
    }
  }, 90);
}

function land(stage, pose) {
  clear(stage);
  audio.play('ding');
  speech.speak(`You rolled ${pose.english}! Give it a try.`, { force: true });
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, '🎲 You rolled…'),
    figure(pose, 200),
    el('h2', {}, pose.english),
    el('p.flow-cue', {}, pose.description || 'Give this pose a try!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => roll(stage) }, 'Roll again 🎲'),
      homeBtn(),
    ]),
  ]));
}

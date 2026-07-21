// Feelings Yoga — a gentle mindfulness game. Pick how you feel, and get a
// matching pose and a kind message. Helps kids notice and settle big feelings.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { ready, kidPoses, randOf, figure, gameShell, homeBtn, rewardPose, endPlay } from './game-kit.js';

const FEELINGS = [
  { emoji: '😊', name: 'Happy', cats: ['animal-play', 'balance'], msg: 'Yay! Let\'s bounce that happy energy into a fun pose!' },
  { emoji: '⚡', name: 'Wiggly', cats: ['balance', 'standing'], msg: 'Lots of wiggles? Let\'s balance and find our calm and steady.' },
  { emoji: '😴', name: 'Sleepy', cats: ['warmup-fun', 'standing'], msg: 'A little sleepy? Let\'s gently wake up our body.' },
  { emoji: '😢', name: 'Sad', cats: ['backbend'], msg: 'It\'s okay to feel sad. Let\'s open our heart big and brave.' },
  { emoji: '😠', name: 'Grumpy', cats: ['restorative', 'forward-fold'], msg: 'Feeling grumpy? Let\'s breathe and melt it away with a cozy pose.' },
];

export default {
  id: 'feelings-yoga',
  needsLandscape: false,
  async mount(container) {
    const stage = gameShell(container, '😊 Feelings Yoga', 'How are you feeling right now? Pick a feeling and get a friendly pose to try, with a kind message. A gentle way to notice feelings and feel better.');
    await ready();
    menu(stage);
  },
  onLeave() { endPlay(); speech.stop(); },
};

function menu(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('h2', {}, 'How do you feel? 💛'),
    el('div.feelings-grid', {}, FEELINGS.map((f) => el('button.feeling-card.glass', { type: 'button', onClick: () => choose(stage, f) }, [
      el('span.feeling-emoji', {}, f.emoji),
      el('span.feeling-name', {}, f.name),
    ]))),
    homeBtn(),
  ]));
}

function choose(stage, f) {
  const pose = randOf(kidPoses({ categories: f.cats }));
  clear(stage);
  audio.play('select');
  speech.speak(`${f.msg} Try to be a ${pose.english}.`, { force: true });
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, f.emoji),
    el('h2', {}, `Feeling ${f.name.toLowerCase()}?`),
    el('p.flow-cue', {}, f.msg),
    figure(pose, 190),
    el('h3', {}, `Try: ${pose.english}`),
    el('div.game-actions', {}, [
      el('button.btn.btn-primary', { type: 'button', onClick: (e) => { rewardPose(pose); e.currentTarget.disabled = true; e.currentTarget.textContent = 'Well done! ⭐'; } }, 'I tried it! ⭐'),
      el('button.btn.btn-secondary', { type: 'button', onClick: () => menu(stage) }, '← Another feeling'),
      homeBtn(),
    ]),
  ]));
}

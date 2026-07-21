// Tutorial — a friendly, swipeable how-to-play walkthrough.
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import settings from '../../core/settings.js';
import { backHeader } from './leaderboard.js';

const STEPS = [
  { icon: '🎡', title: 'Spin the Wheel', text: 'Tap to spin the big colorful wheel. It picks a surprise yoga pose just for you!' },
  { icon: '🧘', title: 'Strike the Pose', text: 'A pose card shows you how. Read it, or tap the 🔊 speaker to hear it out loud!' },
  { icon: '⏱️', title: 'Hold It!', text: 'A timer counts down while you hold the pose. Wobbling is part of the fun!' },
  { icon: '⭐', title: 'Grown-Up Checks', text: 'A grown-up taps ⭐ Great Job or 💪 Practice. You earn XP and coins either way!' },
  { icon: '🏆', title: 'Level Up', text: 'Earn XP to climb from White Belt all the way to Black Belt. Collect badges too!' },
];
let idx = 0;

export default {
  id: 'tutorial',
  mount(container) {
    idx = 0;
    const view = el('div.subscreen', {}, [
      backHeader('📖 How to Play'),
      el('div.tutorial-card.glass', { id: 'tut-card' }),
      el('div.tutorial-nav', {}, [
        el('button.btn.btn-secondary', { id: 'tut-prev', type: 'button', onClick: () => step(-1) }, '←'),
        el('div.tut-dots', { id: 'tut-dots' }),
        el('button.btn.btn-primary', { id: 'tut-next', type: 'button', onClick: () => step(1) }, 'Next →'),
      ]),
    ]);
    container.append(view);
    paint();
    settings.setSetting('tutorialSeen', true);
  },
};

function step(d) {
  audio.play('tap');
  const next = idx + d;
  if (next < 0) return;
  if (next >= STEPS.length) { router.go('setup'); return; }
  idx = next; paint();
}

function paint() {
  const s = STEPS[idx];
  const card = document.getElementById('tut-card');
  card.innerHTML = '';
  card.append(el('div.tut-icon', {}, s.icon), el('h2', {}, s.title), el('p', {}, s.text));
  const dots = document.getElementById('tut-dots');
  dots.innerHTML = '';
  STEPS.forEach((_, i) => dots.append(el('span.dot', { class: i === idx ? 'dot on' : 'dot' })));
  document.getElementById('tut-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';
  document.getElementById('tut-next').textContent = idx === STEPS.length - 1 ? "Let's Play! 🎡" : 'Next →';
}

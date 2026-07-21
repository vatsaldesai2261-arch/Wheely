// Sun Salutation — a guided, step-by-step follow-along flow. No scoring, just
// move together through a gentle sequence with a big figure and friendly cues.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import { burst } from '../components/confetti.js';
import { figure, gameShell, homeBtn, rewardPose, endPlay } from './game-kit.js';

// Synthetic poses ({shape,english}) drive the yogi figure directly.
const FLOW = [
  { shape: 'mountain', english: 'Mountain', emoji: '🏔️', cue: 'Stand tall and still like a big mountain. Take a slow breath in.' },
  { shape: 'standingBack', english: 'Reach Up', emoji: '🙌', cue: 'Reach your arms up high to the sun!' },
  { shape: 'standingFold', english: 'Forward Fold', emoji: '🙇', cue: 'Fold down and say hello to your toes.' },
  { shape: 'lunge', english: 'Low Lunge', emoji: '🦵', cue: 'Step one foot way back into a big lunge.' },
  { shape: 'plank', english: 'Plank', emoji: '💪', cue: 'Make your body strong and straight like a plank.' },
  { shape: 'cobra', english: 'Cobra', emoji: '🐍', cue: 'Lift your chest and hiss like a cobra. Ssss!' },
  { shape: 'downDog', english: 'Down Dog', emoji: '🐶', cue: 'Push up into an upside-down V. Wag your tail!' },
  { shape: 'standingFold', english: 'Forward Fold', emoji: '🙇', cue: 'Step your feet up and fold down again.' },
  { shape: 'mountain', english: 'Mountain', emoji: '🏔️', cue: 'Rise up tall. Breathe in… and say Namaste. 🙏' },
];

let i = 0;

export default {
  id: 'sun-flow',
  needsLandscape: false,
  mount(container) {
    const stage = gameShell(container, '☀️ Sun Salutation', 'A gentle flow to do together, one pose at a time. Follow the figure and the words, then tap Next when you\'re ready. A lovely warm-up or wind-down.');
    i = 0;
    intro(stage);
  },
  onLeave() { endPlay(); speech.stop(); },
};

function intro(stage) {
  clear(stage);
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '☀️'),
    el('h2', {}, 'Sun Salutation'),
    el('p', {}, 'Let\'s flow through the sun sequence together, one pose at a time.'),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => step(stage, 0) }, 'Begin ☀️'),
  ]));
}

function step(stage, idx) {
  i = idx;
  if (idx >= FLOW.length) return finish(stage);
  const s = FLOW[idx];
  clear(stage);
  audio.play('pop');
  speech.speak(`${s.english}. ${s.cue}`, { force: true });
  const dots = el('div.flow-dots', {}, FLOW.map((_, n) => el('span.flow-dot' + (n === idx ? '.on' : (n < idx ? '.done' : '')))));
  stage.append(el('div.game-panel', {}, [
    el('div.game-progress', {}, `Pose ${idx + 1} of ${FLOW.length}`),
    figure(s, 200),
    el('h2', {}, `${s.emoji} ${s.english}`),
    el('p.flow-cue', {}, s.cue),
    dots,
    el('div.game-actions', {}, [
      idx > 0 ? el('button.btn.btn-ghost', { type: 'button', onClick: () => step(stage, idx - 1) }, '← Back') : null,
      el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { rewardPose(s); step(stage, idx + 1); } }, idx === FLOW.length - 1 ? 'Finish 🙏' : 'Next →'),
    ]),
  ]));
}

function finish(stage) {
  clear(stage);
  audio.play('fanfare');
  burst({ count: 70, origin: { x: 0.5, y: 0.35 } });
  speech.speak('Beautiful flowing! Namaste.', { force: true });
  stage.append(el('div.game-panel', {}, [
    el('div.game-emoji', {}, '🙏'),
    el('h2', {}, 'Namaste!'),
    el('p', {}, 'You flowed through the whole sun sequence. Wonderful!'),
    el('div.game-actions', {}, [
      el('button.btn.btn-secondary', { type: 'button', onClick: () => step(stage, 0) }, 'Flow again ☀️'),
      homeBtn(),
    ]),
  ]));
}

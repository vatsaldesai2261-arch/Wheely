// The pose card — art + names + kid description, with a speaker button and a
// flip to reveal fun-fact / benefits. Difficulty & safety banner included.
import { el } from '../../core/dom.js';
import { artElement } from '../../data/pose-art.js';
import speech from '../../core/speech.js';
import audio from '../../core/audio.js';

const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard', advanced: 'Advanced' };

export function poseCard(pose, { showBack = true, compact = false, hideDesc = false } = {}) {
  const card = el(`div.pose-card.diff-${pose.difficulty}${compact ? '.compact' : ''}`);

  // Front
  const front = el('div.pose-card-face.pose-card-front');
  const art = artElement(pose);
  front.append(art);

  const info = el('div.pose-info');
  const titleRow = el('div.pose-title-row', {}, [
    el('h2.pose-name', {}, pose.english),
    el('button.speaker-btn', {
      type: 'button', 'aria-label': `Hear about ${pose.english}`,
      onClick: () => { audio.play('tap'); speech.speak(`${pose.english}. ${pose.description}`, { force: true }); },
    }, '🔊'),
  ]);
  info.append(titleRow);

  if (pose.sanskrit) {
    info.append(el('div.pose-sanskrit', {}, [
      pose.sanskritDevanagari ? el('span.deva', {}, pose.sanskritDevanagari) : null,
      pose.sanskritDevanagari ? el('span.dot', {}, ' · ') : null,
      el('span.translit', {}, pose.sanskrit),
    ]));
  }

  const chips = el('div.pose-chips', {}, [
    el(`span.chip.chip-diff`, {}, DIFF_LABEL[pose.difficulty] || pose.difficulty),
    pose.animalName ? el('span.chip.chip-animal', {}, `${pose.emoji || ''} ${pose.animalName}`) : null,
  ]);
  info.append(chips);

  if (!hideDesc) info.append(el('p.pose-desc', {}, pose.description));
  else info.append(el('p.pose-desc pose-desc-hidden', {}, 'Strike the pose! You\'ll learn all about it next. 🤫'));

  if (pose.safetyNote && (pose.difficulty === 'hard' || pose.difficulty === 'advanced')) {
    info.append(el('div.safety-note', {}, [el('span.safety-ico', { 'aria-hidden': 'true' }, '⚠️'), el('span', {}, pose.safetyNote)]));
  }

  front.append(info);
  card.append(front);

  // Back (fun fact + benefits)
  if (showBack && !compact) {
    const flipBtn = el('button.flip-btn', { type: 'button', 'aria-label': 'Show fun fact' }, '💡');
    front.append(flipBtn);
    const back = el('div.pose-card-face.pose-card-back');
    back.append(el('h3', {}, '💡 Fun Fact'));
    back.append(el('p.pose-funfact', {}, pose.funFact));
    if (pose.benefits?.length) {
      back.append(el('h3', {}, '💪 Good For'));
      back.append(el('ul.pose-benefits', {}, pose.benefits.map((b) => el('li', {}, b))));
    }
    const backBtn = el('button.flip-btn', { type: 'button', 'aria-label': 'Back to pose' }, '↩︎');
    back.append(backBtn);
    card.append(back);

    const flip = () => { card.classList.toggle('is-flipped'); audio.play('tap'); };
    flipBtn.addEventListener('click', flip);
    backBtn.addEventListener('click', flip);
  }

  return card;
}

export default { poseCard };

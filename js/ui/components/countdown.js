// 3-2-1-GO countdown overlay. Returns a promise that resolves when finished.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';

export function countdown(container, { from = 3, label = '', announce = true } = {}) {
  return new Promise((resolve) => {
    const overlay = el('div.countdown-overlay');
    const labelNode = label ? el('div.countdown-label', {}, label) : null;
    const num = el('div.countdown-num');
    if (labelNode) overlay.append(labelNode);
    overlay.append(num);
    container.append(overlay);

    if (announce && label) speech.speak(label, { interrupt: true });

    let n = from;
    const step = () => {
      if (n > 0) {
        num.textContent = n;
        num.classList.remove('pulse'); void num.offsetWidth; num.classList.add('pulse');
        audio.play('countdown');
        n--;
        setTimeout(step, 800);
      } else {
        num.textContent = 'GO!';
        num.classList.remove('pulse'); void num.offsetWidth; num.classList.add('pulse');
        audio.play('go');
        setTimeout(() => {
          overlay.classList.add('fade-out');
          setTimeout(() => { overlay.remove(); resolve(); }, 300);
        }, 650);
      }
    };
    step();
  });
}

export default { countdown };

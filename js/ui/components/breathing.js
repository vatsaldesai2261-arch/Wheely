// Gentle breathing guide — an expanding/contracting circle used between turns.
// On-theme calm moment. Resolves after the requested number of breaths.
import { el } from '../../core/dom.js';

export function breathe(container, { breaths = 2, inhale = 3200, exhale = 3600 } = {}) {
  return new Promise((resolve) => {
    const overlay = el('div.breathe-overlay');
    const circle = el('div.breathe-circle');
    const text = el('div.breathe-text', {}, 'Breathe in…');
    const skip = el('button.btn.btn-ghost.breathe-skip', { type: 'button' }, 'Skip');
    overlay.append(circle, text, skip);
    container.append(overlay);

    let count = 0, done = false;
    const finish = () => { if (done) return; done = true; overlay.classList.add('fade-out'); setTimeout(() => { overlay.remove(); resolve(); }, 300); };
    skip.addEventListener('click', finish);

    const inhalePhase = () => {
      if (done) return;
      text.textContent = 'Breathe in…';
      circle.style.transition = `transform ${inhale}ms cubic-bezier(0.4,0,0.2,1)`;
      circle.style.transform = 'scale(1.6)';
      setTimeout(exhalePhase, inhale);
    };
    const exhalePhase = () => {
      if (done) return;
      text.textContent = 'Breathe out…';
      circle.style.transition = `transform ${exhale}ms cubic-bezier(0.4,0,0.2,1)`;
      circle.style.transform = 'scale(1)';
      setTimeout(() => { count++; count >= breaths ? finish() : inhalePhase(); }, exhale);
    };
    requestAnimationFrame(inhalePhase);
  });
}

export default { breathe };

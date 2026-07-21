// Mystery reward box — a tap-to-open surprise granting coins/sticker/badge.
// The reward is passed in (deterministic upstream), so this is pure UI.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import { burst } from './confetti.js';

export function mysteryBox({ reward, onClose } = {}) {
  const overlay = el('div.mystery-overlay');
  const box = el('button.mystery-box', { type: 'button', 'aria-label': 'Open the mystery box' }, [
    el('div.mystery-lid', {}, '🎁'),
    el('div.mystery-hint', {}, 'Tap to open!'),
  ]);
  overlay.append(box);
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-in'));

  let opened = false;
  box.addEventListener('click', () => {
    if (opened) { close(); return; }
    opened = true;
    audio.play('levelup');
    burst({ count: 90, origin: { x: 0.5, y: 0.45 } });
    box.innerHTML = '';
    box.append(
      el('div.mystery-reward-emoji', {}, reward.emoji || '🎉'),
      el('div.mystery-reward-text', {}, reward.text || 'Surprise!'),
      el('div.mystery-tap', {}, 'Tap to close'),
    );
    box.classList.add('is-open');
  });

  function close() {
    overlay.classList.remove('is-in');
    setTimeout(() => overlay.remove(), 260);
    onClose?.();
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay && opened) close(); });
}

export default { mysteryBox };

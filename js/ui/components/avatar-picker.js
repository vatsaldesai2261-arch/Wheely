// Emoji avatar grid used in the player manager.
import { el, qsa } from '../../core/dom.js';

export const AVATARS = [
  '🦁','🐯','🐸','🦊','🐼','🐨','🐰','🦄','🐢','🦋',
  '🐙','🐧','🦉','🐝','🐬','🦩','🐵','🐶','🐱','🦖',
  '🐴','🐮','🐘','🦒','🦕','🐳','🦭','🐻','🦔','🐷',
  '🌟','🌈','🚀','🌸','⚡','🍀','🔥','💎','🎈','🦕',
];

export function avatarPicker({ selected = AVATARS[0], onSelect } = {}) {
  const grid = el('div.avatar-grid', { role: 'radiogroup', 'aria-label': 'Choose an avatar' });
  let current = selected;
  AVATARS.forEach((a) => {
    const btn = el('button.avatar-cell', {
      type: 'button', role: 'radio', 'aria-checked': String(a === current),
      'aria-label': `Avatar ${a}`,
      onClick: () => {
        current = a;
        qsa('.avatar-cell', grid).forEach((c) => {
          const on = c.dataset.a === a;
          c.classList.toggle('is-selected', on);
          c.setAttribute('aria-checked', String(on));
        });
        onSelect?.(a);
      },
      dataset: { a },
    }, a);
    if (a === current) btn.classList.add('is-selected');
    grid.append(btn);
  });
  return { el: grid, get value() { return current; } };
}

export default { avatarPicker, AVATARS };

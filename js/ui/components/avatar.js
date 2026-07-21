// Renders a player avatar: either an emoji or a photo (media:<id> resolved from
// IndexedDB). Returns an element immediately; upgrades to the photo when ready.
import { el } from '../../core/dom.js';
import media from '../../core/media.js';

export function avatarEl(value, { size = 40, className = '' } = {}) {
  const wrap = el(`span.avatar${className ? '.' + className : ''}`, { style: `--avatar-size:${size}px` });
  if (media.isRef(value)) {
    wrap.classList.add('avatar-photo');
    const img = el('img.avatar-img', { alt: '' });
    wrap.append(img);
    media.getURL(value).then((url) => { if (url) img.src = url; else { wrap.classList.remove('avatar-photo'); wrap.textContent = '🧘'; } });
  } else {
    wrap.textContent = value || '🧘';
  }
  return wrap;
}

export default { avatarEl };

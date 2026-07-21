// Toast queue — polite, auto-dismissing notices (achievements, coins, hints).
import { el } from '../../core/dom.js';

let root;
function ensureRoot() { root ||= document.getElementById('toast-root'); return root; }

export function toast(message, { icon = '', duration = 2600, tone = 'default' } = {}) {
  const r = ensureRoot();
  if (!r) return;
  const node = el(`div.toast.toast-${tone}`, { role: 'status' }, [
    icon ? el('span.toast-icon', { 'aria-hidden': 'true' }, icon) : null,
    el('span.toast-msg', {}, message),
  ]);
  r.append(node);
  requestAnimationFrame(() => node.classList.add('is-in'));
  const remove = () => {
    node.classList.remove('is-in');
    node.addEventListener('transitionend', () => node.remove(), { once: true });
    setTimeout(() => node.remove(), 400);
  };
  setTimeout(remove, duration);
  return remove;
}

export default { toast };

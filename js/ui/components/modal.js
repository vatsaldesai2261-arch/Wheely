// Focus-trapping modal built on <dialog>-like semantics (custom for iOS Safari
// reliability). Returns a controller with close().
import { el, qsa } from '../../core/dom.js';

let openCount = 0;

export function modal({ title, body, actions = [], dismissable = true, className = '' } = {}) {
  const overlay = el('div.modal-overlay', { role: 'presentation' });
  const dialog = el(`div.modal.glass.${className}`.trim(), { role: 'dialog', 'aria-modal': 'true' });
  if (title) {
    const h = el('h2.modal-title', { id: 'modal-title' }, title);
    dialog.setAttribute('aria-labelledby', 'modal-title');
    dialog.append(h);
  }
  const bodyNode = el('div.modal-body');
  if (typeof body === 'string') bodyNode.innerHTML = body;
  else if (body) bodyNode.append(body);
  dialog.append(bodyNode);

  const actionRow = el('div.modal-actions');
  const controller = { close };
  for (const a of actions) {
    const btn = el(`button.btn.${a.variant || 'btn-secondary'}`, {
      type: 'button',
      onClick: () => { const keep = a.onClick?.(controller); if (!keep && a.closeOnClick !== false) close(); },
    }, a.label);
    actionRow.append(btn);
  }
  if (actions.length) dialog.append(actionRow);

  overlay.append(dialog);

  if (dismissable) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  }

  const onKey = (e) => {
    if (e.key === 'Escape' && dismissable) close();
    if (e.key === 'Tab') trapFocus(e, dialog);
  };

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('is-in');
    setTimeout(() => overlay.remove(), 260);
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.style.removeProperty('overflow');
  }

  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  openCount++;
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => {
    overlay.classList.add('is-in');
    (qsa('button, [href], input, select, textarea', dialog)[0] || dialog).focus?.();
  });

  return controller;
}

function trapFocus(e, container) {
  const focusable = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container)
    .filter((n) => !n.disabled && n.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export default { modal };

// Shared "grown-up" unlock gate. Shows the password modal (default "admin")
// and runs a callback on success. If already unlocked, runs immediately.
import { el } from '../core/dom.js';
import audio from '../core/audio.js';
import auth from './auth.js';
import { modal } from '../ui/components/modal.js';

export function requireUnlock(onUnlocked) {
  if (auth.isUnlocked()) { onUnlocked(); return; }
  const input = el('input.text-input', { type: 'password', placeholder: 'Password', autocomplete: 'off', 'aria-label': 'Grown-up password' });
  const err = el('p.form-error', { role: 'alert' }, '');
  const body = el('div', {}, [
    el('p', {}, 'This is for grown-ups. Enter the password to continue.'),
    input, err,
    el('p.form-hint', {}, 'Default password is "admin".'),
  ]);
  const controller = modal({
    title: '🔒 Grown-Up Zone',
    body,
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      {
        label: 'Unlock', variant: 'btn-primary', closeOnClick: false,
        onClick: async () => {
          const ok = await auth.tryUnlock(input.value);
          if (ok) { audio.play('ding'); controller.close(); onUnlocked(); }
          else { err.textContent = 'Wrong password — try again.'; input.value = ''; input.focus(); audio.play('encourage'); }
          return true;
        },
      },
    ],
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.closest('.modal').querySelector('.btn-primary').click(); });
  setTimeout(() => input.focus(), 100);
}

export default { requireUnlock };

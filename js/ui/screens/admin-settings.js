// Admin — timers, safety defaults, password change.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import settings from '../../core/settings.js';
import auth from '../../admin/auth.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { adminHeader } from './admin-players.js';

export default {
  id: 'admin-settings',
  mount(container) {
    const s = settings.all();
    const poseTimer = el('input.text-input', { type: 'number', min: '3', max: '60', value: s.poseTimer });
    poseTimer.addEventListener('change', () => { settings.setSetting('poseTimer', clamp(+poseTimer.value, 3, 60)); poseTimer.value = settings.poseTimer(); toast('Pose timer saved', { icon: '⏱️' }); });
    const gameTimer = el('input.text-input', { type: 'number', min: '1', max: '90', value: s.gameTimer });
    gameTimer.addEventListener('change', () => { settings.setSetting('gameTimer', clamp(+gameTimer.value, 1, 90)); gameTimer.value = settings.gameTimerMinutes(); toast('Game timer saved', { icon: '⏱️' }); });
    const advanced = el('input', { type: 'checkbox', checked: s.includeAdvanced });
    advanced.addEventListener('change', () => { settings.setSetting('includeAdvanced', advanced.checked); });

    const view = el('div.subscreen', {}, [
      adminHeader('⏱️ Timers & Rules'),
      el('div.settings-list', {}, [
        row('Pose hold time (seconds)', poseTimer, 'How long kids hold each pose by default. Individual poses can override this.'),
        row('Game length (minutes)', gameTimer, 'Games end after this many minutes (once at least one round is done).'),
        el('label.setting-row.glass', {}, [
          el('div.setting-text', {}, [el('span.setting-label', {}, '⚠️ Allow Advanced poses by default'), el('span.setting-sub', {}, 'Headstands, deep backbends, arm balances. Off is safest for kids.')]),
          el('span.switch', {}, [advanced, el('span.switch-track')]),
        ]),
      ]),
      el('button.btn.btn-secondary', { type: 'button', onClick: changePassword }, '🔑 Change Password'),
    ]);
    container.append(view);
  },
};

function row(label, input, sub) {
  return el('label.setting-row.glass', {}, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label), sub ? el('span.setting-sub', {}, sub) : null]),
    input,
  ]);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v || lo)); }

function changePassword() {
  audio.play('tap');
  const oldPw = el('input.text-input', { type: 'password', placeholder: 'Current password' });
  const newPw = el('input.text-input', { type: 'password', placeholder: 'New password' });
  const err = el('p.form-error', { role: 'alert' });
  const ctrl = modal({
    title: '🔑 Change Password',
    body: el('div', {}, [oldPw, newPw, err, el('p.form-hint', {}, 'Note: this only keeps kids out — a grown-up with the browser tools could still get in.')]),
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Save', variant: 'btn-primary', closeOnClick: false, onClick: async () => {
        const res = await auth.changePassword(oldPw.value, newPw.value);
        if (res.ok) { toast('Password changed', { icon: '✅' }); ctrl.close(); }
        else { err.textContent = res.error; }
        return true;
      } },
    ],
  });
}

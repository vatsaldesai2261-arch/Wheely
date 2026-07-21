// Admin — timers, safety, and the grown-up settings (voice, language, motion,
// read-aloud, explain-timing, players on/off) plus password change.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import settings from '../../core/settings.js';
import speech from '../../core/speech.js';
import auth from '../../admin/auth.js';
import { LANGUAGES } from '../../core/strings.js';
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
      adminHeader('⏱️ Timers & Settings'),
      el('h2.form-subhead', {}, 'Timers & Rules'),
      el('div.settings-list', {}, [
        row('Pose hold time (seconds)', poseTimer, 'How long kids hold each pose by default. Individual poses can override this.'),
        row('Game length (minutes)', gameTimer, 'Games end after this many minutes (once at least one round is done).'),
        toggleRow('⚠️ Allow Advanced poses by default', advanced, 'Headstands, deep backbends, arm balances. Off is safest for kids.'),
      ]),

      el('h2.form-subhead', {}, 'Voice & Reading'),
      el('div.settings-list', {}, [
        toggleRow('🗣️ Read Poses Aloud', checkbox('narration', s.narration, (v) => { settings.setSetting('narration', v); if (v) speech.speak('Hi! I will read the poses out loud.', { force: true }); }, !speech.available()), speech.available() ? 'The app speaks the pose name and steps out loud.' : 'Not supported on this device.'),
        speech.available() ? voiceRow() : null,
        selectRow('📖 When to explain the pose', 'descTiming', s.descTiming || 'before', [['before', 'Before the pose (get ready)'], ['after', 'After (once they try it)']], 'Show the how-to steps before the pose, or after the child tries it.'),
      ]),

      el('h2.form-subhead', {}, 'Language & Motion'),
      el('div.settings-list', {}, [
        selectRow('🌐 Language', 'lang', s.lang || 'en', LANGUAGES.map((l) => [l.id, l.name]), 'Switch the buttons and menus between English and Hindi.', true),
        selectRow('🌀 Motion', 'reducedMotion', s.reducedMotion || 'auto', [['auto', 'Automatic'], ['on', 'Less motion'], ['off', 'Full motion']], '"Less motion" calms the spinning wheel & confetti for gentle visuals.'),
      ]),

      el('h2.form-subhead', {}, 'Players (show in games)'),
      playersSection(),

      el('button.btn.btn-secondary', { type: 'button', onClick: changePassword }, '🔑 Change Password'),
    ]);
    container.append(view);
  },
};

function checkbox(id, initial, onChange, disabled = false) {
  const input = el('input', { type: 'checkbox', checked: initial, disabled });
  input.addEventListener('change', () => { audio.play('tap'); onChange(input.checked); });
  return input;
}

function toggleRow(label, input, sub) {
  return el('label.setting-row.glass', {}, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label), sub ? el('span.setting-sub', {}, sub) : null]),
    el('span.switch', {}, [input, el('span.switch-track')]),
  ]);
}

function selectRow(label, key, value, options, sub, reloadOnChange) {
  const sel = el('select.select-input', {}, options.map(([v, l]) => el('option', { value: v, selected: v === value }, l)));
  sel.addEventListener('change', () => { audio.play('tap'); settings.setSetting(key, sel.value); if (reloadOnChange) location.reload(); });
  return el('label.setting-row.glass', {}, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label), sub ? el('span.setting-sub', {}, sub) : null]),
    sel,
  ]);
}

function voiceRow() {
  const voices = speech.softVoices();
  const current = settings.getSetting('voiceId') || '';
  const sel = el('select.select-input', {}, (voices.length ? voices : [{ id: '', name: 'Default voice', lang: '' }]).map((v) => el('option', { value: v.id, selected: v.id === current }, v.name + (v.lang ? ` (${v.lang})` : ''))));
  sel.addEventListener('change', () => { audio.play('tap'); settings.setSetting('voiceId', sel.value); speech.setVoice(sel.value); speech.speak('Hello! This is my voice.', { force: true }); });
  const test = el('button.btn.btn-secondary', { type: 'button', onClick: () => speech.speak('Ready, little yogi? Let\'s strike a pose!', { force: true }) }, '🔊 Test');
  return el('div.setting-row.glass', {}, [
    el('div.setting-text', {}, [el('span.setting-label', {}, '🎙️ Voice'), el('span.setting-sub', {}, voices.length ? 'Pick a soft, clear voice (Indian voices show 🇮🇳).' : 'Using the device default voice.')]),
    el('div.voice-controls', {}, [sel, test]),
  ]);
}

function playersSection() {
  const wrap = el('div.settings-list', { id: 'players-toggle-list' });
  paintPlayers(wrap);
  return wrap;
}
function paintPlayers(list) {
  clear(list);
  const players = store.get('players');
  if (!players.length) { list.append(el('p.empty-hint', {}, 'No players yet — add them in the Players screen.')); return; }
  players.forEach((p) => {
    const on = p.active !== false;
    list.append(toggleRow(`${typeof p.avatar === 'string' && !p.avatar.startsWith('media:') ? p.avatar : '🧘'} ${p.name}`,
      checkbox('pl-' + p.id, on, (v) => { store.update('players', (arr) => arr.map((x) => x.id === p.id ? { ...x, active: v } : x)); }),
      on ? 'Playing' : 'Resting'));
  });
}

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

// Settings (kid-facing) — sound, voice narration, motion. Timers/advanced live
// in the admin settings screen.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import settings from '../../core/settings.js';
import speech from '../../core/speech.js';
import { backHeader } from './leaderboard.js';

export default {
  id: 'settings',
  mount(container) {
    const view = el('div.subscreen', {}, [
      backHeader('⚙️ Settings'),
      el('div.settings-list', {}, [
        toggleRow('sound', '🔊 Sounds', 'Fun sounds and music', settings.soundOn(), (v) => settings.setSetting('sound', v)),
        toggleRow('narration', '🗣️ Read Poses Aloud', speech.available() ? 'The app speaks pose names & steps' : 'Not supported on this device', settings.narrationOn(), (v) => { settings.setSetting('narration', v); if (v) speech.speak('Hi! I will read the poses out loud for you.', { force: true }); }, !speech.available()),
        selectRow('reducedMotion', '🌀 Motion', settings.getSetting('reducedMotion') || 'auto', [
          ['auto', 'Automatic'], ['on', 'Less motion'], ['off', 'Full motion'],
        ], (v) => settings.setSetting('reducedMotion', v)),
      ]),
      el('p.settings-note', {}, 'Grown-ups: timers, players, poses and more are in the Grown-Up Zone (tap the logo 5 times on the home screen).'),
    ]);
    container.append(view);
  },
};

function toggleRow(id, label, sub, initial, onChange, disabled = false) {
  const input = el('input', { type: 'checkbox', id: `set-${id}`, checked: initial, disabled });
  input.addEventListener('change', () => { audio.play('tap'); onChange(input.checked); });
  return el('label.setting-row.glass', { for: `set-${id}` }, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label), el('span.setting-sub', {}, sub)]),
    el('span.switch', {}, [input, el('span.switch-track')]),
  ]);
}

function selectRow(id, label, value, options, onChange) {
  const sel = el('select.select-input', { id: `set-${id}` }, options.map(([v, l]) => el('option', { value: v, selected: v === value }, l)));
  sel.addEventListener('change', () => { audio.play('tap'); onChange(sel.value); });
  return el('label.setting-row.glass', { for: `set-${id}` }, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label)]),
    sel,
  ]);
}

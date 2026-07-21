// Settings (kid-facing) — sounds, voice, motion, description timing, and a
// players on/off list. Timers/players CRUD stay in the hidden Grown-Up Zone.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
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
        selectRow('descTiming', '📖 When to explain the pose', settings.getSetting('descTiming') || 'before', [
          ['before', 'Before the pose (get ready)'],
          ['after', 'After (once they try it)'],
        ], (v) => settings.setSetting('descTiming', v)),
        selectRow('reducedMotion', '🌀 Motion', settings.getSetting('reducedMotion') || 'auto', [
          ['auto', 'Automatic'], ['on', 'Less motion'], ['off', 'Full motion'],
        ], (v) => settings.setSetting('reducedMotion', v)),
      ]),
      playersSection(),
      el('p.settings-note', {}, 'Grown-ups: timers, players, poses and wheels are in the Grown-Up Zone — tap the Yoga Wheel logo on the home screen 5 times.'),
    ]);
    container.append(view);
  },
};

function playersSection() {
  const wrap = el('div.stat-section.glass', {}, [el('h2', {}, '👧 Players (show in games)')]);
  const list = el('div.settings-list', { id: 'players-toggle-list' });
  wrap.append(list);
  paintPlayers(list);
  return wrap;
}

function paintPlayers(list) {
  clear(list);
  const players = store.get('players');
  if (!players.length) { list.append(el('p.empty-hint', {}, 'No players yet — add them in the Grown-Up Zone.')); return; }
  players.forEach((p) => {
    const on = p.active !== false;
    list.append(toggleRow(`player-${p.id}`, `${p.avatar || '🧘'} ${p.name}`, on ? 'Playing' : 'Resting', on, (v) => {
      store.update('players', (arr) => arr.map((x) => x.id === p.id ? { ...x, active: v } : x));
    }));
  });
}

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

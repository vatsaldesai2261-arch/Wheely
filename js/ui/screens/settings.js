// Settings (kid-facing) — sounds, voice, motion, description timing, and a
// players on/off list. Timers/players CRUD stay in the hidden Grown-Up Zone.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import settings from '../../core/settings.js';
import speech from '../../core/speech.js';
import { THEMES } from '../../core/theme.js';
import { LANGUAGES } from '../../core/strings.js';
import { helpButton } from '../components/help.js';
import { backHeader } from './leaderboard.js';

export default {
  id: 'settings',
  mount(container) {
    const view = el('div.subscreen', {}, [
      el('header.sub-head', {}, [
        el('button.btn.btn-ghost', { type: 'button', onClick: () => { audio.play('tap'); import('../../core/router.js').then((m) => m.default.go('home')); } }, '← Home'),
        el('h1', {}, '⚙️ Settings'),
        helpButton('About Settings', 'This is where you make the game feel just right. Turn sounds and music on or off, pick a voice to read poses aloud, choose a color theme, and decide when the pose is explained. Grown-up tools like timers and players live in the hidden Grown-Up Zone.'),
      ]),
      el('div.settings-list', {}, [
        toggleRow('sound', '🔊 Sounds', 'Playful clicks, cheers and dings during the game.', settings.soundOn(), (v) => settings.setSetting('sound', v)),
        toggleRow('music', '🎵 Background Music', 'Soft, calming music that plays gently in the background.', settings.getSetting('music') === true, (v) => settings.setSetting('music', v)),
        selectRow('theme', '🎨 Theme', settings.getSetting('theme') || 'olive', THEMES.map((th) => [th.id, th.name]), (v) => settings.setSetting('theme', v), 'Change the whole app\'s colors — Meadow, Ocean, Candy or Space.'),
        selectRow('lang', '🌐 Language', settings.getSetting('lang') || 'en', LANGUAGES.map((l) => [l.id, l.name]), (v) => { settings.setSetting('lang', v); location.reload(); }, 'Switch the buttons and menus between English and Hindi.'),
        toggleRow('narration', '🗣️ Read Poses Aloud', speech.available() ? 'The app speaks the pose name and simple steps out loud.' : 'Not supported on this device.', settings.narrationOn(), (v) => { settings.setSetting('narration', v); if (v) speech.speak('Hi! I will read the poses out loud for you.', { force: true }); }, !speech.available()),
        speech.available() ? voiceRow() : null,
        selectRow('descTiming', '📖 When to explain the pose', settings.getSetting('descTiming') || 'before', [
          ['before', 'Before the pose (get ready)'],
          ['after', 'After (once they try it)'],
        ], (v) => settings.setSetting('descTiming', v), 'Show the "how to do it" steps before the pose, or reveal them after the child tries it.'),
        selectRow('reducedMotion', '🌀 Motion', settings.getSetting('reducedMotion') || 'auto', [
          ['auto', 'Automatic'], ['on', 'Less motion'], ['off', 'Full motion'],
        ], (v) => settings.setSetting('reducedMotion', v), '"Less motion" calms down the spinning wheel and confetti for kids who prefer gentle visuals. "Automatic" follows your device setting.'),
      ]),
      playersSection(),
      el('p.settings-note', {}, 'Grown-ups: timers, players, poses and wheels are in the Grown-Up Zone — tap the kaya haus logo on the home screen 5 times.'),
    ]);
    container.append(view);
  },
};

function voiceRow() {
  const voices = speech.softVoices();
  const current = settings.getSetting('voiceId') || '';
  const sel = el('select.select-input', {},
    (voices.length ? voices : [{ id: '', name: 'Default voice', lang: '' }]).map((v) =>
      el('option', { value: v.id, selected: v.id === current }, v.name + (v.lang ? ` (${v.lang})` : ''))));
  sel.addEventListener('change', () => {
    audio.play('tap');
    settings.setSetting('voiceId', sel.value);
    speech.setVoice(sel.value);
    speech.speak('Hello! This is my voice.', { force: true });
  });
  const test = el('button.btn.btn-secondary', { type: 'button', onClick: () => speech.speak('Ready, little yogi? Let\'s strike a pose!', { force: true }) }, '🔊 Test');
  return el('div.setting-row.glass', {}, [
    el('div.setting-text', {}, [el('span.setting-label', {}, '🎙️ Voice'), el('span.setting-sub', {}, voices.length ? 'Pick a soft, smooth voice' : 'Using the device default voice')]),
    el('div.voice-controls', {}, [sel, test]),
  ]);
}

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

function selectRow(id, label, value, options, onChange, sub) {
  const sel = el('select.select-input', { id: `set-${id}` }, options.map(([v, l]) => el('option', { value: v, selected: v === value }, l)));
  sel.addEventListener('change', () => { audio.play('tap'); onChange(sel.value); });
  return el('label.setting-row.glass', { for: `set-${id}` }, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label), sub ? el('span.setting-sub', {}, sub) : null]),
    sel,
  ]);
}

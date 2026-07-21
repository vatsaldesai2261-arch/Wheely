// Settings (kid-facing) — only the safe, fun knobs: Sounds, Music, Theme.
// Everything else (voice, read-aloud, language, timing, motion, players) lives
// in the locked Grown-Up Zone.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import settings from '../../core/settings.js';
import { THEMES } from '../../core/theme.js';
import { helpButton } from '../components/help.js';
import router from '../../core/router.js';

export default {
  id: 'settings',
  mount(container) {
    const view = el('div.subscreen', {}, [
      el('header.sub-head', {}, [
        el('button.btn.btn-ghost', { type: 'button', onClick: () => { audio.play('tap'); router.go('home'); } }, '← Home'),
        el('h1', {}, '⚙️ Settings'),
        helpButton('About Settings', 'Make the game feel just right! Turn sounds and music on or off and pick a color theme. More options — like the voice, language and timers — are in the Grown-Up Zone (a grown-up taps the kaya haus logo 5 times).'),
      ]),
      el('div.settings-list', {}, [
        toggleRow('sound', '🔊 Sounds', 'Playful clicks, cheers and dings during the game.', settings.soundOn(), (v) => settings.setSetting('sound', v)),
        toggleRow('music', '🎵 Background Music', 'Soft, calming music that plays gently in the background.', settings.getSetting('music') === true, (v) => settings.setSetting('music', v)),
        selectRow('theme', '🎨 Theme', settings.getSetting('theme') || 'olive', THEMES.map((th) => [th.id, th.name]), (v) => settings.setSetting('theme', v), 'Change the whole app\'s colors — Meadow, Ocean, Candy or Space.'),
      ]),
      el('p.settings-note', {}, '👋 Grown-ups: voice, language, timers, players and more are in the Grown-Up Zone — tap the kaya haus logo on the home screen 5 times.'),
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

function selectRow(id, label, value, options, onChange, sub) {
  const sel = el('select.select-input', { id: `set-${id}` }, options.map(([v, l]) => el('option', { value: v, selected: v === value }, l)));
  sel.addEventListener('change', () => { audio.play('tap'); onChange(sel.value); });
  return el('label.setting-row.glass', { for: `set-${id}` }, [
    el('div.setting-text', {}, [el('span.setting-label', {}, label), sub ? el('span.setting-sub', {}, sub) : null]),
    sel,
  ]);
}

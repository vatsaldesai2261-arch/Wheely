// Admin — player CRUD with avatar picker and goal presets.
import { el, clear } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { avatarPicker } from '../components/avatar-picker.js';

const PRESETS = [
  ['gentle', '🌸 Gentle (easy poses)'],
  ['balanced', '⚖️ Balanced (easy + medium)'],
  ['challenge', '🔥 Challenge (up to hard)'],
  ['everything', '🌟 Everything'],
];

function uid() { return 'p-' + Math.random().toString(36).slice(2, 9); }

export default {
  id: 'admin-players',
  mount(container) {
    const view = el('div.subscreen', {}, [
      adminHeader('👧 Players'),
      el('button.btn.btn-primary', { type: 'button', onClick: () => editPlayer(null) }, '➕ Add Player'),
      el('div.admin-list', { id: 'players-admin' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  const wrap = document.getElementById('players-admin');
  clear(wrap);
  const players = store.get('players');
  if (!players.length) { wrap.append(el('p.empty-hint', {}, 'No players yet. Add your first yogi!')); return; }
  players.forEach((p) => {
    wrap.append(el('div.admin-row.glass', {}, [
      el('span.ar-avatar', {}, p.avatar || '🧘'),
      el('div.ar-info', {}, [el('span.ar-name', {}, p.name), el('span.ar-meta', {}, `${p.belt || 'White Belt'} · ${p.xp || 0} XP · age ${p.age || '?'}`)]),
      el('div.ar-actions', {}, [
        el('button.icon-btn', { type: 'button', 'aria-label': 'Edit', onClick: () => editPlayer(p) }, '✏️'),
        el('button.icon-btn', { type: 'button', 'aria-label': 'Delete', onClick: () => del(p) }, '🗑️'),
      ]),
    ]));
  });
}

function editPlayer(existing) {
  audio.play('tap');
  const name = el('input.text-input', { type: 'text', placeholder: 'Name', value: existing?.name || '', maxlength: '16' });
  const age = el('input.text-input', { type: 'number', placeholder: 'Age', value: existing?.age || '', min: '2', max: '99' });
  const picker = avatarPicker({ selected: existing?.avatar || '🦁' });
  const preset = el('select.select-input', {}, PRESETS.map(([v, l]) => el('option', { value: v, selected: (existing?.goalPreset || 'balanced') === v }, l)));

  const body = el('div', {}, [
    el('label.field-label', {}, 'Name'), name,
    el('label.field-label', {}, 'Age'), age,
    el('label.field-label', {}, 'Avatar'), picker.el,
    el('label.field-label', {}, 'Goal'), preset,
  ]);

  const ctrl = modal({
    title: existing ? 'Edit Player' : 'Add Player',
    body,
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Save', variant: 'btn-primary', closeOnClick: false, onClick: () => {
        const nm = name.value.trim();
        if (!nm) { toast('Please enter a name', { icon: '✏️', tone: 'warn' }); return true; }
        store.update('players', (list) => {
          if (existing) return list.map((p) => p.id === existing.id ? { ...p, name: nm, age: +age.value || undefined, avatar: picker.value, goalPreset: preset.value } : p);
          return [...list, { id: uid(), name: nm, age: +age.value || undefined, avatar: picker.value, goalPreset: preset.value, xp: 0, coins: 0, completed: 0, missed: 0, belt: 'White Belt' }];
        });
        audio.play('ding'); ctrl.close(); paint();
        return true;
      } },
    ],
  });
}

function del(p) {
  const ctrl = modal({
    title: 'Delete Player?',
    body: el('p', {}, `Remove ${p.name} and all their progress? This cannot be undone.`),
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Delete', variant: 'btn-danger', onClick: () => {
        store.update('players', (list) => list.filter((x) => x.id !== p.id));
        store.update('stats', (s) => { delete s[p.id]; return s; });
        store.update('achievements', (a) => { delete a[p.id]; return a; });
        audio.play('tap'); paint();
      } },
    ],
  });
}

export function adminHeader(title) {
  return el('header.sub-head', {}, [
    el('button.btn.btn-ghost', { type: 'button', onClick: () => { audio.play('tap'); router.go('admin-dashboard'); } }, '← Back'),
    el('h1', {}, title),
  ]);
}

// Admin — player CRUD with avatar picker and goal presets.
import { el, clear } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { avatarPicker } from '../components/avatar-picker.js';
import poseLoader from '../../data/pose-loader.js';
import media from '../../core/media.js';
import { avatarEl } from '../components/avatar.js';
import { posePicker } from '../components/pose-picker.js';

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
    const active = p.active !== false;
    wrap.append(el('div.admin-row.glass', {}, [
      avatarEl(p.avatar, { size: 40, className: 'ar-avatar' }),
      el('div.ar-info', {}, [el('span.ar-name', {}, p.name), el('span.ar-meta', {}, `${p.belt || 'White Belt'} · ${p.xp || 0} XP · age ${p.age || '?'}`)]),
      el('div.ar-actions', {}, [
        el('button.icon-btn', { type: 'button', 'aria-label': active ? 'Playing (tap to rest)' : 'Resting (tap to play)', title: active ? 'Playing' : 'Resting', onClick: () => { store.update('players', (l) => l.map((x) => x.id === p.id ? { ...x, active: !active } : x)); audio.play('tap'); paint(); } }, active ? '✅' : '💤'),
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
  const startEmoji = media.isRef(existing?.avatar) ? '🦁' : (existing?.avatar || '🦁');
  const picker = avatarPicker({ selected: startEmoji });
  const preset = el('select.select-input', {}, PRESETS.map(([v, l]) => el('option', { value: v, selected: (existing?.goalPreset || 'balanced') === v }, l)));

  // Photo avatar (stored in IndexedDB; overrides the emoji when set)
  let photoRef = media.isRef(existing?.avatar) ? existing.avatar : null;
  const preview = el('span.photo-preview', {}, photoRef ? '' : (startEmoji));
  if (photoRef) media.getURL(photoRef).then((u) => { if (u) preview.innerHTML = `<img src="${u}" alt="">`; });
  const fileInput = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files[0]) return;
    try {
      const blob = await media.downscaleImage(fileInput.files[0], 640, 0.82);
      if (photoRef) media.del(photoRef);
      photoRef = await media.put(blob, { kind: 'avatar' });
      const u = await media.getURL(photoRef);
      preview.innerHTML = `<img src="${u}" alt="">`;
      toast('Photo added!', { icon: '📸' });
    } catch { toast('Could not read that photo.', { tone: 'warn' }); }
  });
  const photoRow = el('div.photo-btn-row', {}, [
    preview,
    el('button.btn.btn-secondary', { type: 'button', onClick: () => fileInput.click() }, photoRef ? '🔁 Change Photo' : '📸 Use a Photo'),
    photoRef ? el('button.btn.btn-ghost', { type: 'button', onClick: () => { media.del(photoRef); photoRef = null; preview.innerHTML = ''; preview.textContent = picker.value; toast('Photo removed', { icon: '🗑️' }); } }, 'Remove') : null,
    fileInput,
  ]);

  // Per-kid asana set (categories). Empty = all categories.
  const selectedCats = new Set(existing?.categories || []);
  const catGrid = el('div.chip-grid', {}, poseLoader.getCategories().map((c) => {
    const chip = el('button.chip', { type: 'button', class: selectedCats.has(c.id) ? 'chip is-active' : 'chip', onClick: () => { selectedCats.has(c.id) ? selectedCats.delete(c.id) : selectedCats.add(c.id); chip.classList.toggle('is-active'); } }, `${c.emoji} ${c.name}`);
    return chip;
  }));

  // Focus asanas (specific poses). When set, the wheel shows ONLY these.
  let focusPoses = existing?.focusPoses || [];
  const focusPicker = posePicker({ selected: focusPoses, onChange: (ids) => { focusPoses = ids; } });

  // Assign reusable goal templates (created in the Goals editor).
  const templates = store.get('goalTemplates');
  const assigned = new Set(existing?.goalIds || []);
  const goalChecklist = templates.length
    ? el('div.chip-grid', {}, templates.map((g) => {
        const chip = el('button.chip', { type: 'button', class: assigned.has(g.id) ? 'chip is-active' : 'chip', onClick: () => { assigned.has(g.id) ? assigned.delete(g.id) : assigned.add(g.id); chip.classList.toggle('is-active'); } }, `🎯 ${g.name}`);
        return chip;
      }))
    : el('p.form-hint', {}, 'No goals yet — create some in the Goals screen, then assign them here.');

  const body = el('div', {}, [
    el('label.field-label', {}, 'Name'), name,
    el('label.field-label', {}, 'Age'), age,
    el('label.field-label', {}, 'Photo (optional)'), photoRow,
    el('label.field-label', {}, 'Or pick an avatar'), picker.el,
    el('label.field-label', {}, 'Difficulty goal'), preset,
    el('label.field-label', {}, 'Pose groups for this kid (none = all)'), catGrid,
    el('h3.form-subhead', {}, '🎯 Focus Asanas (optional)'),
    el('p.form-hint', {}, 'Add specific poses to focus on. If set, this kid\'s wheel shows only these.'),
    focusPicker.el,
    el('h3.form-subhead', {}, '🏆 Goals'),
    el('div.goal-assign-head', {}, [
      el('span.form-hint', {}, 'Assign goals to this kid:'),
      el('button.btn.btn-ghost', { type: 'button', onClick: () => { ctrl.close(); router.go('admin-goals'); } }, '➕ Manage goals'),
    ]),
    goalChecklist,
  ]);

  const ctrl = modal({
    title: existing ? 'Edit Player' : 'Add Player',
    body, className: 'modal-wide',
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Save', variant: 'btn-primary', closeOnClick: false, onClick: () => {
        const nm = name.value.trim();
        if (!nm) { toast('Please enter a name', { icon: '✏️', tone: 'warn' }); return true; }
        const categories = [...selectedCats];
        const goalIds = [...assigned];
        const avatar = photoRef || picker.value;
        store.update('players', (list) => {
          if (existing) return list.map((p) => p.id === existing.id ? { ...p, name: nm, age: +age.value || undefined, avatar, goalPreset: preset.value, categories, focusPoses, goalIds } : p);
          return [...list, { id: uid(), name: nm, age: +age.value || undefined, avatar, goalPreset: preset.value, categories, focusPoses, goalIds, active: true, xp: 0, coins: 0, completed: 0, missed: 0, belt: 'White Belt' }];
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

// Admin — wheel builder. A wheel = categories + difficulty caps + Advanced
// opt-in + a name/emoji. Saved wheels appear in Setup.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import poseLoader from '../../data/pose-loader.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { adminHeader } from './admin-players.js';

function uid() { return 'w-' + Math.random().toString(36).slice(2, 9); }

export default {
  id: 'admin-wheels',
  mount(container) {
    const view = el('div.subscreen', {}, [
      adminHeader('🎡 Wheel Builder'),
      el('button.btn.btn-primary', { type: 'button', onClick: () => editWheel(null) }, '➕ New Wheel'),
      el('div.admin-list', { id: 'wheels-admin' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  const wrap = document.getElementById('wheels-admin');
  clear(wrap);
  const wheels = store.get('wheels');
  if (!wheels.length) { wrap.append(el('p.empty-hint', {}, 'No custom wheels yet. The "Surprise Me!" wheel is always available.')); }
  wheels.forEach((w) => {
    const count = poseLoader.filterPoses({ categories: w.categories, difficulties: w.difficulties, includeAdvanced: w.includeAdvanced }).length;
    wrap.append(el('div.admin-row.glass', {}, [
      el('span.ar-avatar', {}, w.emoji || '🎡'),
      el('div.ar-info', {}, [el('span.ar-name', {}, w.name), el('span.ar-meta', {}, `${w.categories.length || 'all'} groups · ${count} poses`)]),
      el('div.ar-actions', {}, [
        el('button.icon-btn', { type: 'button', onClick: () => editWheel(w) }, '✏️'),
        el('button.icon-btn', { type: 'button', onClick: () => { store.update('wheels', (l) => l.filter((x) => x.id !== w.id)); audio.play('tap'); paint(); } }, '🗑️'),
      ]),
    ]));
  });
}

function editWheel(existing) {
  audio.play('tap');
  const name = el('input.text-input', { type: 'text', placeholder: 'Wheel name', value: existing?.name || '' });
  const emoji = el('input.text-input', { type: 'text', placeholder: 'Emoji', value: existing?.emoji || '🎡', maxlength: '2' });
  const cats = poseLoader.getCategories();
  const selectedCats = new Set(existing?.categories || []);
  const catGrid = el('div.chip-grid', {}, cats.map((c) => {
    const chip = el('button.chip', { type: 'button', class: selectedCats.has(c.id) ? 'chip is-active' : 'chip', onClick: () => { selectedCats.has(c.id) ? selectedCats.delete(c.id) : selectedCats.add(c.id); chip.classList.toggle('is-active'); } }, `${c.emoji} ${c.name}`);
    return chip;
  }));
  const selectedDiffs = new Set(existing?.difficulties || ['easy', 'medium', 'hard']);
  const diffGrid = el('div.chip-grid', {}, ['easy', 'medium', 'hard'].map((d) => {
    const chip = el('button.chip', { type: 'button', class: selectedDiffs.has(d) ? 'chip is-active' : 'chip', onClick: () => { selectedDiffs.has(d) ? selectedDiffs.delete(d) : selectedDiffs.add(d); chip.classList.toggle('is-active'); } }, d);
    return chip;
  }));
  const advanced = el('input', { type: 'checkbox', checked: existing?.includeAdvanced || false });

  const body = el('div', {}, [
    el('label.field-label', {}, 'Name'), name,
    el('label.field-label', {}, 'Emoji'), emoji,
    el('label.field-label', {}, 'Groups (none = all)'), catGrid,
    el('label.field-label', {}, 'Difficulties'), diffGrid,
    el('label.setting-row', {}, [el('span', {}, '⚠️ Include Advanced poses'), el('span.switch', {}, [advanced, el('span.switch-track')])]),
    el('p.form-hint', {}, 'Advanced poses (headstands, deep backbends) are off by default for safety.'),
  ]);

  const ctrl = modal({
    title: existing ? 'Edit Wheel' : 'New Wheel', body, className: 'modal-wide',
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Save', variant: 'btn-primary', closeOnClick: false, onClick: () => {
        const nm = name.value.trim();
        if (!nm) { toast('Name required', { tone: 'warn' }); return true; }
        const diffs = [...selectedDiffs]; if (advanced.checked) diffs.push('advanced');
        const wheel = { id: existing?.id || uid(), name: nm, emoji: emoji.value.trim() || '🎡', categories: [...selectedCats], difficulties: diffs.length ? diffs : ['easy', 'medium'], includeAdvanced: advanced.checked };
        const poolSize = poseLoader.filterPoses({ categories: wheel.categories, difficulties: wheel.difficulties, includeAdvanced: wheel.includeAdvanced }).length;
        if (poolSize < 3) { toast('That wheel has too few poses. Add more groups/difficulties.', { tone: 'warn', duration: 4000 }); return true; }
        store.update('wheels', (l) => existing ? l.map((x) => x.id === existing.id ? wheel : x) : [...l, wheel]);
        audio.play('ding'); ctrl.close(); paint();
        return true;
      } },
    ],
  });
}

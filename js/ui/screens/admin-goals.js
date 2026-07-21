// Admin — Goals editor. Create/edit/delete reusable goal templates, then
// assign them to kids in the Players screen.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import { GOAL_TYPES } from '../../rewards/goals.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { adminHeader } from './admin-players.js';

function uid() { return 'g-' + Math.random().toString(36).slice(2, 9); }

export default {
  id: 'admin-goals',
  mount(container) {
    const view = el('div.subscreen', {}, [
      adminHeader('🏆 Goals'),
      el('p.form-hint', {}, 'Create goals with your own rewards, then assign them to kids in the Players screen. Kids can have several goals.'),
      el('button.btn.btn-primary', { type: 'button', onClick: () => editGoal(null) }, '➕ New Goal'),
      el('div.admin-list', { id: 'goals-admin' }),
    ]);
    container.append(view);
    paint();
  },
};

function metricLabel(m) { return (GOAL_TYPES.find((g) => g.id === m) || {}).label || m; }

function paint() {
  const wrap = document.getElementById('goals-admin');
  clear(wrap);
  const goals = store.get('goalTemplates');
  if (!goals.length) { wrap.append(el('p.empty-hint', {}, 'No goals yet. Create one — e.g. "Reach 200 XP → Ice cream 🍦".')); return; }
  goals.forEach((g) => {
    wrap.append(el('div.admin-row.glass', {}, [
      el('span.ar-avatar', {}, '🎯'),
      el('div.ar-info', {}, [el('span.ar-name', {}, g.name), el('span.ar-meta', {}, `${metricLabel(g.metric)} ${g.target}${g.reward ? ' · 🎁 ' + g.reward : ''}`)]),
      el('div.ar-actions', {}, [
        el('button.icon-btn', { type: 'button', 'aria-label': 'Edit', onClick: () => editGoal(g) }, '✏️'),
        el('button.icon-btn', { type: 'button', 'aria-label': 'Delete', onClick: () => del(g) }, '🗑️'),
      ]),
    ]));
  });
}

function editGoal(existing) {
  audio.play('tap');
  const name = el('input.text-input', { type: 'text', placeholder: 'Goal name (e.g. Superstar Week)', value: existing?.name || '' });
  const metric = el('select.select-input', {}, GOAL_TYPES.map((g) => el('option', { value: g.id, selected: existing?.metric === g.id }, g.label)));
  const target = el('input.text-input', { type: 'number', min: '1', placeholder: 'Target number', value: existing?.target || '' });
  const reward = el('input.text-input', { type: 'text', placeholder: 'Reward (e.g. Movie night 🎬)', value: existing?.reward || '' });
  const body = el('div', {}, [
    el('label.field-label', {}, 'Name'), name,
    el('label.field-label', {}, 'What it tracks'), metric,
    el('label.field-label', {}, 'Target'), target,
    el('label.field-label', {}, 'Reward'), reward,
  ]);
  const ctrl = modal({
    title: existing ? 'Edit Goal' : 'New Goal', body,
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Save', variant: 'btn-primary', closeOnClick: false, onClick: () => {
        const nm = name.value.trim();
        if (!nm) { toast('Name the goal', { tone: 'warn' }); return true; }
        if (!(+target.value > 0)) { toast('Set a target number', { tone: 'warn' }); return true; }
        const g = { id: existing?.id || uid(), name: nm, metric: metric.value, target: +target.value, reward: reward.value.trim() };
        store.update('goalTemplates', (list) => existing ? list.map((x) => x.id === existing.id ? g : x) : [...list, g]);
        audio.play('ding'); ctrl.close(); paint();
        return true;
      } },
    ],
  });
}

function del(g) {
  store.update('goalTemplates', (list) => list.filter((x) => x.id !== g.id));
  // unassign from players
  store.update('players', (list) => list.map((p) => p.goalIds ? { ...p, goalIds: p.goalIds.filter((id) => id !== g.id) } : p));
  audio.play('tap'); paint();
}

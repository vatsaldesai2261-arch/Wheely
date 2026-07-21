// Leaderboard — rank players by a chosen metric.
import { el, clear } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import stats from '../../stats/stats.js';

const METRICS = [
  { id: 'xp', label: '✨ XP' },
  { id: 'poses', label: '🤸 Poses' },
  { id: 'streak', label: '🔥 Best Streak' },
  { id: 'coins', label: '🪙 Coins' },
];
let metric = 'xp';

export default {
  id: 'leaderboard',
  mount(container) {
    const view = el('div.subscreen', {}, [
      backHeader('🏆 Leaderboard'),
      el('div.metric-tabs', {}, METRICS.map((m) =>
        el('button.chip', { type: 'button', class: m.id === metric ? 'chip is-active' : 'chip', dataset: { m: m.id }, onClick: () => { metric = m.id; audio.play('tap'); paint(); } }, m.label)
      )),
      el('div.lb-list', { id: 'lb-list' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  document.querySelectorAll('.metric-tabs .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.m === metric));
  const list = document.getElementById('lb-list');
  clear(list);
  const rows = stats.leaderboard(metric);
  if (!rows.length) { list.append(el('p.empty-hint', {}, 'No players yet. Add players in the Grown-Up Zone!')); return; }
  rows.forEach((r, i) => {
    list.append(el('div.lb-row.glass', { class: `lb-row glass ${i === 0 ? 'lb-first' : ''}` }, [
      el('span.lb-rank', {}, i === 0 ? '👑' : `#${i + 1}`),
      el('span.lb-avatar', {}, r.avatar || '🧘'),
      el('span.lb-name', {}, r.name),
      el('span.lb-belt', {}, r.belt || 'White Belt'),
      el('span.lb-value', {}, String(r.value)),
    ]));
  });
}

export function backHeader(title) {
  return el('header.sub-head', {}, [
    el('button.btn.btn-ghost', { type: 'button', onClick: () => { audio.play('tap'); router.go('home'); } }, '← Home'),
    el('h1', {}, title),
  ]);
}

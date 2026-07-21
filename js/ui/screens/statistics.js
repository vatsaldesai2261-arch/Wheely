// Statistics — per-player dashboard: totals, category spread, recent sessions.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import stats from '../../stats/stats.js';
import poseLoader from '../../data/pose-loader.js';
import { backHeader } from './leaderboard.js';

let currentPlayerId = null;

export default {
  id: 'statistics',
  mount(container) {
    const players = store.get('players');
    currentPlayerId = currentPlayerId || players[0]?.id || 'guest';
    const view = el('div.subscreen', {}, [
      backHeader('📊 Statistics'),
      players.length > 1 ? el('div.player-tabs', {}, players.map((p) =>
        el('button.chip', { type: 'button', class: p.id === currentPlayerId ? 'chip is-active' : 'chip', dataset: { id: p.id }, onClick: () => { currentPlayerId = p.id; audio.play('tap'); paint(); } }, `${p.avatar} ${p.name}`)
      )) : null,
      el('div', { id: 'stats-body' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  document.querySelectorAll('.player-tabs .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.id === currentPlayerId));
  const body = document.getElementById('stats-body');
  clear(body);
  const s = stats.forPlayer(currentPlayerId);
  const player = store.get('players').find((p) => p.id === currentPlayerId);
  const total = s.posesCompleted + s.posesMissed;
  const rate = total ? Math.round((s.posesCompleted / total) * 100) : 0;

  body.append(el('div.stat-tiles', {}, [
    tile('✨', player?.xp || 0, 'XP'),
    tile('🤸', s.posesCompleted, 'Poses done'),
    tile('🎯', `${rate}%`, 'Success'),
    tile('🔥', s.bestStreak, 'Best streak'),
    tile('⏱️', `${s.minutesPracticed}m`, 'Practiced'),
    tile('📅', s.dayStreak, 'Day streak'),
    tile('🎮', s.sessionsPlayed, 'Games'),
    tile('🪙', player?.coins || 0, 'Coins'),
  ]));

  // Category spread
  const cats = poseLoader.getCategories();
  const maxCat = Math.max(1, ...Object.values(s.perCategory || {}));
  body.append(el('div.stat-section.glass', {}, [
    el('h2', {}, 'Poses by Group'),
    el('div.cat-bars', {}, cats.map((c) => {
      const v = s.perCategory?.[c.id] || 0;
      return el('div.cat-bar-row', {}, [
        el('span.cat-bar-label', {}, `${c.emoji} ${c.name}`),
        el('div.cat-bar-track', {}, el('div.cat-bar-fill', { style: `width:${(v / maxCat) * 100}%` })),
        el('span.cat-bar-val', {}, String(v)),
      ]);
    })),
  ]));

  // Recent sessions
  if (s.recentSessions?.length) {
    body.append(el('div.stat-section.glass', {}, [
      el('h2', {}, 'Recent Games'),
      el('div.session-list', {}, s.recentSessions.slice(0, 10).map((sess) =>
        el('div.session-row', {}, [
          el('span', {}, sess.date),
          el('span', {}, sess.mode),
          el('span', {}, '⭐'.repeat(sess.stars || 0) || '—'),
          el('span', {}, `${sess.completed}✅`),
        ])
      )),
    ]));
  }
}

function tile(icon, value, label) {
  return el('div.stat-tile.glass', {}, [
    el('span.stat-icon', {}, icon),
    el('span.stat-value', {}, String(value)),
    el('span.stat-label', {}, label),
  ]);
}

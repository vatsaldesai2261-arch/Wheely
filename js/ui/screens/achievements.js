// Achievements — badge wall, per player, showing locked/unlocked.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import achievements from '../../rewards/achievements.js';
import { backHeader } from './leaderboard.js';

let currentPlayerId = null;

export default {
  id: 'achievements',
  async mount(container) {
    await achievements.init();
    const players = store.get('players');
    currentPlayerId = currentPlayerId || players[0]?.id || 'guest';
    const view = el('div.subscreen', {}, [
      backHeader('🎖️ Achievements'),
      players.length > 1 ? el('div.player-tabs', {}, players.map((p) =>
        el('button.chip', { type: 'button', class: p.id === currentPlayerId ? 'chip is-active' : 'chip', dataset: { id: p.id }, onClick: () => { currentPlayerId = p.id; audio.play('tap'); paint(); } }, `${p.avatar} ${p.name}`)
      )) : null,
      el('div.badge-grid', { id: 'badge-grid' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  document.querySelectorAll('.player-tabs .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.id === currentPlayerId));
  const grid = document.getElementById('badge-grid');
  clear(grid);
  const defs = achievements.definitions();
  const unlocked = achievements.unlockedFor(currentPlayerId);
  const total = defs.length, got = defs.filter((d) => unlocked.has(d.id)).length;
  grid.append(el('p.badge-progress', {}, `${got} / ${total} unlocked`));
  defs.forEach((d) => {
    const on = unlocked.has(d.id);
    grid.append(el('div.badge', { class: on ? 'badge is-on' : 'badge is-off', title: d.desc }, [
      el('span.badge-icon', {}, on ? d.icon : '🔒'),
      el('span.badge-name', {}, d.name),
      el('span.badge-desc', {}, d.desc),
    ]));
  });
}

// Sticker Album + Weekly Quests. Pick a player to see their sticker collection.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import stickers from '../../rewards/stickers.js';
import quests from '../../rewards/quests.js';
import { toast } from '../components/toast.js';
import { backHeader } from './leaderboard.js';

let currentPlayerId = null;

export default {
  id: 'album',
  async mount(container) {
    await quests.loadPool();
    quests.ensureWeek();
    const players = store.get('players');
    currentPlayerId = (players.find((p) => p.id === currentPlayerId) ? currentPlayerId : players[0]?.id) || null;
    const view = el('div.subscreen', {}, [
      backHeader('📔 Sticker Album'),
      questSection(),
      players.length > 1 ? el('div.player-tabs', { id: 'album-tabs' }, players.map((p) =>
        el('button.chip', { type: 'button', class: p.id === currentPlayerId ? 'chip is-active' : 'chip', dataset: { id: p.id }, onClick: () => { currentPlayerId = p.id; audio.play('tap'); paintStickers(); } }, `${p.avatar} ${p.name}`)
      )) : null,
      el('div', { id: 'album-body' }),
    ]);
    container.append(view);
    paintStickers();
  },
};

function questSection() {
  const wrap = el('div.stat-section.glass', {}, [el('h2', {}, '🎯 This Week\'s Quests')]);
  const list = el('div.quest-list', { id: 'quest-list' });
  wrap.append(list);
  paintQuests(list);
  return wrap;
}

function paintQuests(list) {
  clear(list);
  const qs = quests.questProgress();
  if (!qs.length) { list.append(el('p.empty-hint', {}, 'Play some games to start this week\'s quests!')); return; }
  qs.forEach((q) => {
    list.append(el('div.quest-row', {}, [
      el('span.quest-icon', {}, q.icon),
      el('div.quest-info', {}, [
        el('span.quest-name', {}, q.name),
        el('span.quest-desc', {}, q.desc),
        el('div.quest-bar-track', {}, el('div.quest-bar-fill', { style: `width:${q.pct * 100}%` })),
      ]),
      q.done && !q.claimed
        ? el('button.btn.btn-primary.quest-claim', { type: 'button', onClick: () => { quests.claim(q); audio.play('coin'); toast(`+${q.reward} coins! 🪙`, { icon: '🎯' }); refresh(); } }, `🪙 ${q.reward}`)
        : el('span.quest-status', {}, q.claimed ? '✓' : `${q.value}/${q.target}`),
    ]));
  });
}

function paintStickers() {
  const body = document.getElementById('album-body');
  if (!body) return;
  clear(body);
  document.querySelectorAll('#album-tabs .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.id === currentPlayerId));
  if (!currentPlayerId) { body.append(el('p.empty-hint', {}, 'Add a player in the Grown-Up Zone to start collecting stickers!')); return; }
  const owned = stickers.ownedFor(currentPlayerId);
  body.append(el('p.badge-progress', {}, `${[...owned].length} / ${stickers.STICKERS.length} stickers collected`));
  const grid = el('div.sticker-grid');
  stickers.STICKERS.forEach((s) => {
    const has = owned.has(s.id);
    grid.append(el('div.sticker', { class: has ? 'sticker has' : 'sticker locked', title: s.how }, [
      el('span.sticker-emoji', {}, has ? s.emoji : '❔'),
      el('span.sticker-name', {}, has ? s.name : '???'),
      el('span.sticker-how', {}, s.how),
    ]));
  });
  body.append(grid);
}

function refresh() { const l = document.getElementById('quest-list'); if (l) paintQuests(l); }

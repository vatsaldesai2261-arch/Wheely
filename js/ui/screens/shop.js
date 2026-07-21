// Coin Shop — pick a player, spend their coins on hats, pets and frames.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import shop from '../../rewards/shop.js';
import { toast } from '../components/toast.js';
import { backHeader } from './leaderboard.js';

let currentPlayerId = null;

export default {
  id: 'shop',
  async mount(container) {
    await shop.loadCatalog();
    const players = store.get('players');
    currentPlayerId = (players.find((p) => p.id === currentPlayerId) ? currentPlayerId : players[0]?.id) || null;
    const view = el('div.subscreen', {}, [
      backHeader('🛍️ Coin Shop'),
      players.length ? el('div.player-tabs', { id: 'shop-tabs' }, players.map((p) =>
        el('button.chip', { type: 'button', class: p.id === currentPlayerId ? 'chip is-active' : 'chip', dataset: { id: p.id }, onClick: () => { currentPlayerId = p.id; audio.play('tap'); paint(); } }, `${p.avatar} ${p.name}`)
      )) : el('p.empty-hint', {}, 'Add a player in the Grown-Up Zone to start shopping!'),
      el('div', { id: 'shop-body' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  const body = document.getElementById('shop-body');
  if (!body) return;
  clear(body);
  const player = store.get('players').find((p) => p.id === currentPlayerId);
  if (!player) return;
  document.querySelectorAll('#shop-tabs .chip').forEach((c) => c.classList.toggle('is-active', c.dataset.id === currentPlayerId));

  body.append(el('div.coin-banner.glass', {}, [
    el('span.coin-avatar', {}, player.avatar || '🧘'),
    el('span.coin-count', {}, `🪙 ${player.coins || 0} coins`),
  ]));

  const cat = shop.stateFor(player.id);
  const sections = [['hats', '🎩 Hats'], ['pets', '🐾 Pets'], ['frames', '🖼️ Frames']];
  const catalog = shop.allItems();
  for (const [slot, title] of sections) {
    const items = catalog.filter((i) => i.slot === slotName(slot));
    body.append(el('h2.shop-section-title', {}, title));
    const grid = el('div.shop-grid');
    items.forEach((item) => {
      const owned = cat.owned.includes(item.id);
      const equipped = cat.equipped[item.slot] === item.id;
      grid.append(el('div.shop-item.glass', { class: `shop-item glass ${equipped ? 'is-equipped' : ''}` }, [
        el('span.shop-emoji', {}, item.emoji),
        el('span.shop-name', {}, item.name),
        owned
          ? el('button.btn.btn-secondary.shop-btn', { type: 'button', onClick: () => { shop.equip(player.id, item); audio.play('tap'); paint(); } }, equipped ? '✓ On' : 'Wear')
          : el('button.btn.btn-primary.shop-btn', { type: 'button', onClick: () => buy(item) }, `🪙 ${item.cost}`),
      ]));
    });
    body.append(grid);
  }
}

function slotName(section) { return section === 'hats' ? 'hat' : section === 'pets' ? 'pet' : 'frame'; }

function buy(item) {
  const res = shop.buy(currentPlayerId, item);
  if (res.ok) { audio.play('coin'); toast(`Got ${item.name}! ${item.emoji}`, { icon: '🛍️' }); paint(); }
  else { toast(res.error === 'Not enough coins' ? 'Not enough coins yet — keep playing!' : res.error, { tone: 'warn' }); audio.play('encourage'); }
}

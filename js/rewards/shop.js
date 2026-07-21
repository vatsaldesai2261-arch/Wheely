// Coin Shop — spend a player's coins to unlock avatar accessories & pets.
// Unlocks/equips stored per player in the `shop` domain.
import store from '../core/store.js';
import { emit } from '../core/bus.js';

let catalog = null;
export async function loadCatalog() {
  if (catalog) return catalog;
  const res = await fetch(new URL('../../data/shop.json', import.meta.url));
  catalog = await res.json();
  return catalog;
}

export function allItems() {
  if (!catalog) return [];
  return [...catalog.hats, ...catalog.pets, ...catalog.frames];
}

export function stateFor(playerId) {
  const all = store.get('shop');
  return all[playerId] || { owned: [], equipped: {} };
}

export function owns(playerId, itemId) { return stateFor(playerId).owned.includes(itemId); }

export function buy(playerId, item) {
  const player = store.get('players').find((p) => p.id === playerId);
  if (!player) return { ok: false, error: 'No player' };
  if (owns(playerId, item.id)) return { ok: false, error: 'Already owned' };
  if ((player.coins || 0) < item.cost) return { ok: false, error: 'Not enough coins' };
  store.update('players', (arr) => arr.map((p) => p.id === playerId ? { ...p, coins: (p.coins || 0) - item.cost } : p));
  store.update('shop', (all) => {
    const s = all[playerId] || { owned: [], equipped: {} };
    s.owned = [...new Set([...s.owned, item.id])];
    s.equipped = { ...s.equipped, [item.slot]: item.id }; // auto-equip on buy
    all[playerId] = s;
    return all;
  });
  emit('shop:bought', { playerId, item });
  return { ok: true };
}

export function equip(playerId, item) {
  store.update('shop', (all) => {
    const s = all[playerId] || { owned: [], equipped: {} };
    const already = s.equipped[item.slot] === item.id;
    s.equipped = { ...s.equipped, [item.slot]: already ? null : item.id };
    all[playerId] = s;
    return all;
  });
  emit('shop:equipped', { playerId });
}

export function equippedItems(playerId) {
  const s = stateFor(playerId);
  const items = allItems();
  const out = {};
  for (const [slot, id] of Object.entries(s.equipped)) {
    if (id) out[slot] = items.find((i) => i.id === id) || null;
  }
  return out;
}

export default { loadCatalog, allItems, stateFor, owns, buy, equip, equippedItems };

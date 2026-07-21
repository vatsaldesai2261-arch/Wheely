// Sticker album — kids collect stickers by first-completing each pose group
// and hitting milestones. Stored per player in the `stickers` domain.
import store from '../core/store.js';
import { emit, on } from '../core/bus.js';
import poseLoader from '../data/pose-loader.js';
import stats from '../stats/stats.js';

// The full collectible set (category firsts + milestones).
export const STICKERS = [
  { id: 's-standing', name: 'Mountain', emoji: '🏔️', how: 'First standing pose', kind: 'category', category: 'standing' },
  { id: 's-seated', name: 'Lotus', emoji: '🪷', how: 'First seated pose', kind: 'category', category: 'seated' },
  { id: 's-balance', name: 'Acrobat', emoji: '🤸', how: 'First balance pose', kind: 'category', category: 'balance' },
  { id: 's-backbend', name: 'Rainbow', emoji: '🌈', how: 'First backbend', kind: 'category', category: 'backbend' },
  { id: 's-forward-fold', name: 'Folder', emoji: '🙇', how: 'First forward fold', kind: 'category', category: 'forward-fold' },
  { id: 's-twist', name: 'Twister', emoji: '🌀', how: 'First twist', kind: 'category', category: 'twist' },
  { id: 's-core', name: 'Rocket', emoji: '🚀', how: 'First core pose', kind: 'category', category: 'core' },
  { id: 's-inversion', name: 'Upside Down', emoji: '🙃', how: 'First upside-down pose', kind: 'category', category: 'inversion' },
  { id: 's-animal-play', name: 'Zookeeper', emoji: '🦁', how: 'First animal pose', kind: 'category', category: 'animal-play' },
  { id: 's-partner-group', name: 'Team Player', emoji: '🤝', how: 'First together pose', kind: 'category', category: 'partner-group' },
  { id: 's-restorative', name: 'Sleepy Star', emoji: '😌', how: 'First calm pose', kind: 'category', category: 'restorative' },
  { id: 's-warmup-fun', name: 'Sunshine', emoji: '☀️', how: 'First warm-up', kind: 'category', category: 'warmup-fun' },
  { id: 's-first', name: 'First Steps', emoji: '🌱', how: 'Your very first pose', kind: 'milestone', poses: 1 },
  { id: 's-25', name: 'Rising Star', emoji: '⭐', how: 'Complete 25 poses', kind: 'milestone', poses: 25 },
  { id: 's-100', name: 'Super Yogi', emoji: '💯', how: 'Complete 100 poses', kind: 'milestone', poses: 100 },
  { id: 's-streak', name: 'On Fire', emoji: '🔥', how: '5 poses in a row', kind: 'streak', streak: 5 },
  { id: 's-rainbow', name: 'All Colors', emoji: '🎨', how: 'Try 6 pose groups', kind: 'distinct', distinct: 6 },
  { id: 's-belt', name: 'Green Belt', emoji: '💚', how: 'Earn a Green Belt', kind: 'belt', belt: 'green' },
];

export function ownedFor(playerId) {
  const all = store.get('stickers');
  return new Set(all[playerId] || []);
}

function award(playerId, sticker) {
  store.update('stickers', (all) => {
    const set = new Set(all[playerId] || []);
    if (set.has(sticker.id)) return all;
    set.add(sticker.id);
    all[playerId] = [...set];
    return all;
  });
  emit('sticker:earned', { playerId, sticker });
}

export function init() {
  on('engine:decision', ({ player, result, streak }) => {
    if (result !== 'pass') return;
    evaluate(player.id, { streak });
  });
  on('player:levelup', ({ player }) => evaluate(player.id, {}));
}

export function evaluate(playerId, ctx = {}) {
  const s = stats.forPlayer(playerId);
  const player = store.get('players').find((p) => p.id === playerId) || { xp: 0 };
  const owned = ownedFor(playerId);
  const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black'];
  const beltIdx = (xp) => { const l = [0,100,250,500,900,1400,2000,2800,3800]; let i=0; l.forEach((m,k)=>{if(xp>=m)i=k;}); return i; };

  for (const st of STICKERS) {
    if (owned.has(st.id)) continue;
    let hit = false;
    if (st.kind === 'category') hit = (s.perCategory?.[st.category] || 0) >= 1;
    else if (st.kind === 'milestone') hit = s.posesCompleted >= st.poses;
    else if (st.kind === 'streak') hit = (ctx.streak || s.bestStreak || 0) >= st.streak;
    else if (st.kind === 'distinct') hit = (s.distinctCategories?.length || 0) >= st.distinct;
    else if (st.kind === 'belt') hit = beltIdx(player.xp || 0) >= beltOrder.indexOf(st.belt);
    if (hit) award(playerId, st);
  }
}

export default { STICKERS, ownedFor, init, evaluate };

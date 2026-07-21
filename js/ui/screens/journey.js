// Journey map — a path of worlds that unlock as the family plays more.
// Progress = total poses completed across all players.
import { el } from '../../core/dom.js';
import store from '../../core/store.js';
import stats from '../../stats/stats.js';
import { backHeader } from './leaderboard.js';

const STOPS = [
  { name: 'Cozy Cottage', emoji: '🏡', need: 0 },
  { name: 'Sunny Meadow', emoji: '🌻', need: 10 },
  { name: 'Whispering Forest', emoji: '🌲', need: 30 },
  { name: 'Wobbly Bridge', emoji: '🌉', need: 60 },
  { name: 'Misty Mountain', emoji: '⛰️', need: 100 },
  { name: 'Sparkle Caves', emoji: '💎', need: 160 },
  { name: 'Rainbow Falls', emoji: '🌈', need: 240 },
  { name: 'Cloud Castle', emoji: '🏰', need: 340 },
  { name: 'Starry Summit', emoji: '⭐', need: 460 },
];

function totalPoses() {
  return store.get('players').reduce((sum, p) => sum + (stats.forPlayer(p.id).posesCompleted || 0), 0);
}

export default {
  id: 'journey',
  mount(container) {
    const total = totalPoses();
    const nextIdx = STOPS.findIndex((s) => total < s.need);
    const view = el('div.subscreen', {}, [
      backHeader('🗺️ Adventure Map', { text: 'This is your family\'s big yoga journey! Every pose everyone does moves you along the map. New places — meadows, mountains, castles — unlock as you practice more together. There\'s nothing to tap here; just play games and watch new stops light up. 🌟' }),
      el('p.journey-total', {}, `Your family has struck ${total} poses together!`),
      el('div.journey-path', {}, STOPS.map((s, i) => {
        const unlocked = total >= s.need;
        const current = i === (nextIdx === -1 ? STOPS.length - 1 : nextIdx - 1);
        return el('div.journey-stop', { class: `journey-stop ${unlocked ? 'is-unlocked' : 'is-locked'} ${current ? 'is-current' : ''}` }, [
          el('div.journey-emoji', {}, unlocked ? s.emoji : '🔒'),
          el('div.journey-name', {}, unlocked ? s.name : '???'),
          el('div.journey-need', {}, unlocked ? (current ? 'You are here!' : 'Unlocked') : `${s.need} poses`),
        ]);
      })),
    ]);
    container.append(view);
  },
};

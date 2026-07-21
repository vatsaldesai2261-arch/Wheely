// Admin dashboard — hub for grown-up tools.
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import auth from '../../admin/auth.js';
import poseLoader from '../../data/pose-loader.js';

function card(icon, label, sub, target) {
  return el('button.admin-card.glass', { type: 'button', onClick: () => { audio.play('tap'); router.go(target); } }, [
    el('span.admin-icon', {}, icon), el('span.admin-label', {}, label), el('span.admin-sub', {}, sub),
  ]);
}

export default {
  id: 'admin-dashboard',
  mount(container) {
    const players = store.get('players');
    const view = el('div.subscreen', {}, [
      el('header.sub-head', {}, [
        el('button.btn.btn-ghost', { type: 'button', onClick: () => { auth.lock(); audio.play('tap'); router.go('home'); } }, '🔒 Lock & Exit'),
        el('h1', {}, '🛠️ Grown-Up Zone'),
      ]),
      el('div.admin-grid', {}, [
        card('👧', 'Players', `${players.length} players`, 'admin-players'),
        card('🧘', 'Pose Library', `${poseLoader.count()} poses`, 'admin-poses'),
        card('🎡', 'Wheel Builder', `${store.get('wheels').length} custom wheels`, 'admin-wheels'),
        card('🏆', 'Goals', `${store.get('goalTemplates').length} goals`, 'admin-goals'),
        card('⏱️', 'Timers & Rules', 'Pose & game timers', 'admin-settings'),
        card('💾', 'Backup & Restore', 'Save or load data', 'admin-backup'),
      ]),
    ]);
    container.append(view);
  },
};

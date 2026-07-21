// Home hub. Big Play button + navigation tiles. The logo is the hidden admin
// gesture (5 taps within 3s → password modal).
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import auth from '../../admin/auth.js';
import { requireUnlock } from '../../admin/gate.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { t } from '../../core/strings.js';

let tapTimes = [];

function tile(icon, label, target, opts = {}) {
  return el('button.home-tile.glass', {
    type: 'button',
    onClick: () => { audio.play('tap'); opts.onClick ? opts.onClick() : router.go(target); },
  }, [
    el('span.tile-icon', { 'aria-hidden': 'true' }, icon),
    el('span.tile-label', {}, label),
  ]);
}

function openAdminLogin() {
  requireUnlock(() => router.go('admin-dashboard'));
}

function handleLogoTap() {
  const now = performance.now();
  tapTimes = tapTimes.filter((x) => now - x < 3000);
  tapTimes.push(now);
  if (tapTimes.length >= 5) { tapTimes = []; audio.play('pop'); openAdminLogin(); }
}

export default {
  id: 'home',
  mount(container) {
    const players = store.get('players');
    const logo = el('button.home-logo', { type: 'button', 'aria-label': t('appName'), onClick: handleLogoTap }, [
      el('span.logo-wheel', { 'aria-hidden': 'true' }, '🎡'),
      el('span.logo-text', {}, 'Yoga Wheel'),
    ]);

    const view = el('div.home', {}, [
      el('header.home-header', {}, [logo]),
      el('div.home-hero', {}, [
        el('button.btn.btn-primary.btn-xl.home-play', { type: 'button', onClick: () => { audio.play('select'); router.go('setup'); } }, [
          el('span', { 'aria-hidden': 'true' }, '🎡 '), t('play'),
        ]),
        el('p.home-sub', {}, players.length ? `${players.length} yogi${players.length > 1 ? 's' : ''} ready to play!` : 'Add players in the Grown-Up Zone, or just start playing!'),
      ]),
      el('nav.home-tiles', { 'aria-label': 'Menu' }, [
        tile('📖', t('howToPlay'), 'tutorial'),
        tile('🏆', t('leaderboard'), 'leaderboard'),
        tile('🎖️', t('achievements'), 'achievements'),
        tile('🛍️', 'Shop', 'shop'),
        tile('📔', 'Stickers', 'album'),
        tile('📊', t('statistics'), 'statistics'),
        tile('⚙️', t('settings'), 'settings'),
      ]),
      el('p.home-parent-hint', {}, '🔒 Grown-ups: tap the Yoga Wheel logo 5 times to open Setup.'),
    ]);
    container.append(view);
  },
};

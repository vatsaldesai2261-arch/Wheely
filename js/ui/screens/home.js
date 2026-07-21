// Home hub. Big Play button + navigation tiles. The logo is the hidden admin
// gesture (5 taps within 3s → password modal).
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import auth from '../../admin/auth.js';
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
  const input = el('input.text-input', { type: 'password', placeholder: 'Password', autocomplete: 'off', inputmode: 'text', 'aria-label': 'Admin password' });
  const err = el('p.form-error', { role: 'alert' }, '');
  const body = el('div', {}, [
    el('p', {}, 'This area is for grown-ups. Enter the password to continue.'),
    input, err,
  ]);
  const controller = modal({
    title: '🔒 Grown-Up Zone',
    body,
    actions: [
      { label: t('cancel'), variant: 'btn-secondary' },
      {
        label: 'Unlock', variant: 'btn-primary', closeOnClick: false,
        onClick: async () => {
          const ok = await auth.tryUnlock(input.value);
          if (ok) { audio.play('ding'); controller.close(); router.go('admin-dashboard'); }
          else { err.textContent = 'Wrong password — try again.'; input.value = ''; input.focus(); audio.play('encourage'); }
          return true;
        },
      },
    ],
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') body.parentElement.querySelector('.btn-primary').click(); });
  setTimeout(() => input.focus(), 100);
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
        tile('📊', t('statistics'), 'statistics'),
        tile('⚙️', t('settings'), 'settings'),
      ]),
    ]);
    container.append(view);
  },
};

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
import poseLoader from '../../data/pose-loader.js';
import { svgSceneFor } from '../../data/pose-art.js';
import { t } from '../../core/strings.js';

function poseOfTheDay() {
  const all = poseLoader.filterPoses({ difficulties: ['easy', 'medium'], includeAdvanced: false });
  if (!all.length) return null;
  const d = new Date();
  const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 40 + d.getDate();
  return all[seed % all.length];
}

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

function potdCard() {
  const pose = poseOfTheDay();
  if (!pose) return null;
  const card = el('button.potd-card.glass', { type: 'button', onClick: () => { audio.play('select'); router.go('setup'); } }, [
    el('div.potd-art', { html: svgSceneFor(pose) }),
    el('div.potd-info', {}, [
      el('span.potd-kicker', {}, '⭐ Pose of the Day'),
      el('span.potd-name', {}, pose.english),
      el('span.potd-sub', {}, 'Tap to practice!'),
    ]),
  ]);
  return card;
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
    const logo = el('button.home-logo', { type: 'button', 'aria-label': `${t('appName')} — grown-up menu`, onClick: handleLogoTap }, [
      el('img.logo-mark', { src: './assets/brand/kaya-haus-mark.png', alt: '', 'aria-hidden': 'true' }),
      el('img.logo-word', { src: './assets/brand/kaya-haus-word.png', alt: t('appName') }),
    ]);

    const view = el('div.home', {}, [
      el('header.home-header', {}, [logo]),
      el('div.home-hero', {}, [
        el('button.btn.btn-primary.btn-xl.home-play', { type: 'button', onClick: () => { audio.play('select'); router.go('setup'); } }, [
          el('span', { 'aria-hidden': 'true' }, '🎡 '), t('play'),
        ]),
        el('p.home-sub', {}, players.length ? `${players.length} yogi${players.length > 1 ? 's' : ''} ready to play!` : 'Add players in the Grown-Up Zone, or just start playing!'),
      ]),
      potdCard(),
      el('h2.home-section-title', {}, '🧘 Mini-Games'),
      el('p.home-section-sub', {}, 'Quick yoga games — no wheel, just play!'),
      el('nav.home-tiles', { 'aria-label': 'Mini-Games' }, [
        tile('⏱️', 'Pose Rush', 'pose-rush'),
        tile('🚦', 'Red Light Green Light', 'red-light'),
        tile('🅱️', 'Yoga Bingo', 'yoga-bingo'),
        tile('🪞', 'Copycat Mirror', 'copycat'),
        tile('🙊', 'Yogi Says', 'yogi-says'),
        tile('🕺', 'Freeze Dance', 'freeze-dance'),
        tile('🧠', 'Pose Memory', 'pose-memory'),
        tile('🦩', 'Balance Statue', 'balance-statue'),
        tile('🎲', 'Pose Dice', 'pose-dice'),
        tile('🃏', 'Match the Pose', 'pose-match'),
        tile('🔎', 'Guess the Pose', 'guess-pose'),
        tile('🌬️', 'Breathing Games', 'breathing'),
        tile('☀️', 'Sun Salutation', 'sun-flow'),
        tile('😊', 'Feelings Yoga', 'feelings-yoga'),
      ]),
      el('h2.home-section-title', {}, '📚 More'),
      el('nav.home-tiles', { 'aria-label': 'Menu' }, [
        tile('📖', t('howToPlay'), 'tutorial'),
        tile('🗺️', 'Adventure Map', 'journey'),
        tile('🏆', t('leaderboard'), 'leaderboard'),
        tile('🎖️', t('achievements'), 'achievements'),
        tile('🛍️', 'Shop', 'shop'),
        tile('📔', 'Stickers', 'album'),
        tile('🖼️', 'Photos', 'gallery'),
        tile('📊', t('statistics'), 'statistics'),
        tile('⚙️', t('settings'), 'settings'),
      ]),
    ]);
    container.append(view);
  },
};

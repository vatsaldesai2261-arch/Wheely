// Entry point: boot data, register screens, wire the router, install the SW.
import store from './core/store.js';
import router from './core/router.js';
import audio from './core/audio.js';
import { on } from './core/bus.js';
import poseLoader from './data/pose-loader.js';
import auth from './admin/auth.js';
import achievements from './rewards/achievements.js';
import goals from './rewards/goals.js';
import stickers from './rewards/stickers.js';
import quests from './rewards/quests.js';
import theme from './core/theme.js';
import settings from './core/settings.js';
import { toast } from './ui/components/toast.js';
import { burst } from './ui/components/confetti.js';
import { mysteryBox } from './ui/components/mystery-box.js';
import { el } from './core/dom.js';

import splash from './ui/screens/splash.js';
import home from './ui/screens/home.js';
import tutorial from './ui/screens/tutorial.js';
import setup from './ui/screens/setup.js';
import game from './ui/screens/game.js';
import results from './ui/screens/results.js';
import leaderboard from './ui/screens/leaderboard.js';
import achievementsScreen from './ui/screens/achievements.js';
import statistics from './ui/screens/statistics.js';
import settingsScreen from './ui/screens/settings.js';
import shopScreen from './ui/screens/shop.js';
import albumScreen from './ui/screens/album.js';
import journeyScreen from './ui/screens/journey.js';
import galleryScreen from './ui/screens/gallery.js';
import calmScreen from './ui/screens/calm.js';
import adminDashboard from './ui/screens/admin-dashboard.js';
import adminPlayers from './ui/screens/admin-players.js';
import adminPoses from './ui/screens/admin-poses.js';
import adminWheels from './ui/screens/admin-wheels.js';
import adminGoals from './ui/screens/admin-goals.js';
import adminSettings from './ui/screens/admin-settings.js';
import adminBackup from './ui/screens/admin-backup.js';

const SCREENS = [
  splash, home, tutorial, setup, game, results, leaderboard,
  achievementsScreen, statistics, settingsScreen, shopScreen, albumScreen, journeyScreen, galleryScreen, calmScreen,
  adminDashboard, adminPlayers, adminPoses, adminWheels, adminGoals, adminSettings, adminBackup,
];

async function boot() {
  store.seedDefaults();
  await auth.init();
  await achievements.init();
  goals.init();
  stickers.init();
  quests.loadPool().catch(() => {});
  theme.init();

  // Background music: start after the first gesture when enabled.
  window.addEventListener('pointerdown', () => { if (settings.getSetting('music')) audio.startMusic(); }, { once: true });
  on('settings:changed', ({ key, value }) => { if (key === 'music') value ? audio.startMusic() : audio.stopMusic(); });

  const rootEl = document.getElementById('screen-root');
  router.init(rootEl);
  SCREENS.forEach((s) => router.register(s));

  // Guard admin routes: must be unlocked.
  router.setGuard((id) => {
    if (id.startsWith('admin-') && id !== 'admin-login' && !auth.isUnlocked()) return 'home';
    return true;
  });

  // First user gesture unlocks Web Audio (iOS).
  const unlock = () => { audio.unlock(); window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock, { once: true });

  // Auto-pause game when tab is hidden (kid safety + timer fairness).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) import('./game/engine.js').then((m) => m.default.pauseIfPlaying?.());
  });

  // Storage feedback
  on('store:quota', () => toast('Storage is full! Try exporting a backup or removing pose photos.', { icon: '⚠️', duration: 5000, tone: 'warn' }));
  on('store:unavailable', () => toast("Heads up: progress won't be saved in private mode.", { icon: 'ℹ️', duration: 5000, tone: 'warn' }));

  // Reward celebrations
  on('achievement:unlocked', ({ achievement }) => {
    toast(`Achievement: ${achievement.name}!`, { icon: achievement.icon, duration: 3500 });
    burst({ count: 60, origin: { x: 0.5, y: 0.2 } });
  });
  on('player:levelup', ({ player, belt }) => beltCeremony(player, belt));
  on('sticker:earned', ({ sticker }) => {
    toast(`New sticker: ${sticker.name}!`, { icon: sticker.emoji, duration: 3200 });
  });
  on('shop:bought', ({ item }) => burst({ count: 40, origin: { x: 0.5, y: 0.5 } }));
  on('quest:claimed', ({ quest }) => burst({ count: 50, origin: { x: 0.5, y: 0.3 } }));

  // Custom goal reached → mystery box with the grown-up's reward.
  on('goal:reached', ({ player, reward, goalName }) => {
    mysteryBox({ reward: { emoji: '🏆', text: reward ? `${player.name}, you earned: ${reward}!` : `${player.name} reached ${goalName || 'their goal'}!` } });
    toast(`${player.name} reached ${goalName || 'a goal'}! 🏆`, { icon: '🏆', duration: 4000 });
  });

  // Load poses in the background; splash waits on it.
  poseLoader.load().catch((e) => { console.error('pose load failed', e); toast('Could not load poses.', { icon: '⚠️', tone: 'warn' }); });

  router.start();
  registerSW();
}

function beltCeremony(player, belt) {
  burst({ count: 140, origin: { x: 0.5, y: 0.4 } });
  const overlay = el('div.belt-ceremony', { role: 'dialog', 'aria-label': `${player.name} earned ${belt.name}` }, [
    el('div.belt-badge', {}, belt.emoji || '🥋'),
    el('h1.belt-name', {}, belt.name + '!'),
    el('p', {}, `Amazing, ${player.name}!`),
    el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => overlay.remove() }, 'Yay! 🎉'),
  ]);
  document.body.append(overlay);
  import('./core/audio.js').then((m) => m.default.play('levelup'));
  setTimeout(() => overlay.isConnected && overlay.remove(), 6000);
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch((e) => console.warn('SW registration failed', e));
    });
  }
}

boot();

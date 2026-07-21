// Yoga Adventure Wheel — offline service worker.
// Cache-first for the app shell + data; navigation falls back to cached index.
// RELEASE CHECKLIST: bump CACHE_VERSION whenever any precached file changes.
const CACHE_VERSION = 'wheely-v8';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/brand/kaya-haus-mark.png',
  './assets/brand/kaya-haus-word.png',
  // CSS
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './css/animations.css',
  // Fonts
  './assets/fonts/fredoka-latin.woff2',
  './assets/fonts/baloo2-latin.woff2',
  './assets/fonts/baloo2-devanagari.woff2',
  // Core JS
  './js/app.js',
  './js/core/bus.js',
  './js/core/dom.js',
  './js/core/store.js',
  './js/core/settings.js',
  './js/core/router.js',
  './js/core/audio.js',
  './js/core/speech.js',
  './js/core/strings.js',
  './js/core/media.js',
  './js/core/theme.js',
  // Data
  './js/data/pose-loader.js',
  './js/data/pose-art.js',
  './js/data/yogi.js',
  // Game
  './js/game/session.js',
  './js/game/pool.js',
  './js/game/wheel.js',
  './js/game/timer.js',
  './js/game/engine.js',
  './js/game/modes/index.js',
  './js/game/modes/classic.js',
  './js/game/modes/family.js',
  './js/game/modes/classroom.js',
  './js/game/modes/animal.js',
  './js/game/modes/story.js',
  './js/game/modes/daily.js',
  './js/game/modes/belt-test.js',
  './js/game/modes/team.js',
  './js/game/modes/freeze.js',
  './js/game/modes/balance-boss.js',
  './js/game/modes/speedy.js',
  './js/game/modes/buddy.js',
  './js/game/modes/journey.js',
  // Rewards / stats
  './js/rewards/rewards.js',
  './js/rewards/achievements.js',
  './js/rewards/goals.js',
  './js/rewards/shop.js',
  './js/rewards/quests.js',
  './js/rewards/stickers.js',
  './js/stats/stats.js',
  './js/ui/components/avatar.js',
  './js/ui/components/pose-picker.js',
  // Admin
  './js/admin/auth.js',
  './js/admin/backup.js',
  './js/admin/gate.js',
  // UI components
  './js/ui/components/modal.js',
  './js/ui/components/toast.js',
  './js/ui/components/confetti.js',
  './js/ui/components/pose-card.js',
  './js/ui/components/countdown.js',
  './js/ui/components/avatar-picker.js',
  './js/ui/components/breathing.js',
  './js/ui/components/mascot.js',
  './js/ui/components/mystery-box.js',
  './js/ui/components/certificate.js',
  './js/ui/components/help.js',
  './js/ui/components/badge-sheet.js',
  './js/ui/components/report-card.js',
  // UI screens
  './js/ui/screens/splash.js',
  './js/ui/screens/home.js',
  './js/ui/screens/tutorial.js',
  './js/ui/screens/setup.js',
  './js/ui/screens/game.js',
  './js/ui/screens/results.js',
  './js/ui/screens/leaderboard.js',
  './js/ui/screens/achievements.js',
  './js/ui/screens/statistics.js',
  './js/ui/screens/settings.js',
  './js/ui/screens/shop.js',
  './js/ui/screens/album.js',
  './js/ui/screens/journey.js',
  './js/ui/screens/gallery.js',
  './js/ui/screens/calm.js',
  // Standalone mini-games
  './js/ui/screens/game-kit.js',
  './js/ui/screens/game-yogi-says.js',
  './js/ui/screens/game-freeze-dance.js',
  './js/ui/screens/game-pose-memory.js',
  './js/ui/screens/game-balance-statue.js',
  './js/ui/screens/game-breathing.js',
  './js/ui/screens/game-sun-flow.js',
  './js/ui/screens/game-guess-pose.js',
  './js/ui/screens/game-pose-dice.js',
  './js/ui/screens/game-pose-match.js',
  './js/ui/screens/game-feelings.js',
  './js/ui/screens/game-pose-rush.js',
  './js/ui/screens/game-red-light.js',
  './js/ui/screens/game-yoga-bingo.js',
  './js/ui/screens/game-copycat.js',
  './js/ui/screens/admin-dashboard.js',
  './js/ui/screens/admin-goals.js',
  './js/ui/screens/admin-players.js',
  './js/ui/screens/admin-poses.js',
  './js/ui/screens/admin-wheels.js',
  './js/ui/screens/admin-settings.js',
  './js/ui/screens/admin-backup.js',
  // Data files
  './data/poses/index.json',
  './data/poses/standing.json',
  './data/poses/seated.json',
  './data/poses/balance.json',
  './data/poses/backbend.json',
  './data/poses/forward-fold.json',
  './data/poses/twist.json',
  './data/poses/core.json',
  './data/poses/inversion.json',
  './data/poses/animal-play.json',
  './data/poses/partner-group.json',
  './data/poses/restorative.json',
  './data/poses/warmup-fun.json',
  './data/belts.json',
  './data/achievements.json',
  './data/stories.json',
  './data/animals.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Add individually so one 404 can't abort the whole precache.
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let cross-origin pass through

  // Navigations → cached app shell (hash router lives inside index.html).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

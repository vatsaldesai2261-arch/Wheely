# 🎡 Yoga Adventure Wheel

A joyful, **offline-first** yoga game for kids. Spin the wheel, strike a pose, hold it while the timer runs, and a grown-up cheers you on. Earn XP, coins, belts and badges along the way.

Built as an installable **Progressive Web App** — iPad-first, works fully offline, zero runtime dependencies (no frameworks, no CDN).

## ✨ Features

- **525+ yoga poses** across 12 groups, each with a fun spoken-style kid explanation, Sanskrit name (Devanagari + Latin), fun fact, benefits and a mini-story.
- **6 game modes** — Classic, Animal Adventure, Story Adventure, Daily Challenge, Family, Classroom.
- **Spin-the-wheel** gameplay with anti-repeat logic (no pose repeats until the pool is exhausted; "needs practice" poses come back).
- **Multiple players** with avatars, ages, goal presets, XP, coins and belts (White → Black).
- **Rewards** — XP, coins, session stars, a 9-belt ladder with a belt ceremony, and ~35 achievements.
- **Monitor-controlled** pass / needs-practice — a grown-up decides each outcome. Positive language only.
- **Hidden Grown-Up Zone** (tap the home logo 5×) — manage players, poses, wheels, timers, backups and the password.
- **Voice narration** (optional) — the device reads poses aloud via the Web Speech API.
- **Statistics & leaderboard** dashboards.
- **Kid-safety** — Advanced poses (headstands, deep backbends) are hidden from wheels by default; safety notes on hard poses.
- **Accessibility** — AA contrast, large touch targets, `aria-live` announcements, keyboard operable, reduced-motion support.
- Fully offline via a service worker; all data in `localStorage`; backup/restore to a JSON file.

## 🏗️ Architecture

No build step — plain ES modules, served as-is.

```
index.html            single page; screens are swapped by a hash router
service-worker.js     versioned precache, cache-first, offline navigation fallback
css/                  tokens, base, components, screens, animations
js/core/              store (localStorage), router, bus, dom, audio, speech, settings, strings
js/data/              pose-loader (built-in ⊕ user overlay), pose-art (SVG/emoji/image)
js/game/              engine (FSM), pool (anti-repeat), wheel (SVG), timer, session, modes/
js/rewards/           rewards (XP/belts), achievements
js/stats/             stats aggregates + leaderboard
js/admin/             auth (SHA-256 gate), backup
js/ui/                screens/ + components/ (modal, toast, confetti, pose-card, ...)
data/                 poses/ (12 shards + index), belts, achievements, stories, animals
tools/                validate-data.mjs (CI data validator)
```

## 🚀 Running locally

Because the PWA is designed to live at `/Wheely/` (GitHub Pages project path) and uses relative paths, serve it from the **parent** directory:

```bash
# from the directory that CONTAINS the Wheely/ folder
python3 -m http.server 8000
# then open http://localhost:8000/Wheely/
```

Default admin password: **`admin`** (change it in the Grown-Up Zone → Timers & Rules).

## ✅ Validating the dataset

```bash
node tools/validate-data.mjs
```

Checks: ≥500 unique poses, required fields, valid difficulties, safety notes on hard/advanced poses.

## 📦 Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which validates the dataset and publishes to GitHub Pages. **One-time setup:** in the repo, go to *Settings → Pages → Source → GitHub Actions*.

Once live, open the URL on an iPad in Safari and tap *Share → Add to Home Screen* to install. After the first load it works fully offline.

## 🔒 A note on the admin password

The password only keeps curious kids out — it's a SHA-256 hash in `localStorage`, so a grown-up with browser dev tools can still get in. Don't store anything sensitive.

// Setup — choose adventure (mode), players, and a wheel, then start the game.
import { el, clear } from '../../core/dom.js';
import router from '../../core/router.js';
import store from '../../core/store.js';
import audio from '../../core/audio.js';
import settings from '../../core/settings.js';
import { MODE_LIST, getMode } from '../../game/modes/index.js';
import engine from '../../game/engine.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { requireUnlock } from '../../admin/gate.js';
import { avatarEl } from '../components/avatar.js';
import daily from '../../game/modes/daily.js';
import storyMode from '../../game/modes/story.js';

let chosenMode = 'classic';
let chosenPlayers = [];
let chosenWheel = null;
let chosenStory = null;

export default {
  id: 'setup',
  needsLandscape: true,
  mount(container) {
    chosenMode = 'classic'; chosenWheel = null; chosenStory = null;
    // Pre-select the players toggled "active" so grown-ups can just hit Play.
    chosenPlayers = store.get('players').filter((p) => p.active !== false).map((p) => p.id);
    const view = el('div.setup', {}, [
      el('header.setup-head', {}, [
        el('button.btn.btn-ghost', { type: 'button', onClick: () => { audio.play('tap'); router.go('home'); } }, '← Home'),
        el('h1', {}, 'New Adventure'),
      ]),
      el('section.setup-section', {}, [el('h2', {}, '1 · Choose an Adventure'), renderModes()]),
      el('section.setup-section', { id: 'players-section' }, [el('h2', {}, '2 · Who is playing?'), renderPlayers()]),
      el('section.setup-section', { id: 'wheel-section' }, [el('h2', {}, '3 · Pick a Wheel'), renderWheels()]),
      el('div.setup-start', {}, [
        el('button.btn.btn-primary.btn-xl', { id: 'start-btn', type: 'button', onClick: startGame }, '🎡 Start Playing!'),
      ]),
    ]);
    container.append(view);
    refreshPlayers();
  },
};

function renderModes() {
  const grid = el('div.mode-grid');
  MODE_LIST.forEach((m) => {
    const btn = el('button.mode-card.glass', {
      type: 'button', dataset: { mode: m.id },
      onClick: () => selectMode(m.id, grid),
    }, [
      el('span.mode-icon', {}, m.icon),
      el('span.mode-name', {}, m.name),
      el('span.mode-blurb', {}, m.blurb),
    ]);
    if (m.id === chosenMode) btn.classList.add('is-selected');
    grid.append(btn);
  });
  return grid;
}

async function selectMode(id, grid) {
  chosenMode = id;
  audio.play('select');
  [...grid.children].forEach((c) => c.classList.toggle('is-selected', c.dataset.mode === id));
  // Story mode → pick a story
  if (id === 'story') {
    const stories = await storyMode.loadStories();
    pickStory(stories);
  }
  document.getElementById('wheel-section').style.display = (id === 'daily' || id === 'story') ? 'none' : '';
}

function pickStory(stories) {
  const list = el('div.story-list', {}, stories.map((s) =>
    el('button.story-choice.glass', { type: 'button', onClick: () => { chosenStory = s; audio.play('tap'); ctrl.close(); toast(`${s.emoji} ${s.title} selected`, { icon: '📖' }); } }, [
      el('span.story-emoji', {}, s.emoji), el('span.story-title', {}, s.title), el('span.story-cover', {}, s.cover),
    ])
  ));
  const ctrl = modal({ title: '📖 Choose a Story', body: list, dismissable: true, actions: [] });
}

function renderPlayers() {
  return el('div', { id: 'players-list' });
}

function refreshPlayers() {
  const wrap = document.getElementById('players-list');
  if (!wrap) return;
  clear(wrap);
  const players = store.get('players');
  if (!players.length) {
    wrap.append(el('div.empty-hint', {}, [
      el('p', {}, 'No players yet! Add one to track XP and belts — or play a quick guest game.'),
    ]));
  }
  const grid = el('div.player-pick-grid');
  players.forEach((p) => {
    const btn = el('button.player-pick.glass', {
      type: 'button', dataset: { id: p.id },
      onClick: () => togglePlayer(p.id, btn),
    }, [
      avatarEl(p.avatar, { size: 40, className: 'pp-avatar' }),
      el('span.pp-name', {}, p.name),
      el('span.pp-belt', {}, p.belt || 'White Belt'),
    ]);
    if (chosenPlayers.includes(p.id)) btn.classList.add('is-selected');
    grid.append(btn);
  });
  // Quick add + guest
  grid.append(el('button.player-pick.player-add', { type: 'button', onClick: quickAddPlayer }, [
    el('span.pp-avatar', {}, '➕'), el('span.pp-name', {}, 'Add Player'),
  ]));
  wrap.append(grid);
}

function togglePlayer(id, btn) {
  audio.play('tap');
  const i = chosenPlayers.indexOf(id);
  if (i >= 0) chosenPlayers.splice(i, 1); else chosenPlayers.push(id);
  btn.classList.toggle('is-selected');
}

function quickAddPlayer() {
  audio.play('tap');
  // Player management lives in the grown-up area; ask for the password, then go.
  requireUnlock(() => router.go('admin-players'));
}

function renderWheels() {
  const wrap = el('div', { id: 'wheels-list' });
  const wheels = store.get('wheels');
  const grid = el('div.wheel-pick-grid');
  // Default "Everything" wheel
  grid.append(wheelCard({ id: 'all', name: 'Surprise Me!', emoji: '🎲', categories: [], difficulties: ['easy', 'medium', 'hard'], includeAdvanced: false }));
  wheels.forEach((w) => grid.append(wheelCard(w)));
  if (chosenWheel === null) chosenWheel = { id: 'all', name: 'Surprise Me!', categories: [], difficulties: ['easy', 'medium', 'hard'], includeAdvanced: false };
  wrap.append(grid);
  return wrap;
}

function wheelCard(w) {
  const btn = el('button.wheel-card.glass', {
    type: 'button', dataset: { id: w.id },
    onClick: () => { chosenWheel = w; audio.play('select'); document.querySelectorAll('.wheel-card').forEach((c) => c.classList.toggle('is-selected', c.dataset.id === w.id)); },
  }, [
    el('span.wc-emoji', {}, w.emoji || '🎡'),
    el('span.wc-name', {}, w.name),
    el('span.wc-meta', {}, w.categories?.length ? `${w.categories.length} categories` : 'All poses'),
  ]);
  if (chosenWheel?.id === w.id) btn.classList.add('is-selected');
  return btn;
}

function startGame() {
  const players = chosenPlayers.length
    ? store.get('players').filter((p) => chosenPlayers.includes(p.id))
    : [{ id: 'guest', name: 'Guest', avatar: '🧘', xp: 0, coins: 0, belt: 'White Belt' }];

  if (chosenMode === 'story' && !chosenStory) { toast('Pick a story first! 📖', { icon: '📖', tone: 'warn' }); return; }
  if (chosenMode === 'daily') {
    // guest can't be blocked; scored-once handled in results
  }

  const wheelConfig = {
    ...(chosenWheel || { id: 'all', categories: [], difficulties: ['easy', 'medium', 'hard'] }),
    includeAdvanced: (chosenWheel?.includeAdvanced) ?? settings.includeAdvanced(),
    story: chosenStory,
  };

  audio.play('go');
  engine.start({ modeId: chosenMode, wheelConfig, players });
  router.go('game');
}

// Results — per-player stars/XP/coins, mode extras, and session recording.
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import engine from '../../game/engine.js';
import stats from '../../stats/stats.js';
import achievements from '../../rewards/achievements.js';
import { burst } from '../components/confetti.js';
import { t } from '../../core/strings.js';

export default {
  id: 'results',
  needsLandscape: true,
  mount(container) {
    const summary = engine.getLastSummary();
    if (!summary) { router.go('home'); return; }

    // Record stats + session achievements once.
    if (!summary._recorded) {
      summary._recorded = true;
      summary.players.forEach((p) => {
        stats.recordSession(p, { mode: summary.mode, durationSec: summary.durationSec });
        achievements.evaluateSession(p.id, { completed: p.completed, missed: p.missed });
      });
    }

    const view = el('div.results', {}, [
      el('h1.results-title', {}, '🎉 Great Job!'),
      el('div.results-players', {}, summary.players.map(playerResult)),
      renderExtras(summary.extras),
      el('div.results-actions', {}, [
        el('button.btn.btn-secondary', { type: 'button', onClick: () => { audio.play('tap'); router.go('home'); } }, t('home')),
        el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { audio.play('select'); router.go('setup'); } }, t('playAgain')),
      ]),
    ]);
    container.append(view);
    setTimeout(() => burst({ count: 90, origin: { x: 0.5, y: 0.3 } }), 250);
    audio.play('fanfare');
  },
};

function stars(n) {
  return el('div.star-row', { 'aria-label': `${n} stars` },
    [1, 2, 3].map((i) => el('span.star', { class: i <= n ? 'star on' : 'star' }, i <= n ? '⭐' : '☆')));
}

function playerResult(p) {
  return el('div.result-card.glass', {}, [
    el('div.rc-head', {}, [el('span.rc-avatar', {}, p.avatar || '🧘'), el('span.rc-name', {}, p.name)]),
    stars(p.stars),
    el('div.rc-stats', {}, [
      el('span', {}, `✅ ${p.completed}`),
      el('span', {}, `💪 ${p.missed}`),
      el('span', {}, `✨ ${p.xp} XP`),
      el('span', {}, `🪙 ${p.coins}`),
    ]),
    p.bestStreak >= 3 ? el('div.rc-streak', {}, `🔥 Best streak: ${p.bestStreak}`) : null,
  ]);
}

function renderExtras(extras) {
  if (!extras) return null;
  if (extras.type === 'animal-collection') {
    const groups = Object.entries(extras.rescued || {});
    if (!groups.length) return null;
    return el('div.extras.glass', {}, [
      el('h2', {}, '🦁 Animals Rescued!'),
      ...groups.map(([pid, list]) => el('div.rescue-row', {}, (list || []).map((a) => el('span.rescue-animal', { title: a.name }, a.emoji)))),
    ]);
  }
  if (extras.type === 'story') {
    return el('div.extras.glass', {}, [
      el('h2', {}, `${extras.emoji} ${extras.title}`),
      el('p', {}, `Chapters completed: ${extras.chaptersDone} / ${extras.chaptersTotal}`),
    ]);
  }
  if (extras.type === 'daily') {
    return el('div.extras.glass', {}, [el('h2', {}, '🎯 Daily Challenge Complete!'), el('p', {}, `You did all ${extras.poses} poses today!`)]);
  }
  if (extras.group) {
    return el('div.extras.glass', {}, [el('h2', {}, extras.headline)]);
  }
  return null;
}

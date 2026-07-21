// Results — per-player stars/XP/coins, mode extras, and session recording.
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import engine from '../../game/engine.js';
import stats from '../../stats/stats.js';
import achievements from '../../rewards/achievements.js';
import { burst } from '../components/confetti.js';
import shop from '../../rewards/shop.js';
import goals from '../../rewards/goals.js';
import store from '../../core/store.js';
import { avatarEl } from '../components/avatar.js';
import { printCertificate } from '../components/certificate.js';
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
        el('button.btn.btn-secondary', { type: 'button', onClick: () => { audio.play('tap'); router.go('calm'); } }, '😌 Calm Down'),
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

function avatarStack(playerId, avatar) {
  const cos = shop.equippedItems ? shop.equippedItems(playerId) : {};
  return el('span.avatar-stack.rc-avatar', {}, [
    avatarEl(avatar, { size: 48 }),
    cos.hat ? el('span.avatar-hat', {}, cos.hat.emoji) : null,
    cos.pet ? el('span.avatar-pet', {}, cos.pet.emoji) : null,
  ]);
}

function goalChip(playerId) {
  const player = store.get('players').find((x) => x.id === playerId);
  if (!player?.goal) return null;
  const pr = goals.progress(player);
  if (!pr) return null;
  return el('div.goal-chip', {}, pr.reached ? `🏆 Goal reached: ${player.goal.reward || 'Yay!'}` : `🎯 Goal: ${pr.value}/${pr.target}`);
}

function playerResult(p) {
  return el('div.result-card.glass', {}, [
    el('div.rc-head', {}, [avatarStack(p.id, p.avatar), el('span.rc-name', {}, p.name)]),
    stars(p.stars),
    goalChip(p.id),
    p.id !== 'guest' ? el('button.btn.btn-ghost.cert-btn', { type: 'button', onClick: () => printCertificate(store.get('players').find((x) => x.id === p.id) || { name: p.name, xp: p.xp }) }, '🏅 Certificate') : null,
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
  if (extras.type === 'belt-test') {
    return el('div.extras.glass', {}, [
      el('h2', {}, extras.passed ? '🥋 Belt Test PASSED!' : '🥋 Belt Test'),
      el('p', {}, extras.passed ? `Amazing! You passed ${extras.best} of ${extras.total} poses. On to the next belt! 🎉` : `You did ${extras.best} of ${extras.total}. So close — try again to pass!`),
    ]);
  }
  if (extras.type === 'team') {
    const names = extras.names || { A: 'Team A', B: 'Team B' };
    const scores = extras.scores || { A: 0, B: 0 };
    const rosters = extras.rosters || {};
    return el('div.extras.glass', {}, [
      el('h2', {}, `🏆 ${extras.winner || ''}`),
      el('div.team-scores', {}, [
        el('div.team-score', {}, [el('span.ts-name', {}, names.A), el('span.ts-pts', {}, `${scores.A || 0} pts`), el('span.ts-roster', {}, (rosters.A || []).join(', '))]),
        el('div.team-vs', {}, 'vs'),
        el('div.team-score', {}, [el('span.ts-name', {}, names.B), el('span.ts-pts', {}, `${scores.B || 0} pts`), el('span.ts-roster', {}, (rosters.B || []).join(', '))]),
      ]),
    ]);
  }
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
  if (extras.type === 'freeze') {
    return el('div.extras.glass', {}, [el('h2', {}, '🕺 Freeze Dance!'), el('p', {}, `You froze into ${extras.poses || 0} cool poses. What a dancer! 🥶`)]);
  }
  if (extras.type === 'balance') {
    return el('div.extras.glass', {}, [el('h2', {}, '🦩 Balance Boss!'), el('p', {}, extras.steady > 2 ? `Super steady — ${extras.steady} balances in a row! 🌟` : 'Wibble wobble — keep practising your balance!')]);
  }
  if (extras.type === 'speedy') {
    return el('div.extras.glass', {}, [el('h2', {}, '⚡ Speedy Flow!'), el('p', {}, `Zoom! You flowed through ${extras.poses || 0} quick poses. ⚡`)]);
  }
  if (extras.type === 'buddy') {
    return el('div.extras.glass', {}, [el('h2', {}, '🧑‍🤝‍🧑 Buddy Up!'), el('p', {}, `You struck ${extras.poses || 0} poses together. Great teamwork! 💞`)]);
  }
  if (extras.type === 'journey') {
    const stamps = extras.stamps || [];
    return el('div.extras.glass', {}, [
      el('h2', {}, '🌍 Passport Stamped!'),
      el('p', {}, stamps.length ? `You visited ${stamps.length} lands around the world!` : 'Your yoga passport is ready for adventure!'),
      el('div.passport', {}, stamps.map((s) => el('span.stamp', { title: s.name }, s.emoji))),
    ]);
  }
  if (extras.group) {
    return el('div.extras.glass', {}, [el('h2', {}, extras.headline)]);
  }
  return null;
}

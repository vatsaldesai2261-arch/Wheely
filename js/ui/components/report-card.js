// Printable progress report card for a kid — a school-style summary for parents.
import { el } from '../../core/dom.js';
import stats from '../../stats/stats.js';
import achievements from '../../rewards/achievements.js';
import poseLoader from '../../data/pose-loader.js';

function favoriteGroup(s) {
  const cats = Object.entries(s.perCategory || {});
  if (!cats.length) return '—';
  const [id] = cats.sort((a, b) => b[1] - a[1])[0];
  const c = poseLoader.getCategories().find((x) => x.id === id);
  return c ? `${c.emoji} ${c.name}` : id;
}

export function printReportCard(player) {
  const s = stats.forPlayer(player.id);
  const badges = achievements.unlockedFor(player.id).size;
  const total = s.posesCompleted + s.posesMissed;
  const rate = total ? Math.round((s.posesCompleted / total) * 100) : 0;
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const row = (label, value) => el('div.rc-line', {}, [el('span.rc-l', {}, label), el('span.rc-v', {}, String(value))]);

  const overlay = el('div.cert-print-root', {}, [
    el('div.report-card', {}, [
      el('div.badge-sheet-head', {}, [
        el('img.cert-mark', { src: './assets/brand/kaya-haus-mark.png', alt: '' }),
        el('div', {}, [el('div.cert-kicker', {}, 'kaya haus · report card'), el('h1.bs-title', {}, `${player.name}'s Yoga Report`), el('p.bs-sub', {}, date)]),
      ]),
      el('div.report-rows', {}, [
        row('🏅 Belt', player.belt || 'White Belt'),
        row('✨ XP', player.xp || 0),
        row('🤸 Poses completed', s.posesCompleted),
        row('🎯 Success rate', `${rate}%`),
        row('🔥 Best streak', s.bestStreak),
        row('⏱️ Minutes practiced', s.minutesPracticed),
        row('📅 Day streak', s.dayStreak),
        row('🎮 Games played', s.sessionsPlayed),
        row('🎖️ Badges earned', badges),
        row('💚 Favorite poses', favoriteGroup(s)),
      ]),
      el('p.report-note', {}, 'Keep up the wonderful practice! — kaya haus'),
    ]),
  ]);
  document.body.append(overlay);
  const cleanup = () => { overlay.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => { window.print(); setTimeout(() => overlay.isConnected && cleanup(), 1000); }, 200);
}

export default { printReportCard };

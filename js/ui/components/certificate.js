// Printable award certificate for a kid. Opens a print-styled overlay and
// triggers the browser print dialog (save as PDF / print at home).
import { el } from '../../core/dom.js';
import stats from '../../stats/stats.js';

export function printCertificate(player) {
  const s = stats.forPlayer(player.id);
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const overlay = el('div.cert-print-root', {}, [
    el('div.certificate', {}, [
      el('img.cert-mark', { src: './assets/brand/kaya-haus-mark.png', alt: '' }),
      el('div.cert-kicker', {}, 'kaya haus · yoga adventure'),
      el('h1.cert-title', {}, 'Certificate of Awesomeness'),
      el('p.cert-awarded', {}, 'proudly awarded to'),
      el('div.cert-name', {}, `${player.avatarEmoji || ''} ${player.name}`),
      el('p.cert-body', {}, `for striking ${s.posesCompleted} yoga poses, earning ${player.xp || 0} XP, and reaching the ${player.belt || 'White Belt'}!`),
      el('div.cert-badges', {}, [
        el('span', {}, `🤸 ${s.posesCompleted} poses`),
        el('span', {}, `🔥 best streak ${s.bestStreak}`),
        el('span', {}, `⏱️ ${s.minutesPracticed} min`),
      ]),
      el('div.cert-foot', {}, [el('span', {}, date), el('span.cert-sign', {}, 'kaya haus')]),
    ]),
  ]);
  document.body.append(overlay);
  const cleanup = () => { overlay.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => { window.print(); setTimeout(() => overlay.isConnected && cleanup(), 1000); }, 200);
}

export default { printCertificate };

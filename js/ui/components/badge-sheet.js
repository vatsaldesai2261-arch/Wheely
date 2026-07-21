// Printable badge sheet — a kid's earned badges as cut-out circles you can
// print and stick on t-shirts, camp-style. Reuses the print pattern.
import { el } from '../../core/dom.js';
import achievements from '../../rewards/achievements.js';

export function printBadgeSheet(player) {
  const unlocked = achievements.unlockedFor(player.id);
  const defs = achievements.definitions().filter((d) => unlocked.has(d.id));
  const overlay = el('div.cert-print-root', {}, [
    el('div.badge-sheet', {}, [
      el('div.badge-sheet-head', {}, [
        el('img.cert-mark', { src: './assets/brand/kaya-haus-mark.png', alt: '' }),
        el('div', {}, [
          el('div.cert-kicker', {}, 'kaya haus · badges'),
          el('h1.bs-title', {}, `${player.name}'s Badges`),
          el('p.bs-sub', {}, defs.length ? 'Cut out and wear them proudly! ✂️' : 'No badges yet — play a game to earn some!'),
        ]),
      ]),
      el('div.badge-cutouts', {}, defs.map((d) => el('div.badge-cutout', {}, [
        el('div.bc-icon', {}, d.icon),
        el('div.bc-name', {}, d.name),
      ]))),
    ]),
  ]);
  document.body.append(overlay);
  const cleanup = () => { overlay.remove(); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => { window.print(); setTimeout(() => overlay.isConnected && cleanup(), 1000); }, 200);
}

export default { printBadgeSheet };

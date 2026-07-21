// SVG wheel renderer + spin animation. Pick-then-animate: the caller decides
// the winner; the wheel just lands the pointer on it. Fairness lives in pool.js.
import settings from '../core/settings.js';
import audio from '../core/audio.js';

const PALETTE = ['#95d5b2', '#ffd166', '#89c2d9', '#e85d75', '#f4a261', '#b8a4e3', '#a0d8b3', '#f7b267'];

export function createWheel(mountEl) {
  let segments = [];
  let rotation = 0;
  const size = 100;
  const cx = size / 2, cy = size / 2, r = 46;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'wheel-svg');
  const gWheel = document.createElementNS(svgNS, 'g');
  gWheel.setAttribute('class', 'wheel-rotor');
  gWheel.style.transformOrigin = '50% 50%';
  svg.append(gWheel);

  // Hub + pointer (pointer is fixed at top, outside the rotor)
  const hub = document.createElementNS(svgNS, 'circle');
  hub.setAttribute('cx', cx); hub.setAttribute('cy', cy); hub.setAttribute('r', '9');
  hub.setAttribute('fill', '#fff8e7'); hub.setAttribute('stroke', '#2d6a4f'); hub.setAttribute('stroke-width', '1.5');
  svg.append(hub);
  const hubIcon = document.createElementNS(svgNS, 'text');
  hubIcon.setAttribute('x', cx); hubIcon.setAttribute('y', cy + 3.5);
  hubIcon.setAttribute('text-anchor', 'middle'); hubIcon.setAttribute('font-size', '9');
  hubIcon.textContent = '🧘';
  svg.append(hubIcon);

  const pointer = document.createElementNS(svgNS, 'path');
  pointer.setAttribute('d', `M ${cx} 3 L ${cx - 5} 12 L ${cx + 5} 12 Z`);
  pointer.setAttribute('fill', '#e85d75');
  pointer.setAttribute('stroke', '#1b4332');
  pointer.setAttribute('stroke-width', '0.8');
  pointer.setAttribute('class', 'wheel-pointer');
  svg.append(pointer);

  mountEl.append(svg);

  function polar(angleDeg, radius) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  }

  function render() {
    gWheel.textContent = '';
    const n = segments.length || 1;
    const step = 360 / n;
    segments.forEach((seg, i) => {
      const start = i * step, end = (i + 1) * step;
      const [x1, y1] = polar(start, r), [x2, y2] = polar(end, r);
      const large = step > 180 ? 1 : 0;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`);
      path.setAttribute('fill', PALETTE[i % PALETTE.length]);
      path.setAttribute('stroke', '#fff8e7');
      path.setAttribute('stroke-width', '0.6');
      gWheel.append(path);

      const [lx, ly] = polar(start + step / 2, r * 0.62);
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', lx); label.setAttribute('y', ly + 3);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('transform', `rotate(${start + step / 2} ${lx} ${ly})`);
      label.textContent = seg.emoji || '🧘';
      gWheel.append(label);
    });
  }

  function setSegments(poses) { segments = poses; render(); }

  /** Animate so segment `index` lands under the top pointer. Returns a promise. */
  function spinTo(index) {
    return new Promise((resolve) => {
      const n = segments.length || 1;
      const step = 360 / n;
      const targetCenter = index * step + step / 2;   // where the winner currently sits
      const reduced = settings.reducedMotion();
      const turns = reduced ? 0 : 4 + ((Math.random() * 2) | 0);
      // We must rotate so targetCenter aligns to 0deg (top). Rotate by -targetCenter (+full turns).
      const finalRotation = rotation + turns * 360 + (360 - (((rotation + targetCenter) % 360 + 360) % 360));
      const duration = reduced ? 400 : 3400 + Math.random() * 400;

      audio.startSpin();
      if (!reduced) audio.rampSpinDown(duration / 1000);

      const anim = gWheel.animate(
        [{ transform: `rotate(${rotation}deg)` }, { transform: `rotate(${finalRotation}deg)` }],
        { duration, easing: reduced ? 'ease-out' : 'cubic-bezier(0.17, 0.67, 0.28, 1)', fill: 'forwards' }
      );

      // tick sounds as segments pass the pointer
      if (!reduced) {
        let ticks = Math.min(28, turns * n);
        const tickEvery = duration / ticks;
        let k = 0;
        const tickTimer = setInterval(() => { audio.play('tick'); if (++k >= ticks) clearInterval(tickTimer); }, tickEvery);
        anim.addEventListener('finish', () => clearInterval(tickTimer), { once: true });
      }

      anim.addEventListener('finish', () => {
        rotation = finalRotation % 360;
        gWheel.style.transform = `rotate(${rotation}deg)`;
        audio.stopSpin();
        resolve();
      }, { once: true });
    });
  }

  function destroy() { svg.remove(); }

  return { setSegments, spinTo, destroy, el: svg };
}

export default { createWheel };

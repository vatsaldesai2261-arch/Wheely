// SVG wheel — glossy, premium, pick-then-animate. The caller decides the
// winner; the wheel just lands the pointer on it. Fairness lives in pool.js.
import settings from '../core/settings.js';
import audio from '../core/audio.js';

const PALETTE = ['#95d5b2', '#ffd166', '#89c2d9', '#e85d75', '#f4a261', '#b8a4e3', '#7ececa', '#f7b267'];

// Per-mode themed skins: rim color, hub emblem, backdrop tint.
const SKINS = {
  classic: { rim: '#2d6a4f', rim2: '#1b4332', hub: '🧘', glow: '#ffd166' },
  animal:  { rim: '#5a8f3c', rim2: '#3d6b28', hub: '🐾', glow: '#a8dc6a', palette: ['#a8dc6a', '#ffd166', '#f4a261', '#95d5b2', '#e8c34a', '#7cb342', '#c5e1a5', '#f7b267'] },
  story:   { rim: '#3b2a63', rim2: '#241640', hub: '✨', glow: '#b8a4e3', palette: ['#b8a4e3', '#89c2d9', '#ffd166', '#e85d75', '#7ececa', '#c9a4e3', '#a4b8e3', '#f4a261'] },
  ocean:   { rim: '#0b6e8c', rim2: '#063a4d', hub: '🌊', glow: '#7fc8e0', palette: ['#7fc8e0', '#95d5b2', '#89c2d9', '#5ab0d0', '#a8e0ec', '#6ec1d8', '#bfe8f2', '#7ececa'] },
  space:   { rim: '#2b2350', rim2: '#150f30', hub: '🚀', glow: '#b8a4e3', palette: ['#b8a4e3', '#89c2d9', '#f7b267', '#e85d75', '#7ececa', '#ffd166', '#a4b8e3', '#c9a4e3'] },
};

function skinFor(mode, story) {
  if (mode === 'animal') return SKINS.animal;
  if (mode === 'story') {
    const id = story?.id || '';
    if (/sea|ocean/i.test(id)) return SKINS.ocean;
    if (/space|blast/i.test(id)) return SKINS.space;
    return SKINS.story;
  }
  return SKINS.classic;
}

export function createWheel(mountEl, { mode = 'classic', story = null } = {}) {
  const skin = skinFor(mode, story);
  const palette = skin.palette || PALETTE;
  let segments = [];
  let rotation = 0;
  const size = 100, cx = 50, cy = 50, r = 44;
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'wheel-svg');

  // defs: gloss gradient + rim gradient + winner glow filter
  const defs = document.createElementNS(svgNS, 'defs');
  defs.innerHTML = `
    <radialGradient id="wheel-gloss" cx="42%" cy="34%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.10"/>
    </radialGradient>
    <linearGradient id="wheel-rim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${skin.rim}"/>
      <stop offset="100%" stop-color="${skin.rim2}"/>
    </linearGradient>
    <filter id="wheel-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#1b4332" flood-opacity="0.35"/>
    </filter>
    <radialGradient id="wheel-winnerglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${skin.glow}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${skin.glow}" stop-opacity="0"/>
    </radialGradient>`;
  svg.append(defs);

  // rim ring
  const rim = document.createElementNS(svgNS, 'circle');
  rim.setAttribute('cx', cx); rim.setAttribute('cy', cy); rim.setAttribute('r', r + 3.5);
  rim.setAttribute('fill', 'url(#wheel-rim)'); rim.setAttribute('filter', 'url(#wheel-shadow)');
  svg.append(rim);

  // rim light bulbs
  const bulbs = document.createElementNS(svgNS, 'g');
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const bx = cx + Math.cos(a) * (r + 3.5), by = cy + Math.sin(a) * (r + 3.5);
    const b = document.createElementNS(svgNS, 'circle');
    b.setAttribute('cx', bx); b.setAttribute('cy', by); b.setAttribute('r', '1.1');
    b.setAttribute('fill', '#fff8e7'); b.setAttribute('opacity', '0.9');
    b.setAttribute('class', 'wheel-bulb'); b.dataset.i = i;
    bulbs.append(b);
  }
  svg.append(bulbs);

  const winnerGlow = document.createElementNS(svgNS, 'circle');
  winnerGlow.setAttribute('r', '0'); winnerGlow.setAttribute('fill', 'url(#wheel-winnerglow)');
  winnerGlow.setAttribute('opacity', '0');
  svg.append(winnerGlow);

  const gWheel = document.createElementNS(svgNS, 'g');
  gWheel.setAttribute('class', 'wheel-rotor');
  gWheel.style.transformOrigin = '50% 50%';
  svg.append(gWheel);

  // gloss overlay (static, on top of rotor)
  const gloss = document.createElementNS(svgNS, 'circle');
  gloss.setAttribute('cx', cx); gloss.setAttribute('cy', cy); gloss.setAttribute('r', r);
  gloss.setAttribute('fill', 'url(#wheel-gloss)'); gloss.setAttribute('pointer-events', 'none');
  svg.append(gloss);

  // hub
  const hub = document.createElementNS(svgNS, 'circle');
  hub.setAttribute('cx', cx); hub.setAttribute('cy', cy); hub.setAttribute('r', '9');
  hub.setAttribute('fill', '#fff8e7'); hub.setAttribute('stroke', skin.rim); hub.setAttribute('stroke-width', '2');
  svg.append(hub);
  const hubIcon = document.createElementNS(svgNS, 'text');
  hubIcon.setAttribute('x', cx); hubIcon.setAttribute('y', cy + 3.5);
  hubIcon.setAttribute('text-anchor', 'middle'); hubIcon.setAttribute('font-size', '9');
  hubIcon.textContent = skin.hub;
  svg.append(hubIcon);

  // pointer (springy)
  const pointer = document.createElementNS(svgNS, 'g');
  pointer.setAttribute('class', 'wheel-pointer');
  pointer.style.transformOrigin = `${cx}px 6px`;
  pointer.innerHTML = `<path d="M ${cx} 2 L ${cx - 5} 12 L ${cx + 5} 12 Z" fill="#e85d75" stroke="#1b4332" stroke-width="0.8"/><circle cx="${cx}" cy="4" r="2" fill="#ffd166" stroke="#1b4332" stroke-width="0.6"/>`;
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
      path.setAttribute('fill', palette[i % palette.length]);
      path.setAttribute('stroke', '#fff8e7');
      path.setAttribute('stroke-width', '0.7');
      path.dataset.i = i;
      gWheel.append(path);

      const [lx, ly] = polar(start + step / 2, r * 0.64);
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', lx); label.setAttribute('y', ly + 3.4);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('transform', `rotate(${start + step / 2} ${lx} ${ly})`);
      label.textContent = seg.emoji || '🧘';
      gWheel.append(label);
    });
  }

  function setSegments(poses) { segments = poses; render(); }

  function bulbFlash() {
    const list = bulbs.querySelectorAll('.wheel-bulb');
    list.forEach((b, i) => b.setAttribute('opacity', ((i % 2) ? 0.4 : 1)));
  }
  function pointerKick() {
    pointer.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(0deg)' }], { duration: 160, easing: 'ease-out' });
  }

  function spinTo(index) {
    return new Promise((resolve) => {
      const n = segments.length || 1;
      const step = 360 / n;
      const targetCenter = index * step + step / 2;
      const reduced = settings.reducedMotion();
      const turns = reduced ? 0 : 4 + ((Math.random() * 2) | 0);
      const finalRotation = rotation + turns * 360 + (360 - (((rotation + targetCenter) % 360 + 360) % 360));
      const duration = reduced ? 400 : 3400 + Math.random() * 500;

      audio.startSpin();
      if (!reduced) audio.rampSpinDown(duration / 1000);

      const anim = gWheel.animate(
        [{ transform: `rotate(${rotation}deg)` }, { transform: `rotate(${finalRotation}deg)` }],
        { duration, easing: reduced ? 'ease-out' : 'cubic-bezier(0.17, 0.72, 0.24, 1)', fill: 'forwards' }
      );

      if (!reduced) {
        const ticks = Math.min(30, turns * n);
        const tickEvery = duration / ticks;
        let k = 0;
        const tickTimer = setInterval(() => { audio.play('tick'); pointerKick(); bulbFlash(); if (++k >= ticks) clearInterval(tickTimer); }, tickEvery);
        anim.addEventListener('finish', () => clearInterval(tickTimer), { once: true });
      }

      anim.addEventListener('finish', () => {
        rotation = finalRotation % 360;
        gWheel.style.transform = `rotate(${rotation}deg)`;
        audio.stopSpin();
        // winner glow flash on the winning segment
        const [wx, wy] = polar(0, r * 0.62); // top, under pointer
        winnerGlow.setAttribute('cx', wx); winnerGlow.setAttribute('cy', wy);
        winnerGlow.setAttribute('r', '16');
        winnerGlow.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' });
        pointerKick();
        resolve();
      }, { once: true });
    });
  }

  function destroy() { svg.remove(); }
  return { setSegments, spinTo, destroy, el: svg };
}

export default { createWheel };

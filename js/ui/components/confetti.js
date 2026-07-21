// Lightweight canvas confetti burst. Reduced-motion → a calm static starburst.
import settings from '../../core/settings.js';

const COLORS = ['#2d6a4f', '#95d5b2', '#ffd166', '#89c2d9', '#e85d75', '#f4a261'];

export function burst({ count = 90, origin = { x: 0.5, y: 0.4 }, power = 1 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  Object.assign(canvas.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '250' });
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize();

  const ox = origin.x * innerWidth, oy = origin.y * innerHeight;
  const reduced = settings.reducedMotion();

  const parts = Array.from({ length: reduced ? Math.min(count, 40) : count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (reduced ? 0 : (4 + Math.random() * 7) * power);
    return {
      x: ox, y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (reduced ? 0 : 3),
      size: 6 + Math.random() * 8,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
      max: 60 + Math.random() * 40,
    };
  });

  if (reduced) {
    // Static starburst: draw once, fade out.
    parts.forEach((p) => {
      const r = 40 + Math.random() * 120;
      p.x = ox + Math.cos(p.rot) * r;
      p.y = oy + Math.sin(p.rot) * r;
    });
    let alpha = 1;
    const fade = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = alpha;
      parts.forEach((p) => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 7); ctx.fill(); });
      alpha -= 0.03;
      if (alpha > 0) requestAnimationFrame(fade); else canvas.remove();
    };
    fade();
    return;
  }

  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.life++;
      if (p.life > p.max) continue;
      alive++;
      p.vy += 0.18; // gravity
      p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    frame++;
    if (alive > 0 && frame < 220) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

export default { burst };

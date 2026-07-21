// Panda mascot buddy — a friendly SVG face that reacts (idle/cheer/wave).
import { el } from '../../core/dom.js';

export function mascot({ mood = 'idle', size = 96 } = {}) {
  const wrap = el(`div.mascot.mascot-${mood}`, { style: `width:${size}px;height:${size}px`, 'aria-hidden': 'true' });
  wrap.innerHTML = `
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="92" rx="26" ry="5" fill="#000" opacity="0.08"/>
      <circle cx="26" cy="24" r="12" fill="#2d2d2d"/>
      <circle cx="74" cy="24" r="12" fill="#2d2d2d"/>
      <circle cx="50" cy="50" r="34" fill="#ffffff" stroke="#e6e6e6" stroke-width="1.5"/>
      <ellipse cx="35" cy="46" rx="9" ry="11" fill="#2d2d2d"/>
      <ellipse cx="65" cy="46" rx="9" ry="11" fill="#2d2d2d"/>
      <circle cx="36" cy="45" r="3.4" fill="#fff"/><circle cx="66" cy="45" r="3.4" fill="#fff"/>
      <circle cx="37" cy="46" r="1.6" fill="#2d2d2d"/><circle cx="67" cy="46" r="1.6" fill="#2d2d2d"/>
      <ellipse cx="50" cy="60" rx="5" ry="4" fill="#2d2d2d"/>
      <path class="mascot-mouth" d="M 42 68 Q 50 74 58 68" fill="none" stroke="#2d2d2d" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="30" cy="62" r="4" fill="#ffb3c6" opacity="0.7"/>
      <circle cx="70" cy="62" r="4" fill="#ffb3c6" opacity="0.7"/>
    </svg>`;
  return wrap;
}

export default { mascot };

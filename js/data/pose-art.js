// Resolves a pose's visual. Priority:
//   1. admin-attached image (data-URI stored in the override)
//   2. images/poses/<id>.png  (existence probed once, memoized)
//   3. built-in generated SVG scene (by category) + emoji
import { el } from '../core/dom.js';

const imgBase = new URL('../../images/poses/', import.meta.url);
const probeCache = new Map(); // id -> Promise<boolean>

function probeImage(id) {
  if (probeCache.has(id)) return probeCache.get(id);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = new URL(`${id}.png`, imgBase).href;
  });
  probeCache.set(id, p);
  return p;
}

// Soft gradient backdrops per category.
const CATEGORY_SCENE = {
  standing:      ['#cae9f5', '#89c2d9'],
  seated:        ['#d8f3dc', '#95d5b2'],
  balance:       ['#ffe8b3', '#ffd166'],
  backbend:      ['#ffccd5', '#e85d75'],
  'forward-fold':['#d8f3dc', '#89c2d9'],
  twist:         ['#e6dcff', '#b8a4e3'],
  core:          ['#ffe8b3', '#f4a261'],
  inversion:     ['#cae9f5', '#b8a4e3'],
  'animal-play': ['#ffe8b3', '#95d5b2'],
  'partner-group':['#ffccd5', '#ffd166'],
  restorative:   ['#e6dcff', '#cae9f5'],
  'warmup-fun':  ['#fff3b0', '#ffd166'],
};

/** Build an inline SVG scene: soft gradient + big emoji + decorative dots. */
export function svgSceneFor(pose, size = 320) {
  const [c1, c2] = CATEGORY_SCENE[pose.category] || ['#d8f3dc', '#95d5b2'];
  const emoji = pose.emoji || '🧘';
  const gid = `g-${pose.id}`;
  const svg = `
    <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" role="img" aria-label="${pose.english}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="${gid}" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="100%" stop-color="${c2}"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="36" fill="url(#${gid})"/>
      <circle cx="${size * 0.2}" cy="${size * 0.22}" r="14" fill="#ffffff" opacity="0.35"/>
      <circle cx="${size * 0.82}" cy="${size * 0.3}" r="9" fill="#ffffff" opacity="0.3"/>
      <circle cx="${size * 0.75}" cy="${size * 0.8}" r="18" fill="#ffffff" opacity="0.25"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.42}">${emoji}</text>
    </svg>`;
  return svg;
}

/**
 * Returns an HTMLElement for the pose art, resolving the override/image/svg
 * priority. Starts with the SVG scene and upgrades to an image if one exists.
 */
export function artElement(pose) {
  const wrap = el('div.pose-art', { 'aria-hidden': 'false' });

  // 1. admin-attached data-URI
  if (pose.imageDataUri) {
    wrap.append(el('img', { src: pose.imageDataUri, alt: pose.english, class: 'pose-art-img' }));
    return wrap;
  }

  // Start with SVG scene; upgrade to file image if present.
  wrap.innerHTML = svgSceneFor(pose);
  probeImage(pose.id).then((exists) => {
    if (exists) {
      wrap.innerHTML = '';
      wrap.append(el('img', { src: new URL(`${pose.id}.png`, imgBase).href, alt: pose.english, class: 'pose-art-img' }));
    }
  });
  return wrap;
}

export default { artElement, svgSceneFor };

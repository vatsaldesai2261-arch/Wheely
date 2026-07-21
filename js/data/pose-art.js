// Resolves a pose's visual. Priority:
//   1. admin-attached image (data-URI stored in the override)
//   2. images/poses/<id>.png  (existence probed once, memoized)
//   3. built-in illustrated cartoon YOGI posed for this asana (js/data/yogi.js)
import { el } from '../core/dom.js';
import { yogiSVG } from './yogi.js';
import media from '../core/media.js';

const imgBase = new URL('../../images/poses/', import.meta.url);
const probeCache = new Map();

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

// Soft gradient backdrops per category (the "stage" behind the character).
const CATEGORY_SCENE = {
  standing:      ['#cae9f5', '#89c2d9'],
  seated:        ['#d8f3dc', '#95d5b2'],
  balance:       ['#ffe8b3', '#ffd166'],
  backbend:      ['#ffccd5', '#f4a6b6'],
  'forward-fold':['#d8f3dc', '#89c2d9'],
  twist:         ['#e6dcff', '#b8a4e3'],
  core:          ['#ffe8b3', '#f7b267'],
  inversion:     ['#cae9f5', '#b8a4e3'],
  'animal-play': ['#fff0c9', '#a8dcb0'],
  'partner-group':['#ffe0e6', '#ffd166'],
  restorative:   ['#e6dcff', '#cae9f5'],
  'warmup-fun':  ['#fff3b0', '#ffd166'],
};

/** Illustrated scene: gradient stage + posed yogi + a few decorative dots. */
export function svgSceneFor(pose) {
  const [c1, c2] = CATEGORY_SCENE[pose.category] || ['#d8f3dc', '#95d5b2'];
  const gid = `bg-${cssId(pose.id)}`;
  return `
    <div class="pose-scene" style="--c1:${c1};--c2:${c2}">
      <svg class="pose-scene-bg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="${gid}" cx="50%" cy="34%" r="80%">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </radialGradient></defs>
        <rect width="100" height="100" fill="url(#${gid})"/>
        <circle cx="18" cy="20" r="7" fill="#fff" opacity="0.35"/>
        <circle cx="83" cy="26" r="4.5" fill="#fff" opacity="0.3"/>
        <circle cx="78" cy="80" r="9" fill="#fff" opacity="0.22"/>
        <ellipse cx="50" cy="94" rx="34" ry="5" fill="#000" opacity="0.06"/>
      </svg>
      <div class="pose-scene-figure">${yogiSVG(pose, { size: 220 })}</div>
    </div>`;
}

/** Small mono silhouette of the pose, used on wheel segments / chips. */
export function miniSilhouette(pose) {
  return yogiSVG(pose, { size: 64, mono: true });
}

/**
 * Returns an HTMLElement for the pose art, resolving override → image → yogi.
 */
export function artElement(pose) {
  const wrap = el('div.pose-art');

  // 1. Admin photo in IndexedDB
  if (media.isRef(pose.imageRef)) {
    wrap.innerHTML = svgSceneFor(pose); // placeholder while loading
    media.getURL(pose.imageRef).then((url) => {
      if (url) { wrap.innerHTML = ''; wrap.append(el('img', { src: url, alt: pose.english, class: 'pose-art-img' })); }
    });
    return wrap;
  }
  // 1b. Legacy inline data-URI
  if (pose.imageDataUri) {
    wrap.append(el('img', { src: pose.imageDataUri, alt: pose.english, class: 'pose-art-img' }));
    return wrap;
  }

  wrap.innerHTML = svgSceneFor(pose);
  probeImage(pose.id).then((exists) => {
    if (exists) {
      wrap.innerHTML = '';
      wrap.append(el('img', { src: new URL(`${pose.id}.png`, imgBase).href, alt: pose.english, class: 'pose-art-img' }));
    }
  });
  return wrap;
}

function cssId(s) { return String(s).replace(/[^a-z0-9_-]/gi, '-'); }

export default { artElement, svgSceneFor, miniSilhouette };

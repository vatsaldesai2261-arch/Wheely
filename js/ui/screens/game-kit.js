// Shared helpers for the standalone mini-games (no wheel engine).
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import poseLoader from '../../data/pose-loader.js';
import { yogiSVG } from '../../data/yogi.js';
import { backHeader } from './leaderboard.js';

export function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function randOf(a) { return a[(Math.random() * a.length) | 0]; }

/** Ensure the pose dataset is loaded (idempotent) before a game reads it. */
export async function ready() { await poseLoader.load(); }

/** Kid-friendly pose set (easy/medium, no advanced), optionally category-scoped. */
export function kidPoses(extra = {}) {
  const list = poseLoader.filterPoses({ difficulties: ['easy', 'medium'], includeAdvanced: false, ...extra });
  return list.length ? list : poseLoader.filterPoses({ includeAdvanced: false });
}

/** A framed cartoon-yogi figure for the given pose (or a synthetic {shape,english}). */
export function figure(pose, size = 200) { return el('div.game-figure', { html: yogiSVG(pose, { size }) }); }

/** Build the standard subscreen shell (back header + a stage element to drive). */
export function gameShell(container, title, help) {
  const stage = el('div.game-stage-outer');
  container.append(el('div.subscreen', {}, [backHeader(title, { text: help }), stage]));
  return stage;
}

export function homeBtn(label = 'Done 🌟') {
  return el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { audio.play('tap'); router.go('home'); } }, label);
}

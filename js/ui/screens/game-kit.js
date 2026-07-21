// Shared helpers for the standalone mini-games (no wheel engine) — including the
// score "merge": mini-game successes award XP/coins to the chosen player through
// the SAME reward path as the wheel game, so belts, badges, quests and the
// leaderboard all update the same way.
import { el } from '../../core/dom.js';
import router from '../../core/router.js';
import audio from '../../core/audio.js';
import { emit } from '../../core/bus.js';
import store from '../../core/store.js';
import poseLoader from '../../data/pose-loader.js';
import { yogiSVG } from '../../data/yogi.js';
import rewards from '../../rewards/rewards.js';
import stats from '../../stats/stats.js';
import achievements from '../../rewards/achievements.js';
import { avatarEl } from '../components/avatar.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
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

// ---- Scoring / player selection ----------------------------------------
let currentPlayerId = null;
let tally = { xp: 0, coins: 0, completed: 0 };
let playStart = 0;
let recorded = true;
let scoreEl = null;

export function players() { return store.get('players'); }

export function currentPlayer() {
  const list = players();
  if (!list.length) return null;
  if (!currentPlayerId || !list.find((p) => p.id === currentPlayerId)) {
    const active = list.filter((p) => p.active !== false);
    currentPlayerId = (active[0] || list[0]).id;
  }
  return list.find((p) => p.id === currentPlayerId) || null;
}

function paintScore() { if (scoreEl) scoreEl.textContent = `⭐ ${tally.xp} XP · 🪙 ${tally.coins}`; }

/** Award for completing a real pose — routes through the engine's award path so
 *  belts, achievements, quests and stats all update identically. */
export function rewardPose(pose, { multiplier = 1 } = {}) {
  const cp = currentPlayer();
  if (!cp || !pose) return null;
  const a = rewards.awardForDecision(cp, pose, 'pass', { multiplier });
  tally.xp += a.xp; tally.coins += a.coins; tally.completed += 1;
  audio.play('coin'); paintScore();
  return a;
}

/** Award a flat bonus (for non-pose successes: correct guess, matched pair, a
 *  bingo line, good listening). Persists, recomputes belt, fires level-up + badges. */
export function rewardFlat(xp = 0, coins = 0) {
  const cp = currentPlayer();
  if (!cp) return null;
  const before = rewards.beltFor(cp.xp || 0);
  store.update('players', (list) => list.map((p) => p.id === cp.id
    ? { ...p, xp: (p.xp || 0) + xp, coins: (p.coins || 0) + coins, belt: rewards.beltFor((p.xp || 0) + xp).name }
    : p));
  const fresh = store.get('players').find((p) => p.id === cp.id);
  if (fresh) { cp.xp = fresh.xp; cp.coins = fresh.coins; cp.belt = fresh.belt; }
  const after = rewards.beltFor(cp.xp || 0);
  if (after.id !== before.id) emit('player:levelup', { player: cp, belt: after });
  achievements.evaluate(cp.id, {});
  tally.xp += xp; tally.coins += coins; tally.completed += 1;
  audio.play('coin'); paintScore();
  return { xp, coins };
}

/** Record the finished mini-game as a play (sessions, minutes, day-streak, quests).
 *  Call from each game's onLeave; safe to call more than once. */
export function endPlay() {
  if (recorded) return;
  const cp = currentPlayer();
  if (!cp || tally.completed <= 0) { recorded = true; return; }
  recorded = true;
  const durationSec = Math.round((Date.now() - playStart) / 1000);
  stats.recordSession({ id: cp.id, coins: tally.coins, completed: tally.completed, missed: 0, bestStreak: 0, stars: 0, xp: tally.xp }, { mode: 'minigame', durationSec });
  achievements.evaluateSession(cp.id, { completed: tally.completed, missed: 0 });
}

function renderChip(chip, cp) {
  chip.replaceChildren(
    cp ? avatarEl(cp.avatar, { size: 24, className: 'chip-av' }) : el('span.chip-av', {}, '🧘'),
    el('span.chip-name', {}, cp ? cp.name : 'Guest'),
    el('span.chip-caret', {}, '▾'),
  );
}

function pickPlayer(chip) {
  const list = players();
  if (!list.length) { toast('Add players in the Grown-Up Zone to earn XP & coins!', { icon: '🧘' }); return; }
  const ctrl = modal({
    title: '🧘 Who is playing?',
    body: el('div.player-pick-list', {}, list.map((p) => el('button.btn.btn-secondary.pp-row', { type: 'button', onClick: () => {
      currentPlayerId = p.id; renderChip(chip, currentPlayer()); ctrl.close(); audio.play('tap');
    } }, [avatarEl(p.avatar, { size: 28 }), el('span', {}, `${p.name} · ${p.belt || 'White Belt'}`)]))),
  });
}

function playerChip() {
  const chip = el('button.game-player-chip.glass', { type: 'button', 'aria-label': 'Choose who is playing' });
  chip.addEventListener('click', () => pickPlayer(chip));
  renderChip(chip, currentPlayer());
  return chip;
}

/** Build the standard subscreen shell: back header, a player+score topbar, and a
 *  stage element to drive. Resets the per-play score tally. */
export function gameShell(container, title, help) {
  tally = { xp: 0, coins: 0, completed: 0 };
  playStart = Date.now();
  recorded = false;
  const stage = el('div.game-stage-outer');
  scoreEl = el('span.game-score');
  const bar = el('div.game-topbar', {}, [playerChip(), scoreEl]);
  paintScore();
  container.append(el('div.subscreen', {}, [backHeader(title, { text: help }), bar, stage]));
  return stage;
}

export function homeBtn(label = 'Done 🌟') {
  return el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { audio.play('tap'); router.go('home'); } }, label);
}

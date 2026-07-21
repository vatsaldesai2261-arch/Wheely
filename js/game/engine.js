// Game state machine. Owns the session; the game screen is a pure view over
// engine events. States:
//   SETUP → COUNTDOWN → SPINNING → POSE_REVEAL → POSE_TIMER → DECISION
//   → CELEBRATION | ENCOURAGEMENT → NEXT_TURN → (COUNTDOWN | RESULTS)
// PAUSED is an overlay reachable from any active state.
import { emit } from '../core/bus.js';
import settings from '../core/settings.js';
import poseLoader from '../data/pose-loader.js';
import { getMode as lookupMode } from './modes/index.js';
import { createSession, currentPlayer, ensureTurnResult } from './session.js';
import { sampleDecoys, returnToPool, draw } from './pool.js';
import rewards from '../rewards/rewards.js';
import { persistPools, loadPools } from './persistence.js';

const S = {
  SETUP: 'setup', COUNTDOWN: 'countdown', SPINNING: 'spinning', POSE_REVEAL: 'pose_reveal',
  POSE_TIMER: 'pose_timer', DECISION: 'decision', CELEBRATION: 'celebration',
  ENCOURAGEMENT: 'encouragement', NEXT_TURN: 'next_turn', RESULTS: 'results', PAUSED: 'paused',
};

let session = null;
let mode = null;
let state = S.SETUP;
let prevState = null;
let lastSummary = null;

export function getLastSummary() { return lastSummary; }

function setState(next, payload = {}) {
  prevState = state;
  state = next;
  emit('engine:state', { state, session, ...payload });
}

export function getState() { return state; }
export function getSession() { return session; }
export function getMode() { return mode; }

export function start({ modeId, wheelConfig, players }) {
  mode = getModeSafe(modeId);
  const poolsByPlayer = mode.buildPools(players, wheelConfig);

  // restore persisted anti-repeat pools where available (per player/wheel/mode)
  loadPools(poolsByPlayer, players, wheelConfig, modeId);

  session = createSession({ mode: modeId, wheelConfig, players, poolsByPlayer });
  if (mode.init) mode.init(session);

  const minutes = settings.gameTimerMinutes();
  session.gameDeadline = Date.now() + minutes * 60 * 1000;

  setState(S.SETUP);
  return session;
}

/** Kick off the first turn — called by the game screen once it has subscribed. */
export function begin() {
  if (!session || state !== S.SETUP) return;
  beginTurn();
}

function getModeSafe(id) { return lookupMode(id); }

function beginTurn() {
  if (session.ended) return;
  // End conditions
  if (isGameOver()) return end();
  setState(S.COUNTDOWN, { player: currentPlayer(session) });
}

/** Called by the view after the countdown animation finishes. */
export function afterCountdown() {
  if (state !== S.COUNTDOWN) return;
  const player = currentPlayer(session);
  const pool = session.poolsByPlayer.get(player.id);
  const winnerId = mode.nextDraw(session, pool);
  if (!winnerId) return end();

  const winner = poseLoader.byId(winnerId);
  session.currentPose = winner;

  // Build wheel display: winner + decoys, winner placed at a known index.
  const decoyCount = Math.min(7, Math.max(5, pool.source.length - 1));
  const decoys = sampleDecoys(pool, winnerId, decoyCount).map((id) => poseLoader.byId(id)).filter(Boolean);
  const segs = [...decoys];
  const winnerIndex = (Math.random() * (segs.length + 1)) | 0;
  segs.splice(winnerIndex, 0, winner);

  setState(S.SPINNING, { player, segments: segs, winnerIndex, winner });
}

/** Called by the view after the wheel finishes spinning. */
export function afterSpin() {
  if (state !== S.SPINNING) return;
  setState(S.POSE_REVEAL, { player: currentPlayer(session), pose: session.currentPose });
}

/** Swap the current pose for a different one from the pool (no repeat). */
export function reroll() {
  if (state !== S.POSE_REVEAL) return;
  const player = currentPlayer(session);
  const pool = session.poolsByPlayer.get(player.id);
  if (!pool || pool.source.length < 2) return;
  const old = session.currentPose;
  const newId = mode.nextDraw(session, pool);
  if (!newId) return;
  if (old) returnToPool(pool, old.id); // put the skipped pose back
  session.currentPose = poseLoader.byId(newId);
  setState(S.POSE_REVEAL, { player, pose: session.currentPose });
}

/** Called when the kid taps "I'm ready — start". */
export function startPoseTimer() {
  if (state !== S.POSE_REVEAL) return;
  const duration = session.currentPose.duration || settings.poseTimer();
  const override = mode.poseTimerOverride;
  setState(S.POSE_TIMER, { player: currentPlayer(session), pose: session.currentPose, duration: override || duration });
}

/** Called when the pose timer finishes (does NOT auto-decide). */
export function poseTimerDone() {
  if (state !== S.POSE_TIMER) return;
  setState(S.DECISION, { player: currentPlayer(session), pose: session.currentPose });
}

/** Monitor decision. result = 'pass' | 'practice'. */
export function decide(result) {
  if (state !== S.DECISION && state !== S.POSE_TIMER && state !== S.POSE_REVEAL) return;
  const player = currentPlayer(session);
  const pose = session.currentPose;
  const pool = session.poolsByPlayer.get(player.id);
  const tr = ensureTurnResult(session, player.id);

  const wasPracticed = tr.practiced.has(pose.id);
  let awarded = { xp: 0, coins: 0 };

  if (result === 'pass') {
    tr.completed++;
    tr.streak++;
    tr.bestStreak = Math.max(tr.bestStreak, tr.streak);
    if (wasPracticed) { tr.comebacks++; tr.practiced.delete(pose.id); }
    awarded = rewards.awardForDecision(player, pose, 'pass', { multiplier: mode.xpMultiplier || 1 });
  } else {
    tr.missed++;
    tr.streak = 0;
    tr.practiced.add(pose.id);
    returnToPool(pool, pose.id); // failed pose returns to the pool
    awarded = rewards.awardForDecision(player, pose, 'practice', {});
  }
  tr.xp += awarded.xp;
  tr.coins += awarded.coins;

  session.log.push({ playerId: player.id, poseId: pose.id, result, xp: awarded.xp });
  if (mode.onDecision) mode.onDecision(session, player, pose, result);

  emit('engine:decision', { player, pose, result, awarded, streak: tr.streak, comeback: result === 'pass' && wasPracticed });

  setState(result === 'pass' ? S.CELEBRATION : S.ENCOURAGEMENT, { player, pose, awarded, streak: tr.streak });
}

/** Called by the view after celebration/encouragement animation. */
export function afterReaction() {
  if (state !== S.CELEBRATION && state !== S.ENCOURAGEMENT) return;
  session.turnIndex++;
  if (session.turnIndex % session.players.length === 0) session.round++;
  setState(S.NEXT_TURN, {});
  beginTurn();
}

function isGameOver() {
  if (mode.isOver && mode.isOver(session)) return true;
  if (Date.now() >= session.gameDeadline && session.round > 1) return true;
  // sequence modes (daily) end when pools exhausted
  const allEmpty = [...session.poolsByPlayer.values()].every((p) => p.sequence && !p.remaining.length);
  if (allEmpty && [...session.poolsByPlayer.values()].some((p) => p.sequence)) return true;
  return false;
}

// ---- Pause ----
export function pause() {
  if (state === S.PAUSED || state === S.RESULTS || state === S.SETUP) return;
  setState(S.PAUSED, { resumeState: state });
}
export function pauseIfPlaying() { if (session && !session.ended && state !== S.PAUSED && state !== S.RESULTS) pause(); }
export function resume() { if (state === S.PAUSED) { const rs = prevState; setState(rs, { resumed: true }); } }

export function quit() {
  if (session && !session.ended) { session.ended = true; persistPools(session); }
  emit('engine:quit', { session });
  session = null; state = S.SETUP; mode = null;
}

function end() {
  if (!session) return;
  session.ended = true;
  session.endedAt = Date.now();
  persistPools(session);
  const summary = buildSummary();
  lastSummary = summary;
  setState(S.RESULTS, { summary });
  emit('engine:ended', { session, summary });
}

function buildSummary() {
  const players = session.players.map((p) => {
    const tr = session.turnResults[p.id] || { completed: 0, missed: 0, xp: 0, coins: 0, bestStreak: 0, comebacks: 0 };
    const total = tr.completed + tr.missed;
    return {
      id: p.id, name: p.name, avatar: p.avatar,
      completed: tr.completed, missed: tr.missed, xp: tr.xp, coins: tr.coins,
      bestStreak: tr.bestStreak, comebacks: tr.comebacks,
      passRate: total ? tr.completed / total : 0,
      stars: rewards.starsForRate(total ? tr.completed / total : 0),
    };
  });
  return {
    mode: session.mode,
    durationSec: Math.round(((session.endedAt || Date.now()) - session.startedAt) / 1000),
    players,
    extras: mode.resultsExtras ? mode.resultsExtras(session) : null,
    log: session.log,
  };
}

export const STATES = S;
export default {
  start, begin, getState, getSession, getMode, getLastSummary, afterCountdown, afterSpin, startPoseTimer,
  poseTimerDone, decide, afterReaction, reroll, pause, resume, quit, pauseIfPlaying, STATES: S,
};

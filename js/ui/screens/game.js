// Game screen — a pure view over engine events. Renders each FSM state.
import { el, clear, announce } from '../../core/dom.js';
import router from '../../core/router.js';
import { on } from '../../core/bus.js';
import audio from '../../core/audio.js';
import speech from '../../core/speech.js';
import settings from '../../core/settings.js';
import engine from '../../game/engine.js';
import { createWheel } from '../../game/wheel.js';
import { createTimer } from '../../game/timer.js';
import { poseCard } from '../components/pose-card.js';
import { countdown } from '../components/countdown.js';
import { breathe } from '../components/breathing.js';
import { burst } from '../components/confetti.js';
import store from '../../core/store.js';
import media from '../../core/media.js';
import { toast } from '../components/toast.js';
import { t } from '../../core/strings.js';

let unsub = [];
let stageEl, hudEl;
let wheel = null;
let poseTimer = null;

function cleanup() {
  unsub.forEach((f) => f());
  unsub = [];
  poseTimer?.cancel(); poseTimer = null;
  wheel?.destroy?.(); wheel = null;
  if (nextFallback) { clearTimeout(nextFallback); nextFallback = null; }
  speech.stop();
}

export default {
  id: 'game',
  needsLandscape: true,
  onLeave: cleanup,

  mount(container, params) {
    cleanup();
    const view = el('div.game-screen', {}, [
      hudEl = el('div.game-hud'),
      stageEl = el('div.game-stage'),
    ]);
    container.append(view);

    renderHud();
    unsub.push(on('engine:state', (e) => render(e)));
    unsub.push(on('engine:decision', (e) => onDecision(e)));

    // If we arrived without an active session (e.g. refresh), bounce to setup.
    if (!engine.getSession()) { router.go('setup'); return; }

    // Kick off the first turn now that we're subscribed. If a game is already
    // mid-flight (e.g. returning from pause), re-render the live state instead.
    if (engine.getState() === engine.STATES.SETUP) engine.begin();
    else render({ state: engine.getState(), session: engine.getSession(), player: currentLivePlayer(), pose: engine.getSession()?.currentPose });
  },
};

function currentLivePlayer() {
  const s = engine.getSession();
  return s ? s.players[s.turnIndex % s.players.length] : null;
}

function renderHud() {
  const s = engine.getSession();
  clear(hudEl);
  hudEl.append(
    el('button.hud-btn', { type: 'button', 'aria-label': t('pause'), onClick: () => { audio.play('tap'); engine.pause(); } }, '⏸'),
    el('div.hud-title', {}, `Round ${s?.round || 1}`),
    el('button.hud-btn', { type: 'button', 'aria-label': t('quit'), onClick: () => { audio.play('tap'); if (confirm('Quit this game?')) { engine.quit(); router.go('home'); } } }, '✕'),
  );
}

function playerBadge(player) {
  return el('div.player-badge', {}, [
    el('span.pb-avatar', {}, player.avatar || '🧘'),
    el('span.pb-name', {}, player.name),
  ]);
}

async function render({ state, session, ...payload }) {
  const S = engine.STATES;
  renderHud();
  switch (state) {
    case S.COUNTDOWN: return renderCountdown(payload.player);
    case S.SPINNING: return renderSpin(payload);
    case S.POSE_REVEAL: return renderReveal(payload);
    case S.POSE_TIMER: return renderTimer(payload);
    case S.DECISION: return renderDecision(payload);
    case S.CELEBRATION: return renderCelebration(payload);
    case S.ENCOURAGEMENT: return renderEncouragement(payload);
    case S.PAUSED: return renderPaused(payload);
    case S.RESULTS: return goResults(payload);
    default: break;
  }
}

async function renderCountdown(player) {
  clear(stageEl);
  stageEl.append(playerBadge(player));
  announce(`${player.name}, get ready!`);
  await countdown(stageEl, { from: 3, label: `${player.name}, get ready!` });
  engine.afterCountdown();
}

async function renderSpin({ player, segments, winnerIndex }) {
  clear(stageEl);
  const wrap = el('div.wheel-wrap');
  const mount = el('div.wheel-mount');
  wrap.append(playerBadge(player), mount, el('p.wheel-hint', {}, t('spinning')));
  stageEl.append(wrap);
  const sess = engine.getSession();
  wheel = createWheel(mount, { mode: sess?.mode, story: sess?.wheelConfig?.story });
  wheel.setSegments(segments);
  announce(t('spinning'));
  await wheel.spinTo(winnerIndex);
  audio.play('ding');
  engine.afterSpin();
}

function renderReveal({ player, pose }) {
  clear(stageEl);
  const after = settings.getSetting('descTiming') === 'after';
  const card = poseCard(pose, { showBack: true, hideDesc: after });
  const startBtn = el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { audio.play('select'); engine.startPoseTimer(); } }, t('startPose'));
  const shuffle = el('button.btn.btn-ghost.reveal-shuffle', { type: 'button', 'aria-label': 'Get a different pose', onClick: () => { audio.play('whoosh'); engine.reroll(); } }, '🎲 Different pose');
  stageEl.append(el('div.reveal', {}, [
    playerBadge(player),
    el('div.reveal-card', {}, card),
    el('div.reveal-actions', {}, [shuffle, startBtn]),
  ]));
  announce(`${player.name}, your pose is ${pose.english}.${after ? '' : ' ' + pose.description}`);
  speech.speak(after ? pose.english : `${pose.english}. ${pose.description}`);
}

function renderTimer({ player, pose, duration }) {
  clear(stageEl);
  const ring = el('div.timer-ring');
  const num = el('div.timer-num', {}, String(duration));
  ring.append(num);
  const card = poseCard(pose, { showBack: false, compact: true });
  const skip = el('button.btn.btn-secondary', { type: 'button', onClick: () => { poseTimer?.cancel(); engine.poseTimerDone(); } }, 'Done early');
  stageEl.append(el('div.hold', {}, [
    playerBadge(player),
    el('h2.hold-title', {}, t('holdPose')),
    ring, card, skip,
  ]));

  const total = duration;
  poseTimer = createTimer({
    seconds: duration,
    onTick: (whole) => {
      num.textContent = whole;
      ring.style.setProperty('--pct', String(1 - whole / total));
      if (whole <= 3 && whole > 0) audio.play('countdown');
    },
    onDone: () => { audio.play('ding'); engine.poseTimerDone(); },
  });
  poseTimer.start();
}

function renderDecision({ player, pose }) {
  clear(stageEl);
  announce(t('monitorPrompt'));
  const after = settings.getSetting('descTiming') === 'after';
  if (after) speech.speak(pose.description);
  stageEl.append(el('div.decision', {}, [
    playerBadge(player),
    el('div.decision-card', {}, poseCard(pose, { showBack: false, compact: true })),
    after ? el('p.decision-desc', {}, `${pose.emoji || ''} ${pose.description}`) : null,
    el('p.decision-prompt', {}, t('monitorPrompt')),
    el('div.decision-btns', {}, [
      el('button.btn.btn-practice.btn-xl', { type: 'button', onClick: () => { audio.play('tap'); engine.decide('practice'); } }, [el('span.db-ico', {}, '💪'), t('needsPractice')]),
      el('button.btn.btn-pass.btn-xl', { type: 'button', onClick: () => { audio.play('coin'); engine.decide('pass'); } }, [el('span.db-ico', {}, '⭐'), t('pass')]),
    ]),
  ]));
}

function onDecision({ awarded, result }) {
  // handled visually in celebration/encouragement states
}

function renderCelebration({ player, pose, awarded, streak }) {
  clear(stageEl);
  audio.play('cheer');
  burst({ count: 110, origin: { x: 0.5, y: 0.42 } });
  const msg = streak >= 3 ? `${streak} in a row! 🔥` : t('celebrate');
  announce(`${t('celebrate')} plus ${awarded.xp} points`);
  speech.speak(msg);
  stageEl.append(el('div.reaction.celebrate', {}, [
    playerBadge(player),
    el('div.reaction-emoji', {}, pose.emoji || '🎉'),
    el('h1.reaction-title', {}, msg),
    el('div.reward-fly', {}, [
      el('span.reward-xp', {}, `+${awarded.xp} XP`),
      awarded.coins ? el('span.reward-coin', {}, `+${awarded.coins} 🪙`) : null,
    ]),
    el('div.celebrate-actions', {}, [snapButton(player, pose), nextButton()]),
  ]));
}

// Optional "Snap it!" — capture a photo of the pose into the gallery.
function snapButton(player, pose) {
  if (!media.available()) return null;
  const input = el('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
  input.addEventListener('change', async () => {
    if (!input.files[0]) return;
    try {
      const blob = await media.downscaleImage(input.files[0], 900, 0.82);
      const ref = await media.put(blob, { kind: 'gallery' });
      store.update('gallery', (list) => [{ id: 'ph-' + Math.random().toString(36).slice(2, 9), ref, playerId: player.id, poseId: pose.id, poseName: pose.english, at: Date.now() }, ...list]);
      audio.play('pop'); toast('Saved to Photo Memories! 📸', { icon: '📸' });
    } catch { toast('Could not save that photo.', { tone: 'warn' }); }
  });
  const btn = el('button.btn.btn-secondary.snap-btn', { type: 'button', onClick: () => input.click() }, '📸 Snap it!');
  btn.append(input);
  return btn;
}

function renderEncouragement({ player, pose }) {
  clear(stageEl);
  audio.play('encourage');
  announce(t('encourage'));
  speech.speak("Nice try! We'll see this one again. Keep going!");
  stageEl.append(el('div.reaction.encourage', {}, [
    playerBadge(player),
    el('div.reaction-emoji', {}, '🌱'),
    el('h1.reaction-title', {}, t('encourage')),
    el('p.reaction-sub', {}, "We'll practice this one again soon!"),
    nextButton(),
  ]));
}

// Explicit Next button, with a gentle auto-advance fallback so it never stalls.
let nextFallback = null;
function nextButton() {
  const advance = () => { if (nextFallback) { clearTimeout(nextFallback); nextFallback = null; } audio.play('select'); engine.afterReaction(); };
  clearTimeout(nextFallback);
  nextFallback = setTimeout(advance, 8000);
  return el('button.btn.btn-primary.btn-xl.next-btn', { type: 'button', onClick: advance }, [t('next'), el('span', { 'aria-hidden': 'true' }, ' ▶')]);
}

async function maybeBreather() {
  const s = engine.getSession();
  // A calm breath every full round (except right before results).
  if (s && !s.ended && s.turnIndex % s.players.length === 0 && s.round % 2 === 0) {
    if (engine.getState() === engine.STATES.COUNTDOWN) {
      // insert a breather before the next countdown render kicks in
    }
  }
}

function renderPaused({ resumeState }) {
  const overlay = el('div.pause-overlay.glass', {}, [
    el('h1', {}, '⏸ Paused'),
    el('div.pause-btns', {}, [
      el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { audio.play('select'); engine.resume(); } }, t('resume')),
      el('button.btn.btn-secondary', { type: 'button', onClick: () => { engine.quit(); router.go('home'); } }, t('quit')),
    ]),
  ]);
  stageEl.append(overlay);
}

function goResults({ summary }) {
  cleanup();
  router.go('results');
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

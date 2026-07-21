// Plain session data factory. No logic — the engine mutates this.
export function createSession({ mode, wheelConfig, players, poolsByPlayer, modeState = {} }) {
  return {
    mode,
    wheelConfig,
    players,                 // [{id, name, avatar, ...}]
    poolsByPlayer,           // Map<playerId, pool>
    modeState,               // mode-specific bookkeeping
    turnIndex: 0,
    round: 1,
    log: [],                 // [{playerId, poseId, result, xp}]
    startedAt: Date.now(),
    gameDeadline: null,      // set by engine from settings
    turnResults: {},         // playerId -> {completed, missed, streak, bestStreak, xp, coins, comebacks}
    currentPose: null,
    ended: false,
  };
}

export function currentPlayer(session) {
  return session.players[session.turnIndex % session.players.length];
}

export function ensureTurnResult(session, playerId) {
  return (session.turnResults[playerId] ||= { completed: 0, missed: 0, streak: 0, bestStreak: 0, xp: 0, coins: 0, comebacks: 0, practiced: new Set() });
}

export default { createSession, currentPlayer, ensureTurnResult };

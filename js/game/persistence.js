// Persist anti-repeat pools across sessions, keyed by player+wheel+mode, so a
// class doesn't see the same poses two days running. Sequence pools (daily) are
// not persisted (they reset each day by design).
import store from '../core/store.js';
import { serialize, deserialize } from './pool.js';

function keyFor(playerId, wheelConfig, modeId) {
  const wheelId = wheelConfig.id || 'adhoc';
  return `${playerId}:${wheelId}:${modeId}`;
}

export function loadPools(poolsByPlayer, players, wheelConfig, modeId) {
  const prog = store.get('progress');
  const saved = prog.pools || {};
  for (const p of players) {
    const pool = poolsByPlayer.get(p.id);
    if (!pool || pool.sequence) continue;
    const s = saved[keyFor(p.id, wheelConfig, modeId)];
    if (s && Array.isArray(s.source) && sameSource(s.source, pool.source)) {
      const restored = deserialize(s);
      pool.remaining = restored.remaining.filter((id) => pool.source.includes(id));
      pool.lastDrawn = restored.lastDrawn;
      pool.cycle = restored.cycle;
      if (!pool.remaining.length) pool.remaining = [...pool.source].sort(() => Math.random() - 0.5);
    }
  }
}

function sameSource(a, b) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

export function persistPools(session) {
  if (!session) return;
  store.update('progress', (prog) => {
    const pools = (prog.pools ||= {});
    for (const p of session.players) {
      const pool = session.poolsByPlayer.get(p.id);
      if (!pool || pool.sequence) continue;
      pools[keyFor(p.id, session.wheelConfig, session.mode)] = serialize(pool);
    }
    return prog;
  });
}

export function resetPools() {
  store.update('progress', (prog) => { prog.pools = {}; return prog; });
}

export default { loadPools, persistPools, resetPools };

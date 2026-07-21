// Anti-repeat pool. No pose repeats until the pool is exhausted; a "needs
// practice" pose returns to the pool; refill avoids a back-to-back repeat.
// Deterministic shuffle is fine (Math.random) — fairness, not reproducibility.
export function createPool(poseIds) {
  const source = [...new Set(poseIds)];
  return { source, remaining: shuffle([...source]), lastDrawn: null, cycle: 1 };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function draw(pool) {
  if (!pool.source.length) return null;
  if (!pool.remaining.length) {
    let next = shuffle([...pool.source]);
    // avoid immediate repeat across the cycle boundary
    if (pool.source.length > 1 && next[0] === pool.lastDrawn) next.push(next.shift());
    pool.remaining = next;
    pool.cycle++;
  }
  const id = pool.remaining.pop();
  pool.lastDrawn = id;
  return id;
}

/** Peek n decoys (not the winner) for wheel decoration. */
export function sampleDecoys(pool, winnerId, n) {
  const others = pool.source.filter((id) => id !== winnerId);
  return shuffle(others).slice(0, n);
}

export function returnToPool(pool, id) {
  if (pool.source.includes(id) && !pool.remaining.includes(id)) {
    // reinsert at a random spot so it isn't necessarily next
    const idx = (Math.random() * (pool.remaining.length + 1)) | 0;
    pool.remaining.splice(idx, 0, id);
  }
}

export function serialize(pool) {
  return { source: pool.source, remaining: pool.remaining, lastDrawn: pool.lastDrawn, cycle: pool.cycle };
}
export function deserialize(obj) {
  return { source: obj.source || [], remaining: obj.remaining || [], lastDrawn: obj.lastDrawn ?? null, cycle: obj.cycle || 1 };
}

export default { createPool, draw, sampleDecoys, returnToPool, serialize, deserialize };

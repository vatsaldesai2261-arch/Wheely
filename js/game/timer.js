// rAF + timestamp countdown timer (accurate under tab throttling, unlike
// setInterval). Used for pose timer, game timer and generic delays.
export function createTimer({ seconds, onTick, onDone }) {
  let raf = null;
  let endAt = 0;
  let remainingMs = seconds * 1000;
  let running = false;
  let lastWhole = Math.ceil(seconds);

  function frame() {
    const now = performance.now();
    remainingMs = Math.max(0, endAt - now);
    const whole = Math.ceil(remainingMs / 1000);
    if (whole !== lastWhole) { lastWhole = whole; onTick?.(whole, remainingMs / 1000); }
    if (remainingMs <= 0) { running = false; onDone?.(); return; }
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      running = true;
      endAt = performance.now() + remainingMs;
      onTick?.(lastWhole, remainingMs / 1000);
      raf = requestAnimationFrame(frame);
    },
    pause() {
      if (!running) return;
      running = false;
      remainingMs = Math.max(0, endAt - performance.now());
      if (raf) cancelAnimationFrame(raf);
    },
    resume() {
      if (running || remainingMs <= 0) return;
      running = true;
      endAt = performance.now() + remainingMs;
      raf = requestAnimationFrame(frame);
    },
    cancel() { running = false; if (raf) cancelAnimationFrame(raf); },
    addSeconds(s) { remainingMs += s * 1000; if (running) endAt += s * 1000; },
    get remaining() { return remainingMs / 1000; },
    get running() { return running; },
  };
}

export default { createTimer };

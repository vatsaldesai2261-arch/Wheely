// Searchable multi-pick of poses (+ whole groups). Returns { el, get selected }.
// Used for per-kid focus asanas and routine building.
import { el, clear } from '../../core/dom.js';
import poseLoader from '../../data/pose-loader.js';

export function posePicker({ selected = [], onChange } = {}) {
  const chosen = new Set(selected);
  const search = el('input.text-input', { type: 'search', placeholder: '🔎 Search poses to add…' });
  const chips = el('div.picked-chips');
  const results = el('div.pose-results');
  const wrap = el('div.pose-picker', {}, [search, chips, results]);

  function emit() { onChange?.([...chosen]); }

  function renderChips() {
    clear(chips);
    if (!chosen.size) { chips.append(el('span.empty-hint', {}, 'No poses added yet — search below.')); return; }
    [...chosen].forEach((id) => {
      const p = poseLoader.byId(id);
      chips.append(el('button.chip.is-active', { type: 'button', onClick: () => { chosen.delete(id); renderChips(); renderResults(); emit(); } },
        `${p?.emoji || '🧘'} ${p?.english || id} ✕`));
    });
  }

  function renderResults() {
    clear(results);
    const q = search.value.trim();
    if (!q) return;
    const list = poseLoader.search(q).slice(0, 24);
    list.forEach((p) => {
      const has = chosen.has(p.id);
      results.append(el('button.pose-result-row', { type: 'button', class: `pose-result-row ${has ? 'is-added' : ''}`, onClick: () => { has ? chosen.delete(p.id) : chosen.add(p.id); renderChips(); renderResults(); emit(); } }, [
        el('span.prr-emoji', {}, p.emoji || '🧘'),
        el('span.prr-name', {}, p.english),
        el('span.prr-add', {}, has ? '✓' : '＋'),
      ]));
    });
  }

  search.addEventListener('input', renderResults);
  renderChips();

  return { el: wrap, get value() { return [...chosen]; } };
}

export default { posePicker };

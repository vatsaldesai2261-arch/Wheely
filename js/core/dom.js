// DOM helpers. Keep it tiny and dependency-free.

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/** el('button.big', {onClick, 'aria-label':'x'}, ['Hi', child]) */
export function el(tagSpec, attrs = {}, children = []) {
  const [tag, ...classes] = tagSpec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k in node && k !== 'list') {
      try { node[k] = v; } catch { node.setAttribute(k, v); }
    } else {
      node.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Event delegation: delegate(root, '.chip', 'click', (e, target) => {}) */
export function delegate(root, selector, event, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

let announcer;
/** Announce a message to screen readers via the global aria-live region. */
export function announce(text) {
  announcer ||= document.getElementById('announcer');
  if (!announcer) return;
  announcer.textContent = '';
  // rAF forces AT to re-read even identical text
  requestAnimationFrame(() => { announcer.textContent = text; });
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

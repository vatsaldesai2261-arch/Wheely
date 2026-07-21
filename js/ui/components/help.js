// A small "ⓘ" info button that opens a short, kid-friendly explanation of a
// screen or feature. Reuses the modal component.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import { modal } from './modal.js';

export function helpButton(title, html) {
  return el('button.help-btn', { type: 'button', 'aria-label': `About ${title}`, title: `About ${title}`, onClick: () => {
    audio.play('tap');
    const body = typeof html === 'string' ? el('div.help-body', { html }) : html;
    modal({ title: `ⓘ ${title}`, body, actions: [{ label: 'Got it!', variant: 'btn-primary' }] });
  } }, 'ⓘ');
}

export default { helpButton };

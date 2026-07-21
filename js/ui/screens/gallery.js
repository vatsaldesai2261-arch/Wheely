// Photo memory gallery — snap/upload photos of kids doing poses, saved to
// IndexedDB, shown as a scrapbook. Grown-ups add; everyone enjoys.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import media from '../../core/media.js';
import { toast } from '../components/toast.js';
import { backHeader } from './leaderboard.js';

function uid() { return 'ph-' + Math.random().toString(36).slice(2, 9); }

export default {
  id: 'gallery',
  mount(container) {
    const fileInput = el('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files[0]) return;
      try {
        const blob = await media.downscaleImage(fileInput.files[0], 900, 0.82);
        const ref = await media.put(blob, { kind: 'gallery' });
        store.update('gallery', (list) => [{ id: uid(), ref, at: Date.now() }, ...list]);
        audio.play('pop'); toast('Photo saved to gallery!', { icon: '📸' }); paint();
      } catch { toast('Could not save that photo.', { tone: 'warn' }); }
    });

    const view = el('div.subscreen', {}, [
      backHeader('🖼️ Photo Memories'),
      el('button.btn.btn-primary', { type: 'button', onClick: () => fileInput.click() }, '📸 Add a Photo'),
      fileInput,
      el('div.gallery-grid', { id: 'gallery-grid' }),
    ]);
    container.append(view);
    paint();
  },
};

function paint() {
  const grid = document.getElementById('gallery-grid');
  clear(grid);
  const items = store.get('gallery');
  if (!items.length) { grid.append(el('p.empty-hint', {}, 'No photos yet. Tap "Add a Photo" to start your scrapbook!')); return; }
  items.forEach((it) => {
    const cell = el('div.gallery-cell.glass', {}, [
      el('div.gallery-img', {}, '⏳'),
      el('button.gallery-del', { type: 'button', 'aria-label': 'Delete photo', onClick: () => { media.del(it.ref); store.update('gallery', (l) => l.filter((x) => x.id !== it.id)); audio.play('tap'); paint(); } }, '🗑️'),
    ]);
    media.getURL(it.ref).then((url) => { if (url) cell.querySelector('.gallery-img').innerHTML = `<img src="${url}" alt="">`; });
    grid.append(cell);
  });
}

// Admin — backup/restore + storage meter + pool reset.
import { el } from '../../core/dom.js';
import audio from '../../core/audio.js';
import store from '../../core/store.js';
import backup from '../../admin/backup.js';
import { resetPools } from '../../game/persistence.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { adminHeader } from './admin-players.js';

export default {
  id: 'admin-backup',
  mount(container) {
    const used = store.usageBytes();
    const pct = Math.min(100, Math.round((used / (5 * 1024 * 1024)) * 100));
    const fileInput = el('input', { type: 'file', accept: 'application/json', style: 'display:none' });
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files[0]) return;
      const res = await backup.importFile(fileInput.files[0]);
      if (res.ok) { toast('Backup restored! Reloading…', { icon: '✅' }); setTimeout(() => location.reload(), 1200); }
      else { toast(res.error, { tone: 'warn', duration: 4000 }); }
    });

    const view = el('div.subscreen', {}, [
      adminHeader('💾 Backup & Restore'),
      el('div.storage-meter.glass', {}, [
        el('h2', {}, 'Storage'),
        el('div.meter-track', {}, el('div.meter-fill', { style: `width:${pct}%`, class: pct > 85 ? 'meter-fill meter-high' : 'meter-fill' })),
        el('p.meter-label', {}, `${(used / 1024).toFixed(0)} KB used${store.isMemoryOnly() ? ' · ⚠️ not saved (private mode)' : ''}`),
      ]),
      el('div.backup-actions', {}, [
        el('button.btn.btn-primary.btn-xl', { type: 'button', onClick: () => { const n = backup.download(); audio.play('ding'); toast(`Saved ${n}`, { icon: '💾' }); } }, '⬇️ Export Backup'),
        el('button.btn.btn-secondary', { type: 'button', onClick: () => fileInput.click() }, '⬆️ Import Backup'),
        fileInput,
      ]),
      el('div.danger-zone.glass', {}, [
        el('h2', {}, '⚠️ Reset'),
        el('button.btn.btn-secondary', { type: 'button', onClick: () => { resetPools(); audio.play('tap'); toast('Anti-repeat pools reset', { icon: '🔄' }); } }, 'Reset pose rotation'),
        el('button.btn.btn-danger', { type: 'button', onClick: eraseAll }, 'Erase ALL data'),
      ]),
    ]);
    container.append(view);
  },
};

function eraseAll() {
  const ctrl = modal({
    title: '⚠️ Erase Everything?',
    body: el('p', {}, 'This deletes all players, progress, custom poses and wheels. Export a backup first! This cannot be undone.'),
    actions: [
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Erase All', variant: 'btn-danger', onClick: () => {
        ['players', 'wheels', 'progress', 'stats', 'achievements', 'poseOverrides'].forEach((d) => store.set(d, Array.isArray(store.get(d)) ? [] : {}));
        toast('All data erased. Reloading…', { icon: '🗑️' });
        setTimeout(() => location.reload(), 1200);
      } },
    ],
  });
}

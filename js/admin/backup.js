// Backup & restore — export the full store as JSON; import validates envelope.
import store from '../core/store.js';

export function download() {
  const envelope = store.exportAll();
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const name = `wheely-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}

export function importFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        resolve(store.importAll(obj));
      } catch {
        resolve({ ok: false, error: 'That file is not valid JSON.' });
      }
    };
    reader.onerror = () => resolve({ ok: false, error: 'Could not read the file.' });
    reader.readAsText(file);
  });
}

export default { download, importFile };

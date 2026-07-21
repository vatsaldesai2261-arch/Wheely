// Admin — pose library browser + editor (override layer). Search, filter,
// edit, hide, add custom, attach a downscaled photo.
import { el, clear } from '../../core/dom.js';
import audio from '../../core/audio.js';
import poseLoader from '../../data/pose-loader.js';
import media from '../../core/media.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { adminHeader } from './admin-players.js';

let query = '';
let shown = 60; // pagination: how many rows currently rendered
let catFilter = '';

let showHidden = false;

export default {
  id: 'admin-poses',
  mount(container) {
    query = ''; catFilter = ''; shown = 60; showHidden = false;
    const search = el('input.text-input', { type: 'search', placeholder: '🔎 Search all poses…' });
    search.addEventListener('input', () => { query = search.value; shown = 60; paint(); });
    const cats = poseLoader.getCategories();
    const catSel = el('select.select-input', {}, [el('option', { value: '' }, 'All groups'), ...cats.map((c) => el('option', { value: c.id }, `${c.emoji} ${c.name}`))]);
    catSel.addEventListener('change', () => { catFilter = catSel.value; shown = 60; paint(); });
    const hiddenToggle = el('label.chip', {}, [
      el('input', { type: 'checkbox', onchange: (e) => { showHidden = e.target.checked; shown = 60; paint(); } }),
      el('span', {}, ' Show hidden'),
    ]);

    const view = el('div.subscreen', {}, [
      adminHeader(`🧘 Pose Library (${poseLoader.count()})`),
      el('div.pose-toolbar', {}, [search, catSel, hiddenToggle, el('button.btn.btn-primary', { type: 'button', onClick: () => editPose(null) }, '➕ Custom')]),
      el('div.pose-admin-list', { id: 'pose-admin-list' }),
    ]);
    container.append(view);
    paint();
  },
};

function fullList() {
  // include hidden entries when the toggle is on (search()/all() exclude them)
  let list = showHidden ? poseLoader.allIncludingHidden() : poseLoader.search(query);
  if (showHidden && query) {
    const q = query.trim().toLowerCase();
    list = list.filter((p) => p.english.toLowerCase().includes(q) || (p.sanskrit || '').toLowerCase().includes(q) || p.category.includes(q));
  }
  if (catFilter) list = list.filter((p) => p.category === catFilter);
  return list;
}

function paint() {
  const wrap = document.getElementById('pose-admin-list');
  clear(wrap);
  const list = fullList();
  const page = list.slice(0, shown);
  wrap.append(el('p.list-count', {}, `Showing ${page.length} of ${list.length}`));
  page.forEach((p) => {
    const hidden = p._hidden;
    wrap.append(el('div.pose-admin-row.glass', { class: `pose-admin-row glass ${hidden ? 'is-hidden-pose' : ''}` }, [
      el('span.par-emoji', {}, p.emoji || '🧘'),
      el('div.par-info', {}, [
        el('span.par-name', {}, p.english),
        el('span.par-meta', {}, `${p.sanskrit || '—'} · ${p.difficulty} · ${p.category}${p.source === 'custom' ? ' · custom' : p.source === 'edited' ? ' · edited' : ''}${hidden ? ' · hidden' : ''}${p.videoRef ? ' · 🎬' : ''}`),
      ]),
      el('div.par-actions', {}, [
        el('button.icon-btn', { type: 'button', 'aria-label': 'Edit', onClick: () => editPose(p) }, '✏️'),
        hidden
          ? el('button.icon-btn', { type: 'button', 'aria-label': 'Show pose', title: 'Show', onClick: () => { poseLoader.hidePose(p.id, false); audio.play('tap'); toast(`${p.english} is back!`, { icon: '👀' }); paint(); } }, '👁️')
          : el('button.icon-btn', { type: 'button', 'aria-label': 'Hide pose', title: 'Hide', onClick: () => { poseLoader.hidePose(p.id, true); audio.play('tap'); toast(`${p.english} hidden`, { icon: '🙈' }); paint(); } }, '🙈'),
      ]),
    ]));
  });
  if (shown < list.length) {
    wrap.append(el('button.btn.btn-secondary.load-more', { type: 'button', onClick: () => { shown += 60; paint(); } }, `Load more (${list.length - shown} left)`));
  }
}

function editPose(existing) {
  audio.play('tap');
  const f = {};
  const field = (key, label, val = '', type = 'text') => {
    const input = type === 'textarea' ? el('textarea.text-input', { rows: '2' }, val || '') : el('input.text-input', { type, value: val });
    f[key] = input;
    return el('div', {}, [el('label.field-label', {}, label), input]);
  };
  const cats = poseLoader.getCategories();
  const catSel = el('select.select-input', {}, cats.map((c) => el('option', { value: c.id, selected: existing?.category === c.id }, c.name)));
  const diffSel = el('select.select-input', {}, ['easy', 'medium', 'hard', 'advanced'].map((d) => el('option', { value: d, selected: (existing?.difficulty || 'easy') === d }, d)));
  f.category = catSel; f.difficulty = diffSel;

  const photo = el('input', { type: 'file', accept: 'image/*' });
  let imageRef = existing?.imageRef || null;
  let imageDataUri = existing?.imageDataUri || null; // legacy support
  const photoStatus = el('span.media-status', {}, imageRef || imageDataUri ? '✓ photo set' : '');
  photo.addEventListener('change', async () => {
    if (!photo.files[0]) return;
    try {
      const blob = await media.downscaleImage(photo.files[0], 720, 0.82);
      if (imageRef) media.del(imageRef);
      imageRef = await media.put(blob, { kind: 'pose-image' });
      imageDataUri = null;
      photoStatus.textContent = '✓ photo set';
      toast('Photo attached', { icon: '📷' });
    } catch { toast('Could not read that photo.', { tone: 'warn' }); }
  });

  const video = el('input', { type: 'file', accept: 'video/*' });
  let videoRef = existing?.videoRef || null;
  const videoStatus = el('span.media-status', {}, videoRef ? '✓ video set' : '');
  video.addEventListener('change', async () => {
    if (!video.files[0]) return;
    const chk = media.checkVideo(video.files[0]);
    if (!chk.ok) { toast(chk.error, { tone: 'warn', duration: 4000 }); video.value = ''; return; }
    try {
      if (videoRef) media.del(videoRef);
      videoRef = await media.put(video.files[0], { kind: 'pose-video' });
      videoStatus.textContent = '✓ video set';
      toast('Video attached', { icon: '🎬' });
    } catch { toast('Could not save that video.', { tone: 'warn' }); }
  });

  const body = el('div', {}, [
    field('english', 'Name', existing?.english),
    field('sanskrit', 'Sanskrit (Latin)', existing?.sanskrit),
    field('sanskritDevanagari', 'Sanskrit (Devanagari)', existing?.sanskritDevanagari),
    field('animalName', 'Animal (optional)', existing?.animalName),
    field('emoji', 'Emoji', existing?.emoji || '🧘'),
    el('label.field-label', {}, 'Group'), catSel,
    el('label.field-label', {}, 'Difficulty'), diffSel,
    field('description', 'Kid instructions', existing?.description, 'textarea'),
    field('funFact', 'Fun fact', existing?.funFact, 'textarea'),
    field('story', 'Story', existing?.story, 'textarea'),
    field('safetyNote', 'Safety note (hard/advanced)', existing?.safetyNote),
    field('duration', 'Hold seconds', existing?.duration || 10, 'number'),
    el('label.field-label', {}, 'Photo (optional, overrides art)'), el('div.photo-btn-row', {}, [photo, photoStatus]),
    el('label.field-label', {}, 'Video (optional, ≤ 6 MB short clip)'), el('div.photo-btn-row', {}, [video, videoStatus]),
  ]);

  const ctrl = modal({
    title: existing ? `Edit: ${existing.english}` : 'New Custom Pose',
    body, className: 'modal-wide',
    actions: [
      existing && poseLoader.isBuiltin(existing.id)
        ? { label: 'Reset', variant: 'btn-secondary', onClick: () => { poseLoader.resetOverride(existing.id); toast('Reset to original', { icon: '↩️' }); paint(); } }
        : null,
      { label: 'Cancel', variant: 'btn-secondary' },
      { label: 'Save', variant: 'btn-primary', closeOnClick: false, onClick: () => {
        const english = f.english.value.trim();
        if (!english) { toast('Name is required', { tone: 'warn' }); return true; }
        const pose = {
          id: existing?.id || 'custom-' + Math.random().toString(36).slice(2, 9),
          english,
          sanskrit: f.sanskrit.value.trim(),
          sanskritDevanagari: f.sanskritDevanagari.value.trim(),
          animalName: f.animalName.value.trim(),
          emoji: f.emoji.value.trim() || '🧘',
          category: f.category.value,
          difficulty: f.difficulty.value,
          benefits: existing?.benefits || ['A fun stretch'],
          funFact: f.funFact.value.trim() || 'Yoga is thousands of years old!',
          story: f.story.value.trim() || '',
          description: f.description.value.trim() || 'Strike the pose and hold it!',
          duration: +f.duration.value || 10,
        };
        const safety = f.safetyNote.value.trim();
        if (safety) pose.safetyNote = safety;
        if (imageRef) pose.imageRef = imageRef;
        else if (imageDataUri) pose.imageDataUri = imageDataUri;
        if (videoRef) pose.videoRef = videoRef;
        poseLoader.upsertOverride(pose);
        audio.play('ding'); ctrl.close(); paint();
        return true;
      } },
    ].filter(Boolean),
  });
}

// Downscale to ≤512px JPEG to protect localStorage quota.
function downscale(file, max = 512, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

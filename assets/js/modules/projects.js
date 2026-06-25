/* ═══════════════════════════════════════════════════════════
   MODULE: PROJECTS.JS — Manage projects + image upload
═══════════════════════════════════════════════════════════ */
import { sb }                                    from '../supabase.js';
import { toast, modal, loader, confirm,
         initTagsInput, setBtnLoading }           from '../ui.js';
import { compressToWebP, blobToFile,
         createPreviewURL, formatBytes }          from '../image.js';

let projectsData = [];
let editingId    = null;
let tagsCtrl     = null;
let pendingFile  = null; // WebP File siap upload

export async function initProjects() {
  const page = document.getElementById('page-projects');
  if (!page) return;

  // Tags input
  const wrap  = document.getElementById('project-tags-wrap');
  const input = document.getElementById('project-tags-input');
  if (wrap && input) tagsCtrl = initTagsInput(wrap, input, () => {});

  // Image upload zone
  initUploadZone();

  document.getElementById('project-add-btn')?.addEventListener('click', () => openModal());
  document.getElementById('project-modal-close')?.addEventListener('click', () => modal.close('project-modal'));
  document.getElementById('project-save-btn')?.addEventListener('click', saveProject);

  await loadProjects();
}

function initUploadZone() {
  const zone    = document.getElementById('project-upload-zone');
  const fileIn  = document.getElementById('project-image-file');
  const preview = document.getElementById('project-image-preview');
  const info    = document.getElementById('project-image-info');
  const progress = document.getElementById('project-upload-progress');
  const bar      = document.getElementById('project-upload-bar');

  if (!zone || !fileIn) return;

  // Drag & drop
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) processImage(file);
  });

  fileIn.addEventListener('change', () => {
    const file = fileIn.files[0];
    if (file) processImage(file);
  });

  async function processImage(file) {
    if (info) info.textContent = 'Compressing...';
    if (progress) progress.style.display = 'block';
    if (bar) bar.style.width = '30%';

    try {
      const webpBlob = await compressToWebP(file);
      if (bar) bar.style.width = '100%';
      pendingFile = blobToFile(webpBlob, file.name);

      // Preview
      if (preview) {
        preview.src = createPreviewURL(webpBlob);
        preview.style.display = 'block';
      }
      if (info) info.textContent = `WebP · ${formatBytes(webpBlob.size)} (original: ${formatBytes(file.size)})`;
      setTimeout(() => { if (progress) progress.style.display = 'none'; }, 600);
    } catch (err) {
      toast.error('Gagal compress gambar: ' + err.message);
      if (info) info.textContent = '';
      if (progress) progress.style.display = 'none';
    }
  }
}

async function loadProjects() {
  const tbody = document.getElementById('projects-tbody');
  if (!tbody) return;
  loader.show(tbody.closest('.table-wrap') || tbody);

  try {
    projectsData = await sb.select('projects', { order: 'sort_order.asc' });
    renderTable();
  } catch (err) {
    toast.error('Gagal load projects: ' + err.message);
  }
}

function renderTable() {
  const tbody = document.getElementById('projects-tbody');
  if (!tbody) return;

  if (!projectsData.length) {
    loader.empty(tbody.closest('.table-wrap'), 'Belum ada project', 'Tambah project pertama kamu!');
    return;
  }

  tbody.innerHTML = projectsData.map(p => `
    <tr>
      <td>
        ${p.image_url
          ? `<img src="${p.image_url}" style="width:56px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)" onerror="this.style.display='none'" />`
          : `<div style="width:56px;height:40px;background:var(--surface-3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.6rem;color:var(--white-dim)">${p.fallback||'IMG'}</div>`}
      </td>
      <td>
        <div style="font-weight:500;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div>
        <div class="td-muted">${p.num ? `#${p.num}` : ''}</div>
      </td>
      <td class="td-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.body}</td>
      <td>
        ${p.link ? `<a href="${p.link}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:0.7rem">↗ Link</a>` : '<span class="muted">—</span>'}
      </td>
      <td><input class="form-input order-input" type="number" value="${p.sort_order}" min="0"
            onchange="window._projectOrder(${p.id}, this.value)" /></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window._projectEdit(${p.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="window._projectDelete(${p.id}, '${p.image_url}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function openModal(data = null) {
  editingId   = data?.id || null;
  pendingFile = null;

  const title = document.getElementById('project-modal-title');
  if (title) title.textContent = editingId ? 'Edit Project' : 'Add Project';

  document.getElementById('project-num').value      = data?.num      || '';
  document.getElementById('project-title').value    = data?.title    || '';
  document.getElementById('project-body').value     = data?.body     || '';
  document.getElementById('project-link').value     = data?.link     || '';
  document.getElementById('project-fallback').value = data?.fallback || '';
  document.getElementById('project-order').value    = data?.sort_order ?? projectsData.length;

  const preview = document.getElementById('project-image-preview');
  const info    = document.getElementById('project-image-info');
  if (preview) { preview.src = data?.image_url || ''; preview.style.display = data?.image_url ? 'block' : 'none'; }
  if (info) info.textContent = data?.image_url ? 'Existing image (upload baru untuk ganti)' : '';

  const fileIn = document.getElementById('project-image-file');
  if (fileIn) fileIn.value = '';

  if (tagsCtrl) tagsCtrl.setTags(data?.tags || []);
  modal.open('project-modal');
}

async function saveProject() {
  const saveBtn = document.getElementById('project-save-btn');
  const title   = document.getElementById('project-title').value.trim();
  if (!title) { toast.error('Judul project wajib diisi.'); return; }

  setBtnLoading(saveBtn, true, 'Saving...');
  try {
    let imageUrl = editingId
      ? (projectsData.find(p => p.id === editingId)?.image_url || '')
      : '';

    // Upload gambar kalau ada file baru
    if (pendingFile) {
      const path = `projects/${pendingFile.name}`;
      imageUrl   = await sb.uploadFile('portfolio-assets', path, pendingFile);
      toast.info('Gambar diupload ✓');
    }

    const payload = {
      num       : document.getElementById('project-num').value.trim(),
      title,
      body      : document.getElementById('project-body').value.trim(),
      image_url : imageUrl,
      link      : document.getElementById('project-link').value.trim(),
      tags      : tagsCtrl ? tagsCtrl.getTags() : [],
      fallback  : document.getElementById('project-fallback').value.trim(),
      sort_order: parseInt(document.getElementById('project-order').value) || 0
    };

    if (editingId) await sb.update('projects', editingId, payload);
    else           await sb.insert('projects', payload);

    toast.success(editingId ? 'Project diupdate!' : 'Project ditambahkan!');
    modal.close('project-modal');
    await loadProjects();
  } catch (err) {
    toast.error('Gagal simpan: ' + err.message);
  } finally {
    setBtnLoading(saveBtn, false);
  }
}

window._projectEdit = (id) => {
  const data = projectsData.find(p => p.id === id);
  if (data) openModal(data);
};

window._projectDelete = async (id, imageUrl) => {
  const ok = await confirm('Hapus project ini? Gambar di storage juga akan dihapus.');
  if (!ok) return;
  try {
    // Hapus dari storage kalau ada
    if (imageUrl && imageUrl.includes('portfolio-assets')) {
      const path = imageUrl.split('/portfolio-assets/')[1];
      if (path) await sb.deleteFile('portfolio-assets', path);
    }
    await sb.delete('projects', id);
    toast.success('Project dihapus.');
    await loadProjects();
  } catch (err) {
    toast.error('Gagal hapus: ' + err.message);
  }
};

window._projectOrder = async (id, val) => {
  try {
    await sb.update('projects', id, { sort_order: parseInt(val) || 0 });
    toast.success('Urutan disimpan.');
  } catch (err) {
    toast.error('Gagal update urutan.');
  }
};

/* ═══════════════════════════════════════════════════════════
   MODULE: SLIDES.JS — Manage Education/Venture slides
═══════════════════════════════════════════════════════════ */
import { sb }                                   from '../supabase.js';
import { toast, modal, loader, confirm,
         initTagsInput, setBtnLoading }          from '../ui.js';

let slidesData  = [];
let editingId   = null;
let tagsCtrl    = null;

export async function initSlides() {
  const page = document.getElementById('page-slides');
  if (!page) return;

  // Tags input
  const wrap  = document.getElementById('slide-tags-wrap');
  const input = document.getElementById('slide-tags-input');
  if (wrap && input) tagsCtrl = initTagsInput(wrap, input, () => {});

  // Events
  document.getElementById('slide-add-btn')?.addEventListener('click', () => openModal());
  document.getElementById('slide-modal-close')?.addEventListener('click', () => modal.close('slide-modal'));
  document.getElementById('slide-save-btn')?.addEventListener('click', saveSlide);

  await loadSlides();
}

async function loadSlides() {
  const tbody = document.getElementById('slides-tbody');
  if (!tbody) return;
  loader.show(tbody.closest('.table-wrap') || tbody, 'Loading slides...');

  try {
    slidesData = await sb.select('slides', { order: 'tab.asc,sort_order.asc' });
    renderTable();
  } catch (err) {
    toast.error('Gagal load slides: ' + err.message);
  }
}

function renderTable() {
  const tbody = document.getElementById('slides-tbody');
  if (!tbody) return;

  if (!slidesData.length) {
    const wrap = tbody.closest('.table-wrap');
    if (wrap) loader.empty(wrap, 'Belum ada slide', 'Klik "+ Add Slide" untuk menambah.');
    return;
  }

  tbody.innerHTML = slidesData.map(s => `
    <tr>
      <td>
        <span class="badge ${s.tab === 'Education' ? 'badge-blue' : 'badge-green'}">${s.tab}</span>
      </td>
      <td>
        <div style="font-weight:500">${s.title}</div>
        <div class="td-muted">${s.subtitle}</div>
      </td>
      <td class="td-muted">${s.period}</td>
      <td>
        ${s.founder ? '<span class="badge badge-green"><span class="badge-dot"></span>Founder</span>' : '<span class="muted">—</span>'}
      </td>
      <td><input class="form-input order-input" type="number" value="${s.sort_order}" min="0"
            onchange="window._slideOrder(${s.id}, this.value)" /></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window._slideEdit(${s.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="window._slideDelete(${s.id})" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function openModal(data = null) {
  editingId = data?.id || null;
  const title = document.getElementById('slide-modal-title');
  if (title) title.textContent = editingId ? 'Edit Slide' : 'Add Slide';

  // Reset / fill form
  document.getElementById('slide-tab').value      = data?.tab      || 'Education';
  document.getElementById('slide-period').value   = data?.period   || '';
  document.getElementById('slide-title').value    = data?.title    || '';
  document.getElementById('slide-subtitle').value = data?.subtitle || '';
  document.getElementById('slide-body').value     = data?.body     || '';
  document.getElementById('slide-order').value    = data?.sort_order ?? 0;

  const founderToggle = document.getElementById('slide-founder');
  if (founderToggle) founderToggle.checked = data?.founder || false;

  if (tagsCtrl) tagsCtrl.setTags(data?.tags || []);
  modal.open('slide-modal');
}

async function saveSlide() {
  const saveBtn = document.getElementById('slide-save-btn');
  const payload = {
    tab       : document.getElementById('slide-tab').value,
    period    : document.getElementById('slide-period').value.trim(),
    title     : document.getElementById('slide-title').value.trim(),
    subtitle  : document.getElementById('slide-subtitle').value.trim(),
    body      : document.getElementById('slide-body').value.trim(),
    tags      : tagsCtrl ? tagsCtrl.getTags() : [],
    founder   : document.getElementById('slide-founder')?.checked || false,
    sort_order: parseInt(document.getElementById('slide-order').value) || 0
  };

  if (!payload.title) { toast.error('Title wajib diisi.'); return; }

  setBtnLoading(saveBtn, true, 'Saving...');
  try {
    if (editingId) await sb.update('slides', editingId, payload);
    else           await sb.insert('slides', payload);
    toast.success(editingId ? 'Slide diupdate!' : 'Slide ditambahkan!');
    modal.close('slide-modal');
    await loadSlides();
  } catch (err) {
    toast.error('Gagal simpan: ' + err.message);
  } finally {
    setBtnLoading(saveBtn, false);
  }
}

/* Global handlers (called from inline onclick) */
window._slideEdit = (id) => {
  const data = slidesData.find(s => s.id === id);
  if (data) openModal(data);
};

window._slideDelete = async (id) => {
  const ok = await confirm('Hapus slide ini? Tindakan tidak bisa dibatalkan.');
  if (!ok) return;
  try {
    await sb.delete('slides', id);
    toast.success('Slide dihapus.');
    await loadSlides();
  } catch (err) {
    toast.error('Gagal hapus: ' + err.message);
  }
};

window._slideOrder = async (id, val) => {
  try {
    await sb.update('slides', id, { sort_order: parseInt(val) || 0 });
    toast.success('Urutan disimpan.');
  } catch (err) {
    toast.error('Gagal update urutan.');
  }
};

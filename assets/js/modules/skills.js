/* ═══════════════════════════════════════════════════════════
   MODULE: SKILLS.JS — Manage skills + icon picker
═══════════════════════════════════════════════════════════ */
import { sb }                                   from '../supabase.js';
import { toast, modal, loader, confirm,
         setBtnLoading }                        from '../ui.js';

let skillsData = [];
let editingId  = null;

const ICONS = [
  'video-editing','film','monitor','smartphone','layers','pen-tool','star',
  'file-text','home','globe','camera','image','music','mic','code',
  'settings','layout','edit','share','trending-up','zap','aperture'
];

export async function initSkills() {
  const page = document.getElementById('page-skills');
  if (!page) return;

  // Build icon picker
  buildIconPicker();

  document.getElementById('skill-add-btn')?.addEventListener('click', () => openModal());
  document.getElementById('skill-modal-close')?.addEventListener('click', () => modal.close('skill-modal'));
  document.getElementById('skill-save-btn')?.addEventListener('click', saveSkill);

  await loadSkills();
}

function buildIconPicker() {
  const grid = document.getElementById('icon-picker-grid');
  if (!grid) return;
  grid.innerHTML = ICONS.map(name => `
    <button type="button" class="icon-option" data-icon="${name}" title="${name}"
      onclick="window._selectIcon('${name}')">
      ${getIconSVG(name)}
    </button>`).join('');
}

async function loadSkills() {
  const tbody = document.getElementById('skills-tbody');
  if (!tbody) return;
  loader.show(tbody.closest('.table-wrap') || tbody);

  try {
    skillsData = await sb.select('skills', { order: 'sort_order.asc' });
    renderTable();
  } catch (err) {
    toast.error('Gagal load skills: ' + err.message);
  }
}

function renderTable() {
  const tbody = document.getElementById('skills-tbody');
  if (!tbody) return;

  if (!skillsData.length) {
    loader.empty(tbody.closest('.table-wrap'), 'Belum ada skill', 'Tambah skill pertama kamu!');
    return;
  }

  tbody.innerHTML = skillsData.map(s => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span class="skill-icon-preview">${getIconSVG(s.icon)}</span>
          <code style="font-size:0.7rem;color:var(--white-dim)">${s.icon}</code>
        </div>
      </td>
      <td><strong>${s.name}</strong></td>
      <td class="td-muted" style="max-width:280px">${s.body}</td>
      <td><input class="form-input order-input" type="number" value="${s.sort_order}" min="0"
            onchange="window._skillOrder(${s.id}, this.value)" /></td>
      <td>
        <div class="td-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="window._skillEdit(${s.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="window._skillDelete(${s.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function openModal(data = null) {
  editingId = data?.id || null;
  const title = document.getElementById('skill-modal-title');
  if (title) title.textContent = editingId ? 'Edit Skill' : 'Add Skill';

  document.getElementById('skill-name').value  = data?.name  || '';
  document.getElementById('skill-body').value  = data?.body  || '';
  document.getElementById('skill-order').value = data?.sort_order ?? skillsData.length;

  // Set icon selection
  const selectedIcon = data?.icon || 'star';
  document.getElementById('skill-icon-val').value = selectedIcon;
  document.querySelectorAll('.icon-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.icon === selectedIcon);
  });

  modal.open('skill-modal');
}

async function saveSkill() {
  const saveBtn = document.getElementById('skill-save-btn');
  const payload = {
    icon      : document.getElementById('skill-icon-val').value || 'star',
    name      : document.getElementById('skill-name').value.trim(),
    body      : document.getElementById('skill-body').value.trim(),
    sort_order: parseInt(document.getElementById('skill-order').value) || 0
  };

  if (!payload.name) { toast.error('Nama skill wajib diisi.'); return; }

  setBtnLoading(saveBtn, true, 'Saving...');
  try {
    if (editingId) await sb.update('skills', editingId, payload);
    else           await sb.insert('skills', payload);
    toast.success(editingId ? 'Skill diupdate!' : 'Skill ditambahkan!');
    modal.close('skill-modal');
    await loadSkills();
  } catch (err) {
    toast.error('Gagal simpan: ' + err.message);
  } finally {
    setBtnLoading(saveBtn, false);
  }
}

function getIconSVG(name) {
  const paths = {
    'video-editing' : '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    'film'          : '<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
    'monitor'       : '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    'smartphone'    : '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    'layers'        : '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    'pen-tool'      : '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    'star'          : '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'file-text'     : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    'home'          : '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'globe'         : '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    'camera'        : '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    'image'         : '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    'music'         : '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    'mic'           : '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    'code'          : '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    'settings'      : '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'layout'        : '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    'edit'          : '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    'share'         : '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    'trending-up'   : '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    'zap'           : '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'aperture'      : '<circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/>'
  };
  const p = paths[name] || paths['star'];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18">${p}</svg>`;
}

window._selectIcon = (name) => {
  document.getElementById('skill-icon-val').value = name;
  document.querySelectorAll('.icon-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.icon === name);
  });
};

window._skillEdit = (id) => {
  const data = skillsData.find(s => s.id === id);
  if (data) openModal(data);
};

window._skillDelete = async (id) => {
  const ok = await confirm('Hapus skill ini?');
  if (!ok) return;
  try {
    await sb.delete('skills', id);
    toast.success('Skill dihapus.');
    await loadSkills();
  } catch (err) {
    toast.error('Gagal hapus: ' + err.message);
  }
};

window._skillOrder = async (id, val) => {
  try {
    await sb.update('skills', id, { sort_order: parseInt(val) || 0 });
    toast.success('Urutan disimpan.');
  } catch (err) {
    toast.error('Gagal update urutan.');
  }
};

export { getIconSVG };

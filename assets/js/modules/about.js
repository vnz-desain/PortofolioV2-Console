/* ═══════════════════════════════════════════════════════════
   MODULE: ABOUT.JS — Manage bio & tags
═══════════════════════════════════════════════════════════ */
import { sb }                        from '../supabase.js';
import { toast, initTagsInput, setBtnLoading } from '../ui.js';

let tagsCtrl = null;
let aboutId  = null;

export async function initAbout() {
  const page = document.getElementById('page-about');
  if (!page) return;

  // Init tags input
  const tagsWrap = document.getElementById('about-tags-wrap');
  const tagsInput = document.getElementById('about-tags-input');
  if (tagsWrap && tagsInput) {
    tagsCtrl = initTagsInput(tagsWrap, tagsInput, () => {});
  }

  // Load data
  await loadAbout();

  // Save handler
  const saveBtn = document.getElementById('about-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', saveAbout);
}

async function loadAbout() {
  const bioEl  = document.getElementById('about-bio');
  const saveBtn = document.getElementById('about-save-btn');
  if (saveBtn) saveBtn.disabled = true;

  try {
    const rows = await sb.select('about', { limit: 1 });
    const data = rows[0];
    if (!data) return;

    aboutId = data.id;
    if (bioEl) bioEl.value = data.bio || '';
    if (tagsCtrl) tagsCtrl.setTags(data.tags || []);
  } catch (err) {
    toast.error('Gagal load data About: ' + err.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function saveAbout() {
  const saveBtn = document.getElementById('about-save-btn');
  const bioEl   = document.getElementById('about-bio');
  const bio     = bioEl?.value?.trim();

  if (!bio) { toast.error('Bio tidak boleh kosong.'); return; }

  setBtnLoading(saveBtn, true, 'Saving...');
  try {
    const tags = tagsCtrl ? tagsCtrl.getTags() : [];
    const payload = { bio, tags, updated_at: new Date().toISOString() };

    if (aboutId) {
      await sb.update('about', aboutId, payload);
    } else {
      const res = await sb.insert('about', payload);
      aboutId = res[0]?.id;
    }
    toast.success('About berhasil disimpan!');
  } catch (err) {
    toast.error('Gagal simpan: ' + err.message);
  } finally {
    setBtnLoading(saveBtn, false);
  }
}

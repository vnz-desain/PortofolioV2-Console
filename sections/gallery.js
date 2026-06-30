/* ══ GALLERY ════════════════════════════════════════════
   Manage folders + photos via Supabase Storage
   Bucket  : portfolio-assets
   Path    : gallery/[slug]/[filename].webp
══════════════════════════════════════════════════════ */

const GALLERY_BUCKET = 'portfolio-assets';

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function fmtOrder(n) {
  return String(n ?? 0).padStart(4, '0');
}

/* ══ FOLDERS ════════════════════════════════════════════ */
let _folders   = [];
let _folderId  = null;

function initGallery() {
  try {
    document.getElementById('gf-add').addEventListener('click', () => openFolder());
    document.getElementById('gf-modal-x').addEventListener('click', () => modal.close('gf-modal'));
    document.getElementById('gf-save').addEventListener('click', saveFolder);
    document.getElementById('gf-delete').addEventListener('click', () => delFolder(_folderId));
    loadFolders();
  } catch (e) {
    console.error('[gallery] initGallery error:', e);
    toast.err('Gagal inisialisasi gallery: ' + e.message);
  }
}

async function loadFolders() {
  try {
    _folders = await sb.get('gallery_folders', 'sort_order.asc');
    renderFolders();
  } catch (e) {
    console.error('[gallery] loadFolders error:', e);
    toast.err('Gagal load folders: ' + e.message);
  }
}

function renderFolders() {
  const wrap = document.getElementById('gf-list');
  if (!wrap) return;
  if (!_folders.length) {
    wrap.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p>Belum ada folder gallery.</p>
    </div>`;
    return;
  }
  wrap.innerHTML = _folders.map(f => `
    <div class="row-item">
      <span class="row-order">${fmtOrder(f.sort_order)}</span>
      <span class="row-title">
        <span class="cell-title">${f.name}</span>
        <span class="cell-sub">${f.description || ''} <code style="font-size:0.7rem;opacity:0.45">/${f.slug}/</code></span>
      </span>
      <span class="row-action" style="display:flex;gap:0.4rem">
        <button class="btn btn-ghost btn-sm" onclick="openGalleryPhotos(${f.id},'${f.name}','${f.slug}')">📷 Foto</button>
        <button class="btn btn-ghost btn-sm" onclick="openFolder(${f.id})">Ubah</button>
      </span>
    </div>`).join('');
}

function openFolder(id) {
  _folderId = id || null;
  const d   = id ? _folders.find(f => f.id === id) : null;
  document.getElementById('gf-modal-title').textContent  = d ? 'Edit Folder' : 'Add Folder';
  document.getElementById('gf-name').value               = d?.name        || '';
  document.getElementById('gf-slug').value               = d?.slug        || '';
  document.getElementById('gf-desc').value               = d?.description || '';
  document.getElementById('gf-order').value              = d?.sort_order  ?? _folders.length;
  document.getElementById('gf-delete').style.display     = d ? 'flex' : 'none';

  // Auto-slug hanya untuk folder baru
  const nameEl = document.getElementById('gf-name');
  nameEl.oninput = id ? null : function () {
    document.getElementById('gf-slug').value = slugify(this.value);
  };
  modal.open('gf-modal');
}

async function saveFolder() {
  const btn  = document.getElementById('gf-save');
  const name = document.getElementById('gf-name').value.trim();
  let   slug = document.getElementById('gf-slug').value.trim();
  if (!name) { toast.err('Nama wajib diisi.'); return; }
  if (!slug)  slug = slugify(name);
  btnLoad(btn, true);
  try {
    const payload = {
      name,
      slug,
      description: document.getElementById('gf-desc').value.trim() || null,
      sort_order:  parseInt(document.getElementById('gf-order').value) || 0
    };
    if (_folderId) await sb.patch('gallery_folders', _folderId, payload);
    else           await sb.post('gallery_folders', payload);
    toast.ok(_folderId ? 'Folder diupdate!' : 'Folder ditambahkan!');
    modal.close('gf-modal');
    await loadFolders();
  } catch (e) {
    console.error('[gallery] saveFolder error:', e);
    toast.err('Gagal: ' + e.message);
  } finally { btnLoad(btn, false); }
}

async function delFolder(id) {
  if (!id) return;
  if (!confirm('Hapus folder ini? Data foto di DB akan ikut terhapus (file di Storage tidak otomatis hapus).')) return;
  try {
    await sb.del('gallery_folders', id);
    toast.ok('Folder dihapus.');
    modal.close('gf-modal');
    await loadFolders();
  } catch (e) {
    console.error('[gallery] delFolder error:', e);
    toast.err('Gagal hapus: ' + e.message);
  }
}

/* ══ PHOTOS ═════════════════════════════════════════════ */
let _currentFolder = null;
let _photos        = [];

function openGalleryPhotos(folderId, folderName, slug) {
  _currentFolder = { id: folderId, name: folderName, slug };
  document.getElementById('gp-folder-name').textContent = folderName;
  modal.open('gp-modal');
  loadPhotos(folderId);
  _initUploadZone();
}

async function loadPhotos(folderId) {
  const grid = document.getElementById('gp-grid');
  grid.innerHTML = '<div class="empty"><div class="spin spin-light"></div><p style="margin-top:0.5rem;opacity:0.6">Memuat foto...</p></div>';
  try {
    _photos = await sb.get('gallery_photos', 'sort_order.asc', 'folder_id=eq.' + folderId);
    renderPhotos();
  } catch (e) {
    console.error('[gallery] loadPhotos error:', e);
    grid.innerHTML = `<div class="empty"><p style="color:var(--danger,#f87171)">Gagal load foto: ${e.message}</p></div>`;
    toast.err('Gagal load foto: ' + e.message);
  }
}

function renderPhotos() {
  const grid = document.getElementById('gp-grid');
  if (!_photos.length) {
    grid.innerHTML = `<div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p>Belum ada foto. Upload sekarang!</p>
    </div>`;
    return;
  }
  grid.innerHTML = _photos.map(p => `
    <div class="gp-photo-item">
      <img src="${p.url}" alt="${p.name}" loading="lazy" onerror="this.style.opacity='0.3'" />
      <div class="gp-photo-overlay">
        <span class="gp-photo-order">${fmtOrder(p.sort_order)}</span>
        <span class="gp-photo-name">${p.name}</span>
        <div style="display:flex;gap:0.3rem;margin-top:0.3rem">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="editPhotoOrder(${p.id},${p.sort_order})" title="Ubah urutan">⇅</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deletePhoto(${p.id},'${p.storage_path}')" title="Hapus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`).join('');
}

async function editPhotoOrder(photoId, currentOrder) {
  const val = prompt('Urutan baru (angka):', currentOrder);
  if (val === null || val.trim() === '') return;
  const order = parseInt(val);
  if (isNaN(order)) { toast.err('Harus angka.'); return; }
  try {
    await sb.patch('gallery_photos', photoId, { sort_order: order });
    toast.ok('Urutan diupdate!');
    await loadPhotos(_currentFolder.id);
  } catch (e) {
    console.error('[gallery] editPhotoOrder error:', e);
    toast.err('Gagal: ' + e.message);
  }
}

async function deletePhoto(photoId, storagePath) {
  if (!confirm('Hapus foto ini? Akan dihapus dari Storage juga.')) return;
  try {
    if (storagePath) await sb.rmFile(GALLERY_BUCKET, storagePath);
    await sb.del('gallery_photos', photoId);
    toast.ok('Foto dihapus.');
    _photos = _photos.filter(p => p.id !== photoId);
    renderPhotos();
  } catch (e) {
    console.error('[gallery] deletePhoto error:', e);
    toast.err('Hapus gagal: ' + e.message);
  }
}

/* ══ UPLOAD ZONE ════════════════════════════════════════ */
function _initUploadZone() {
  try {
    const oldZone = document.getElementById('gp-upload-zone');
    const oldBtn  = document.getElementById('gp-upload-btn');
    if (!oldZone || !oldBtn) {
      console.error('[gallery] _initUploadZone: elemen tidak ditemukan', { oldZone, oldBtn });
      toast.err('Gagal init upload zone — cek modal HTML.');
      return;
    }

    // gp-upload-file ada DI DALAM gp-upload-zone — clone sekali saja
    // lalu replace, baru ambil ulang elemen2 dari clone yg sudah live di DOM.
    const zone = oldZone.cloneNode(true);
    oldZone.replaceWith(zone);

    const fi = document.getElementById('gp-upload-file'); // sekarang ini elemen yg live

    zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('drag'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('drag');
      const f = e.dataTransfer?.files[0];
      if (f && f.type.startsWith('image/')) _openCrop(f);
      else if (f) toast.err('File harus berupa gambar.');
    });
    fi.addEventListener('change', () => {
      if (fi.files[0]) _openCrop(fi.files[0]);
    });

    document.getElementById('gp-upload-btn').onclick =
      () => document.getElementById('gp-upload-file').click();
  } catch (e) {
    console.error('[gallery] _initUploadZone error:', e);
    toast.err('Gagal setup upload: ' + e.message);
  }
}

/* ══ CROP MODAL ═════════════════════════════════════════
   Flow baru: upload file → crop (drag+resize, mouse+touch)
   → klik "Upload" → auto compress di background → kirim ke Storage
══════════════════════════════════════════════════════ */
let _cImg = null, _cFile = null;
let _cX = 0, _cY = 0, _cW = 0, _cH = 0;
let _cRatio = 1;                       // display:natural scale
let _action = null;                    // 'move' | 'tl' | 'tr' | 'bl' | 'br' | null
let _startPt = { x: 0, y: 0 };
let _startBox = { x: 0, y: 0, w: 0, h: 0 };

const HANDLE_SIZE = 18;                // hit-area px (display coords), cukup besar utk jari

function _openCrop(file) {
  _cFile = file;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    _cImg = img;
    URL.revokeObjectURL(url);
    _cX = 0; _cY = 0; _cW = img.naturalWidth; _cH = img.naturalHeight;
    document.getElementById('gc-name').value  = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('gc-order').value = _photos.length;
    document.getElementById('gc-size').textContent = '';
    document.getElementById('gc-upload').disabled  = false;
    _drawCrop();
    _bindCropEvents();
    modal.open('gc-modal');
  };
  img.onerror = () => toast.err('Gagal membaca gambar.');
  img.src = url;
}

function _drawCrop() {
  const canvas = document.getElementById('gc-canvas');
  if (!canvas || !_cImg) return;
  const wrap   = canvas.parentElement;
  const MAXW   = Math.min(wrap.clientWidth || 460, 520);
  const ratio  = Math.min(MAXW / _cImg.naturalWidth, MAXW / _cImg.naturalHeight, 1);
  _cRatio = ratio;
  canvas.width  = Math.round(_cImg.naturalWidth  * ratio);
  canvas.height = Math.round(_cImg.naturalHeight * ratio);

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(_cImg, 0, 0, canvas.width, canvas.height);

  const cx = _cX * ratio, cy = _cY * ratio, cw = _cW * ratio, ch = _cH * ratio;

  // Dim area luar crop
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.rect(cx, cy, cw, ch);
  ctx.fill('evenodd');

  // Border crop
  ctx.strokeStyle = '#81D4FA';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx, cy, cw, ch);

  // Grid rule-of-thirds tipis
  ctx.strokeStyle = 'rgba(129,212,250,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(cx + cw * i / 3, cy); ctx.lineTo(cx + cw * i / 3, cy + ch); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + ch * i / 3); ctx.lineTo(cx + cw, cy + ch * i / 3); ctx.stroke();
  }

  // Corner handles
  const hs = 10;
  ctx.fillStyle = '#81D4FA';
  [[cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, hs / 2, 0, Math.PI * 2); ctx.fill();
  });

  const infoEl = document.getElementById('gc-info');
  if (infoEl) infoEl.textContent = `${Math.round(_cW)} × ${Math.round(_cH)} px`;
}

function _hitTest(px, py) {
  // px, py dalam display coords (sudah dikali ratio)
  const r = _cRatio;
  const cx = _cX * r, cy = _cY * r, cw = _cW * r, ch = _cH * r;
  const hs = HANDLE_SIZE;
  const corners = {
    tl: [cx, cy], tr: [cx + cw, cy],
    bl: [cx, cy + ch], br: [cx + cw, cy + ch]
  };
  for (const [k, [hx, hy]] of Object.entries(corners)) {
    if (Math.abs(px - hx) <= hs && Math.abs(py - hy) <= hs) return k;
  }
  if (px >= cx && px <= cx + cw && py >= cy && py <= cy + ch) return 'move';
  return null;
}

function _getPoint(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : e;
  return {
    x: (t.clientX - rect.left) * (canvas.width  / rect.width),
    y: (t.clientY - rect.top)  * (canvas.height / rect.height)
  };
}

function _bindCropEvents() {
  const canvas = document.getElementById('gc-canvas');
  if (!canvas) return;
  // Bersihkan listener lama dgn clone
  const fresh = canvas.cloneNode(true);
  canvas.replaceWith(fresh);
  _drawCrop(); // re-draw karena clone menghapus konteks

  const onDown = e => {
    e.preventDefault();
    const p = _getPoint(e, fresh);
    _action = _hitTest(p.x, p.y);
    if (!_action) return;
    _startPt  = p;
    _startBox = { x: _cX, y: _cY, w: _cW, h: _cH };
  };

  const onMove = e => {
    if (!_action) return;
    e.preventDefault();
    const p = _getPoint(e, fresh);
    const dx = (p.x - _startPt.x) / _cRatio;
    const dy = (p.y - _startPt.y) / _cRatio;
    const iw = _cImg.naturalWidth, ih = _cImg.naturalHeight;
    const MIN = 30;

    if (_action === 'move') {
      _cX = Math.max(0, Math.min(_startBox.x + dx, iw - _startBox.w));
      _cY = Math.max(0, Math.min(_startBox.y + dy, ih - _startBox.h));
    } else {
      let { x, y, w, h } = _startBox;
      if (_action.includes('l')) { const nx = Math.min(x + dx, x + w - MIN); w += x - nx; x = Math.max(0, nx); }
      if (_action.includes('r')) { w = Math.max(MIN, Math.min(w + dx, iw - x)); }
      if (_action.includes('t')) { const ny = Math.min(y + dy, y + h - MIN); h += y - ny; y = Math.max(0, ny); }
      if (_action.includes('b')) { h = Math.max(MIN, Math.min(h + dy, ih - y)); }
      _cX = x; _cY = y; _cW = w; _cH = h;
    }
    _drawCrop();
  };

  const onUp = () => { _action = null; };

  fresh.addEventListener('mousedown', onDown);
  fresh.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  fresh.addEventListener('touchstart', onDown, { passive: false });
  fresh.addEventListener('touchmove',  onMove, { passive: false });
  fresh.addEventListener('touchend',   onUp);
  fresh.addEventListener('touchcancel',onUp);

  // Cursor feedback (desktop)
  fresh.addEventListener('mousemove', e => {
    if (_action) return;
    const p = _getPoint(e, fresh);
    const hit = _hitTest(p.x, p.y);
    fresh.style.cursor = hit === 'move' ? 'move'
      : (hit === 'tl' || hit === 'br') ? 'nwse-resize'
      : (hit === 'tr' || hit === 'bl') ? 'nesw-resize'
      : 'default';
  });
}

function setCropPreset(aspect) {
  if (!_cImg) return;
  const iw = _cImg.naturalWidth, ih = _cImg.naturalHeight;
  if (aspect === 'free') {
    _cX = 0; _cY = 0; _cW = iw; _cH = ih;
  } else {
    const [wa, ha] = aspect.split(':').map(Number);
    let w = iw, h = Math.round(iw / (wa / ha));
    if (h > ih) { h = ih; w = Math.round(ih * (wa / ha)); }
    _cX = Math.round((iw - w) / 2);
    _cY = Math.round((ih - h) / 2);
    _cW = w; _cH = h;
  }
  _drawCrop();
}

/* ── Upload: auto-compress di background, lalu kirim ── */
async function uploadCroppedPhoto() {
  if (!_cImg || !_currentFolder) { toast.err('Belum ada foto yang dipilih.'); return; }
  const btn   = document.getElementById('gc-upload');
  const name  = document.getElementById('gc-name').value.trim()
                 || _cFile.name.replace(/\.[^.]+$/, '');
  const order = parseInt(document.getElementById('gc-order').value) || 0;
  const sizeEl = document.getElementById('gc-size');

  btnLoad(btn, true);
  sizeEl.textContent = 'Compressing...';
  try {
    // 1) Render hasil crop ke canvas penuh resolusi
    const tmp = document.createElement('canvas');
    tmp.width = _cW; tmp.height = _cH;
    tmp.getContext('2d').drawImage(_cImg, _cX, _cY, _cW, _cH, 0, 0, _cW, _cH);

    const pngFile = await new Promise((res, rej) =>
      tmp.toBlob(b => b ? res(new File([b], _cFile.name, { type: 'image/png' })) : rej(new Error('Canvas toBlob gagal')), 'image/png'));

    if (typeof compressWebP !== 'function') throw new Error('compressWebP tidak ditemukan.');
    const blob = await compressWebP(pngFile);
    sizeEl.textContent = fmtB(blob.size);

    // 2) Upload ke Supabase Storage
    if (typeof toFile !== 'function') throw new Error('toFile tidak ditemukan.');
    const file        = toFile(blob, name);
    const storagePath = `gallery/${_currentFolder.slug}/${file.name}`;
    const url          = await sb.upload(GALLERY_BUCKET, storagePath, file);

    await sb.post('gallery_photos', {
      folder_id:    _currentFolder.id,
      name,
      url,
      storage_path: storagePath,
      sort_order:   order
    });

    toast.ok('Foto berhasil diupload! (' + fmtB(blob.size) + ')');
    modal.close('gc-modal');
    await loadPhotos(_currentFolder.id);
  } catch (e) {
    console.error('[gallery] uploadCroppedPhoto error:', e);
    sizeEl.textContent = '';
    toast.err('Upload gagal: ' + e.message);
  } finally { btnLoad(btn, false); }
}

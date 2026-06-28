/* ══ GALLERY ════════════════════════════════════════════
   Manage folders + photos via Google Drive (Edge Functions)
══════════════════════════════════════════════════════ */

const SB_FUNC_URL = 'https://ocedszxukzrnmvrecrnx.supabase.co/functions/v1';

function padOrder(n){ return String(n||0).padStart(2,'0'); }

/* ── Helper: call edge function ── */
async function callEdge(fn, body, isForm){
  const s = JSON.parse(localStorage.getItem('sb-ocedszxukzrnmvrecrnx-auth-token')||'{}');
  const token = s.access_token || '';
  const res = await fetch(SB_FUNC_URL + '/' + fn, {
    method: 'POST',
    headers: isForm ? { 'Authorization': 'Bearer ' + token } : { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: isForm ? body : JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Edge function error');
  return data;
}

/* ══ FOLDERS ════════════════════════════════════════════ */
let _folders = [], _folderId = null;

function initGallery(){
  document.getElementById('gf-add').addEventListener('click', ()=>openFolder());
  document.getElementById('gf-modal-x').addEventListener('click', ()=>modal.close('gf-modal'));
  document.getElementById('gf-save').addEventListener('click', saveFolder);
  document.getElementById('gf-delete').addEventListener('click', ()=>delFolder(_folderId));
  loadFolders();
}

async function loadFolders(){
  try{
    _folders = await sb.get('gallery_folders','sort_order.asc');
    renderFolders();
  }catch(e){ toast.err('Gagal load folders: '+e.message); }
}

function renderFolders(){
  const wrap = document.getElementById('gf-list');
  if(!wrap) return;
  if(!_folders.length){
    wrap.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>Belum ada folder gallery.</p></div>';
    return;
  }
  wrap.innerHTML = _folders.map(f=>`
    <div class="row-item">
      <span class="row-order">${padOrder(f.sort_order)}</span>
      <span class="row-thumb">${f.cover_url?`<img src="${f.cover_url}" alt="" onerror="this.style.display='none'" />`:'📁'}</span>
      <span class="row-title">
        <span class="cell-title">${f.name}</span>
        <span class="cell-sub">${f.description||''}</span>
      </span>
      <span class="row-action" style="display:flex;gap:0.4rem">
        <button class="btn btn-ghost btn-sm" onclick="openGalleryPhotos(${f.id},'${f.name}','${f.drive_folder_id}')">Foto</button>
        <button class="btn btn-ghost btn-sm" onclick="openFolder(${f.id})">Ubah</button>
      </span>
    </div>`).join('');
}

function openFolder(id){
  _folderId = id||null;
  const d = id ? _folders.find(f=>f.id===id) : null;
  document.getElementById('gf-modal-title').textContent = d?'Edit Folder':'Add Folder';
  document.getElementById('gf-name').value          = d?.name          ||'';
  document.getElementById('gf-desc').value          = d?.description   ||'';
  document.getElementById('gf-drive-id').value      = d?.drive_folder_id||'';
  document.getElementById('gf-cover').value         = d?.cover_url     ||'';
  document.getElementById('gf-order').value         = d?.sort_order    ?? _folders.length;
  document.getElementById('gf-delete').style.display = d?'flex':'none';
  modal.open('gf-modal');
}

async function saveFolder(){
  const btn = document.getElementById('gf-save');
  const name = document.getElementById('gf-name').value.trim();
  const driveId = document.getElementById('gf-drive-id').value.trim();
  if(!name){ toast.err('Nama wajib diisi.'); return; }
  if(!driveId){ toast.err('Drive Folder ID wajib diisi.'); return; }
  btnLoad(btn,true);
  try{
    const p = { name, description:document.getElementById('gf-desc').value.trim(), drive_folder_id:driveId, cover_url:document.getElementById('gf-cover').value.trim(), sort_order:parseInt(document.getElementById('gf-order').value)||0 };
    if(_folderId) await sb.patch('gallery_folders',_folderId,p);
    else await sb.post('gallery_folders',p);
    toast.ok(_folderId?'Folder diupdate!':'Folder ditambahkan!');
    modal.close('gf-modal');
    await loadFolders();
  }catch(e){ toast.err('Gagal: '+e.message); }
  finally{ btnLoad(btn,false); }
}

async function delFolder(id){
  if(!id) return;
  if(!await confirm('Hapus folder ini? Semua foto di dalamnya juga akan dihapus dari database (tidak dari Drive).')) return;
  try{
    await sb.del('gallery_folders',id);
    toast.ok('Folder dihapus.'); modal.close('gf-modal'); await loadFolders();
  }catch(e){ toast.err('Gagal: '+e.message); }
}

/* ══ PHOTOS ═════════════════════════════════════════════ */
let _currentFolder = null;
let _photos = [];
let _uploadPending = null;

function openGalleryPhotos(folderId, folderName, driveFolderId){
  _currentFolder = { id: folderId, name: folderName, drive_folder_id: driveFolderId };
  document.getElementById('gp-folder-name').textContent = folderName;
  document.getElementById('gp-drive-id-val').value = driveFolderId;
  modal.open('gp-modal');
  loadPhotos(folderId);
}

async function loadPhotos(folderId){
  const grid = document.getElementById('gp-grid');
  grid.innerHTML = '<div class="empty"><div class="spin spin-light"></div></div>';
  try{
    _photos = await sb.get('gallery_photos', 'sort_order.asc', 'folder_id=eq.'+folderId);
    renderPhotos();
  }catch(e){ toast.err('Gagal load foto: '+e.message); }
}

function renderPhotos(){
  const grid = document.getElementById('gp-grid');
  if(!_photos.length){
    grid.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>Belum ada foto. Sync dari Drive atau upload baru.</p></div>';
    return;
  }
  grid.innerHTML = _photos.map(p=>`
    <div class="gp-photo-item">
      <img src="${p.thumbnail_url||p.view_url}" alt="${p.name}" onerror="this.src=''" loading="lazy" />
      <div class="gp-photo-overlay">
        <span class="gp-photo-name">${p.name}</span>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deletePhoto(${p.id},'${p.drive_file_id}')" title="Hapus">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>
    </div>`).join('');
}

/* Sync dari Drive */
async function syncFromDrive(){
  if(!_currentFolder) return;
  const btn = document.getElementById('gp-sync-btn');
  btnLoad(btn,true);
  try{
    const res = await callEdge('gallery-sync', { folder_id: _currentFolder.id, drive_folder_id: _currentFolder.drive_folder_id });
    toast.ok('Sync selesai! '+res.synced+' foto.');
    await loadPhotos(_currentFolder.id);
  }catch(e){ toast.err('Sync gagal: '+e.message); }
  finally{ btnLoad(btn,false); }
}

/* Upload foto baru */
function initPhotoUpload(){
  const zone = document.getElementById('gp-upload-zone');
  const fi   = document.getElementById('gp-upload-file');
  if(!zone||!fi) return;
  zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', ()=>zone.classList.remove('drag'));
  zone.addEventListener('drop', e=>{ e.preventDefault(); zone.classList.remove('drag'); const f=e.dataTransfer?.files[0]; if(f&&f.type.startsWith('image/')) uploadPhoto(f); });
  fi.addEventListener('change', ()=>{ if(fi.files[0]) uploadPhoto(fi.files[0]); });
}

async function uploadPhoto(file){
  if(!_currentFolder){ toast.err('Pilih folder dulu.'); return; }
  const btn = document.getElementById('gp-upload-btn');
  btnLoad(btn,true);
  toast.info('Compressing...');
  try{
    const blob = await compressWebP(file);
    const webpFile = toFile(blob, file.name);
    toast.info('Uploading ke Drive...');
    const form = new FormData();
    form.append('file', webpFile);
    form.append('folder_id', String(_currentFolder.id));
    form.append('drive_folder_id', _currentFolder.drive_folder_id);
    form.append('name', webpFile.name);
    await callEdge('gallery-upload', form, true);
    toast.ok('Foto diupload!');
    await loadPhotos(_currentFolder.id);
  }catch(e){ toast.err('Upload gagal: '+e.message); }
  finally{ btnLoad(btn,false); const fi=document.getElementById('gp-upload-file'); if(fi) fi.value=''; }
}

async function deletePhoto(photoId, driveFileId){
  if(!await confirm('Hapus foto ini? Akan dihapus dari Drive juga.')) return;
  try{
    await callEdge('gallery-delete', { photo_id: photoId, drive_file_id: driveFileId });
    toast.ok('Foto dihapus.');
    _photos = _photos.filter(p=>p.id!==photoId);
    renderPhotos();
  }catch(e){ toast.err('Hapus gagal: '+e.message); }
}

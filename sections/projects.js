let _projects=[], _projId=null, _projTags=null, _pendingFile=null;

function initProjects(){
  _projTags = tagsInput('pj-tags-wrap','pj-tags-input');
  _initUpload();
  document.getElementById('pj-add').addEventListener('click', ()=>openProj());
  document.getElementById('pj-modal-x').addEventListener('click', ()=>modal.close('pj-modal'));
  document.getElementById('pj-save').addEventListener('click', saveProj);
  loadProjects();
}

function _initUpload(){
  const zone=document.getElementById('pj-zone');
  const fi=document.getElementById('pj-file');
  const prev=document.getElementById('pj-prev');
  const info=document.getElementById('pj-info');
  const bar=document.getElementById('pj-bar');
  const barW=document.getElementById('pj-bar-wrap');
  if(!zone||!fi) return;

  zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', ()=>zone.classList.remove('drag'));
  zone.addEventListener('drop', e=>{ e.preventDefault(); zone.classList.remove('drag'); const f=e.dataTransfer?.files[0]; if(f&&f.type.startsWith('image/')) _processImg(f); });
  fi.addEventListener('change', ()=>{ if(fi.files[0]) _processImg(fi.files[0]); });

  async function _processImg(file){
    if(info) info.textContent='Compressing...';
    if(barW){ barW.style.display='block'; bar.style.width='30%'; }
    try {
      const blob = await compressWebP(file);
      if(bar) bar.style.width='100%';
      _pendingFile = toFile(blob, file.name);
      if(prev){ prev.src=URL.createObjectURL(blob); prev.style.display='block'; }
      if(info) info.textContent='WebP · '+fmtB(blob.size)+' (asli: '+fmtB(file.size)+')';
      setTimeout(()=>{ if(barW) barW.style.display='none'; },600);
    } catch(e){ toast.err('Compress gagal: '+e.message); if(barW) barW.style.display='none'; }
  }
}

async function loadProjects(){
  try {
    _projects = await sb.get('projects','sort_order.asc');
    renderProjects();
  } catch(e){ toast.err('Gagal load projects: '+e.message); }
}

function renderProjects(){
  const tb = document.getElementById('pj-tbody');
  if(!tb) return;
  if(!_projects.length){
    tb.innerHTML='<tr><td colspan="6"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>Belum ada project</p></div></td></tr>';
    return;
  }
  tb.innerHTML = _projects.map(p=>`
    <tr>
      <td><div class="proj-thumb">${p.image_url?`<img src="${p.image_url}" alt="" onerror="this.style.display='none'" />`:(p.fallback||'IMG')}</div></td>
      <td><div style="font-weight:500;font-size:0.8rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</div><div class="td-sub">#${p.num}</div></td>
      <td style="font-size:0.72rem;color:var(--muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.body}</td>
      <td>${p.link?`<a href="${p.link}" target="_blank" class="btn btn-ghost btn-sm" style="font-size:0.68rem">↗</a>`:'<span style="color:var(--muted)">—</span>'}</td>
      <td><input class="input order-in" type="number" value="${p.sort_order}" min="0" onchange="patchOrder('projects',${p.id},this.value)" /></td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openProj(${p.id})">${iSVG('edit',13)}</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="delProj(${p.id})">${iSVG('zap',13)}</button>
      </div></td>
    </tr>`).join('');
}

function openProj(id){
  _projId=id||null; _pendingFile=null;
  const d=id?_projects.find(p=>p.id===id):null;
  document.getElementById('pj-modal-title').textContent = d?'Edit Project':'Add Project';
  document.getElementById('pj-num').value      = d?.num      ||'';
  document.getElementById('pj-title').value    = d?.title    ||'';
  document.getElementById('pj-body').value     = d?.body     ||'';
  document.getElementById('pj-link').value     = d?.link     ||'';
  document.getElementById('pj-fallback').value = d?.fallback ||'';
  document.getElementById('pj-order').value    = d?.sort_order ?? _projects.length;
  const prev=document.getElementById('pj-prev');
  const info=document.getElementById('pj-info');
  if(prev){ prev.src=d?.image_url||''; prev.style.display=d?.image_url?'block':'none'; }
  if(info) info.textContent=d?.image_url?'Gambar sudah ada (upload baru untuk ganti)':'';
  const fi=document.getElementById('pj-file'); if(fi) fi.value='';
  _projTags.set(d?.tags||[]);
  modal.open('pj-modal');
}

async function saveProj(){
  const btn=document.getElementById('pj-save');
  const title=document.getElementById('pj-title').value.trim();
  if(!title){ toast.err('Judul wajib diisi.'); return; }
  btnLoad(btn,true);
  try {
    let imgUrl=_projId?(_projects.find(p=>p.id===_projId)?.image_url||''):'';
    if(_pendingFile){
      imgUrl=await sb.upload('portfolio-assets','projects/'+_pendingFile.name,_pendingFile);
      toast.info('Gambar diupload ✓');
    }
    const p={ num:document.getElementById('pj-num').value.trim(), title, body:document.getElementById('pj-body').value.trim(), image_url:imgUrl, link:document.getElementById('pj-link').value.trim(), tags:_projTags.get(), fallback:document.getElementById('pj-fallback').value.trim(), sort_order:parseInt(document.getElementById('pj-order').value)||0 };
    if(_projId) await sb.patch('projects',_projId,p);
    else await sb.post('projects',p);
    toast.ok(_projId?'Project diupdate!':'Project ditambahkan!');
    modal.close('pj-modal');
    await loadProjects();
  } catch(e){ toast.err('Gagal: '+e.message); }
  finally { btnLoad(btn,false); }
}

async function delProj(id){
  if(!await confirm('Hapus project ini?')) return;
  try {
    const p=_projects.find(x=>x.id===id);
    if(p?.image_url?.includes('portfolio-assets')){
      const path=p.image_url.split('/portfolio-assets/')[1];
      if(path) await sb.rmFile('portfolio-assets',path);
    }
    await sb.del('projects',id);
    toast.ok('Dihapus.');
    await loadProjects();
  } catch(e){ toast.err('Gagal: '+e.message); }
}

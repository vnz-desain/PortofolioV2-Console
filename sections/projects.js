function padOrder(n){ return String(n||0).padStart(2,'0'); }

let _projects=[], _projId=null, _projTags=null, _pendingFile=null;

function initProjects(){
  _projTags=tagsInput('pj-tags-wrap','pj-tags-input');
  _initUpload();
  document.getElementById('pj-add').addEventListener('click',function(){ openProj(); });
  document.getElementById('pj-modal-x').addEventListener('click',function(){ modal.close('pj-modal'); });
  document.getElementById('pj-save').addEventListener('click',saveProj);
  document.getElementById('pj-delete').addEventListener('click',function(){ delProj(_projId); });
  loadProjects();
}

function _initUpload(){
  var zone=document.getElementById('pj-zone'),fi=document.getElementById('pj-file');
  var prev=document.getElementById('pj-prev'),info=document.getElementById('pj-info');
  var bar=document.getElementById('pj-bar'),barW=document.getElementById('pj-bar-wrap');
  if(!zone||!fi) return;
  zone.addEventListener('dragover',function(e){ e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave',function(){ zone.classList.remove('drag'); });
  zone.addEventListener('drop',function(e){ e.preventDefault(); zone.classList.remove('drag'); var f=e.dataTransfer&&e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) _proc(f); });
  fi.addEventListener('change',function(){ if(fi.files[0]) _proc(fi.files[0]); });
  async function _proc(file){
    if(info) info.textContent='Compressing...';
    if(barW){ barW.style.display='block'; bar.style.width='30%'; }
    try{
      var blob=await compressWebP(file);
      bar.style.width='100%';
      _pendingFile=toFile(blob,file.name);
      if(prev){ prev.src=URL.createObjectURL(blob); prev.style.display='block'; }
      if(info) info.textContent='WebP · '+fmtB(blob.size)+' (asli: '+fmtB(file.size)+')';
      setTimeout(function(){ barW.style.display='none'; },600);
    }catch(e){ toast.err('Compress gagal: '+e.message); barW.style.display='none'; }
  }
}

async function loadProjects(){
  try{ _projects=await sb.get('projects','sort_order.asc'); renderProjects(); }
  catch(e){ toast.err('Gagal load projects: '+e.message); }
}

function renderProjects(){
  var wrap=document.getElementById('pj-list');
  if(!wrap) return;
  if(!_projects.length){
    wrap.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>Belum ada project.</p></div>';
    return;
  }
  wrap.innerHTML=_projects.map(function(p){
    var thumb=p.image_url
      ?'<img src="'+p.image_url+'" alt="" onerror="this.style.display=\'none\'" />'
      :(p.fallback||'IMG');
    return '<div class="row-item" onclick="openProj('+p.id+')">'
      +'<span class="row-order">'+padOrder(p.sort_order)+'</span>'
      +'<span class="row-thumb">'+thumb+'</span>'
      +'<span class="row-title"><span class="cell-title">'+p.title+'</span></span>'
      +'<span class="row-action"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openProj('+p.id+')">Ubah</button></span>'
      +'</div>';
  }).join('');
}

function openProj(id){
  _projId=id||null; _pendingFile=null;
  var d=id?_projects.find(function(p){ return p.id===id; }):null;
  document.getElementById('pj-modal-title').textContent=d?'Edit Project':'Add Project';
  document.getElementById('pj-num').value=d&&d.num||'';
  document.getElementById('pj-title').value=d&&d.title||'';
  document.getElementById('pj-body').value=d&&d.body||'';
  document.getElementById('pj-link').value=d&&d.link||'';
  document.getElementById('pj-fallback').value=d&&d.fallback||'';
  document.getElementById('pj-order').value=d&&d.sort_order!=null?d.sort_order:_projects.length;
  var prev=document.getElementById('pj-prev'),info=document.getElementById('pj-info');
  if(prev){ prev.src=d&&d.image_url||''; prev.style.display=d&&d.image_url?'block':'none'; }
  if(info) info.textContent=d&&d.image_url?'Gambar sudah ada (upload baru untuk ganti)':'';
  var fi=document.getElementById('pj-file'); if(fi) fi.value='';
  document.getElementById('pj-delete').style.display=d?'flex':'none';
  _projTags.set(d&&d.tags||[]);
  modal.open('pj-modal');
}

async function saveProj(){
  var btn=document.getElementById('pj-save');
  var title=document.getElementById('pj-title').value.trim();
  if(!title){ toast.err('Judul wajib diisi.'); return; }
  btnLoad(btn,true);
  try{
    var imgUrl=_projId?(_projects.find(function(p){ return p.id===_projId; })&&_projects.find(function(p){ return p.id===_projId; }).image_url||''):'';
    if(_pendingFile){ imgUrl=await sb.upload('portfolio-assets','projects/'+_pendingFile.name,_pendingFile); toast.info('Gambar diupload ✓'); }
    var p={num:document.getElementById('pj-num').value.trim(),title:title,body:document.getElementById('pj-body').value.trim(),image_url:imgUrl,link:document.getElementById('pj-link').value.trim(),tags:_projTags.get(),fallback:document.getElementById('pj-fallback').value.trim(),sort_order:parseInt(document.getElementById('pj-order').value)||0};
    if(_projId) await sb.patch('projects',_projId,p);
    else await sb.post('projects',p);
    toast.ok(_projId?'Project diupdate!':'Project ditambahkan!');
    modal.close('pj-modal');
    await loadProjects();
  }catch(e){ toast.err('Gagal: '+e.message); }
  finally{ btnLoad(btn,false); }
}

async function delProj(id){
  if(!id) return;
  if(!await confirm('Hapus project ini?')) return;
  try{
    var p=_projects.find(function(x){ return x.id===id; });
    if(p&&p.image_url&&p.image_url.includes('portfolio-assets')){ var path=p.image_url.split('/portfolio-assets/')[1]; if(path) await sb.rmFile('portfolio-assets',path); }
    await sb.del('projects',id);
    toast.ok('Dihapus.'); modal.close('pj-modal'); await loadProjects();
  }catch(e){ toast.err('Gagal: '+e.message); }
}

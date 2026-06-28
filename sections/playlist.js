function padOrder(n){ return String(n||0).padStart(2,'0'); }

/* ══ PLAYLISTS ══════════════════════════════════════════ */
let _playlists=[], _plId=null, _plPending=null;

function initPlaylists(){
  _initPlUpload();
  document.getElementById('pl-add').addEventListener('click',function(){ openPl(); });
  document.getElementById('pl-modal-x').addEventListener('click',function(){ modal.close('pl-modal'); });
  document.getElementById('pl-save').addEventListener('click',savePl);
  document.getElementById('pl-delete').addEventListener('click',function(){ delPl(_plId); });
  loadPlaylists();
}

function _initPlUpload(){
  var zone=document.getElementById('pl-zone'),fi=document.getElementById('pl-file');
  var prev=document.getElementById('pl-prev'),info=document.getElementById('pl-info');
  var bar=document.getElementById('pl-bar'),barW=document.getElementById('pl-bar-wrap');
  if(!zone||!fi) return;
  zone.addEventListener('dragover',function(e){ e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave',function(){ zone.classList.remove('drag'); });
  zone.addEventListener('drop',function(e){ e.preventDefault(); zone.classList.remove('drag'); var f=e.dataTransfer&&e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) _procPl(f); });
  fi.addEventListener('change',function(){ if(fi.files[0]) _procPl(fi.files[0]); });
  async function _procPl(file){
    if(info) info.textContent='Compressing...';
    if(barW){ barW.style.display='block'; bar.style.width='30%'; }
    try{
      var blob=await compressWebP(file);
      bar.style.width='100%';
      _plPending=toFile(blob,file.name);
      if(prev){ prev.src=URL.createObjectURL(blob); prev.style.display='block'; }
      if(info) info.textContent='WebP · '+fmtB(blob.size);
      setTimeout(function(){ barW.style.display='none'; },600);
    }catch(e){ toast.err('Compress gagal: '+e.message); barW.style.display='none'; }
  }
}

async function loadPlaylists(){
  try{ _playlists=await sb.get('playlists','sort_order.asc'); renderPlaylists(); }
  catch(e){ toast.err('Gagal load playlists: '+e.message); }
}

function renderPlaylists(){
  var wrap=document.getElementById('pl-list');
  if(!wrap) return;
  if(!_playlists.length){
    wrap.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>Belum ada playlist.</p></div>';
    return;
  }
  wrap.innerHTML=_playlists.map(function(p){
    var thumb=p.image_url
      ?'<img src="'+p.image_url+'" alt="" onerror="this.style.display=\'none\'" />'
      :'♪';
    return '<div class="row-item" onclick="openPl('+p.id+')">'
      +'<span class="row-order">'+padOrder(p.sort_order)+'</span>'
      +'<span class="row-thumb">'+thumb+'</span>'
      +'<span class="row-title">'
        +'<span class="cell-title">'+p.title+'</span>'
        +(p.genre?'<span class="cell-sub">'+p.genre+'</span>':'')
      +'</span>'
      +'<span class="row-action"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openPl('+p.id+')">Ubah</button></span>'
      +'</div>';
  }).join('');
}

function openPl(id){
  _plId=id||null; _plPending=null;
  var d=id?_playlists.find(function(p){ return p.id===id; }):null;
  document.getElementById('pl-modal-title').textContent=d?'Edit Playlist':'Add Playlist';
  document.getElementById('pl-title').value=d&&d.title||'';
  document.getElementById('pl-genre').value=d&&d.genre||'';
  document.getElementById('pl-body').value=d&&d.body||'';
  document.getElementById('pl-link').value=d&&d.link||'';
  document.getElementById('pl-order').value=d&&d.sort_order!=null?d.sort_order:_playlists.length;
  var prev=document.getElementById('pl-prev'),info=document.getElementById('pl-info');
  if(prev){ prev.src=d&&d.image_url||''; prev.style.display=d&&d.image_url?'block':'none'; }
  if(info) info.textContent=d&&d.image_url?'Cover sudah ada (upload baru untuk ganti)':'';
  var fi=document.getElementById('pl-file'); if(fi) fi.value='';
  document.getElementById('pl-delete').style.display=d?'flex':'none';
  modal.open('pl-modal');
}

async function savePl(){
  var btn=document.getElementById('pl-save');
  var title=document.getElementById('pl-title').value.trim();
  if(!title){ toast.err('Judul wajib diisi.'); return; }
  btnLoad(btn,true);
  try{
    var imgUrl=_plId?(_playlists.find(function(p){ return p.id===_plId; })&&_playlists.find(function(p){ return p.id===_plId; }).image_url||''):'';
    if(_plPending){ imgUrl=await sb.upload('portfolio-assets','playlists/'+_plPending.name,_plPending); toast.info('Cover diupload ✓'); }
    var p={title:title,genre:document.getElementById('pl-genre').value.trim(),body:document.getElementById('pl-body').value.trim(),link:document.getElementById('pl-link').value.trim(),image_url:imgUrl,sort_order:parseInt(document.getElementById('pl-order').value)||0};
    if(_plId) await sb.patch('playlists',_plId,p);
    else await sb.post('playlists',p);
    toast.ok(_plId?'Playlist diupdate!':'Playlist ditambahkan!');
    modal.close('pl-modal');
    await loadPlaylists();
  }catch(e){ toast.err('Gagal: '+e.message); }
  finally{ btnLoad(btn,false); }
}

async function delPl(id){
  if(!id) return;
  if(!await confirm('Hapus playlist ini?')) return;
  try{
    var p=_playlists.find(function(x){ return x.id===id; });
    if(p&&p.image_url&&p.image_url.includes('portfolio-assets')){ var path=p.image_url.split('/portfolio-assets/')[1]; if(path) await sb.rmFile('portfolio-assets',path); }
    await sb.del('playlists',id);
    toast.ok('Dihapus.'); modal.close('pl-modal'); await loadPlaylists();
  }catch(e){ toast.err('Gagal: '+e.message); }
}

/* ══ TRACKS ═════════════════════════════════════════════ */
let _tracks=[], _trId=null, _trPending=null;

function initTracks(){
  _initTrUpload();
  document.getElementById('tr-add').addEventListener('click',function(){ openTr(); });
  document.getElementById('tr-modal-x').addEventListener('click',function(){ modal.close('tr-modal'); });
  document.getElementById('tr-save').addEventListener('click',saveTr);
  document.getElementById('tr-delete').addEventListener('click',function(){ delTr(_trId); });
  loadTracks();
}

function _initTrUpload(){
  var zone=document.getElementById('tr-zone'),fi=document.getElementById('tr-file');
  var prev=document.getElementById('tr-prev'),info=document.getElementById('tr-info');
  var bar=document.getElementById('tr-bar'),barW=document.getElementById('tr-bar-wrap');
  if(!zone||!fi) return;
  zone.addEventListener('dragover',function(e){ e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave',function(){ zone.classList.remove('drag'); });
  zone.addEventListener('drop',function(e){ e.preventDefault(); zone.classList.remove('drag'); var f=e.dataTransfer&&e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) _procTr(f); });
  fi.addEventListener('change',function(){ if(fi.files[0]) _procTr(fi.files[0]); });
  async function _procTr(file){
    if(info) info.textContent='Compressing...';
    if(barW){ barW.style.display='block'; bar.style.width='30%'; }
    try{
      var blob=await compressWebP(file);
      bar.style.width='100%';
      _trPending=toFile(blob,file.name);
      if(prev){ prev.src=URL.createObjectURL(blob); prev.style.display='block'; }
      if(info) info.textContent='WebP · '+fmtB(blob.size);
      setTimeout(function(){ barW.style.display='none'; },600);
    }catch(e){ toast.err('Compress gagal: '+e.message); barW.style.display='none'; }
  }
}

async function loadTracks(){
  try{ _tracks=await sb.get('tracks','sort_order.asc'); renderTracks(); }
  catch(e){ toast.err('Gagal load tracks: '+e.message); }
}

function renderTracks(){
  var wrap=document.getElementById('tr-list');
  if(!wrap) return;
  if(!_tracks.length){
    wrap.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>Belum ada track.</p></div>';
    return;
  }
  wrap.innerHTML=_tracks.map(function(t){
    var thumb=t.image_url
      ?'<img src="'+t.image_url+'" alt="" onerror="this.style.display=\'none\'" />'
      :'♫';
    return '<div class="row-item" onclick="openTr('+t.id+')">'
      +'<span class="row-order">'+padOrder(t.sort_order)+'</span>'
      +'<span class="row-thumb">'+thumb+'</span>'
      +'<span class="row-title">'
        +'<span class="cell-title">'+t.title+'</span>'
        +(t.artist?'<span class="cell-sub">'+t.artist+(t.genre?' · '+t.genre:'')+'</span>':'')
      +'</span>'
      +'<span class="row-action"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openTr('+t.id+')">Ubah</button></span>'
      +'</div>';
  }).join('');
}

function openTr(id){
  _trId=id||null; _trPending=null;
  var d=id?_tracks.find(function(t){ return t.id===id; }):null;
  document.getElementById('tr-modal-title').textContent=d?'Edit Track':'Add Track';
  document.getElementById('tr-title').value=d&&d.title||'';
  document.getElementById('tr-artist').value=d&&d.artist||'';
  document.getElementById('tr-genre').value=d&&d.genre||'';
  document.getElementById('tr-link').value=d&&d.link||'';
  document.getElementById('tr-order').value=d&&d.sort_order!=null?d.sort_order:_tracks.length;
  var prev=document.getElementById('tr-prev'),info=document.getElementById('tr-info');
  if(prev){ prev.src=d&&d.image_url||''; prev.style.display=d&&d.image_url?'block':'none'; }
  if(info) info.textContent=d&&d.image_url?'Cover sudah ada (upload baru untuk ganti)':'';
  var fi=document.getElementById('tr-file'); if(fi) fi.value='';
  document.getElementById('tr-delete').style.display=d?'flex':'none';
  modal.open('tr-modal');
}

async function saveTr(){
  var btn=document.getElementById('tr-save');
  var title=document.getElementById('tr-title').value.trim();
  if(!title){ toast.err('Judul wajib diisi.'); return; }
  btnLoad(btn,true);
  try{
    var imgUrl=_trId?(_tracks.find(function(t){ return t.id===_trId; })&&_tracks.find(function(t){ return t.id===_trId; }).image_url||''):'';
    if(_trPending){ imgUrl=await sb.upload('portfolio-assets','tracks/'+_trPending.name,_trPending); toast.info('Cover diupload ✓'); }
    var p={title:title,artist:document.getElementById('tr-artist').value.trim(),genre:document.getElementById('tr-genre').value.trim(),link:document.getElementById('tr-link').value.trim(),image_url:imgUrl,sort_order:parseInt(document.getElementById('tr-order').value)||0};
    if(_trId) await sb.patch('tracks',_trId,p);
    else await sb.post('tracks',p);
    toast.ok(_trId?'Track diupdate!':'Track ditambahkan!');
    modal.close('tr-modal');
    await loadTracks();
  }catch(e){ toast.err('Gagal: '+e.message); }
  finally{ btnLoad(btn,false); }
}

async function delTr(id){
  if(!id) return;
  if(!await confirm('Hapus track ini?')) return;
  try{
    var t=_tracks.find(function(x){ return x.id===id; });
    if(t&&t.image_url&&t.image_url.includes('portfolio-assets')){ var path=t.image_url.split('/portfolio-assets/')[1]; if(path) await sb.rmFile('portfolio-assets',path); }
    await sb.del('tracks',id);
    toast.ok('Dihapus.'); modal.close('tr-modal'); await loadTracks();
  }catch(e){ toast.err('Gagal: '+e.message); }
}

/* ══ INIT BOTH ══════════════════════════════════════════ */
function initPlaylist(){
  initPlaylists();
  initTracks();
}

function padOrder(n){ return String(n||0).padStart(2,'0'); }

let _slides=[], _slideId=null, _slideTags=null;

function initSlides(){
  _slideTags=tagsInput('sl-tags-wrap','sl-tags-input');
  document.getElementById('sl-add').addEventListener('click',function(){ openSlide(); });
  document.getElementById('sl-modal-x').addEventListener('click',function(){ modal.close('sl-modal'); });
  document.getElementById('sl-save').addEventListener('click',saveSlide);
  document.getElementById('sl-delete').addEventListener('click',function(){ delSlide(_slideId); });
  loadSlides();
}

async function loadSlides(){
  try{ _slides=await sb.get('slides','tab.asc,sort_order.asc'); renderSlides(); }
  catch(e){ toast.err('Gagal load slides: '+e.message); }
}

function renderSlides(){
  var wrap=document.getElementById('sl-list');
  if(!wrap) return;
  if(!_slides.length){
    wrap.innerHTML='<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg><p>Belum ada slide.</p></div>';
    return;
  }
  wrap.innerHTML=_slides.map(function(s){
    var badge=s.tab==='Education'
      ?'<span class="badge badge-blue">Edu</span>'
      :'<span class="badge badge-green">Ven</span>';
    return '<div class="row-item" onclick="openSlide('+s.id+')">'
      +'<span class="row-order">'+padOrder(s.sort_order)+'</span>'
      +'<span class="row-badge">'+badge+'</span>'
      +'<span class="row-title">'
        +'<span class="cell-title">'+s.title+'</span>'
        +'<span class="cell-sub">'+((s.subtitle||''))+'</span>'
      +'</span>'
      +'<span class="row-action"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openSlide('+s.id+')">Ubah</button></span>'
      +'</div>';
  }).join('');
}

function openSlide(id){
  _slideId=id||null;
  var d=id?_slides.find(function(s){ return s.id===id; }):null;
  document.getElementById('sl-modal-title').textContent=d?'Edit Slide':'Add Slide';
  document.getElementById('sl-tab').value=d&&d.tab||'Education';
  document.getElementById('sl-period').value=d&&d.period||'';
  document.getElementById('sl-title').value=d&&d.title||'';
  document.getElementById('sl-subtitle').value=d&&d.subtitle||'';
  document.getElementById('sl-body').value=d&&d.body||'';
  document.getElementById('sl-order').value=d&&d.sort_order!=null?d.sort_order:_slides.length;
  document.getElementById('sl-founder').checked=!!(d&&d.founder);
  document.getElementById('sl-delete').style.display=d?'flex':'none';
  _slideTags.set(d&&d.tags||[]);
  modal.open('sl-modal');
}

async function saveSlide(){
  var btn=document.getElementById('sl-save');
  var title=document.getElementById('sl-title').value.trim();
  if(!title){ toast.err('Title wajib diisi.'); return; }
  btnLoad(btn,true);
  try{
    var p={tab:document.getElementById('sl-tab').value,period:document.getElementById('sl-period').value.trim(),title:title,subtitle:document.getElementById('sl-subtitle').value.trim(),body:document.getElementById('sl-body').value.trim(),tags:_slideTags.get(),founder:document.getElementById('sl-founder').checked,sort_order:parseInt(document.getElementById('sl-order').value)||0};
    if(_slideId) await sb.patch('slides',_slideId,p);
    else await sb.post('slides',p);
    toast.ok(_slideId?'Slide diupdate!':'Slide ditambahkan!');
    modal.close('sl-modal');
    await loadSlides();
  }catch(e){ toast.err('Gagal: '+e.message); }
  finally{ btnLoad(btn,false); }
}

async function delSlide(id){
  if(!id) return;
  if(!await confirm('Hapus slide ini?')) return;
  try{ await sb.del('slides',id); toast.ok('Dihapus.'); modal.close('sl-modal'); await loadSlides(); }
  catch(e){ toast.err('Gagal: '+e.message); }
}

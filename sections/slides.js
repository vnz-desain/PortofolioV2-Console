let _slides = [], _slideId = null, _slideTags = null;

function initSlides(){
  _slideTags = tagsInput('sl-tags-wrap','sl-tags-input');
  document.getElementById('sl-add').addEventListener('click', ()=>openSlide());
  document.getElementById('sl-modal-x').addEventListener('click', ()=>modal.close('sl-modal'));
  document.getElementById('sl-save').addEventListener('click', saveSlide);
  document.getElementById('sl-delete').addEventListener('click', ()=>delSlide(_slideId));
  loadSlides();
}

async function loadSlides(){
  try {
    _slides = await sb.get('slides','tab.asc,sort_order.asc');
    renderSlides();
  } catch(e){ toast.err('Gagal load slides: '+e.message); }
}

function padOrder(n){ return String(n||0).padStart(2,'0'); }

function renderSlides(){
  const tb = document.getElementById('sl-tbody');
  if(!tb) return;
  if(!_slides.length){
    tb.innerHTML='<tr><td colspan="5"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg><p>Belum ada slide. Klik "+ Add".</p></div></td></tr>';
    return;
  }
  tb.innerHTML = _slides.map(s=>`
    <tr>
      <td style="width:36px"><span class="cell-order">${padOrder(s.sort_order)}</span></td>
      <td>
        <div class="cell-title">${s.title}</div>
        <div class="cell-sub">${s.subtitle||''}</div>
      </td>
      <td style="width:100px"><div class="cell-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.period||'—'}</div></td>
      <td style="width:80px"><span class="badge ${s.tab==='Education'?'badge-blue':'badge-green'}">${s.tab}</span></td>
      <td style="width:58px;text-align:right"><button class="btn btn-ghost btn-sm" onclick="openSlide(${s.id})">Ubah</button></td>
    </tr>`).join('');
}

function openSlide(id){
  _slideId = id||null;
  const d = id ? _slides.find(s=>s.id===id) : null;
  document.getElementById('sl-modal-title').textContent = d?'Edit Slide':'Add Slide';
  document.getElementById('sl-tab').value      = d?.tab      ||'Education';
  document.getElementById('sl-period').value   = d?.period   ||'';
  document.getElementById('sl-title').value    = d?.title    ||'';
  document.getElementById('sl-subtitle').value = d?.subtitle ||'';
  document.getElementById('sl-body').value     = d?.body     ||'';
  document.getElementById('sl-order').value    = d?.sort_order ?? _slides.length;
  document.getElementById('sl-founder').checked= d?.founder  ||false;
  document.getElementById('sl-delete').style.display = d ? 'flex' : 'none';
  _slideTags.set(d?.tags||[]);
  modal.open('sl-modal');
}

async function saveSlide(){
  const btn = document.getElementById('sl-save');
  const title = document.getElementById('sl-title').value.trim();
  if(!title){ toast.err('Title wajib diisi.'); return; }
  btnLoad(btn,true);
  try {
    const p = {
      tab:        document.getElementById('sl-tab').value,
      period:     document.getElementById('sl-period').value.trim(),
      title,
      subtitle:   document.getElementById('sl-subtitle').value.trim(),
      body:       document.getElementById('sl-body').value.trim(),
      tags:       _slideTags.get(),
      founder:    document.getElementById('sl-founder').checked,
      sort_order: parseInt(document.getElementById('sl-order').value)||0
    };
    if(_slideId) await sb.patch('slides',_slideId,p);
    else await sb.post('slides',p);
    toast.ok(_slideId?'Slide diupdate!':'Slide ditambahkan!');
    modal.close('sl-modal');
    await loadSlides();
  } catch(e){ toast.err('Gagal: '+e.message); }
  finally { btnLoad(btn,false); }
}

async function delSlide(id){
  if(!id) return;
  if(!await confirm('Hapus slide ini?')) return;
  try { await sb.del('slides',id); toast.ok('Dihapus.'); modal.close('sl-modal'); await loadSlides(); }
  catch(e){ toast.err('Gagal: '+e.message); }
}

let _slides = [], _slideId = null, _slideTags = null;

function initSlides(){
  _slideTags = tagsInput('sl-tags-wrap','sl-tags-input');
  document.getElementById('sl-add').addEventListener('click', ()=>openSlide());
  document.getElementById('sl-modal-x').addEventListener('click', ()=>modal.close('sl-modal'));
  document.getElementById('sl-save').addEventListener('click', saveSlide);
  loadSlides();
}

async function loadSlides(){
  try {
    _slides = await sb.get('slides','tab.asc,sort_order.asc');
    renderSlides();
  } catch(e){ toast.err('Gagal load slides: '+e.message); }
}

function renderSlides(){
  const tb = document.getElementById('sl-tbody');
  if(!tb) return;
  if(!_slides.length){
    tb.innerHTML='<tr><td colspan="6"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg><p>Belum ada slide</p></div></td></tr>';
    return;
  }
  tb.innerHTML = _slides.map(s=>`
    <tr>
      <td><span class="badge ${s.tab==='Education'?'badge-blue':'badge-green'}">${s.tab}</span></td>
      <td><div style="font-weight:500;font-size:0.8rem">${s.title}</div><div class="td-sub">${s.subtitle}</div></td>
      <td style="font-size:0.75rem;color:var(--muted)">${s.period}</td>
      <td>${s.founder?'<span class="badge badge-green"><span class="badge-dot"></span>Ya</span>':'<span style="color:var(--muted);font-size:0.75rem">—</span>'}</td>
      <td><input class="input order-in" type="number" value="${s.sort_order}" min="0" onchange="patchOrder('slides',${s.id},this.value)" /></td>
      <td><div class="td-actions">
        <button class="btn btn-ghost btn-sm btn-icon" onclick="openSlide(${s.id})" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="delSlide(${s.id})" title="Hapus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
      </div></td>
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
  _slideTags.set(d?.tags||[]);
  modal.open('sl-modal');
}

async function saveSlide(){
  const btn   = document.getElementById('sl-save');
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
  if(!await confirm('Hapus slide ini?')) return;
  try { await sb.del('slides',id); toast.ok('Dihapus.'); await loadSlides(); }
  catch(e){ toast.err('Gagal: '+e.message); }
}

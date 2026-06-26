/* ── Toast ── */
const toast = {
  _wrap: null,
  _init(){ if(!this._wrap){ this._wrap=document.createElement('div'); this._wrap.className='toast-wrap'; document.body.appendChild(this._wrap); } },
  show(msg, type, dur=3000){
    this._init();
    const icons = {
      ok:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    const el = document.createElement('div');
    el.className = 'toast toast-'+(type||'info');
    el.innerHTML = (icons[type]||icons.info)+'<span>'+msg+'</span>';
    this._wrap.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='0.15s'; setTimeout(()=>el.remove(),150); }, dur);
  },
  ok:   m => toast.show(m,'ok'),
  err:  m => toast.show(m,'err',5000),
  info: m => toast.show(m,'info')
};

/* ── Modal ── */
const modal = {
  open(id) { document.getElementById(id)?.classList.add('open'); },
  close(id){ document.getElementById(id)?.classList.remove('open'); },
};
document.addEventListener('click', e=>{ if(e.target.classList.contains('modal-bg')) e.target.classList.remove('open'); });

/* ── Confirm ── */
function confirm(msg){
  return new Promise(resolve=>{
    let el = document.getElementById('_confirm');
    if(!el){
      el = document.createElement('div');
      el.id='_confirm'; el.className='modal-bg';
      el.innerHTML=`<div class="modal" style="max-width:320px">
        <div class="modal-hd"><h3>Konfirmasi</h3></div>
        <div class="modal-body"><p id="_cm" style="color:var(--white);font-size:0.82rem"></p></div>
        <div class="modal-ft">
          <button class="btn btn-ghost btn-sm" id="_cn">Batal</button>
          <button class="btn btn-danger btn-sm" id="_cy">Hapus</button>
        </div></div>`;
      document.body.appendChild(el);
    }
    document.getElementById('_cm').textContent = msg;
    el.classList.add('open');
    const done = v => { el.classList.remove('open'); resolve(v); };
    document.getElementById('_cy').onclick = ()=>done(true);
    document.getElementById('_cn').onclick = ()=>done(false);
    el.onclick = e=>{ if(e.target===el) done(false); };
  });
}

/* ── Tags input ── */
function tagsInput(wrapId, inputId){
  const wrap  = document.getElementById(wrapId);
  const input = document.getElementById(inputId);
  if(!wrap||!input) return { get:()=>[], set:()=>{}, clear:()=>{} };
  let tags = [];

  function render(){
    wrap.querySelectorAll('.tag-chip').forEach(c=>c.remove());
    tags.forEach((t,i)=>{
      const c = document.createElement('span');
      c.className='tag-chip';
      c.innerHTML=t+'<button data-i="'+i+'">×</button>';
      wrap.insertBefore(c, input);
    });
  }
  input.addEventListener('keydown', e=>{
    if((e.key==='Enter'||e.key===',') && input.value.trim()){
      e.preventDefault();
      const v=input.value.trim().replace(/,$/,'');
      if(v&&!tags.includes(v)){ tags.push(v); render(); }
      input.value='';
    }
    if(e.key==='Backspace'&&!input.value&&tags.length){ tags.pop(); render(); }
  });
  wrap.addEventListener('click', e=>{
    const btn=e.target.closest('[data-i]');
    if(btn){ tags.splice(+btn.dataset.i,1); render(); }
    else input.focus();
  });
  return {
    get()  { return [...tags]; },
    set(a) { tags=[...(a||[])]; render(); },
    clear(){ tags=[]; render(); }
  };
}

/* ── Btn loading ── */
function btnLoad(btn, on){
  if(!btn) return;
  if(on){ btn._h=btn.innerHTML; btn.disabled=true; btn.innerHTML='<div class="spin"></div>'; }
  else  { btn.disabled=false; btn.innerHTML=btn._h||''; }
}

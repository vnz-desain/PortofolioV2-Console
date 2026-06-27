const ICONS = {
  'video-editing':'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  'film':'<rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>',
  'monitor':'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  'smartphone':'<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  'layers':'<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  'pen-tool':'<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/>',
  'star':'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  'globe':'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  'camera':'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  'image':'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  'code':'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  'edit':'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  'share':'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  'mic':'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>',
  'music':'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'trending-up':'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  'zap':'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'aperture':'<circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/>',
  'home':'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  'settings':'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
};

function iSVG(n,s=16){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="${s}" height="${s}">${ICONS[n]||ICONS.star}</svg>`; }

let _skills=[], _skillId=null;

function initSkills(){
  const grid = document.getElementById('sk-icon-grid');
  if(grid) grid.innerHTML = Object.keys(ICONS).map(n=>
    `<button type="button" class="icon-opt" data-icon="${n}" title="${n}" onclick="pickIcon('${n}')">${iSVG(n,16)}</button>`
  ).join('');
  document.getElementById('sk-add').addEventListener('click', ()=>openSkill());
  document.getElementById('sk-modal-x').addEventListener('click', ()=>modal.close('sk-modal'));
  document.getElementById('sk-save').addEventListener('click', saveSkill);
  document.getElementById('sk-delete').addEventListener('click', ()=>delSkill(_skillId));
  loadSkills();
}

async function loadSkills(){
  try { _skills = await sb.get('skills','sort_order.asc'); renderSkills(); }
  catch(e){ toast.err('Gagal load skills: '+e.message); }
}

function renderSkills(){
  const tb = document.getElementById('sk-tbody');
  if(!tb) return;
  if(!_skills.length){
    tb.innerHTML='<tr><td colspan="4"><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><p>Belum ada skill.</p></div></td></tr>';
    return;
  }
  tb.innerHTML = _skills.map(s=>`
    <tr>
      <td style="width:36px"><span class="cell-order">${padOrder(s.sort_order)}</span></td>
      <td style="width:36px"><div class="sk-icon">${iSVG(s.icon,20)}</div></td>
      <td><div class="cell-title">${s.name}</div></td>
      <td style="width:60px;text-align:right"><button class="btn btn-ghost btn-sm" onclick="openSkill(${s.id})">Ubah</button></td>
    </tr>`).join('');
}

function pickIcon(n){
  document.getElementById('sk-icon-val').value = n;
  document.querySelectorAll('.icon-opt').forEach(el=>el.classList.toggle('on', el.dataset.icon===n));
}

function openSkill(id){
  _skillId = id||null;
  const d = id ? _skills.find(s=>s.id===id) : null;
  document.getElementById('sk-modal-title').textContent = d?'Edit Skill':'Add Skill';
  document.getElementById('sk-name').value  = d?.name  ||'';
  document.getElementById('sk-body').value  = d?.body  ||'';
  document.getElementById('sk-order').value = d?.sort_order ?? _skills.length;
  document.getElementById('sk-delete').style.display = d ? 'flex' : 'none';
  pickIcon(d?.icon||'star');
  modal.open('sk-modal');
}

async function saveSkill(){
  const btn = document.getElementById('sk-save');
  const name = document.getElementById('sk-name').value.trim();
  if(!name){ toast.err('Nama wajib diisi.'); return; }
  btnLoad(btn,true);
  try {
    const p = { icon:document.getElementById('sk-icon-val').value||'star', name, body:document.getElementById('sk-body').value.trim(), sort_order:parseInt(document.getElementById('sk-order').value)||0 };
    if(_skillId) await sb.patch('skills',_skillId,p);
    else await sb.post('skills',p);
    toast.ok(_skillId?'Skill diupdate!':'Skill ditambahkan!');
    modal.close('sk-modal');
    await loadSkills();
  } catch(e){ toast.err('Gagal: '+e.message); }
  finally { btnLoad(btn,false); }
}

async function delSkill(id){
  if(!id) return;
  if(!await confirm('Hapus skill ini?')) return;
  try { await sb.del('skills',id); toast.ok('Dihapus.'); modal.close('sk-modal'); await loadSkills(); }
  catch(e){ toast.err('Gagal: '+e.message); }
}

function padOrder(n){ return String(n||0).padStart(2,'0'); }

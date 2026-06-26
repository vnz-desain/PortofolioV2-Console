let _aboutId = null;
let _aboutTags = null;

function initAbout(){
  _aboutTags = tagsInput('about-tags-wrap','about-tags-input');
  document.getElementById('about-save').addEventListener('click', saveAbout);
  loadAbout();
}

async function loadAbout(){
  try {
    const rows = await sb.get('about','id.asc','limit=1');
    const d = rows[0]; if(!d) return;
    _aboutId = d.id;
    document.getElementById('about-bio').value = d.bio||'';
    _aboutTags.set(d.tags||[]);
  } catch(e){ toast.err('Gagal load About: '+e.message); }
}

async function saveAbout(){
  const btn = document.getElementById('about-save');
  const bio = document.getElementById('about-bio').value.trim();
  if(!bio){ toast.err('Bio wajib diisi.'); return; }
  btnLoad(btn,true);
  try {
    const payload = { bio, tags: _aboutTags.get(), updated_at: new Date().toISOString() };
    if(_aboutId) await sb.patch('about',_aboutId,payload);
    else { const r=await sb.post('about',payload); _aboutId=r[0]?.id; }
    toast.ok('About disimpan!');
  } catch(e){ toast.err('Gagal: '+e.message); }
  finally { btnLoad(btn,false); }
}

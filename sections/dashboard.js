async function loadDashboard(){
  try {
    const [slides, skills, projects] = await Promise.all([
      sb.get('slides','sort_order.asc'),
      sb.get('skills','sort_order.asc'),
      sb.get('projects','sort_order.asc')
    ]);

    // Stat cards
    const sc = document.getElementById('stat-cards');
    if(sc) sc.innerHTML = [
      {l:'Slides',  v:slides.length,   icon:'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'},
      {l:'Skills',  v:skills.length,   icon:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'},
      {l:'Projects',v:projects.length, icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'}
    ].map(s=>`
      <div class="stat fade-up">
        <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${s.icon}</svg></div>
        <div><div class="stat-val">${s.v}</div><div class="stat-lbl">${s.l}</div></div>
      </div>`).join('');

    // Recent slides
    const sl = document.getElementById('dash-slides');
    if(sl) sl.innerHTML = slides.slice(0,5).map(s=>`
      <div class="dash-item">
        <span class="badge ${s.tab==='Education'?'badge-blue':'badge-green'}">${s.tab}</span>
        <span style="font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title}</span>
      </div>`).join('') || '<p class="empty" style="padding:1rem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2"/></svg><span>Belum ada slide</span></p>';

    // Recent projects
    const pj = document.getElementById('dash-projects');
    if(pj) pj.innerHTML = projects.slice(0,5).map(p=>`
      <div class="dash-item">
        <div class="proj-thumb">${p.image_url?`<img src="${p.image_url}" alt="" onerror="this.style.display='none'" />`:(p.fallback||'IMG')}</div>
        <span style="font-size:0.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title}</span>
      </div>`).join('') || '<p style="font-size:0.75rem;color:var(--muted);padding:0.5rem 0">Belum ada project.</p>';

  } catch(e){ toast.err('Dashboard: '+e.message); }
}

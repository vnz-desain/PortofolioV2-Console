const router = {
  _routes: {},
  on(path, fn){ this._routes[path]=fn; return this; },
  go(path){ window.location.hash='/'+path; },
  start(){
    window.addEventListener('hashchange', ()=>this._resolve());
    this._resolve();
  },
  current(){ return (window.location.hash||'').replace(/^#\/?/,'')||'dashboard'; },
  _resolve(){
    const path = this.current();
    document.querySelectorAll('.nav-item[data-r]').forEach(el=>{
      el.classList.toggle('active', el.dataset.r===path);
    });
    const lbl = document.querySelector('.nav-item[data-r="'+path+'"] .nav-lbl');
    const ttl = document.getElementById('topbar-title');
    if(ttl&&lbl) ttl.textContent = lbl.textContent;
    document.querySelectorAll('.page').forEach(el=>{
      el.classList.toggle('active', el.dataset.p===path);
    });
    if(this._routes[path]) this._routes[path]();
    else if(this._routes['dashboard']) this.go('dashboard');
  }
};

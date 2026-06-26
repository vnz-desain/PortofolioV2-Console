const SB_URL = 'https://ocedszxukzrnmvrecrnx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZWRzenh1a3pybm12cmVjcm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjI4ODAsImV4cCI6MjA5Nzg5ODg4MH0.fxgMdyZlbp0V20oSvI6ZgnZNgWFh4g0iHMI4SxYLkkE';
const SB_SK  = 'sb-ocedszxukzrnmvrecrnx-auth-token';

const sb = {
  _s()  { try { return JSON.parse(localStorage.getItem(SB_SK)||'null'); } catch { return null; } },
  _tok(){ return this._s()?.access_token || SB_KEY; },
  _hdr(x){ return Object.assign({'apikey':SB_KEY,'Authorization':'Bearer '+this._tok(),'Content-Type':'application/json','Prefer':'return=representation'},x||{}); },

  isLoggedIn(){ const s=this._s(); return !!(s?.access_token); },
  getUser()   { return this._s()?.user||null; },

  async signIn(email,pass){
    const r=await fetch(SB_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
    const d=await r.json();
    if(!r.ok) throw new Error(d.error_description||d.message||'Login failed');
    localStorage.setItem(SB_SK,JSON.stringify(d));
    return d;
  },
  async signOut(){
    try{await fetch(SB_URL+'/auth/v1/logout',{method:'POST',headers:this._hdr()});}catch{}
    localStorage.removeItem(SB_SK);
  },

  async get(table,order,extra){
    let url=SB_URL+'/rest/v1/'+table+'?select=*';
    if(order) url+='&order='+order;
    if(extra) url+='&'+extra;
    const r=await fetch(url,{headers:this._hdr()});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(table,data){
    const r=await fetch(SB_URL+'/rest/v1/'+table,{method:'POST',headers:this._hdr(),body:JSON.stringify(data)});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async patch(table,id,data){
    const r=await fetch(SB_URL+'/rest/v1/'+table+'?id=eq.'+id,{method:'PATCH',headers:this._hdr(),body:JSON.stringify(data)});
    if(!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(table,id){
    const r=await fetch(SB_URL+'/rest/v1/'+table+'?id=eq.'+id,{method:'DELETE',headers:this._hdr({'Prefer':'return=minimal'})});
    if(!r.ok) throw new Error(await r.text());
  },
  async upload(bucket,path,file){
    const r=await fetch(SB_URL+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+this._tok(),'Content-Type':file.type,'x-upsert':'true'},body:file});
    if(!r.ok) throw new Error(await r.text());
    return SB_URL+'/storage/v1/object/public/'+bucket+'/'+path;
  },
  async rmFile(bucket,path){
    await fetch(SB_URL+'/storage/v1/object/'+bucket+'/'+path,{method:'DELETE',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+this._tok()}});
  }
};

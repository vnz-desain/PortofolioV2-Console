const MAX_B = 500*1024;

async function compressWebP(file){
  const img = await new Promise((res,rej)=>{
    const u=URL.createObjectURL(file), i=new Image();
    i.onload=()=>{ URL.revokeObjectURL(u); res(i); };
    i.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('Gagal load')); };
    i.src=u;
  });
  let w=img.naturalWidth, h=img.naturalHeight;
  if(w>1920||h>1920){ const s=Math.min(1920/w,1920/h); w=Math.round(w*s); h=Math.round(h*s); }
  return _findQ(img,w,h);
}

function _blob(img,w,h,q){
  return new Promise(res=>{
    const c=document.createElement('canvas'); c.width=w; c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    c.toBlob(b=>res(b),'image/webp',q);
  });
}

async function _findQ(img,w,h){
  let b=await _blob(img,w,h,0.88);
  if(b.size<=MAX_B) return b;
  let lo=0.1,hi=0.85,best=b;
  for(let i=0;i<8;i++){
    const m=(lo+hi)/2; b=await _blob(img,w,h,m);
    if(b.size<=MAX_B){ best=b; lo=m; } else hi=m;
    if(hi-lo<0.02) break;
  }
  if(best.size>MAX_B){ const s=Math.sqrt(MAX_B/best.size)*0.9; best=await _blob(img,Math.round(w*s),Math.round(h*s),0.75); }
  return best;
}

function toFile(blob, name){
  const base = name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9-_]/g,'-');
  return new File([blob], base+'-'+Date.now()+'.webp', {type:'image/webp'});
}

function fmtB(b){ return b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB'; }

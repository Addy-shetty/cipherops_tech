/* cipherops_tech — 01-core.js */
/* =====================================================================
   helpers
   ===================================================================== */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function el(tag,attrs={},...kids){ const e=document.createElement(tag); for(const k in attrs){ const v=attrs[k]; if(v==null) continue; if(k==="style") e.style.cssText=v; else if(k.startsWith("on")) e[k]=v; else if(k==="html") e.innerHTML=v; else if(k in e && typeof e[k]!=="object") e[k]=v; else e.setAttribute(k,v); }
  kids.flat().forEach(c=>{ if(c==null||c===false) return; e.append(c.nodeType?c:document.createTextNode(c)); }); return e; }
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("on"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("on"),2200); }
const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;

/* =====================================================================
   curriculum
   ===================================================================== */

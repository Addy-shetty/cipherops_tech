/* cipherops_tech — 07-boot.js */
/* =====================================================================
   boot
   ===================================================================== */
try{ initExplorer(); }catch(err){ console.error(err); }
const fromHash=(location.hash||"").slice(1); if(LESSONS.some(l=>l.id===fromHash)){ current=fromHash; openMods.add(LESSONS.find(l=>l.id===fromHash).mod.id); }
$("#startBtn").onclick=()=>openLesson(LESSONS[0].id,true);
$("#attackBtn").onclick=()=>selectScenario("sqli",{play:true});
const applyTheme=t=>{ document.documentElement.setAttribute("data-theme",t); $("#themeBtn").textContent=t==="dark"?"☀":"☾"; $("#themeBtn").setAttribute("aria-label",t==="dark"?"Switch to light theme":"Switch to dark theme"); try{ localStorage.setItem("cipherops-theme",t); }catch(e){} if(typeof xView==="function") xView(); };
let theme="light"; try{ theme=localStorage.getItem("cipherops-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); }catch(e){}
applyTheme(theme); $("#themeBtn").onclick=()=>applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");
renderLabs(); renderCheats(); renderPlacement(); renderCards(); refreshAll();
if(fromHash.startsWith("lab-") && LABS.some(l=>"lab-"+l.id===fromHash)) openLabView(fromHash.slice(4),true);
$("#searchBtn").onclick=openSearch;
$("#searchIn").oninput=e=>drawResults(e.target.value);
$("#searchIn").onkeydown=e=>{ if(e.key==="Escape") closeSearch(); if(e.key==="Enter"){ const f=$("#searchRes .sres"); if(f) f.click(); } };
$("#search").onclick=e=>{ if(e.target.id==="search") closeSearch(); };
document.addEventListener("keydown",e=>{ const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)||document.activeElement.isContentEditable;
  if((e.key==="/"&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k")){ e.preventDefault(); openSearch(); } if(e.key==="Escape"&&!$("#search").hidden) closeSearch(); });

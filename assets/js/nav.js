/* cipherops_tech — responsive header menu (shared by / and /aws) */
(function(){
  var btn=document.getElementById("navBtn"), hdr=document.querySelector("header.top"), nav=document.getElementById("siteNav");
  if(!btn||!hdr||!nav) return;
  function set(open){ hdr.classList.toggle("navopen",open); btn.setAttribute("aria-expanded",open?"true":"false"); btn.textContent=open?"✕":"☰"; btn.setAttribute("aria-label",open?"Close menu":"Open menu"); }
  btn.addEventListener("click",function(e){ e.stopPropagation(); set(!hdr.classList.contains("navopen")); if(hdr.classList.contains("navopen")){ var a=nav.querySelector("a"); if(a) a.focus(); } });
  nav.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
  document.addEventListener("click",function(e){ if(hdr.classList.contains("navopen")&&!hdr.contains(e.target)) set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&hdr.classList.contains("navopen")){ set(false); btn.focus(); } });
  window.addEventListener("resize",function(){ if(window.innerWidth>1320) set(false); });
})();

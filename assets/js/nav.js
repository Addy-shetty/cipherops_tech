/* cipherops_tech — responsive header menu (shared by / and /aws) */
(function(){
  var btn=document.getElementById("navBtn"), hdr=document.querySelector("header.top"), nav=document.getElementById("siteNav");
  if(!btn||!hdr||!nav) return;
  function set(open){ hdr.classList.toggle("navopen",open); btn.setAttribute("aria-expanded",open?"true":"false"); btn.textContent=open?"✕":"☰"; btn.setAttribute("aria-label",open?"Close menu":"Open menu"); }
  btn.addEventListener("click",function(e){ e.stopPropagation(); set(!hdr.classList.contains("navopen")); if(hdr.classList.contains("navopen")){ var a=nav.querySelector("a"); if(a) a.focus(); } });
  nav.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
  document.addEventListener("click",function(e){ if(hdr.classList.contains("navopen")&&!hdr.contains(e.target)) set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&hdr.classList.contains("navopen")){ set(false); btn.focus(); } });
  window.addEventListener("resize",function(){ if(window.innerWidth>1200) set(false); });
})();

/* "On this page" dropdown */
(function(){
  var dd=document.querySelector(".navdd"), b=document.getElementById("navDdBtn"); if(!dd||!b) return;
  var menu=dd.querySelector(".navdd-menu");
  function set(o){ dd.classList.toggle("open",o); b.setAttribute("aria-expanded",o?"true":"false"); }
  b.addEventListener("click",function(e){ e.stopPropagation(); var o=!dd.classList.contains("open"); set(o); if(o){ var a=menu.querySelector("a"); if(a) a.focus(); } });
  menu.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
  menu.addEventListener("keydown",function(e){ var as=[].slice.call(menu.querySelectorAll("a")), i=as.indexOf(document.activeElement);
    if(e.key==="ArrowDown"){ e.preventDefault(); as[(i+1)%as.length].focus(); } else if(e.key==="ArrowUp"){ e.preventDefault(); as[(i-1+as.length)%as.length].focus(); } });
  document.addEventListener("click",function(e){ if(!dd.contains(e.target)) set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&dd.classList.contains("open")){ set(false); b.focus(); } });
})();

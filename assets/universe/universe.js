function bootUniverse(RAW){
"use strict";
/* ---------- data ---------- */
const P=RAW.programs;
const KIND={W:{n:"Wildcards",s:"wildcard"},R:{n:"Root domains",s:"root domain"},U:{n:"Web apps & URLs",s:"web"},A:{n:"APIs",s:"api"},M:{n:"Android apps",s:"android"},I:{n:"iOS apps",s:"ios"},S:{n:"Smart contracts",s:"smart contract"},B:{n:"Blockchain / DLT",s:"blockchain"},L:{n:"AI models & features",s:"ai"},C:{n:"Source code",s:"code"},N:{n:"IPs & CIDRs",s:"network"},H:{n:"Hardware & IoT",s:"hardware"},E:{n:"Desktop & executables",s:"executable"},O:{n:"Other",s:"other"}};
const KORDER="WRUALSBMICNHEO";
const TRACK={w:{n:"Web",c:"#60A5FA"},a:{n:"API",c:"#22D3EE"},m:{n:"Mobile",c:"#34D399"},"3":{n:"Web3",c:"#C084FC"},i:{n:"AI security",c:"#F472B6"},h:{n:"Hardware & IoT",c:"#FB923C"},n:{n:"Network",c:"#94A3B8"},c:{n:"Source code",c:"#FACC15"}};
const hostOf=t=>{ t=String(t).trim().toLowerCase(); if(/\s/.test(t)) return ""; t=t.replace(/^[a-z]+:\/\//,"").replace(/[\/?#].*$/,"").replace(/:\d+$/,""); return /^(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(t)&&!/^\d+(\.\d+){3}$/.test(t)?t:""; };
P.forEach(p=>{ p.items=(p.sc||[]).map(e=>{ const a=e.split("|"); return {k:a[0],t:a[1],d:a[2]||""}; });
  p.out=(p.oos||[]).map(e=>{ const a=e.split("|"); return {k:a[0],t:a[1]}; }); p.oc=p.oc||0;
  const hs=new Set(), roots=new Set(); p.items.forEach(it=>{ if("WRUA".includes(it.k)){ const h=hostOf(it.t); if(h){ hs.add(h); if(h.startsWith("*.")) roots.add(h.slice(2)); else if(it.k==="R") roots.add(h); } } });
  p.dm=[...hs]; p.roots=[...roots]; p.kc={}; p.items.forEach(it=>p.kc[it.k]=(p.kc[it.k]||0)+1); p.cat=p.cat||""; });
const PLAT={self:{n:"Self-hosted programs",c:"#E2E8F0"},hackerone:{n:"HackerOne",c:"#F472B6"},bugcrowd:{n:"Bugcrowd",c:"#FB923C"},intigriti:{n:"Intigriti",c:"#60A5FA"},yeswehack:{n:"YesWeHack",c:"#F87171"},hackenproof:{n:"HackenProof",c:"#34D399"},immunefi:{n:"Immunefi",c:"#C084FC"},federacy:{n:"Federacy",c:"#FACC15"},openbugbounty:{n:"Open Bug Bounty",c:"#22D3EE"}};
const TYPE={1:{n:"Paid bounty",c:"#F5B83D"},0:{n:"VDP (no cash)",c:"#2DD4BF"},"-1":{n:"Unknown",c:"#8FA0C8"}};
const SHN={2:"Full",1:"Partial",0:"None","-1":"Unknown"};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
function el(t,a={},...k){const e=document.createElement(t);for(const x in a){const v=a[x];if(v==null)continue;if(x==="style")e.style.cssText=v;else if(x.startsWith("on"))e[x]=v;else if(x in e&&typeof e[x]!=="object")e[x]=v;else e.setAttribute(x,v);}k.flat().forEach(c=>{if(c==null||c===false)return;e.append(c.nodeType?c:document.createTextNode(c));});return e;}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2000);}
const counts={}; P.forEach(p=>counts[p.p]=(counts[p.p]||0)+1);
const platOrder=Object.keys(PLAT).filter(k=>counts[k]).sort((a,b)=>counts[b]-counts[a]);
$("#snap").textContent="Snapshot "+RAW.generated+" · "+P.length.toLocaleString()+" programs";

/* ---------- filters ---------- */
const F={track:new Set(),type:new Set(["1","0","-1"]),sh:new Set(["2","1","0","-1"]),plat:new Set(platOrder),scope:0,beginner:false};
let visible=new Uint8Array(P.length).fill(1);
function passes(p){ return (!F.track.size||[...F.track].some(t=>p.cat.includes(t))) && F.type.has(String(p.b)) && F.sh.has(String(p.sh)) && F.plat.has(p.p) && p.d>=F.scope && (!F.beginner||p.s>=60); }
function applyFilters(){ let n=0, nb=0; P.forEach((p,i)=>{ const v=passes(p)?1:0; visible[i]=v; if(v){ n++; if(p.s>=60) nb++; } });
  $("#count").innerHTML=""; $("#count").append(el("span",{},el("b",{},n.toLocaleString())," programs shown · ",el("b",{},nb.toLocaleString())," beginner-friendly"));
  if(U) U.refresh(); if(view==="bubble") drawBubble(); if(view==="list") drawList(); }
function chip(label,color,count,on,fn){ const b=el("button",{className:"chip","aria-pressed":String(on)},color?el("i",{style:"background:"+color+";box-shadow:0 0 8px "+color}):null,label,count!=null?el("small",{},String(count)):null); b.onclick=()=>{ fn(b); }; return b; }
function buildFilters(){
  const tc={}, sc={}; P.forEach(p=>{ tc[p.b]=(tc[p.b]||0)+1; sc[p.sh]=(sc[p.sh]||0)+1; });
  const trc={}; P.forEach(p=>{ for(const c of p.cat) trc[c]=(trc[c]||0)+1; });
  Object.keys(TRACK).forEach(k=>{ if(!trc[k]) return; $("#fTrack").append(chip(TRACK[k].n,TRACK[k].c,trc[k],false,b=>{ F.track.has(k)?F.track.delete(k):F.track.add(k); b.setAttribute("aria-pressed",String(F.track.has(k))); applyFilters(); })); });
  $("#allT").onclick=()=>{ F.track.clear(); $$("#fTrack .chip").forEach(c=>c.setAttribute("aria-pressed","false")); applyFilters(); };
  ["1","0","-1"].forEach(k=>$("#fType").append(chip(TYPE[k].n,TYPE[k].c,tc[k]||0,true,b=>{ F.type.has(k)?F.type.delete(k):F.type.add(k); b.setAttribute("aria-pressed",String(F.type.has(k))); applyFilters(); })));
  ["2","1","0","-1"].forEach(k=>$("#fSH").append(chip(SHN[k],null,sc[k]||0,true,b=>{ F.sh.has(k)?F.sh.delete(k):F.sh.add(k); b.setAttribute("aria-pressed",String(F.sh.has(k))); applyFilters(); })));
  platOrder.forEach(k=>{ const cb=el("input",{type:"checkbox",checked:true,"aria-label":PLAT[k].n}); cb.onchange=()=>{ cb.checked?F.plat.add(k):F.plat.delete(k); applyFilters(); };
    const row=el("label",{className:"prow"},cb,el("span",{},el("span",{className:"sw",style:"background:"+PLAT[k].c}),PLAT[k].n),el("small",{},String(counts[k])));
    row.addEventListener("dblclick",()=>{ if(U) U.flyToGalaxy(k); }); $("#fPlat").append(row); });
  $("#allP").onclick=()=>{ const all=F.plat.size===platOrder.length; $$("#fPlat input").forEach((cb,i)=>{ cb.checked=!all; }); F.plat=new Set(all?[]:platOrder); applyFilters(); };
  $("#scope").oninput=e=>{ F.scope=+e.target.value; $("#scopeV").textContent=F.scope?F.scope+"+ assets":"any"; applyFilters(); };
  $("#beginner").onclick=()=>{ F.beginner=!F.beginner; $("#beginner").setAttribute("aria-checked",String(F.beginner)); applyFilters(); };
  $("#closeF").onclick=()=>{ $("#filters").classList.add("closed"); $("#stage").classList.add("fclosed"); };
  $("#openF").onclick=()=>{ $("#filters").classList.remove("closed"); $("#stage").classList.remove("fclosed"); };
}

/* ---------- card ---------- */
let selected=-1;
function why(p){ return [
  [p.sh>=1, p.sh===2?"Full safe harbor listed":p.sh===1?"Partial safe harbor listed":p.sh===0?"No safe harbor listed":"Safe harbor unknown"],
  [true, p.b===0?"VDP: no cash, so fewer competing hunters":p.b===1?"Paid bounty: real rewards, more competition":"Reward type unknown"],
  [p.d>=1, p.roots.length?"Wildcard scope: "+p.roots.length+" root domain"+(p.roots.length>1?"s":"")+" (every subdomain counts)":p.d>=5?"Wide scope: "+p.d+" assets listed":p.d>=1?"Narrow scope: "+p.d+" asset"+(p.d>1?"s":""):"No scope listed in the dataset"],
  [p.p!=="self", p.p!=="self"?"Platform-run: triage and mediation help":"Self-hosted: you deal with the company directly"],
  [(p.u||"").startsWith("https://"),"Public HTTPS policy page"],
  [p.sw||p.hof, p.sw||p.hof?"Swag or hall of fame":"No swag or hall of fame listed"],
  ...(p.kyc?[[false,"KYC (identity check) required before payout"]]:[])]; }
function openCard(i){
  selected=i; const p=P[i], C=$("#card"); C.innerHTML=""; C.classList.add("on");
  C.append(el("button",{className:"x",onclick:closeCard,"aria-label":"Close"},"✕"),
    el("div",{className:"eyebrow"},PLAT[p.p].n), el("h2",{},p.n),
    el("div",{className:"meta"}, [...p.cat].filter(c=>TRACK[c]).map(c=>el("span",{className:"tag trk",style:"border-color:"+TRACK[c].c+"88;color:"+TRACK[c].c},TRACK[c].n)), el("span",{className:"tag "+(p.b===1?"gold":p.b===0?"teal":"")},TYPE[p.b].n), el("span",{className:"tag"+(p.sh===2?" teal":"")},"Safe harbor: "+SHN[p.sh]), p.sw?el("span",{className:"tag violet"},"Swag"):null, p.hof?el("span",{className:"tag violet"},"Hall of fame"):null),
    el("div",{className:"f-h"},"Beginner score ",el("span",{className:"mono"},p.s+" / 100")), el("div",{className:"score"},el("div",{className:"bar"},el("i",{style:"width:"+p.s+"%"}))),
    el("ul",{className:"why"}, why(p).map(([ok,t])=>el("li",{className:ok?"":"no"},t))),
    el("dl",{className:"kv"}, el("dt",{},"Policy"), el("dd",{}, p.u?el("a",{href:p.u,target:"_blank",rel:"noopener noreferrer"},p.u.replace(/^https?:\/\//,"").slice(0,60)+(p.u.length>68?"…":"")):"—"),
      p.mx?el("dt",{},"Max reward"):null, p.mx?el("dd",{className:"mono"},"$"+Number(p.mx).toLocaleString()):null,
      p.tags&&p.tags.length?el("dt",{},"Project"):null, p.tags&&p.tags.length?el("dd",{},p.tags.join(" · ")):null,
      p.aiw?el("dt",{},"AI in scope"):null, p.aiw?el("dd",{},el("code",{className:"aiw"},p.aiw)):null,
      p.note?el("dt",{},"Focus"):null, p.note?el("dd",{},p.note):null),
    scopeView(p),
    scopeBox(p),
    el("p",{style:"font-size:12.5px;color:var(--text-3);margin:4px 0 0"},"Details come from community datasets and can be out of date. The live policy is the source of truth."),
    el("div",{className:"warn"},"Before you test: read the live policy, stay strictly in scope, use your own test accounts, and stop at proof of concept."),
    el("div",{className:"row"}, p.u?el("a",{className:"btn primary sm",href:p.u,target:"_blank",rel:"noopener noreferrer"},"Read the policy ↗"):null,
      el("button",{className:"btn sm",onclick:()=>{ toast("Scope Detective arrives in the full bug bounty track"); }},"Practise this scope"),
      el("button",{className:"btn sm",onclick:()=>U&&U.flyToGalaxy(p.p)},"View galaxy")));
  if(U) U.select(i);
}

function scopeView(p){
  if(!p.d) return el("div",{className:"scopev"},el("div",{className:"f-h"},"Scope"),el("p",{className:"muted"},"Not listed in the datasets. Read the in-scope table on the policy page."));
  const groups=KORDER.split("").filter(k=>p.kc[k]);
  let cur=groups[0]; const box=el("div",{className:"scopev"}), body=el("div",{className:"sbody"});
  const tabs=el("div",{className:"stabs",role:"tablist"});
  function show(k,showAll){ cur=k; [...tabs.children].forEach(b=>b.setAttribute("aria-selected",String(b.dataset.k===k)));
    body.innerHTML=""; const list=k==="X"?p.out:p.items.filter(it=>it.k===k), lim=showAll?list.length:12;
    const ul=el("div",{className:"slist"}); list.slice(0,lim).forEach(it=>ul.append(el("div",{className:"sitem"+(k==="X"?" oos":"")},k==="X"?el("small",{},KIND[it.k]?KIND[it.k].s:""):null,el("code",{},it.t),it.d?el("small",{},it.d):null)));
    body.append(ul); if(list.length>lim) body.append(el("button",{className:"btn sm",onclick:()=>show(k,true)},"Show all "+list.length.toLocaleString()));
    if(k==="X"&&p.oc>p.out.length) body.append(el("p",{className:"muted"},"Showing "+p.out.length+" of "+p.oc+" out-of-scope items. The rest are on the policy page."));
    if(k==="W"||k==="R") body.append(el("p",{className:"muted"},"A wildcard like *.example.com covers every subdomain, which can be hundreds or thousands of hosts. You find them with recon (subfinder, Chaos), then re-check each against the out-of-scope list.")); }
  groups.forEach(k=>tabs.append(el("button",{role:"tab","data-k":k,onclick:()=>show(k)},KIND[k].n,el("small",{},String(p.kc[k])))));
  if(p.oc) tabs.append(el("button",{role:"tab","data-k":"X",className:"oos",onclick:()=>show("X")},"Out of scope",el("small",{},String(p.oc))));
  box.append(el("div",{className:"f-h"},"Scope ",el("span",{className:"mono"},p.d.toLocaleString()+" in"+(p.oc?" · "+p.oc+" out":""))),tabs,body); show(cur); return box; }
function closeCard(){ selected=-1; $("#card").classList.remove("on"); if(U) U.select(-1); }

/* ---------- search ---------- */
let suggK=0;
function searchFor(q){ q=q.trim().toLowerCase(); if(!q) return []; const a=[],b=[]; P.forEach((p,i)=>{ const n=p.n.toLowerCase(); if(n.startsWith(q)) a.push(i); else if(n.includes(q)||p.dm.some(d=>d.includes(q))) b.push(i); }); return a.concat(b).slice(0,12); }
function drawSugg(){ const s=$("#sugg"), r=searchFor($("#q").value); s.innerHTML=""; suggK=0;
  r.forEach((i,k)=>{ const p=P[i]; s.append(el("button",{className:k===0?"k":"",onmousedown:e=>{ e.preventDefault(); pick(i); }},el("span",{className:"dot",style:"width:9px;height:9px;color:"+TYPE[p.b].c+";background:"+TYPE[p.b].c}),p.n,el("small",{},PLAT[p.p].n))); });
  s.classList.toggle("on",r.length>0); s._r=r; }
function pick(i){ $("#sugg").classList.remove("on"); $("#q").value=P[i].n; if(!visible[i]){ resetFilters(); } openCard(i); if(view==="universe"&&U) U.flyToPoint(i); }
function resetFilters(){ F.track.clear(); $$("#fTrack .chip").forEach(c=>c.setAttribute("aria-pressed","false")); F.type=new Set(["1","0","-1"]); F.sh=new Set(["2","1","0","-1"]); F.plat=new Set(platOrder); F.scope=0; F.beginner=false;
  $$("#fType .chip,#fSH .chip").forEach(c=>c.setAttribute("aria-pressed","true")); $$("#fPlat input").forEach(c=>c.checked=true); $("#scope").value=0; $("#scopeV").textContent="any"; $("#beginner").setAttribute("aria-checked","false"); applyFilters(); }
$("#q").addEventListener("input",drawSugg);
$("#q").addEventListener("keydown",e=>{ const s=$("#sugg"), r=s._r||[]; if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); suggK=(suggK+(e.key==="ArrowDown"?1:-1)+r.length)%Math.max(r.length,1); [...s.children].forEach((c,k)=>c.classList.toggle("k",k===suggK)); } else if(e.key==="Enter"&&r.length){ pick(r[suggK]); } else if(e.key==="Escape"){ s.classList.remove("on"); } });
$("#q").addEventListener("blur",()=>setTimeout(()=>$("#sugg").classList.remove("on"),120));
document.addEventListener("keydown",e=>{ if(e.key==="/"&&document.activeElement!==$("#q")){ e.preventDefault(); $("#q").focus(); } if(e.key==="Escape"&&selected>=0&&document.activeElement!==$("#q")) closeCard(); });

/* ---------- views ---------- */
let view="universe";
$$("[data-view]").forEach(b=>b.onclick=()=>setView(b.dataset.view));
function setView(v){ view=v; $$("[data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===v)));
  const u=v==="universe"; $("#gl").style.display=u?"block":"none"; $("#labels").style.display=u?"block":"none"; $("#zoomc").style.display=u?"flex":"none"; $("#hint").style.display=u?"":"none";
  $("#hov").style.display="none"; $("#sel").style.display="none"; $("#bubble").style.display=v==="bubble"?"block":"none"; $("#list").style.display=v==="list"?"block":"none";
  $$(".axis").forEach(a=>a.remove()); if(v==="bubble") drawBubble(); if(v==="list") drawList(); if(U) U.setActive(u); }

/* bubble chart (2D canvas) */
let bubblePts=[];
const rnd=(i,k)=>{ let h=(i*2654435761 ^ k*40503)>>>0; h=Math.imul(h^(h>>>16),2246822507)>>>0; h=Math.imul(h^(h>>>13),3266489909)>>>0; return ((h^(h>>>16))>>>0)/4294967296; };
function drawBubble(){
  const cv=$("#bubble"), st=$("#stage"), dpr=Math.min(devicePixelRatio,2), W=st.clientWidth, H=st.clientHeight; cv.width=W*dpr; cv.height=H*dpr;
  $$(".axis").forEach(a=>a.remove()); const g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const left=$("#filters").classList.contains("closed")?80:385, right=selected>=0&&W>900?400:40, top=40, bottom=60, pw=W-left-right, ph=H-top-bottom;
  g.strokeStyle="rgba(150,175,255,.14)"; g.lineWidth=1; g.font="500 11px JetBrains Mono, monospace"; g.fillStyle="#7B88A8";
  for(let s=0;s<=100;s+=20){ const x=left+pw*s/100; g.beginPath(); g.moveTo(x,top); g.lineTo(x,top+ph); g.stroke(); g.fillText(String(s),x-6,top+ph+18); }
  const maxD=Math.max(...P.map(p=>p.d)), ly=d=>top+ph-ph*Math.log2(1+d)/Math.log2(1+maxD);
  [0,1,5,20,100,1000,10000].filter(d=>d<=maxD).forEach(d=>{ const y=ly(d); g.beginPath(); g.moveTo(left,y); g.lineTo(left+pw,y); g.stroke(); g.textAlign="right"; g.fillText(d===1?"1 asset":d.toLocaleString()+" assets",left-8,y+4); g.textAlign="left"; });
  g.fillStyle="rgba(45,212,191,.06)"; g.fillRect(left+pw*0.6,top,pw*0.4,ph); g.fillStyle="#2DD4BF"; g.font="700 12px Barlow Semi Condensed, sans-serif"; g.fillText("BEGINNER-FRIENDLY ZONE  →",left+pw*0.6+10,top+16);
  bubblePts=[];
  P.forEach((p,i)=>{ if(!visible[i]) return; const x=left+pw*(Math.min(99.4,p.s+rnd(i,1)*4-2)/100), y=ly(p.d)-(rnd(i,2)*ph*0.06)+ph*0.03*(p.d?0:rnd(i,3)), r=2.2+Math.min(Math.log2(1+p.d),10)*1.05; const yy=Math.max(top+r+2,y);
    g.beginPath(); g.arc(x,yy,r,0,7); g.fillStyle=TYPE[p.b].c+(i===selected?"":"cc"); g.fill(); if(p.sh===2){ g.strokeStyle="rgba(220,245,240,.7)"; g.lineWidth=1; g.stroke(); }
    bubblePts.push([x,yy,r,i]); });
  if(selected>=0){ const b=bubblePts.find(q=>q[3]===selected); if(b){ g.beginPath(); g.arc(b[0],b[1],b[2]+6,0,7); g.strokeStyle="#fff"; g.lineWidth=2; g.stroke(); } }
  st.append(el("div",{className:"axis",style:"left:"+(left+pw/2-90)+"px;top:"+(H-26)+"px"},"Beginner score →"), el("div",{className:"axis",style:"left:"+(left-60)+"px;top:"+(top-26)+"px"},"↑ in-scope assets"));
}
$("#bubble").addEventListener("mousemove",e=>{ const r=$("#bubble").getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top; let best=null,bd=1e9; bubblePts.forEach(q=>{ const d=(q[0]-x)**2+(q[1]-y)**2; if(d<bd&&d<(q[2]+5)**2){ bd=d; best=q; } }); showTip(best?best[3]:-1,x,y); $("#bubble").style.cursor=best?"pointer":"default"; $("#bubble")._h=best?best[3]:-1; });
$("#bubble").addEventListener("click",()=>{ const h=$("#bubble")._h; if(h>=0){ openCard(h); drawBubble(); } });
$("#bubble").addEventListener("mouseleave",()=>showTip(-1));
function showTip(i,x,y){ const t=$("#tip"); if(i<0){ t.style.display="none"; return; } const p=P[i]; t.innerHTML=""; t.append(el("b",{},p.n),el("small",{},TYPE[p.b].n+" · SH "+SHN[p.sh]+" · score "+p.s)); t.style.display="block"; t.style.left=Math.min(x+14,$("#stage").clientWidth-240)+"px"; t.style.top=(y+14)+"px"; }

/* list */
let sortK="s", sortDir=-1, shown=150;
function drawList(){ const L=$("#list"); L.innerHTML="";
  const rows=P.map((p,i)=>i).filter(i=>visible[i]).sort((a,b)=>{ const A=P[a][sortK], B=P[b][sortK]; return (typeof A==="string"?A.localeCompare(B):A-B)*sortDir || P[a].n.localeCompare(P[b].n); });
  const cols=[["n","Program"],["p","Platform"],["b","Type"],["sh","Safe harbor"],["d","Scope"],["s","Beginner score"]];
  const th=cols.map(([k,t])=>{ const h=el("th",{scope:"col",tabIndex:0},t); if(sortK===k) h.setAttribute("aria-sort",sortDir>0?"ascending":"descending"); h.onclick=h.onkeydown=e=>{ if(e.type==="keydown"&&e.key!=="Enter") return; if(sortK===k) sortDir*=-1; else { sortK=k; sortDir=(k==="n"||k==="p")?1:-1; } drawList(); }; return h; });
  const tb=el("tbody"); rows.slice(0,shown).forEach(i=>{ const p=P[i]; const tr=el("tr",{tabIndex:0},el("td",{},p.n),el("td",{},PLAT[p.p].n),el("td",{},el("span",{className:"tag "+(p.b===1?"gold":p.b===0?"teal":"")},TYPE[p.b].n)),el("td",{},SHN[p.sh]),el("td",{className:"mono"},p.d?String(p.d):"—"),el("td",{className:"mono"},String(p.s)));
    tr.onclick=()=>openCard(i); tr.onkeydown=e=>{ if(e.key==="Enter") openCard(i); }; tb.append(tr); });
  L.append(el("table",{},el("caption",{style:"text-align:left;padding:0 0 10px;color:var(--text-2)"},rows.length.toLocaleString()+" programs · click a row for details"),el("thead",{},el("tr",{},th)),tb));
  if(rows.length>shown) L.append(el("div",{className:"more"},el("button",{className:"btn",onclick:()=>{ shown+=300; drawList(); }},"Show more ("+(rows.length-shown).toLocaleString()+" left)")));
}

/* ---------- 3D universe ---------- */
let U=null;
function buildUniverse(){
  if(!window.THREE) throw new Error("three.js not loaded");
  const cv=$("#gl"), st=$("#stage");
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:false}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setClearColor(0x060A16);
  const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x060A16,0.00055);
  const cam=new THREE.PerspectiveCamera(55,1,1,9000);
  // seeded helpers
  const hash=s=>{ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
  const rng=seed=>()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  const gauss=r=>{ let u=0,v=0; while(!u) u=r(); while(!v) v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  // galaxies
  const G={}; const others=platOrder.filter(k=>k!=="self");
  G.self={pos:new THREE.Vector3(0,0,0),R:210,tilt:[0.18,0]};
  others.forEach((k,j)=>{ const a=j/others.length*Math.PI*2+0.4, rad=480+((j%2)*90); G[k]={pos:new THREE.Vector3(Math.cos(a)*rad,(j%3-1)*70,Math.sin(a)*rad),R:30+Math.sqrt(counts[k])*7,tilt:[(rng(hash(k))()-.5)*1.0,(rng(hash(k)+7)()-.5)*1.0]}; });
  // positions
  const N=P.length, pos=new Float32Array(N*3), col=new Float32Array(N*3), size=new Float32Array(N), ring=new Float32Array(N), alpha=new Float32Array(N), boost=new Float32Array(N);
  const tmp=new THREE.Vector3(), cTmp=new THREE.Color(), world=[];
  P.forEach((p,i)=>{ const g=G[p.p], r=rng(hash(p.n+p.p)); const arms=p.p==="self"?3:2, arm=Math.floor(r()*arms);
    const base=1-p.s/100; let d=Math.min(1,Math.max(0.02,base*0.95+(r()-0.5)*0.35)); d=Math.pow(d,1.15);
    const dist=g.R*d, ang=arm*Math.PI*2/arms+d*3.4+gauss(r)*0.28*(0.4+d);
    tmp.set(Math.cos(ang)*dist,gauss(r)*g.R*0.05*(1.2-d),Math.sin(ang)*dist);
    tmp.applyAxisAngle(new THREE.Vector3(1,0,0),g.tilt[0]).applyAxisAngle(new THREE.Vector3(0,0,1),g.tilt[1]).add(g.pos);
    pos.set([tmp.x,tmp.y,tmp.z],i*3); world.push(tmp.clone());
    cTmp.set(TYPE[p.b].c); col.set([cTmp.r,cTmp.g,cTmp.b],i*3);
    size[i]=10+Math.min(Math.log2(1+p.d),9)*4.6+(p.s>=60?4:0); ring[i]=p.sh===2?2:p.sh===1?1:0; alpha[i]=1; boost[i]=p.s>=60?1:0; });
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.BufferAttribute(pos,3)); geo.setAttribute("color",new THREE.BufferAttribute(col,3));
  geo.setAttribute("size",new THREE.BufferAttribute(size,1)); geo.setAttribute("ring",new THREE.BufferAttribute(ring,1));
  const aAttr=new THREE.BufferAttribute(alpha,1); geo.setAttribute("alpha",aAttr); geo.setAttribute("boost",new THREE.BufferAttribute(boost,1));
  const mat=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    uniforms:{uPR:{value:renderer.getPixelRatio()},uTime:{value:0},uBeg:{value:0}},
    vertexShader:`attribute float size; attribute float ring; attribute float alpha; attribute float boost; attribute vec3 color;
      varying vec3 vC; varying float vR; varying float vA; varying float vB; uniform float uPR; uniform float uTime; uniform float uBeg;
      void main(){ vC=color; vR=ring; vA=alpha; vB=boost; vec4 mv=modelViewMatrix*vec4(position,1.0);
        float tw=1.0+0.08*sin(uTime*1.6+position.x*0.05+position.z*0.03);
        float s=size*tw*(1.0+uBeg*boost*0.25);
        gl_PointSize=clamp(s*uPR*(420.0/-mv.z),2.0,46.0); gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`varying vec3 vC; varying float vR; varying float vA; varying float vB; uniform float uBeg;
      void main(){ vec2 c=gl_PointCoord-0.5; float r=length(c)*2.0; if(r>1.0) discard;
        float core=smoothstep(0.42,0.18,r); float glow=exp(-r*r*5.0)*0.55;
        float rg=0.0; if(vR>0.5){ rg=smoothstep(0.07,0.0,abs(r-0.8)); if(vR<1.5){ float a=atan(c.y,c.x); rg*=step(0.0,sin(a*6.0)); } }
        vec3 col=vC*(core*1.15+glow)+vec3(0.85,1.0,0.96)*rg*0.9;
        float a=(core+glow*0.9+rg*0.9)*vA*mix(1.0, (vB>0.5?1.0:0.28), uBeg);
        if(a<0.01) discard; gl_FragColor=vec4(col,a); }`});
  const points=new THREE.Points(geo,mat); scene.add(points);
  // galaxy cores
  const glowTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=128; const g=c.getContext("2d"); const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,"rgba(255,255,255,1)"); gr.addColorStop(0.18,"rgba(255,255,255,.55)"); gr.addColorStop(0.5,"rgba(255,255,255,.12)"); gr.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=gr; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); })();
  const labels={};
  platOrder.forEach(k=>{ const g=G[k]; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:new THREE.Color(PLAT[k].c),transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false}));
    s.position.copy(g.pos); s.scale.setScalar(g.R*1.1); scene.add(s);
    const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0x2DD4BF,transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false})); s2.position.copy(g.pos); s2.scale.setScalar(g.R*0.8); scene.add(s2); g.neb=s2;
    const lb=el("button",{className:"glabel",onclick:()=>flyToGalaxy(k)},PLAT[k].n,el("small",{},String(counts[k]))); lb.style.borderColor=PLAT[k].c+"88"; $("#labels").append(lb); labels[k]=lb; });
  // ---------- deep space: stars, milky way, nebulae, dust, shooting stars ----------
  const SPACE=(()=>{
    const grp=new THREE.Group(); scene.add(grp);
    const starMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
      uniforms:{uPR:{value:renderer.getPixelRatio()},uTime:{value:0},uOn:{value:1}},
      vertexShader:`attribute float size; attribute vec3 color; attribute float phase; attribute float spike;
        varying vec3 vC; varying float vS; varying float vT; uniform float uPR; uniform float uTime;
        void main(){ vC=color; vS=spike; vec4 mv=modelViewMatrix*vec4(position,1.0);
          vT=0.72+0.28*sin(uTime*(0.6+phase*2.2)+phase*40.0);
          gl_PointSize=clamp(size*uPR*(spike>0.5?1.0:mix(1.0,vT,0.6)),1.0,64.0); gl_Position=projectionMatrix*mv; }`,
      fragmentShader:`varying vec3 vC; varying float vS; varying float vT; uniform float uOn;
        void main(){ vec2 c=gl_PointCoord-0.5; float r=length(c)*2.0;
          float core=exp(-r*r*(vS>0.5?60.0:9.0)); float halo=exp(-r*r*(vS>0.5?7.0:3.5))*0.35;
          float sp=0.0; if(vS>0.5){ float ax=abs(c.x), ay=abs(c.y);
            sp=(exp(-ax*90.0)*pow(max(0.0,1.0-ay*2.0),2.2)+exp(-ay*90.0)*pow(max(0.0,1.0-ax*2.0),2.2))*0.75*vT; }
          float a=(core+halo+sp)*uOn; if(a<0.01) discard; gl_FragColor=vec4(vC*(0.75+core*0.6+sp*0.5),min(a,1.0)); }`});
    const STC=[[0.66,0.76,1.0],[0.8,0.86,1.0],[1,1,1],[1,0.96,0.86],[1,0.86,0.66],[1,0.72,0.55]];
    function starCloud(n,seed,place,sz,spikeP){ const r=rng(seed), p=new Float32Array(n*3), c=new Float32Array(n*3), s=new Float32Array(n), ph=new Float32Array(n), sk=new Float32Array(n), v=new THREE.Vector3();
      for(let i=0;i<n;i++){ place(r,v); p.set([v.x,v.y,v.z],i*3); const k=STC[Math.min(5,Math.floor(Math.pow(r(),0.8)*6))], b=0.55+r()*0.45; c.set([k[0]*b,k[1]*b,k[2]*b],i*3);
        const big=r()<spikeP; sk[i]=big?1:0; s[i]=big?18+r()*20:sz[0]+Math.pow(r(),3)*sz[1]; ph[i]=r(); }
      const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(p,3)); g.setAttribute("color",new THREE.BufferAttribute(c,3));
      g.setAttribute("size",new THREE.BufferAttribute(s,1)); g.setAttribute("phase",new THREE.BufferAttribute(ph,1)); g.setAttribute("spike",new THREE.BufferAttribute(sk,1));
      const pts=new THREE.Points(g,starMat); pts.frustumCulled=false; return pts; }
    // 1) all-sky stars on a far shell
    grp.add(starCloud(9000,42,(r,v)=>v.set(gauss(r),gauss(r),gauss(r)).normalize().multiplyScalar(2300+r()*1600),[1.4,3.2],0.014));
    // 2) a milky-way band across the sky
    const band=new THREE.Group(); band.rotation.set(0.55,0.3,0.42); grp.add(band);
    band.add(starCloud(7000,7,(r,v)=>{ const a=r()*Math.PI*2, lat=gauss(r)*0.09*(1+0.6*Math.sin(a*2)); v.set(Math.cos(a)*Math.cos(lat),Math.sin(lat),Math.sin(a)*Math.cos(lat)).multiplyScalar(2600+r()*900); },[1.1,2.4],0.003));
    // 3) nebula clouds (procedural canvas textures)
    const nebTex=(seed,hue)=>{ const c=document.createElement("canvas"); c.width=c.height=256; const g=c.getContext("2d"), r=rng(seed);
      for(let i=0;i<46;i++){ const x=128+gauss(r)*42, y=128+gauss(r)*34, rad=18+r()*70, h=hue+(r()-0.5)*50, l=45+r()*25;
        const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,"hsla("+h+",85%,"+l+"%,"+(0.10+r()*0.12)+")"); gr.addColorStop(1,"hsla("+h+",85%,"+l+"%,0)"); g.fillStyle=gr; g.fillRect(0,0,256,256); }
      const m=g.createRadialGradient(128,128,40,128,128,128); m.addColorStop(0,"rgba(0,0,0,0)"); m.addColorStop(1,"rgba(0,0,0,1)"); g.globalCompositeOperation="destination-out"; g.fillStyle=m; g.fillRect(0,0,256,256);
      const t=new THREE.CanvasTexture(c); return t; };
    const nebs=[]; [[268,0.32],[190,0.26],[320,0.24],[215,0.2],[28,0.16],[160,0.2],[290,0.22]].forEach(([hue,op],j)=>{ const r=rng(900+j);
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:nebTex(300+j,hue),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
      const v=new THREE.Vector3(gauss(r),gauss(r)*0.6,gauss(r)).normalize().multiplyScalar(2200+r()*700); sp.position.copy(v); sp.scale.setScalar(1300+r()*1200); sp.material.rotation=r()*6.28; grp.add(sp); nebs.push([sp,op,r()*6]); });
    // 4) galaxy dust, halos and slow rotation
    const dustGroups=[];
    platOrder.forEach(k=>{ const g=G[k], r=rng(hash(k)+99), n=Math.round(500+g.R*9), col=new THREE.Color(PLAT[k].c);
      const holder=new THREE.Group(); holder.position.copy(g.pos); holder.rotation.order="ZXY"; holder.rotation.x=g.tilt[0]; holder.rotation.z=g.tilt[1]; scene.add(holder);
      const spin=new THREE.Group(); holder.add(spin);
      const arms=k==="self"?3:2, p=new Float32Array(n*3), c=new Float32Array(n*3), s=new Float32Array(n), ph=new Float32Array(n), sk=new Float32Array(n);
      for(let i=0;i<n;i++){ const d=Math.pow(r(),0.75)*1.12, arm=Math.floor(r()*arms), ang=arm*Math.PI*2/arms+d*3.4+gauss(r)*0.22*(0.5+d), dist=g.R*d;
        p.set([Math.cos(ang)*dist,gauss(r)*g.R*0.035,Math.sin(ang)*dist],i*3); const m=0.25+0.5*(1-d); c.set([(col.r*0.6+0.4)*m,(col.g*0.6+0.4)*m,(col.b*0.6+0.4)*m],i*3); s[i]=1.2+r()*2.2; ph[i]=r(); }
      const gg=new THREE.BufferGeometry(); gg.setAttribute("position",new THREE.BufferAttribute(p,3)); gg.setAttribute("color",new THREE.BufferAttribute(c,3)); gg.setAttribute("size",new THREE.BufferAttribute(s,1)); gg.setAttribute("phase",new THREE.BufferAttribute(ph,1)); gg.setAttribute("spike",new THREE.BufferAttribute(sk,1));
      const dust=new THREE.Points(gg,starMat); spin.add(dust);
      // halo ring
      const ringPts=[]; for(let a=0;a<=96;a++){ const t=a/96*Math.PI*2; ringPts.push(new THREE.Vector3(Math.cos(t)*g.R*1.22,0,Math.sin(t)*g.R*1.22)); }
      const rl=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.13,depthWrite:false})); holder.add(rl);
      dustGroups.push({spin,ring:rl,speed:(k==="self"?0.012:0.03)*(r()<0.5?1:-1)}); });
    // 5) shooting stars
    const shoot=[]; for(let i=0;i<3;i++){ const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(6),3)); g.setAttribute("color",new THREE.BufferAttribute(new Float32Array([1,1,1,0,0,0]),3));
      const l=new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); l.frustumCulled=false; scene.add(l); shoot.push({l,life:0,dur:1,p:new THREE.Vector3(),d:new THREE.Vector3(),len:0}); }
    let nextShot=2.5, on=true;
    const fwd=new THREE.Vector3(), side=new THREE.Vector3(), upv=new THREE.Vector3();
    function spawn(sh){ cam.getWorldDirection(fwd); side.crossVectors(fwd,cam.up).normalize(); upv.crossVectors(side,fwd).normalize(); const R=Math.random;
      const dist=700+R()*900; sh.p.copy(cam.position).addScaledVector(fwd,dist).addScaledVector(side,(R()-0.5)*dist*1.2).addScaledVector(upv,(0.15+R()*0.4)*dist*0.7);
      sh.d.copy(side).multiplyScalar(R()<0.5?-1:1).addScaledVector(upv,-(0.3+R()*0.5)).normalize(); sh.len=dist*(0.12+R()*0.1); sh.dur=0.7+R()*0.6; sh.life=sh.dur; sh.speed=dist*(0.9+R()*0.6); }
    function update(dt,t){ starMat.uniforms.uTime.value=t; grp.rotation.y=t*0.004;
      nebs.forEach(([sp,op,o])=>{ sp.material.opacity=on?op*(0.85+0.15*Math.sin(t*0.25+o)):0; });
      dustGroups.forEach(dg=>{ dg.spin.rotation.y+=dt*dg.speed; dg.ring.material.opacity=on?0.13:0; dg.spin.visible=on; });
      if(on&&!reduced){ nextShot-=dt; if(nextShot<=0){ const f=shoot.find(s=>s.life<=0); if(f) spawn(f); nextShot=3+Math.random()*6; } }
      shoot.forEach(sh=>{ if(sh.life<=0){ sh.l.material.opacity=0; return; } sh.life-=dt; const k=1-sh.life/sh.dur; sh.p.addScaledVector(sh.d,sh.speed*dt);
        const a=sh.l.geometry.attributes.position; a.setXYZ(0,sh.p.x,sh.p.y,sh.p.z); a.setXYZ(1,sh.p.x-sh.d.x*sh.len,sh.p.y-sh.d.y*sh.len,sh.p.z-sh.d.z*sh.len); a.needsUpdate=true;
        sh.l.material.opacity=Math.sin(Math.PI*Math.min(1,k))*0.95; }); }
    return {update,setOn(b){ on=b; starMat.uniforms.uOn.value=1; },get on(){ return on; },shoot(){ const f=shoot.find(s=>s.life<=0)||shoot[0]; spawn(f); }};
  })();
  // camera rig
  const DEF={th:0.6,ph:1.05,r:980,t:new THREE.Vector3(0,0,0)};
  const V={th:DEF.th,ph:DEF.ph,r:DEF.r,t:DEF.t.clone(),T:{th:DEF.th,ph:DEF.ph,r:DEF.r,t:DEF.t.clone()}};
  const place=()=>{ cam.position.set(V.t.x+V.r*Math.sin(V.ph)*Math.sin(V.th),V.t.y+V.r*Math.cos(V.ph),V.t.z+V.r*Math.sin(V.ph)*Math.cos(V.th)); cam.lookAt(V.t); };
  function resize(){ const w=st.clientWidth,h=st.clientHeight; renderer.setSize(w,h,false); cam.aspect=w/Math.max(h,1); cam.updateProjectionMatrix(); }
  new ResizeObserver(()=>{ resize(); if(view==="bubble") drawBubble(); }).observe(st); resize();
  // interaction
  let drag=null, moved=0, hover=-1;
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("pointerdown",e=>{ drag={x:e.clientX,y:e.clientY,pan:e.button===2||e.shiftKey,id:e.pointerId}; moved=0; cv.classList.add("drag"); try{cv.setPointerCapture(e.pointerId);}catch(_){} });
  const pointers=new Map(); let pinch=null;
  cv.addEventListener("pointerdown",e=>{ pointers.set(e.pointerId,[e.clientX,e.clientY]); if(pointers.size===2){ const [a,b]=[...pointers.values()]; pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),r:V.T.r}; } });
  cv.addEventListener("pointermove",e=>{
    if(pointers.has(e.pointerId)) pointers.set(e.pointerId,[e.clientX,e.clientY]);
    if(pinch&&pointers.size===2){ const [a,b]=[...pointers.values()]; V.T.r=clampR(pinch.r*pinch.d/Math.max(20,Math.hypot(a[0]-b[0],a[1]-b[1]))); moved=99; return; }
    if(drag){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y; moved+=Math.abs(dx)+Math.abs(dy); drag.x=e.clientX; drag.y=e.clientY;
      if(drag.pan){ const s=V.r*0.0012; const right=new THREE.Vector3().setFromMatrixColumn(cam.matrix,0), up=new THREE.Vector3().setFromMatrixColumn(cam.matrix,1); V.T.t.addScaledVector(right,-dx*s).addScaledVector(up,dy*s); }
      else { V.T.th-=dx*0.005; V.T.ph=Math.min(2.9,Math.max(0.15,V.T.ph-dy*0.004)); } return; }
    const r=cv.getBoundingClientRect(); const i=pick(e.clientX-r.left,e.clientY-r.top); setHover(i,e.clientX-r.left,e.clientY-r.top); });
  const end=e=>{ pointers.delete(e.pointerId); if(pointers.size<2) pinch=null; cv.classList.remove("drag"); if(drag&&moved<6){ const r=cv.getBoundingClientRect(); const i=pick(e.clientX-r.left,e.clientY-r.top); if(i>=0){ openCard(i); flyToPoint(i,true); } else if(selected>=0) closeCard(); } drag=null; };
  cv.addEventListener("pointerup",end); cv.addEventListener("pointercancel",end);
  cv.addEventListener("pointerleave",()=>setHover(-1));
  const clampR=r=>Math.min(2600,Math.max(40,r));
  cv.addEventListener("wheel",e=>{ e.preventDefault(); V.T.r=clampR(V.T.r*Math.pow(1.0015,e.deltaY)); },{passive:false});
  $("#zi").onclick=()=>V.T.r=clampR(V.T.r/1.35); $("#zo").onclick=()=>V.T.r=clampR(V.T.r*1.35); $("#zr").onclick=resetView; $("#zfx").onclick=()=>{ SPACE.setOn(!SPACE.on); $("#zfx").setAttribute("aria-pressed",String(SPACE.on)); toast(SPACE.on?"Deep-space effects on":"Deep-space effects off (faster on older devices)"); };
  function resetView(){ V.T.th=DEF.th; V.T.ph=DEF.ph; V.T.r=DEF.r; V.T.t.copy(DEF.t); }
  document.addEventListener("keydown",e=>{ if(view!=="universe"||/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; const k=e.key;
    if(k==="ArrowLeft") V.T.th+=0.12; else if(k==="ArrowRight") V.T.th-=0.12; else if(k==="ArrowUp") V.T.ph=Math.max(0.15,V.T.ph-0.1); else if(k==="ArrowDown") V.T.ph=Math.min(2.9,V.T.ph+0.1);
    else if(k==="+"||k==="=") V.T.r=clampR(V.T.r/1.25); else if(k==="-") V.T.r=clampR(V.T.r*1.25); else if(k==="r"||k==="R") resetView(); else return; e.preventDefault(); });
  // screen-space picking
  const proj=new THREE.Vector3();
  function pick(x,y){ const w=st.clientWidth,h=st.clientHeight; let best=-1,bd=1e9; const f=h/(2*Math.tan(cam.fov*Math.PI/360));
    for(let i=0;i<N;i++){ if(!visible[i]) continue; proj.copy(world[i]).project(cam); if(proj.z>1) continue; const sx=(proj.x+1)/2*w, sy=(1-proj.y)/2*h; const dx=sx-x, dy=sy-y, d=dx*dx+dy*dy;
      const depth=world[i].distanceTo(cam.position); const pr=Math.max(7,Math.min(40,size[i]*(420/depth)*0.5)); if(d<pr*pr&&d<bd){ bd=d; best=i; } }
    return best; }
  function setHover(i,x,y){ hover=i; cv.classList.toggle("hov",i>=0); showTip(i,x,y); }
  // fly
  function flyToPoint(i,keepR){ const w=world[i]; V.T.t.copy(w); if(!keepR||V.T.r>260) V.T.r=reduced?V.T.r:160; }
  function flyToGalaxy(k){ const g=G[k]; V.T.t.copy(g.pos); V.T.r=Math.max(140,g.R*3.1); toast(PLAT[k].n+" · "+counts[k]+" programs"); }
  U={dbg(){ return {cam:cam.position.toArray().map(v=>+v.toFixed(1)),t:V.t.toArray().map(v=>+v.toFixed(1)),r:+V.r.toFixed(1),calls:renderer.info.render.calls,pts:renderer.info.render.points,active}; }, refresh(){ for(let i=0;i<N;i++) alpha[i]=visible[i]?1:0; aAttr.needsUpdate=true; },
     select(i){ /* handled by reticle in loop */ }, flyToPoint, flyToGalaxy, setActive(on){ active=on; },
     beginnerGlow(on){ begT=on?1:0; }, space:SPACE };
  let active=true, begT=0;
  // loop
  const clock=new THREE.Clock(), lp=new THREE.Vector3();
  let simT=null; U.__step=(n)=>{ simT=simT||0; for(let i=0;i<n;i++){ simT+=1/60; frame(1/60,simT); } };
  (function tick(){ requestAnimationFrame(tick); if(!active) return; const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime; frame(dt,t); })();
  function frame(dt,t){
    if(!drag&&!reduced&&selected<0) V.T.th+=dt*0.012;
    const k=1-Math.pow(0.0015,dt); V.th+=(V.T.th-V.th)*k; V.ph+=(V.T.ph-V.ph)*k; V.r+=(V.T.r-V.r)*k; V.t.lerp(V.T.t,k); place();
    SPACE.update(dt,t); mat.uniforms.uTime.value=t; mat.uniforms.uBeg.value+=(begT-mat.uniforms.uBeg.value)*k;
    platOrder.forEach(kk=>{ const g=G[kk]; g.neb.material.opacity=mat.uniforms.uBeg.value*0.5*(0.8+0.2*Math.sin(t*2)); });
    renderer.render(scene,cam);
    const w=st.clientWidth,h=st.clientHeight;
    platOrder.forEach(kk=>{ const lb=labels[kk]; lp.copy(G[kk].pos); lp.y+=G[kk].R*0.25+12; lp.project(cam); const vis=lp.z<1&&F.plat.has(kk);
      lb.style.display=vis?"block":"none"; lb.style.left=((lp.x+1)/2*w)+"px"; lb.style.top=((1-lp.y)/2*h)+"px"; lb.style.opacity=Math.max(0.25,Math.min(1,(V.r-90)/400)); });
    const ret=(id,i)=>{ const r=$(id); if(i<0||!visible[i]){ r.style.display="none"; return; } lp.copy(world[i]).project(cam); if(lp.z>1){ r.style.display="none"; return; } r.style.display="block"; r.style.left=((lp.x+1)/2*w)+"px"; r.style.top=((1-lp.y)/2*h)+"px"; };
    ret("#hov",hover); ret("#sel",selected);
  }
  return U;
}

/* ---------- start here ---------- */
function startHere(){ $("#intro").hidden=true; try{ localStorage.setItem("bu-intro","1"); }catch(e){}
  if(!F.beginner){ F.beginner=true; $("#beginner").setAttribute("aria-checked","true"); applyFilters(); }
  if(U){ U.beginnerGlow(true); setView("universe"); const best=P.map((p,i)=>i).filter(i=>visible[i]).sort((a,b)=>P[b].s-P[a].s)[0]; if(best!=null){ U.flyToPoint(best); openCard(best); } }
  else setView("list");
  toast("Showing beginner-friendly programs: safe harbor, clear policy, wide scope"); }
$("#start").onclick=startHere; $("#go").onclick=startHere;
$("#explore").onclick=()=>{ $("#intro").hidden=true; try{ localStorage.setItem("bu-intro","1"); }catch(e){} };
$("#beginner").addEventListener("click",()=>{ if(U) U.beginnerGlow(F.beginner); });


/* ---------- scope downloads (Chaos-style) ---------- */
const slug=n=>n.toLowerCase().normalize("NFKD").replace(/[^\w]+/g,"_").replace(/^_+|_+$/g,"")||"program";
const STAMP=()=>RAW.generated||new Date().toISOString().slice(0,10);
function saveFile(name,content,type){ try{ const blob=content instanceof Blob?content:new Blob([content],{type:type||"text/plain"}); const a=el("a",{href:URL.createObjectURL(blob),download:name}); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); toast("Downloaded "+name); }
  catch(e){ if(typeof content==="string"&&navigator.clipboard){ navigator.clipboard.writeText(content).then(()=>toast("Download blocked here, copied to clipboard instead")); } else toast("Download blocked in this view"); } }
const chaosObj=p=>({name:p.n,url:p.u,bounty:p.b===1,swag:!!p.sw,domains:p.roots.length?p.roots:p.dm.filter(h=>!h.startsWith("*.")),platform:PLAT[p.p].n,tracks:[...p.cat].map(c=>TRACK[c]&&TRACK[c].n).filter(Boolean),safe_harbor:SHN[p.sh],beginner_score:p.s,max_reward:p.mx||null,
  in_scope:p.items.map(it=>({type:KIND[it.k].s,target:it.t,...(it.d?{note:it.d}:{})})),out_of_scope:p.out.map(it=>({type:KIND[it.k]?KIND[it.k].s:"other",target:it.t})),out_of_scope_total:p.oc});
const csvCell=v=>{ v=String(v==null?"":v); return /[",\n]/.test(v)||/^[=+\-@]/.test(v)?'"'+v.replace(/^([=+\-@])/,"'$1").replace(/"/g,'""')+'"':v; };
const HEAD="# Scope list from community datasets ("+"snapshot %D).\n# Wildcards like *.example.com cover every subdomain; find them with recon, then re-check the out-of-scope list.\n# Listing is not permission: confirm every asset against the live policy before testing.\n";
function scopeTxt(p){ let t=HEAD.replace("%D",STAMP())+"# Program: "+p.n+"\n# Policy: "+p.u+"\n";
  KORDER.split("").forEach(k=>{ const l=p.items.filter(it=>it.k===k); if(l.length) t+="\n## IN SCOPE: "+KIND[k].n+"\n"+l.map(it=>it.t+(it.d?"    # "+it.d:"")).join("\n")+"\n"; });
  if(p.oc) t+="\n## OUT OF SCOPE"+(p.oc>p.out.length?" (first "+p.out.length+" of "+p.oc+", see policy)":"")+"\n"+p.out.map(it=>it.t).join("\n")+"\n"; return t; }
const csvOf=(rows)=>rows.map(r=>r.map(csvCell).join(",")).join("\n")+"\n";
function scopeBox(p){
  if(!p.d) return null;
  const f=slug(p.n), hasC=p.kc.S||p.kc.B, roots=p.roots, hosts=p.dm.filter(h=>!h.startsWith("*."));
  const cmd=roots.length?"subfinder -dL "+f+"-roots.txt -all -silent | httpx -silent -o "+f+"-live.txt":hosts.length?"httpx -l "+f+"-hosts.txt -silent -title -tech-detect":hasC?"# open each contract on the explorer, then clone the repo listed in the policy":"# read each asset's notes on the policy page first";
  const btn=(label,fn)=>el("button",{className:"btn sm",onclick:fn},label);
  return el("div",{className:"scopebox"},
    el("div",{className:"f-h"},"Download scope"),
    el("div",{className:"row"},
      btn("⬇ Full scope .txt",()=>saveFile(f+"-scope.txt",scopeTxt(p))),
      roots.length?btn("⬇ Wildcard roots ("+roots.length+")",()=>saveFile(f+"-roots.txt",roots.join("\n")+"\n")):null,
      hosts.length?btn("⬇ Hosts ("+hosts.length+")",()=>saveFile(f+"-hosts.txt",hosts.join("\n")+"\n")):null,
      hasC?btn("⬇ Contracts .csv",()=>saveFile(f+"-contracts.csv",csvOf([["type","target","note"],...p.items.filter(it=>it.k==="S"||it.k==="B").map(it=>[KIND[it.k].s,it.t,it.d])]),"text/csv")):null,
      btn("⬇ .json",()=>saveFile(f+".json",JSON.stringify(chaosObj(p),null,2)+"\n","application/json"))),
    el("div",{className:"cmd"},el("code",{},cmd),el("button",{className:"btn sm",title:"Copy command",onclick:()=>{ navigator.clipboard&&navigator.clipboard.writeText(cmd).then(()=>toast("Command copied")); }},"⧉")),
    el("p",{className:"muted"},"The .txt keeps in-scope and out-of-scope together so the exclusions travel with your target list."));
}
/* minimal ZIP writer (stored, no compression) — one .txt per program, like Chaos */
const CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return b=>{ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=t[(c^b[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }; })();
function makeZip(files){ const enc=new TextEncoder(), parts=[], central=[]; let off=0;
  const u16=v=>[v&255,(v>>>8)&255], u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  files.forEach(([name,text])=>{ const nb=enc.encode(name), db=enc.encode(text), crc=CRC(db);
    const common=[...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)];
    const local=new Uint8Array([...u32(0x04034b50),...common]); parts.push(local,nb,db);
    central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...common,...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);
    off+=local.length+nb.length+db.length; });
  const csize=central.reduce((a,b)=>a+b.length,0);
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(csize),...u32(off),...u16(0)]);
  return new Blob([...parts,...central,end],{type:"application/zip"}); }
function filtered(){ return P.filter((p,i)=>visible[i]); }
function buildDlMenu(){ const m=$("#dlMenu"); m.innerHTML=""; const ps=filtered(), withD=ps.filter(p=>p.d);
  const roots=[...new Set(ps.flatMap(p=>p.roots))].sort(), hosts=[...new Set(ps.flatMap(p=>p.dm.filter(h=>!h.startsWith("*."))))].sort(), contracts=ps.flatMap(p=>p.items.filter(it=>it.k==="S"||it.k==="B").map(it=>[p.n,KIND[it.k].s,it.t,it.d,p.u]));
  const ai=ps.flatMap(p=>p.cat.includes("i")?p.items.filter(it=>it.k==="L"||(p.aiw&&it.t===p.aiw)).map(it=>[p.n,it.t,p.u]).concat(p.items.some(it=>it.k==="L"||it.t===p.aiw)?[]:[[p.n,p.aiw||"",p.u]]):[]);
  const tag=(F.beginner?"beginner-":"")+([...F.track].map(t=>TRACK[t].n.toLowerCase().replace(/\W+/g,"")).join("-")||""), base="bounty-scopes-"+(tag?tag+"-":"")+STAMP();
  const it=(label,info,fn,dis)=>{ const b=el("button",{className:"it",role:"menuitem",disabled:!!dis,onclick:()=>{ fn(); m.classList.remove("on"); $("#dlAll").setAttribute("aria-expanded","false"); }},label,el("small",{},info)); return b; };
  m.append(el("h4",{},"Download scopes"),
    el("p",{},"Uses your current filters: "+ps.length.toLocaleString()+" programs, "+withD.length.toLocaleString()+" with a listed scope ("+withD.reduce((a,p)=>a+p.d,0).toLocaleString()+" assets). Always confirm against the live policy."),
    it("Wildcard roots (feed to subfinder)",roots.length.toLocaleString()+" · .txt",()=>saveFile(base+"-roots.txt",HEAD.replace("%D",STAMP())+roots.join("\n")+"\n"),!roots.length),
    it("Exact hosts in scope",hosts.length.toLocaleString()+" · .txt",()=>saveFile(base+"-hosts.txt",HEAD.replace("%D",STAMP())+hosts.join("\n")+"\n"),!hosts.length),
    it("One file per program (in + out of scope)",withD.length+" files · .zip",()=>{ const used=new Set(); const files=withD.map(p=>{ let f=slug(p.n), k=f, n=2; while(used.has(k)) k=f+"_"+(n++); used.add(k); return [k+".txt",scopeTxt(p)]; });
      files.push(["README.txt","Bounty Universe scope export, "+STAMP()+"\nSources: "+RAW.sources.map(s=>s.name+" ("+s.license+")").join("; ")+"\nListing is not permission. Read each program's live policy before testing.\n"]); saveFile(base+".zip",makeZip(files)); },!withD.length),
    it("Web3: smart contracts & chains",contracts.length.toLocaleString()+" · .csv",()=>saveFile(base+"-web3.csv",csvOf([["program","type","target","note","policy"],...contracts]),"text/csv"),!contracts.length),
    it("AI security targets",ai.length.toLocaleString()+" · .csv",()=>saveFile(base+"-ai.csv",csvOf([["program","ai_target","policy"],...ai]),"text/csv"),!ai.length),
    it("Programs, full JSON",ps.length+" programs · .json",()=>saveFile(base+".json",JSON.stringify({generated:STAMP(),sources:RAW.sources,programs:ps.map(chaosObj)})+"\n","application/json")),
    it("Programs table",ps.length+" rows · .csv",()=>saveFile(base+".csv",csvOf([["name","platform","tracks","type","safe_harbor","beginner_score","max_reward","in_scope","out_of_scope","policy_url"],...ps.map(p=>[p.n,PLAT[p.p].n,[...p.cat].map(c=>TRACK[c]&&TRACK[c].n).filter(Boolean).join(" "),TYPE[p.b].n,SHN[p.sh],p.s,p.mx||"",p.d,p.oc,p.u])]),"text/csv")));
}
$("#dlAll").onclick=e=>{ e.stopPropagation(); const m=$("#dlMenu"), on=!m.classList.contains("on"); if(on) buildDlMenu(); m.classList.toggle("on",on); $("#dlAll").setAttribute("aria-expanded",String(on)); };
document.addEventListener("click",e=>{ if(!e.target.closest(".dlwrap")){ $("#dlMenu").classList.remove("on"); $("#dlAll").setAttribute("aria-expanded","false"); } });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ $("#dlMenu").classList.remove("on"); $("#dlAll").setAttribute("aria-expanded","false"); } });

/* ---------- boot ---------- */
buildFilters();
try{ U=buildUniverse(); }catch(err){ console.error(err); U=null; $("#noweb").style.display="flex"; $("#gl").style.display="none"; }
applyFilters();
let seen=false; try{ seen=!!localStorage.getItem("bu-intro"); }catch(e){}
if(!seen) $("#intro").hidden=false;
if(!U) setView("list");
window.__BU={makeZip,buildDlMenu,scopeTxt,P,F,openCard,setView,applyFilters,startHere,get U(){return U;}};
}

fetch("/assets/universe/programs.json",{cache:"default"}).then(r=>{ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
  .then(RAW=>{ document.getElementById("loading").hidden=true; bootUniverse(RAW); })
  .catch(err=>{ console.error(err); const l=document.getElementById("loading"); l.textContent="Couldn't load the program data. Please refresh."; });

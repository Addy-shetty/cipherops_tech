/* cipherops_tech — AI & LLM course app: contents, routing, lesson view, code, quiz, search, progress */
"use strict";
(function(){
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
function h(tag,attrs,...kids){ const e=document.createElement(tag); attrs=attrs||{};
  for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="style") e.style.cssText=v; else if(k==="className") e.className=v; else if(k.startsWith("on")) e[k]=v; else if(k==="html") e.innerHTML=v; else e.setAttribute(k,v===true?"":v); }
  kids.flat(Infinity).forEach(c=>{ if(c==null||c===false) return; e.append(c.nodeType?c:document.createTextNode(String(c))); }); return e; }
function toast(m){ const t=$("#toast"); t.textContent=m; t.classList.add("on"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("on"),2400); }
function rich(s){ const out=[]; const re=/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g; let last=0,m;
  while((m=re.exec(s))){ if(m.index>last) out.push(s.slice(last,m.index)); const t=m[0];
    out.push(t.startsWith("**")?h("strong",{},t.slice(2,-2)):t.startsWith("`")?h("code",{},t.slice(1,-1)):h("em",{},t.slice(1,-1))); last=m.index+t.length; }
  if(last<s.length) out.push(s.slice(last)); return out; }

/* ---------- storage (shared cipherops namespace) ---------- */
const KEY={progress:"cipherops:ai:progress",last:"cipherops:ai:last",prefs:"cipherops:ai:prefs",recent:"cipherops:ai:recent"};
const load=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(k)); return v==null?d:v; }catch(e){ return d; } };
const store=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
let P=load(KEY.progress,{}); /* { lessonId: {max, done, quiz:{i:true}} } */
const prog=id=>P[id]||(P[id]={max:0,done:false,quiz:{}});
const saveP=()=>store(KEY.progress,P);

const L=AI_LESSONS, byId=Object.fromEntries(L.map(l=>[l.id,l]));
const modOf=l=>AI_MODULES.find(m=>m.id===l.mod);
const lessonsIn=m=>L.filter(l=>l.mod===m.id);
const LEVEL={Beginner:"basic",Intermediate:"intermediate",Advanced:"advanced"};
const CROSS={pi:"Prompt injection",guard:"Guardrails & defence in depth",hidden:"Hidden context exposure",jail:"Jailbreaks"};

/* ---------- theme (synced with the main site) ---------- */
const applyTheme=t=>{ document.documentElement.setAttribute("data-theme",t); const b=$("#themeBtn"); b.textContent=t==="dark"?"☀":"☾"; b.setAttribute("aria-label",t==="dark"?"Switch to light theme":"Switch to dark theme"); try{ localStorage.setItem("cipherops-theme",t); }catch(e){} };
let theme="light"; try{ theme=localStorage.getItem("cipherops-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); }catch(e){}
applyTheme(theme); $("#themeBtn").onclick=()=>applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");

/* ---------- progress UI ---------- */
function renderProgress(){
  const done=L.filter(l=>prog(l.id).done).length, pct=Math.round(done/L.length*100);
  $("#aiCount").textContent=done+"/"+L.length; $("#aiBar").style.width=pct+"%";
  $("#progPct").textContent=pct+"%"; $("#progBar").style.width=pct+"%";
  $("#progTxt").textContent=done?done+" of "+L.length+" lessons complete":"Finish a walkthrough to complete a lesson.";
}
let current=null;
function renderToc(){
  const toc=$("#toc"); toc.innerHTML="";
  AI_MODULES.forEach(m=>{ const ls=lessonsIn(m), d=ls.filter(l=>prog(l.id).done).length;
    const open=current?byId[current].mod===m.id:m.n===1;
    const det=h("details",{className:"ai-mod",open:open},h("summary",{},h("span",{className:"ai-mn"},String(m.n)),h("span",{className:"ai-mt"},m.title),h("span",{className:"mono ai-mc"},d+"/"+ls.length)),
      h("ol",{},ls.map(l=>{ const p=prog(l.id); return h("li",{},h("a",{href:"#/"+l.id,className:(l.id===current?"cur ":"")+(p.done?"done":""),"aria-current":l.id===current?"page":null},
        h("span",{className:"ai-chk","aria-hidden":"true"},p.done?"✓":""),h("span",{},l.title),h("small",{className:"mono"},l.min+"m"))); })));
    toc.append(det); });
}

/* ---------- code highlighting (tiny, safe: builds text nodes) ---------- */
const KW={python:/^(import|from|as|def|return|if|elif|else|for|in|while|try|except|raise|with|await|async|not|and|or|is|None|True|False|class|lambda|pass|break|continue|print)$/,
  json:/^(true|false|null)$/, bash:/^(curl|export|echo)$/, text:/^$/};
function highlight(src,lang){
  const pre=h("code",{className:"lang-"+lang}); if(lang==="text"){ pre.textContent=src; return pre; }
  const re=lang==="json"?/("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|(\b[a-z_]+\b)|([\s\S])/g
    :/(#[^\n]*)|("""[\s\S]*?"""|f?"(?:[^"\\\n]|\\.)*"|f?'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_][\w]*\b)(\s*\()?|([\s\S])/g;
  let m, buf=""; const flush=()=>{ if(buf){ pre.append(buf); buf=""; } }; const add=(cls,t)=>{ flush(); pre.append(h("span",{className:cls},t)); };
  while((m=re.exec(src))){
    if(lang==="json"){ if(m[1]){ add(m[2]?"c-key":"c-str",m[1]); if(m[2]) buf+=m[2]; } else if(m[3]) add("c-num",m[3]); else if(m[4]&&KW.json.test(m[4])) add("c-kw",m[4]); else buf+=m[0]; continue; }
    if(m[1]&&lang!=="bash") add("c-com",m[1]); else if(m[1]) buf+=m[1];
    else if(m[2]) add("c-str",m[2]); else if(m[3]) add("c-num",m[3]);
    else if(m[4]){ if((KW[lang]||KW.text).test(m[4])) add("c-kw",m[4]); else if(m[5]) add("c-fn",m[4]); else buf+=m[4]; if(m[5]) buf+=m[5]; }
    else buf+=m[0]; }
  flush(); return pre; }
function codeBlock(c){
  const copy=h("button",{className:"btn sm ghost",onclick:async()=>{ try{ await navigator.clipboard.writeText(c.src); copy.textContent="Copied ✓"; setTimeout(()=>copy.textContent="Copy",1500); }catch(e){ toast("Select the code and copy it manually"); } }},"Copy");
  return h("figure",{className:"ai-code card"},h("figcaption",{},h("span",{className:"mono ai-lang"},c.lang),h("span",{},c.title),copy),
    h("pre",{className:"ai-pre",tabindex:"0"},highlight(c.src,c.lang)),
    c.out?h("div",{className:"ai-out"},h("span",{className:"mono"},"Example output"),h("pre",{},c.out)):null); }

/* ---------- lesson view ---------- */
let walker=null;
function home(){
  current=null; if(walker){ walker.destroy(); walker=null; } renderToc();
  const M=$("#lesson"); M.innerHTML="";
  const next=L.find(l=>!prog(l.id).done)||L[0], last=load(KEY.last,null);
  M.append(h("section",{className:"ai-hero"},
    h("div",{className:"eyebrow"},"cipherops_tech · AI & LLM course"),
    h("h1",{},"Watch a prompt become an answer, step by step."),
    h("p",{className:"lede"},"23 animated lessons in six modules. Follow tokens through a model, build with the API, add retrieval and agents, then learn how attackers abuse LLM apps and how to stop them."),
    h("div",{className:"row ctas"},h("a",{className:"btn primary",href:"#/"+(last&&byId[last]?last:next.id)},last&&byId[last]?"Continue: "+byId[last].title+" →":"Start: "+next.title+" →"),h("a",{className:"btn",href:"#/prompt-injection"},"Jump to Security →")),
    h("p",{className:"muted"},"Keys inside a lesson: ← → step · 1–9 jump · R replay · Space pause · F full screen · Ctrl K search")));
  const grid=h("div",{className:"ai-mods"});
  AI_MODULES.forEach(m=>{ const ls=lessonsIn(m), d=ls.filter(l=>prog(l.id).done).length;
    grid.append(h("article",{className:"card ai-modcard"},h("div",{className:"eyebrow"},"Module "+m.n+" · "+d+"/"+ls.length),h("h3",{},m.title),h("p",{className:"muted"},m.blurb),
      h("ol",{},ls.map(l=>h("li",{},h("a",{href:"#/"+l.id},(prog(l.id).done?"✓ ":"")+l.title),h("span",{className:"tag "+LEVEL[l.level]},l.level))))));});
  M.append(grid);
  document.title="AI & LLM — how models work, how to build with them, how to secure them · cipherops_tech";
}
function openLesson(id,step,focus){
  const les=byId[id]; if(!les){ home(); return; }
  current=id; store(KEY.last,id); renderToc(); closeSide();
  if(walker){ walker.destroy(); walker=null; }
  const m=modOf(les), idx=L.indexOf(les), mi=lessonsIn(m).indexOf(les), p=prog(id);
  const M=$("#lesson"); M.innerHTML="";
  M.append(h("nav",{className:"crumb","aria-label":"Breadcrumb"},h("a",{href:"#/"},"AI & LLM")," / Module "+m.n+": "+m.title+" / Lesson "+(mi+1)+" of "+lessonsIn(m).length));
  M.append(h("header",{className:"ai-lh"},h("h1",{},les.title),
    h("div",{className:"meta"},h("span",{className:"tag "+LEVEL[les.level]},les.level),h("span",{className:"tag"},"⏱ "+les.min+" min"),h("span",{className:"tag"},les.scene.steps.length+" steps"),p.done?h("span",{className:"done-badge"},"✓ Completed"):null),
    h("p",{className:"lede"},les.desc)));
  const host=h("div",{className:"walkhost"}); M.append(host);
  const start=step!=null?step:0;
  walker=WALK.render({id:"ai-"+id,color:AC.m},les.scene,host,{start,
    onStep:(i,max)=>{ const pp=prog(id); if(max>pp.max){ pp.max=max; saveP(); } try{ history.replaceState(null,"","#/"+id+(i?"/"+(i+1):"")); }catch(e){} },
    onComplete:()=>{ const pp=prog(id); if(!pp.done){ pp.done=true; saveP(); renderProgress(); renderToc(); toast("Lesson complete ✓"); } },
    onDone:()=>{ const q=$("#quiz"); if(q){ q.scrollIntoView({behavior:"smooth",block:"start"}); const b=$("button",q); if(b) b.focus({preventScroll:true}); } },
    doneLabel:"Check yourself ↓"});
  if(les.code&&les.code.length) M.append(h("section",{className:"ai-sec"},h("h2",{},"Try it in code"),les.code.map(codeBlock)));
  // quiz
  const qs=h("section",{className:"ai-sec",id:"quiz"},h("h2",{},"Check yourself"));
  les.quiz.forEach((Q,qi)=>{ const fb=h("div",{className:"qfb",role:"status"}); const opts=h("div",{className:"opts"});
    Q.o.forEach((o,k)=>opts.append(h("button",{className:"opt",onclick:e=>{ const ok=k===Q.a; e.currentTarget.classList.add(ok?"right":"wrong");
      if(ok){ $$("button",opts).forEach(b=>b.disabled=true); fb.textContent="✓ "+Q.why; const pp=prog(id); pp.quiz[qi]=true; saveP(); } else { e.currentTarget.disabled=true; fb.textContent="Not quite. Have another look at the walkthrough."; } }},o)));
    if(p.quiz&&p.quiz[qi]){ $$("button",opts).forEach((b,k)=>{ b.disabled=true; if(k===Q.a) b.classList.add("right"); }); fb.textContent="✓ "+Q.why; }
    qs.append(h("div",{className:"card dashed quiz"},h("div",{className:"eyebrow"},"Question "+(qi+1)+" of "+les.quiz.length),h("h4",{},Q.q),opts,fb)); });
  M.append(qs);
  if(les.cross&&CROSS[les.cross]) M.append(h("div",{className:"callout"},h("span",{"aria-hidden":"true"},"🛡"),h("span",{},"Learn to attack and defend this hands-on in the security curriculum: ",h("a",{href:"/#"+les.cross},CROSS[les.cross]+" →"))));
  if(les.links&&les.links.length) M.append(h("section",{className:"ai-sec"},h("div",{className:"eyebrow",style:"margin-bottom:10px"},"Go deeper"),h("div",{className:"golinks"},les.links.map(([t,u])=>h("a",{href:u,target:"_blank",rel:"noopener"},t+" ↗")))));
  const prev=L[idx-1], next=L[idx+1];
  M.append(h("nav",{className:"rfoot","aria-label":"Lesson navigation"},
    prev?h("a",{className:"btn sm",href:"#/"+prev.id},"← "+prev.title):h("span",{}),h("span",{className:"spacer"}),
    next?h("a",{className:"btn sm primary",href:"#/"+next.id},next.title+" →"):h("a",{className:"btn sm",href:"#/"},"Course home")));
  document.title=les.title+" · AI & LLM · cipherops_tech";
  if(focus){ window.scrollTo({top:0}); M.focus({preventScroll:true}); }
}

/* ---------- routing: #/lesson-id or #/lesson-id/step ---------- */
function route(focus){ const m=(location.hash||"").match(/^#\/([\w-]+)?(?:\/(\d+))?/);
  if(!m||!m[1]){ home(); if(focus) window.scrollTo({top:0}); return; }
  if(m[1]===current&&walker){ if(m[2]) walker.setStep(+m[2]-1); return; }
  openLesson(m[1],m[2]?Math.max(0,+m[2]-1):null,focus); }
window.addEventListener("hashchange",()=>route(true));

/* ---------- sidebar on small screens ---------- */
const side=$("#side"), sbtn=$("#sideToggle");
function closeSide(){ side.classList.remove("open"); sbtn.setAttribute("aria-expanded","false"); }
sbtn.onclick=()=>{ const o=!side.classList.contains("open"); side.classList.toggle("open",o); sbtn.setAttribute("aria-expanded",String(o)); };

/* ---------- search ---------- */
const S=$("#search"), SI=$("#searchIn"), SR=$("#searchRes"); let sel=0, hits=[];
const IDX=L.flatMap(l=>[{l,step:null,title:l.title,text:(l.title+" "+l.desc+" "+modOf(l).title).toLowerCase()},
  ...l.scene.steps.map((s,i)=>({l,step:i,title:s.t,text:(s.t+" "+s.short+" "+s.p.join(" ")+" "+(s.k||"")).toLowerCase().replace(/[*`]/g,"")}))]);
function search(q){ q=q.trim().toLowerCase(); SR.innerHTML=""; sel=0;
  if(!q){ const rec=load(KEY.recent,[]); hits=rec.map(r=>IDX.find(x=>x.l.id===r.id&&x.step===r.step)).filter(Boolean);
    if(hits.length) SR.append(h("div",{className:"ai-sh mono"},"Recent")); else { hits=L.slice(0,6).map(l=>IDX.find(x=>x.l===l&&x.step===null)); SR.append(h("div",{className:"ai-sh mono"},"Start here")); } }
  else { const words=q.split(/\s+/).filter(Boolean);
    hits=IDX.map(x=>{ let sc=0; for(const w of words){ const i=x.text.indexOf(w); if(i<0) return null; sc+=(x.title.toLowerCase().includes(w)?5:1)+(i<40?1:0); } if(x.step===null) sc+=2; return {x,sc}; })
      .filter(Boolean).sort((a,b)=>b.sc-a.sc).slice(0,12).map(r=>r.x); }
  if(!hits.length){ SR.append(h("p",{className:"muted",style:"padding:12px"},"No matches. Try 'tokens', 'RAG' or 'injection'.")); return; }
  hits.forEach((x,i)=>SR.append(h("button",{className:"sres"+(i===0?" first":""),role:"option","aria-selected":i===0?"true":"false",onclick:()=>go(x)},
    h("span",{},h("b",{},x.title),h("br",{}),h("small",{className:"muted"},x.step===null?"Lesson · "+modOf(x.l).title:"Step "+(x.step+1)+" · "+x.l.title))))); }
function mark(){ $$(".sres",SR).forEach((b,i)=>{ b.classList.toggle("first",i===sel); b.setAttribute("aria-selected",String(i===sel)); if(i===sel) b.scrollIntoView({block:"nearest"}); }); }
function go(x){ const rec=load(KEY.recent,[]).filter(r=>!(r.id===x.l.id&&r.step===x.step)); rec.unshift({id:x.l.id,step:x.step}); store(KEY.recent,rec.slice(0,6));
  closeSearch(); location.hash="#/"+x.l.id+(x.step?"/"+(x.step+1):""); if(x.l.id===current&&walker) walker.setStep(x.step||0); }
let lastFocus=null;
function openSearch(){ lastFocus=document.activeElement; S.hidden=false; SI.value=""; search(""); SI.focus(); }
function closeSearch(){ S.hidden=true; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
$("#searchBtn").onclick=openSearch;
SI.oninput=e=>search(e.target.value);
SI.onkeydown=e=>{ if(e.key==="ArrowDown"){ sel=Math.min(hits.length-1,sel+1); mark(); e.preventDefault(); } else if(e.key==="ArrowUp"){ sel=Math.max(0,sel-1); mark(); e.preventDefault(); }
  else if(e.key==="Enter"&&hits[sel]){ go(hits[sel]); } else if(e.key==="Escape") closeSearch(); e.stopPropagation(); };
S.onclick=e=>{ if(e.target===S) closeSearch(); };
document.addEventListener("keydown",e=>{ const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k")||(e.key==="/"&&!typing)){ e.preventDefault(); e.stopImmediatePropagation(); S.hidden?openSearch():closeSearch(); }
  else if(e.key==="Escape"&&!S.hidden) closeSearch(); },true);

/* ---------- boot ---------- */
renderProgress(); route(false);
window.__AI={L,P,openLesson,route};
})();

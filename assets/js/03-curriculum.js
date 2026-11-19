/* cipherops_tech — 03-curriculum.js */
const LESSONS=MODULES.flatMap((m,mi)=>m.lessons.map((l,li)=>({...l,mod:m,mi,li})));
const TOTAL=LESSONS.length;
const LEVEL_NAME={basic:"Basic",intermediate:"Intermediate",advanced:"Advanced"};

/* progress */
const done=new Set(); let current=LESSONS[0].id, levelFilter="all", openMods=new Set(["basics"]);
try{ JSON.parse(localStorage.getItem("cipherops-progress")||"[]").forEach(id=>done.add(id)); }catch(e){}
const save=()=>{ try{ localStorage.setItem("cipherops-progress",JSON.stringify([...done])); }catch(e){} };

function renderHeaderProgress(){ const pct=Math.round(done.size/TOTAL*100); $("#hdrCount").textContent=done.size+"/"+TOTAL; $("#hdrBar").style.width=pct+"%"; }
function renderStrip(){
  const s=$("#modstrip"); s.innerHTML=""; const cur=LESSONS.find(l=>l.id===current).mod.id;
  MODULES.forEach((m,i)=>{ const n=m.lessons.filter(l=>done.has(l.id)).length;
    s.append(el("button",{className:"modchip","aria-current":String(cur===m.id),onclick:()=>openLesson(m.lessons[0].id,true)},
      el("span",{className:"c"},String(i+1).padStart(2,"0")+" · "+n+"/"+m.lessons.length), el("span",{className:"t"},m.title),
      el("div",{className:"bar",style:"height:5px"},el("i",{style:"width:"+(n/m.lessons.length*100)+"%"})))); });
}
function renderSidebar(){
  const sb=$("#sidebar"); sb.innerHTML="";
  const pct=Math.round(done.size/TOTAL*100);
  sb.append(el("div",{className:"overall"},
    el("div",{className:"row"},el("span",{},"Your progress"),el("span",{},done.size+" of "+TOTAL+" · "+pct+"%")),
    el("div",{className:"bar"},el("i",{style:"width:"+pct+"%"})),
    el("div",{className:"filters",role:"group","aria-label":"Filter by level"}, ["all","basic","intermediate","advanced"].map(k=>el("button",{"aria-pressed":String(levelFilter===k),onclick:()=>{levelFilter=k;renderSidebar();}}, k==="all"?"All levels":LEVEL_NAME[k])))));
  MODULES.forEach((m,i)=>{
    const n=m.lessons.filter(l=>done.has(l.id)).length, open=openMods.has(m.id), all=n===m.lessons.length;
    const wrap=el("div",{className:"mod"+(all?" done":"")});
    const head=el("button",{"aria-expanded":String(open),onclick:()=>{ open?openMods.delete(m.id):openMods.add(m.id); renderSidebar(); }},
      el("span",{className:"num"},all?"✓":String(i+1)), el("span",{},el("span",{className:"mt"},m.title)), el("span",{className:"mc"},n+"/"+m.lessons.length),
      el("span",{className:"mini"},el("i",{style:"width:"+(n/m.lessons.length*100)+"%"})));
    wrap.append(head);
    if(open){ const ul=el("ul",{className:"lessons"});
      m.lessons.filter(l=>levelFilter==="all"||l.level===levelFilter).forEach(l=>ul.append(el("li",{},el("button",{"aria-current":String(l.id===current),onclick:()=>openLesson(l.id,false)},
        el("span",{className:"check"+(done.has(l.id)?" on":"")},"✓"), l.title, el("span",{className:"lvl"},LEVEL_NAME[l.level].slice(0,3).toUpperCase())))));
      if(!ul.children.length) ul.append(el("li",{className:"muted",style:"font-size:14px;padding:6px 8px"},"No "+LEVEL_NAME[levelFilter]+" lessons here."));
      wrap.append(ul); }
    sb.append(wrap);
  });
}
const WSTEP={};
function renderReader(){
  const L=LESSONS.find(l=>l.id===current), R=$("#reader"); R.innerHTML="";
  const idx=LESSONS.indexOf(L);
  R.append(el("div",{className:"crumb"},"Module "+(L.mi+1)+" · "+L.mod.title+" · Lesson "+(L.li+1)+" of "+L.mod.lessons.length));
  R.append(el("h2",{},L.title));
  R.append(el("div",{className:"meta"}, el("span",{className:"tag "+L.level},LEVEL_NAME[L.level]), el("span",{className:"tag"},"⏱ "+L.min+" min"), done.has(L.id)?el("span",{className:"done-badge"},"✓ Completed"):null));
  if(typeof LESSON_SCENES!=="undefined"&&LESSON_SCENES[L.id]&&typeof WALK!=="undefined"){
    const host=el("div",{className:"walkhost lwalk"});
    R.append(el("div",{className:"lw-head"},el("span",{className:"eyebrow"},"Animated walkthrough"),el("span",{className:"muted lw-hint"},"Click inside, then use ← → to step")),host);
    try{ WALK.render({id:"lesson-"+L.id,color:"#94A3B8"},LESSON_SCENES[L.id],host,{scopedKeys:true,start:WSTEP[L.id]||0,
      onStep:i=>{ WSTEP[L.id]=i; },doneLabel:"Take the quick check ↓",
      onDone:()=>{ const q=R.querySelector(".quiz"); if(q){ q.scrollIntoView({behavior:reduced?"auto":"smooth",block:"center"}); const b=q.querySelector("button"); if(b) b.focus({preventScroll:true}); } },
      keyHint:"← → step · 1–9 jump · R replay · Space pause · F full screen (click the diagram first)"}); }catch(err){ console.error(err); }
    R.append(el("div",{className:"eyebrow",style:"margin:18px 0 6px"},"In short")); }
  L.body.forEach(p=>R.append(el("p",{},p)));
  if(L.callout) R.append(el("div",{className:"callout warn"},el("span",{"aria-hidden":"true"},"✋"),el("span",{},L.callout)));
  if(L.example) R.append(el("div",{},el("div",{className:"eyebrow",style:"margin-bottom:8px"},"Example"),el("pre",{className:"code"},L.example)));
  R.append(el("div",{},el("div",{className:"eyebrow",style:"margin-bottom:10px"},"Key ideas"),el("ul",{className:"keys"},L.keys.map(k=>el("li",{},el("span",{},k))))));
  if(L.lab||L.cheat){ const lab=L.lab&&LABS.find(x=>x.id===L.lab), ch=L.cheat&&CHEATS.find(x=>x.id===L.cheat);
    R.append(el("div",{},el("div",{className:"eyebrow",style:"margin-bottom:10px"},"Practise"),el("div",{className:"practice"},
      lab?el("button",{className:"btn sm",onclick:()=>openLabView(lab.id,true)},"⚑ Lab: "+lab.title+(LP.solved[lab.id]!=null?" ✓":" · "+lab.points+" pts")):null,
      ch?el("button",{className:"btn sm",onclick:()=>openCheat(ch.id)},"⧉ Cheat sheet: "+ch.title):null))); }
  { const AIX={llmapps:"prompt-to-response",pi:"prompt-injection",jail:"jailbreaks",hidden:"data-leakage",rag:"how-rag-works",agency:"what-is-agent",guard:"jailbreaks"};
    if(AIX[L.id]) R.append(el("div",{className:"callout"},el("span",{"aria-hidden":"true"},"🧠"),el("span",{},"See how LLMs work under the hood, step by step, in the AI & LLM course. ",el("a",{href:"/ai-learning#/"+AIX[L.id]},"Open the lesson →")))); }
  if(L.links&&L.links.length) R.append(el("div",{},el("div",{className:"eyebrow",style:"margin-bottom:10px"},"Go deeper"),el("div",{className:"golinks"},L.links.map(([t,u])=>el("a",{href:u,target:"_blank",rel:"noopener"},t)))));
  { const sc=XS.find(x=>x.lesson===L.id)||(L.sim&&XS.find(x=>x.id===({normal:"normal",sqli:"sqli",prompt:"prompt"})[L.sim.payload])); const dflt=!!(L.sim&&(L.sim.gate||L.sim.patched));
    if(sc) R.append(el("div",{className:"callout"},el("span",{"aria-hidden":"true"},"📡"),el("span",{},"Watch this attack packet by packet in the Attack Explorer. ",el("button",{className:"btn sm",style:"margin-left:6px",onclick:()=>{ selectScenario(sc.id,{scroll:true,play:true,def:dflt}); }},"Open: "+sc.title+" →")))); }
  // quick check
  const q=L.check, box=el("div",{className:"card dashed quiz"}), fb=el("div",{style:"font-size:16px;min-height:1.4em"});
  box.append(el("div",{className:"eyebrow"},"Quick check"), el("h4",{},q.q));
  const opts=el("div",{className:"opts"}); let answered=false;
  q.o.forEach((o,i)=>{ const b=el("button",{className:"opt"},o); b.onclick=()=>{
    if(i===q.a){ b.classList.add("right"); opts.querySelectorAll("button").forEach(x=>x.disabled=true); fb.textContent="✓ "+q.why; if(!done.has(L.id)){ markDone(L.id,true); } }
    else { b.classList.add("wrong"); b.disabled=true; fb.textContent="Not quite — have another look."; }
    answered=true; }; opts.append(b); });
  box.append(opts,fb); R.append(box);
  const prev=LESSONS[idx-1], next=LESSONS[idx+1];
  const markBtn=el("button",{className:done.has(L.id)?"btn":"btn primary",onclick:()=>{ if(done.has(L.id)){ done.delete(L.id); save(); refreshAll(); } else markDone(L.id); }}, done.has(L.id)?"Mark as not done":"Mark complete ✓");
  R.append(el("div",{className:"rfoot"},
    el("button",{className:"btn sm",disabled:!prev,onclick:()=>prev&&openLesson(prev.id,true)},"← "+(prev?prev.title:"Start")),
    el("span",{className:"spacer"}), markBtn,
    el("button",{className:"btn sm",disabled:!next,onclick:()=>next&&openLesson(next.id,true)},(next?next.title:"The end")+" →")));
}
function markDone(id,fromQuiz){ done.add(id); save(); refreshAll(); toast(fromQuiz?"Correct — lesson complete":"Lesson complete"); if(done.size===TOTAL) setTimeout(()=>toast("🎉 You've completed every lesson"),2300); }
function openLesson(id,scroll){
  current=id; const L=LESSONS.find(l=>l.id===id); openMods.add(L.mod.id);
  try{ history.replaceState(null,"","#"+id); }catch(e){}
  refreshAll();
  if(scroll) document.getElementById("curriculum").scrollIntoView({behavior:reduced?"auto":"smooth"});
}
function refreshAll(){ if(typeof renderCards==="function"&&document.getElementById("fcBox")&&FC&&FC.deck==="mine") renderCards(); renderHeaderProgress(); renderStrip(); renderSidebar(); renderReader(); if(typeof refreshPaths==="function"&&document.getElementById("pathGrid")) refreshPaths(); }

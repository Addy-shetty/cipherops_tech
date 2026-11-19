/* cipherops_tech — AWS Security Lab page */
"use strict";
(function(){
/* ---------- progress (shared points with the main site) ---------- */
const RANKS=[[0,"Novice"],[100,"Apprentice"],[350,"Analyst"],[700,"Operator"],[1100,"Specialist"],[1500,"cipherops Elite"]];
const LP={solved:{},hints:{}}; try{ Object.assign(LP,JSON.parse(localStorage.getItem("cipherops-labs")||"{}")); }catch(e){}
const AP={quiz:{},seen:{}}; try{ Object.assign(AP,JSON.parse(localStorage.getItem("cipherops-aws")||"{}")); }catch(e){}
const saveLP=()=>{ try{ localStorage.setItem("cipherops-labs",JSON.stringify(LP)); }catch(e){} };
const saveAP=()=>{ try{ localStorage.setItem("cipherops-aws",JSON.stringify(AP)); }catch(e){} };
const points=()=>Object.values(LP.solved).reduce((a,b)=>a+b,0);
const rank=p=>{ let r=RANKS[0]; RANKS.forEach(x=>{ if(p>=x[0]) r=x; }); return r[1]; };
const labDone=id=>LP.solved[id]!=null;
const modDone=m=>labDone(m.lab.id)&&AP.quiz[m.id];
function award(lab){ if(labDone(lab.id)) return; LP.solved[lab.id]=lab.points; saveLP(); refresh(); atoast("⚑ +"+lab.points+" pts · "+lab.title); }
function refresh(){ const p=points(); A$("#hdrPts").textContent="⚑ "+p+" pts · "+rank(p);
  const done=AWSMODS.filter(modDone).length; A$("#awsCount").textContent=done+"/"+AWSMODS.length; A$("#awsBar").style.width=(done/AWSMODS.length*100)+"%";
  A$("#heroProg").textContent=done+" of "+AWSMODS.length+" services complete · "+AWSMODS.filter(m=>labDone(m.lab.id)).length+" labs solved"+(labDone(CAPSTONE.lab.id)?" · incident closed":"");
  drawMap(); }

/* ---------- theme (same storage key as the main site) ---------- */
const applyTheme=t=>{ document.documentElement.setAttribute("data-theme",t); const b=A$("#themeBtn"); b.textContent=t==="dark"?"☀":"☾"; b.setAttribute("aria-label",t==="dark"?"Switch to light theme":"Switch to dark theme"); try{ localStorage.setItem("cipherops-theme",t); }catch(e){} };
let theme="light"; try{ theme=localStorage.getItem("cipherops-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); }catch(e){}
applyTheme(theme); A$("#themeBtn").onclick=()=>applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");

/* ---------- inline code renderer: `code` spans ---------- */
function rich(s){ const out=[]; String(s).split("`").forEach((part,i)=>{ if(!part) return; out.push(i%2?ael("code",{},part):part); }); return out; }
function copyBtn(text){ return ael("button",{className:"copy",title:"Copy","aria-label":"Copy command",onclick:()=>{ navigator.clipboard&&navigator.clipboard.writeText(text).then(()=>atoast("Copied")); }},"⧉"); }

/* ---------- account map ---------- */
function drawMap(){ const host=A$("#map"); host.innerHTML="";
  Object.keys(GROUPS).forEach(g=>{ const mods=AWSMODS.filter(m=>m.group===g).sort((a,b)=>AWS_PATH.indexOf(a.id)-AWS_PATH.indexOf(b.id));
    host.append(ael("div",{className:"lane",style:"--lane:"+GROUPS[g].c},ael("div",{className:"lane-h"},GROUPS[g].n),
      ael("div",{className:"tiles"},mods.map(m=>{ const n=AWS_PATH.indexOf(m.id)+1, ld=labDone(m.lab.id), q=AP.quiz[m.id];
        return ael("a",{className:"tile"+(ld&&q?" done":"")+(cur&&cur.id===m.id?" cur":""),href:"#"+m.id,"aria-label":m.name+(ld&&q?" (complete)":"")},
          ael("span",{className:"tnum"},String(n).padStart(2,"0")),ael("b",{},m.svc),ael("small",{},m.tag),
          ael("span",{className:"tstat"},ael("i",{title:"Walkthrough",className:AP.walk&&AP.walk[m.id]?"on":""},"▶ walk"),ael("i",{title:"Quiz",className:q?"on":""},"✓ quiz"),ael("i",{title:"Lab",className:ld?"on":""},"⚑ lab"))); })))); }); }

/* ---------- module view ---------- */
let cur=null, curTab="walk", pendingTab=null, walker=null;
function openModule(id,tab,scroll){
  const m=AWSMODS.find(x=>x.id===id); if(!m) return;
  cur=m; curTab=tab||curTab||"learn"; AP.seen[id]=true; saveAP();
  const host=A$("#module"); host.innerHTML=""; host.hidden=false;
  const i=AWS_PATH.indexOf(id), prev=AWSMODS.find(x=>x.id===AWS_PATH[i-1]), next=AWSMODS.find(x=>x.id===AWS_PATH[i+1]);
  const tabs=[["walk","Walkthrough"+(AP.walk&&AP.walk[m.id]?" ✓":"")],["learn","Learn"],["lab","Lab"+(labDone(m.lab.id)?" ✓":"")],["real","Real AWS account"],["quiz","Quiz"+(AP.quiz[m.id]?" ✓":"")]];
  const tabBar=ael("div",{className:"mtabs",role:"tablist","aria-label":"Module sections"},tabs.map(([k,l])=>ael("button",{role:"tab","aria-selected":String(curTab===k),onclick:()=>{ curTab=k; openModule(id,k,false); }},l)));
  const body=ael("div",{className:"mbody",role:"tabpanel"});
  host.append(ael("div",{className:"mhead"},
    ael("div",{},ael("div",{className:"eyebrow",style:"color:"+GROUPS[m.group].c},"Module "+(i+1)+" of 12 · "+GROUPS[m.group].n+" · "+m.level+" · ~"+m.min+" min"),ael("h2",{},m.name),ael("p",{className:"lede"},m.tag)),
    ael("div",{className:"mnav"},prev?ael("a",{className:"btn sm ghost",href:"#"+prev.id},"← "+prev.svc):null,next?ael("a",{className:"btn sm",href:"#"+next.id},next.svc+" →"):ael("a",{className:"btn sm primary",href:"#capstone"},"Final incident →"))),
    tabBar,body);
  if(walker){ walker.destroy(); walker=null; }
  ({walk:renderWalk,learn:renderLearn,lab:renderLab,real:renderReal,quiz:renderQuiz})[curTab](m,body);
  drawMap();
  if(scroll!==false) host.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth",block:"start"});
}
function renderWalk(m,b){ const sc=SCENES[m.id]; if(!sc){ renderLearn(m,b); return; } b.classList.add("walkhost");
  walker=WALK.render(m,sc,b,{onComplete:()=>{ AP.walk=AP.walk||{}; if(!AP.walk[m.id]){ AP.walk[m.id]=true; saveAP(); drawMap(); } },onDone:()=>openModule(m.id,"lab"),doneLabel:"Start the lab →"});
  b.append(ael("p",{className:"muted wfoot"},"Want the reference version? ",ael("button",{className:"linkbtn",onclick:()=>openModule(m.id,"learn")},"Open the Learn tab"),": key ideas, failure modes, a checklist and CLI commands.")); }
function renderLearn(m,b){
  b.append(ael("div",{className:"learn-grid"},
    ael("div",{},
      ael("h3",{},"What it is"),ael("p",{},m.what),
      ael("h3",{},"Why it matters"),ael("p",{},m.why),
      ael("h3",{},"Key ideas"),ael("dl",{className:"ideas"},m.ideas.map(([t,d])=>[ael("dt",{},t),ael("dd",{},d)])),
      ael("h3",{},"How it goes wrong"),ael("ul",{className:"wrong"},m.wrong.map(([t,d])=>ael("li",{},ael("b",{},t),": "+d)))),
    ael("aside",{},
      ael("div",{className:"card side"},ael("h4",{},"Defender checklist"),ael("ul",{className:"checklist"},m.check.map((c,k)=>{ const id="ck-"+m.id+"-"+k; const cb=ael("input",{type:"checkbox",id}); try{ cb.checked=!!(AP.ck&&AP.ck[id]); }catch(e){}
        cb.onchange=()=>{ AP.ck=AP.ck||{}; AP.ck[id]=cb.checked; saveAP(); }; return ael("li",{},cb,ael("label",{for:id},c)); }))),
      ael("div",{className:"card side"},ael("h4",{},"Try it with the CLI"),m.cli.map(([d,c])=>ael("div",{className:"clirow"},ael("div",{className:"muted"},d),ael("div",{className:"cmdline"},ael("pre",{className:"code"},c),copyBtn(c))))),
      ael("div",{className:"card side"},ael("h4",{},"AWS documentation"),ael("ul",{className:"docs"},m.docs.map(([t,u])=>ael("li",{},ael("a",{href:u,target:"_blank",rel:"noopener"},t+" ↗"))))))),
    ael("div",{className:"row next"},ael("button",{className:"btn primary",onclick:()=>openModule(m.id,"lab")},"Start the lab →"),ael("button",{className:"btn ghost",onclick:()=>openModule(m.id,"quiz")},"Take the quiz")));
}
function renderLab(m,b){ ENGINES[m.lab.type](m.lab,b,()=>award(m.lab)); if(labDone(m.lab.id)) b.prepend(ael("p",{className:"done-note"},"✓ You've already solved this lab ("+m.lab.points+" pts). Play it again any time."));
  b.append(ael("div",{className:"row next"},ael("button",{className:"btn ghost",onclick:()=>openModule(m.id,"real")},"Try it in a real AWS account →"))); }
function renderReal(m,b){ const r=m.real, url="/assets/aws/cfn/"+r.tpl;
  const pre=ael("pre",{className:"code tpl",hidden:true});
  b.append(
    ael("div",{className:"safety card"},ael("b",{},"Before you start: "),"use a sandbox AWS account (not production), set up a zero-spend or small budget alert in AWS Budgets, pick one Region, and run the cleanup steps when you finish. Charges are yours. Templates are provided as-is for learning."),
    ael("div",{className:"realmeta"},ael("span",{className:"tag basic"},"⏱ "+r.time),ael("span",{className:"tag intermediate"},"$ "+r.cost)),
    ael("div",{className:"row"},ael("a",{className:"btn primary sm",href:url,download:r.tpl},"⬇ Download "+r.tpl),ael("button",{className:"btn sm ghost",onclick:async()=>{ if(!pre.hidden){ pre.hidden=true; return; } try{ const t=await (await fetch(url)).text(); pre.textContent=t; pre.hidden=false; }catch(e){ atoast("Couldn't load the template"); } }},"View template"),
      m.id==="macie"?ael("button",{className:"btn sm",onclick:macieSamples},"⬇ Fake sample files (.zip)"):null),
    pre,
    r.pre?ael("div",{},ael("h3",{},"You'll need"),ael("ul",{},r.pre.map(x=>ael("li",{},rich(x))))):null,
    ael("h3",{},"Steps"),ael("ol",{className:"steps"},r.steps.map(s=>{ const cmds=(s.match(/`([^`]+)`/g)||[]).map(x=>x.slice(1,-1)); return ael("li",{},ael("span",{},rich(s)),cmds.length===1&&cmds[0].length>30?copyBtn(cmds[0]):null); })),
    ael("h3",{},"Clean up"),ael("ol",{className:"steps clean"},r.clean.map(s=>ael("li",{},rich(s)))));
}
function renderQuiz(m,b){ const st=m.quiz.map(()=>false); const fbAll=ael("p",{className:"done-note",hidden:!AP.quiz[m.id]},"✓ Quiz passed");
  m.quiz.forEach((Q,i)=>{ const fb=ael("div",{className:"qfb"}); const opts=ael("div",{className:"opts"});
    Q.o.forEach((o,k)=>opts.append(ael("button",{className:"opt",onclick:e=>{ if(k===Q.a){ e.target.classList.add("right"); A$$("button",opts).forEach(x=>x.disabled=true); fb.textContent="✓ "+Q.why; st[i]=true;
        if(st.every(Boolean)&&!AP.quiz[m.id]){ AP.quiz[m.id]=true; saveAP(); fbAll.hidden=false; atoast("Quiz passed: "+m.svc); refresh(); } }
      else { e.target.classList.add("wrong"); fb.textContent="Not quite. Try another answer."; } }},o)));
    b.append(ael("div",{className:"qbox card"},ael("div",{className:"qq"},(i+1)+". "+Q.q),opts,fb)); });
  b.append(fbAll); }

/* ---------- Macie fake data (clearly fake; uses AWS's documented example key) ---------- */
const CRC=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return b=>{ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=t[(c^b[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }; })();
function makeZip(files){ const enc=new TextEncoder(), parts=[], central=[]; let off=0; const u16=v=>[v&255,(v>>>8)&255], u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  files.forEach(([name,text])=>{ const nb=enc.encode(name), db=enc.encode(text), crc=CRC(db);
    const common=[...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(crc),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)];
    const local=new Uint8Array([...u32(0x04034b50),...common]); parts.push(local,nb,db);
    central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...common,...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb); off+=local.length+nb.length+db.length; });
  const cs=central.reduce((a,b)=>a+b.length,0); return new Blob([...parts,...central,new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cs),...u32(off),...u16(0)])],{type:"application/zip"}); }
function macieSamples(){
  const files=[["macie-samples/README.txt","All data in these files is FAKE and safe to upload.\nNames and emails are invented; card numbers are official test numbers; the AWS key is AWS's documented example key.\n"],
   ["macie-samples/customers-fake.csv","name,email,phone,passport\nAva Thornfield,ava.thornfield@example.com,+1-202-555-0143,X1234567\nRavi Menon,ravi.menon@example.com,+1-202-555-0178,P7654321\nLina Okafor,lina.okafor@example.org,+1-202-555-0110,K2468135\n"],
   ["macie-samples/cards-test.json",JSON.stringify({note:"test card numbers only",cards:[{brand:"visa",number:"4111111111111111",exp:"12/30"},{brand:"mastercard",number:"5555555555554444",exp:"11/29"}]},null,2)+"\n"],
   ["macie-samples/build-1832.log","[ci] step 4/9: printing environment for debugging\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n[ci] step 5/9: npm test\n"]];
  try{ const a=ael("a",{href:URL.createObjectURL(makeZip(files)),download:"macie-samples.zip"}); document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); atoast("Downloaded macie-samples.zip"); }catch(e){ atoast("Download blocked in this view"); } }

/* ---------- real-account overview + capstone ---------- */
function drawRealIndex(){ const tb=A$("#realIndex"); tb.innerHTML="";
  AWSMODS.forEach(m=>tb.append(ael("tr",{},ael("td",{},ael("a",{href:"#"+m.id,onclick:()=>{ pendingTab="real"; if(cur&&cur.id===m.id) openModule(m.id,"real"); }},m.svc)),ael("td",{},ael("a",{href:"/assets/aws/cfn/"+m.real.tpl,download:m.real.tpl},ael("code",{},m.real.tpl))),ael("td",{},m.real.cost),ael("td",{},m.real.time)))); }
function drawCapstone(){ const host=A$("#capLab"); host.innerHTML=""; ENGINES.hunt(CAPSTONE.lab,host,()=>award(CAPSTONE.lab)); }

/* ---------- routing ---------- */
function route(){ const h=decodeURIComponent(location.hash.slice(1)); if(AWSMODS.some(m=>m.id===h)){ const t=pendingTab||(cur&&cur.id===h?curTab:"walk"); pendingTab=null; openModule(h,t); } }
window.addEventListener("hashchange",route);
A$("#startBtn").onclick=()=>{ const firstOpen=AWSMODS.find(m=>!modDone(m))||AWSMODS[0]; location.hash=firstOpen.id; };
drawRealIndex(); drawCapstone(); refresh(); route();
window.__AWS={openModule,AWSMODS,LP,AP,ENGINES,award,get walker(){ return walker; }};
})();

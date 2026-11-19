/* cipherops_tech — AWS Security Lab engines (all simulated in the browser) */
"use strict";

/* ---------- tiny helpers (scoped to this page) ---------- */
const A$=(s,r)=>(r||document).querySelector(s), A$$=(s,r)=>[...(r||document).querySelectorAll(s)];
function ael(tag,attrs,...kids){ const e=document.createElement(tag); attrs=attrs||{};
  for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
    if(k==="style") e.style.cssText=v; else if(k==="className") e.className=v; else if(k.startsWith("on")) e[k]=v; else if(k==="text") e.textContent=v; else e.setAttribute(k,v===true?"":v); }
  kids.flat(Infinity).forEach(c=>{ if(c==null||c===false) return; e.append(c.nodeType?c:document.createTextNode(String(c))); }); return e; }
function atoast(m){ const t=A$("#toast"); if(!t) return; t.textContent=m; t.classList.add("on"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("on"),2600); }
const glob2re=(p,ci)=>new RegExp("^"+String(p).replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$",ci?"i":"");
const arr=v=>v==null?[]:Array.isArray(v)?v:[v];

/* =====================================================================
   1) IAM policy evaluator
   Simplified but faithful to AWS evaluation order:
   explicit Deny (any policy) > SCP must Allow > permissions boundary must Allow >
   identity-based OR resource-based Allow > implicit deny.
   ===================================================================== */
const IAMSIM=(()=>{
  function ipInCidr(ip,cidr){ if(!cidr.includes("/")) return ip===cidr;
    const [base,bits]=cidr.split("/"), toN=s=>s.split(".").reduce((a,b)=>(a<<8)+(+b),0)>>>0;
    if(!/^\d+\.\d+\.\d+\.\d+$/.test(ip)||!/^\d+\.\d+\.\d+\.\d+$/.test(base)) return false;
    const m=bits==="0"?0:(~0<<(32-(+bits)))>>>0; return (toN(ip)&m)===(toN(base)&m); }
  function condOk(cond,ctx){
    if(!cond) return true;
    const lc={}; Object.keys(ctx).forEach(k=>lc[k.toLowerCase()]=ctx[k]);
    for(const rawOp of Object.keys(cond)){
      let op=rawOp, ifExists=false, anyValue=false;
      if(op.startsWith("ForAnyValue:")){ anyValue=true; op=op.slice(12); }
      if(op.startsWith("ForAllValues:")) op=op.slice(13);
      if(op.endsWith("IfExists")){ ifExists=true; op=op.slice(0,-8); }
      const block=cond[rawOp];
      for(const key of Object.keys(block)){
        const want=arr(block[key]).map(String), has=lc[key.toLowerCase()];
        const negated=/^(StringNot|NotIp|ArnNot|NumericNot)/.test(op);
        if(has==null){ if(ifExists||negated) continue; return false; }
        const vals=arr(has).map(String); let ok;
        const anyMatch=f=>vals.some(v=>want.some(w=>f(v,w)));
        switch(op){
          case "StringEquals": ok=anyMatch((v,w)=>v===w); break;
          case "StringNotEquals": ok=!anyMatch((v,w)=>v===w); break;
          case "StringEqualsIgnoreCase": ok=anyMatch((v,w)=>v.toLowerCase()===w.toLowerCase()); break;
          case "StringLike": ok=anyMatch((v,w)=>glob2re(w).test(v)); break;
          case "StringNotLike": ok=!anyMatch((v,w)=>glob2re(w).test(v)); break;
          case "ArnEquals": case "ArnLike": ok=anyMatch((v,w)=>glob2re(w).test(v)); break;
          case "ArnNotEquals": case "ArnNotLike": ok=!anyMatch((v,w)=>glob2re(w).test(v)); break;
          case "Bool": ok=anyMatch((v,w)=>v.toLowerCase()===w.toLowerCase()); break;
          case "IpAddress": ok=anyMatch((v,w)=>ipInCidr(v,w)); break;
          case "NotIpAddress": ok=!anyMatch((v,w)=>ipInCidr(v,w)); break;
          case "NumericLessThan": ok=anyMatch((v,w)=>+v<+w); break;
          case "NumericLessThanEquals": ok=anyMatch((v,w)=>+v<=+w); break;
          case "NumericGreaterThan": ok=anyMatch((v,w)=>+v>+w); break;
          case "NumericGreaterThanEquals": ok=anyMatch((v,w)=>+v>=+w); break;
          case "NumericEquals": ok=anyMatch((v,w)=>+v===+w); break;
          case "Null": ok=want.every(w=>(w==="true")===(has==null)); break;
          default: throw new Error("Condition operator not supported in this simulator: "+rawOp);
        }
        if(anyValue===false && !ok) return false; if(anyValue && !ok) return false;
      }
    }
    return true;
  }
  function principalOk(p,req){
    if(p==null) return true;           // identity policies have no Principal
    if(p==="*") return true;
    const aws=arr(p.AWS), svc=arr(p.Service);
    if(aws.includes("*")) return true;
    if(aws.some(a=>a===req.principal||a===req.account||a==="arn:aws:iam::"+req.account+":root"&&req.viaRoot)) return true;
    if(svc.some(s=>s===req.service)) return true;
    return false;
  }
  function stmtMatches(st,req,isResourcePolicy){
    const acts=st.Action!=null?arr(st.Action):null, nacts=st.NotAction!=null?arr(st.NotAction):null;
    if(acts&&!acts.some(a=>glob2re(a,true).test(req.action))) return false;
    if(nacts&&nacts.some(a=>glob2re(a,true).test(req.action))) return false;
    if(!acts&&!nacts) throw new Error("A statement needs Action or NotAction");
    const res=st.Resource!=null?arr(st.Resource):null, nres=st.NotResource!=null?arr(st.NotResource):null;
    if(res&&!res.some(r=>glob2re(r).test(req.resource))) return false;
    if(nres&&nres.some(r=>glob2re(r).test(req.resource))) return false;
    if(!res&&!nres&&!isResourcePolicy) throw new Error("Identity policy statements need Resource or NotResource");
    if(isResourcePolicy){ if(st.Principal==null&&st.NotPrincipal==null) throw new Error("Resource-based policy statements need a Principal");
      if(st.Principal!=null&&!principalOk(st.Principal,req)) return false; }
    const ctx=Object.assign({"aws:PrincipalArn":req.principal,"aws:PrincipalAccount":req.account},req.ctx||{});
    return condOk(st.Condition,ctx);
  }
  function stmts(doc){ if(!doc) return []; if(typeof doc!=="object") throw new Error("Policy must be a JSON object");
    if(!doc.Statement) throw new Error('Policy needs a "Statement" array'); return arr(doc.Statement); }
  function check(docs,req,isRes,effect){ for(const d of docs){ for(const st of stmts(d.doc)){
      if(st.Effect!=="Allow"&&st.Effect!=="Deny") throw new Error('Each statement needs "Effect": "Allow" or "Deny"');
      if(st.Effect===effect&&stmtMatches(st,req,isRes)) return {by:d.name,sid:st.Sid||"(no Sid)"}; } } return null; }
  /* evaluate one request. set = {identity:[{name,doc}], scp:[{name,doc}]|null, boundary:[..]|null, resource:[{name,doc}]|null, kms:bool} */
  function evaluate(set,req){
    const all=[["identity",set.identity||[],false],["SCP",set.scp||[],false],["boundary",set.boundary||[],false],["resource",set.resource||[],true]];
    for(const [kind,docs,isRes] of all){ const d=check(docs,req,isRes,"Deny"); if(d) return {r:"DENY",why:"Explicit Deny in "+d.by+" ("+d.sid+")"}; }
    if(set.scp&&set.scp.length){ if(!check(set.scp,req,false,"Allow")) return {r:"DENY",why:"No SCP statement allows this action, so the organization blocks it"}; }
    if(set.boundary&&set.boundary.length){ if(!check(set.boundary,req,false,"Allow")) return {r:"DENY",why:"Outside the permissions boundary"}; }
    const res=set.resource&&set.resource.length?check(set.resource,req,true,"Allow"):null;
    let idn=check(set.identity||[],req,false,"Allow");
    if(set.kms){ // KMS: identity policies only count when the key policy delegates to the account
      const deleg=check(set.resource||[],Object.assign({},req,{principal:"arn:aws:iam::"+req.account+":root",viaRoot:true}),true,"Allow");
      if(idn&&!deleg) idn=null;
      if(res) return {r:"ALLOW",why:"Allowed by the key policy ("+res.sid+")"};
      if(idn) return {r:"ALLOW",why:"Key policy delegates to IAM, and "+idn.by+" allows it"};
      return {r:"DENY",why:"Implicit deny: the key policy does not allow this principal"};
    }
    if(req.external){ if(res&&idn) return {r:"ALLOW",why:"Cross-account: "+res.by+" ("+res.sid+") and the caller's own IAM policy both allow it"};
      return {r:"DENY",why:res?"Cross-account: the caller's own account doesn't allow it":"Cross-account access needs an Allow in the resource policy for this principal"}; }
    if(res) return {r:"ALLOW",why:"Allowed by "+res.by+" ("+res.sid+")"};
    if(idn) return {r:"ALLOW",why:"Allowed by "+idn.by+" ("+idn.sid+")"};
    return {r:"DENY",why:"Implicit deny: nothing allows it"};
  }
  return {evaluate,condOk};
})();

/* ---------- shared lab chrome ---------- */
function labShell(spec,onSolved){
  const box=ael("div",{className:"lab"});
  const status=ael("div",{className:"lab-status",role:"status","aria-live":"polite"});
  const hintBox=ael("div",{className:"lab-hint",hidden:true});
  let hintI=0;
  const hintBtn=spec.hints&&spec.hints.length?ael("button",{className:"btn sm ghost",onclick:()=>{ hintBox.hidden=false; hintBox.textContent="Hint "+(hintI+1)+"/"+spec.hints.length+": "+spec.hints[hintI]; hintI=Math.min(hintI+1,spec.hints.length-1); }},"💡 Hint"):null;
  box.append(ael("div",{className:"lab-brief"},ael("div",{className:"eyebrow"},"Simulated lab · "+spec.points+" pts"),ael("h4",{},spec.title),ael("p",{},spec.brief)));
  const body=ael("div",{className:"lab-body"}); box.append(body, ael("div",{className:"lab-foot"},hintBtn,status), hintBox);
  let solvedOnce=false;
  const solved=(msg)=>{ status.className="lab-status ok"; status.textContent="✓ "+(msg||"Lab solved")+" (+"+spec.points+" pts)"; if(!solvedOnce){ solvedOnce=true; onSolved&&onSolved(); } };
  const fail=(msg)=>{ status.className="lab-status bad"; status.textContent=msg; };
  const info=(msg)=>{ status.className="lab-status"; status.textContent=msg; };
  return {box,body,solved,fail,info};
}

/* =====================================================================
   Engine: policy — edit one policy until every test request matches
   ===================================================================== */
function labPolicy(spec,host,onSolved){
  const L=labShell(spec,onSolved);
  const ta=ael("textarea",{className:"code-edit",spellcheck:"false","aria-label":spec.slot.label,rows:Math.max(14,JSON.stringify(spec.slot.start,null,2).split("\n").length+2)});
  ta.value=JSON.stringify(spec.slot.start,null,2);
  ta.addEventListener("keydown",e=>{ if(e.key==="Tab"){ e.preventDefault(); const s=ta.selectionStart; ta.value=ta.value.slice(0,s)+"  "+ta.value.slice(ta.selectionEnd); ta.selectionStart=ta.selectionEnd=s+2; } if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); run(); } });
  const fixed=ael("div",{className:"fixed-pols"});
  (spec.fixed||[]).forEach(f=>fixed.append(ael("details",{},ael("summary",{},"🔒 "+f.name+" (read-only)"),ael("pre",{className:"code"},JSON.stringify(f.doc,null,2)))));
  const tbl=ael("table",{className:"tests"});
  const head=ael("tr",{},["Request","Who","Expected","Result","Why"].map(h=>ael("th",{scope:"col"},h)));
  tbl.append(ael("thead",{},head)); const tb=ael("tbody"); tbl.append(tb);
  function drawRows(results){ tb.innerHTML="";
    spec.tests.forEach((t,i)=>{ const r=results?results[i]:null;
      const ctx=t.ctx?Object.entries(t.ctx).map(([k,v])=>k+"="+v).join(", "):"";
      tb.append(ael("tr",{className:r?(r.r===t.expect?"pass":"failrow"):""},
        ael("td",{},ael("code",{},t.action),ael("div",{className:"res"},t.resource),ctx?ael("div",{className:"ctx"},ctx):null),
        ael("td",{},t.who),
        ael("td",{},ael("span",{className:"pill "+(t.expect==="ALLOW"?"allow":"deny")},t.expect)),
        ael("td",{},r?ael("span",{className:"pill "+(r.r==="ALLOW"?"allow":"deny")},r.r+(r.r===t.expect?" ✓":" ✗")):"—"),
        ael("td",{className:"why"},r?r.why:(t.note||""))));
    }); }
  function run(){
    let doc; try{ doc=JSON.parse(ta.value); }catch(e){ L.fail("JSON error: "+e.message); return; }
    try{
      const results=spec.tests.map(t=>{ const P=spec.principals[t.who];
        const set={identity:(P.identity||[]).slice(),scp:spec.scp?spec.scp.slice():null,boundary:P.boundary||null,resource:spec.resource?spec.resource.slice():null,kms:!!spec.kms};
        const mine={name:spec.slot.name,doc};
        if(spec.slot.kind==="identity"&&(spec.slot.for||[]).includes(t.who)) set.identity.push(mine);
        if(spec.slot.kind==="scp") set.scp=[mine];
        if(spec.slot.kind==="resource") set.resource=[mine];
        return IAMSIM.evaluate(set,{principal:P.arn,account:spec.account||"111122223333",action:t.action,resource:t.resource,ctx:t.ctx||{},service:P.service,external:!!P.external}); });
      drawRows(results);
      const bad=results.filter((r,i)=>r.r!==spec.tests[i].expect).length;
      if(!bad){ const extra=spec.extraCheck?spec.extraCheck(doc):null; if(extra){ L.fail(extra); return; } L.solved("All "+results.length+" requests behave as expected"); }
      else L.fail(bad+" of "+results.length+" requests don't match yet. Read the Why column.");
    }catch(e){ L.fail("Policy error: "+e.message); }
  }
  L.body.append(ael("div",{className:"pol-grid"},
    ael("div",{},ael("div",{className:"f-h"},spec.slot.label),ta,ael("div",{className:"row"},ael("button",{className:"btn sm primary",onclick:run},"▶ Run tests"),ael("button",{className:"btn sm ghost",onclick:()=>{ ta.value=JSON.stringify(spec.slot.start,null,2); drawRows(); L.info("Reset to the starting policy."); }},"Reset"),
      spec.solution?ael("button",{className:"btn sm ghost",onclick:()=>{ if(confirmReveal()){ ta.value=JSON.stringify(spec.solution,null,2); L.info("Solution loaded. Run the tests and read why each one passes."); } }},"Show a solution"):null), fixed.children.length?fixed:null),
    ael("div",{},ael("div",{className:"f-h"},"Test requests"),ael("div",{className:"tblwrap"},tbl))));
  drawRows(); host.append(L.box); return {run};
}
function confirmReveal(){ return true; }

/* =====================================================================
   Engine: cli — a scripted AWS CLI against a fake account
   ===================================================================== */
function tokenize(line){ const out=[]; let cur="", q=null, has=false;
  for(let i=0;i<line.length;i++){ const c=line[i];
    if(q){ if(c===q) q=null; else cur+=c; continue; }
    if(c==='"'||c==="'"){ q=c; has=true; continue; }
    if(/\s/.test(c)){ if(has||cur){ out.push(cur); cur=""; has=false; } continue; }
    cur+=c; has=true; }
  if(q) throw new Error("Unclosed quote"); if(has||cur) out.push(cur); return out; }
function parseCli(line){ const t=tokenize(line.trim()); if(!t.length) return null;
  if(t[0]!=="aws") return {builtin:t[0],args:t.slice(1)};
  const svc=t[1], op=t[2], args={}; let i=3;
  while(i<t.length){ const k=t[i]; if(!k.startsWith("--")) throw new Error("Unexpected value: "+k);
    const name=k.slice(2); const v=t[i+1]; if(v==null||v.startsWith("--")){ args[name]=true; i++; } else { args[name]=v; i+=2; } }
  return {svc,op,args}; }
function labCli(spec,host,onSolved){
  const L=labShell(spec,onSolved);
  const S=JSON.parse(JSON.stringify(spec.state));
  const out=ael("div",{className:"term-out",role:"log","aria-live":"polite"});
  const inp=ael("input",{className:"term-in",spellcheck:"false",autocomplete:"off","aria-label":"Type an AWS CLI command"});
  const tasks=ael("ol",{className:"tasks"});
  const hist=[]; let hi=0;
  const print=(t,cls)=>{ out.append(ael("pre",{className:cls||""},t)); out.scrollTop=out.scrollHeight; };
  function drawTasks(){ tasks.innerHTML=""; let all=true;
    spec.tasks.forEach(t=>{ let ok=false; try{ ok=!!t.check(S); }catch(e){} all=all&&ok; tasks.append(ael("li",{className:ok?"done":""},(ok?"✓ ":"")+t.t)); });
    if(all) L.solved("Every task complete"); }
  const ops=Object.keys(spec.commands);
  function exec(line){
    print("$ "+line,"cmd");
    let p; try{ p=parseCli(line); }catch(e){ print(e.message,"err"); return; }
    if(!p) return;
    if(p.builtin){ const b=p.builtin;
      if(b==="clear"){ out.innerHTML=""; return; }
      if(b==="help"){ print("Commands in this lab:\n  "+ops.map(o=>"aws "+o).join("\n  ")+"\nAlso: help, tasks, clear, hint. Up/Down arrows recall history.","info"); return; }
      if(b==="tasks"){ print(spec.tasks.map((t,i)=>(i+1)+". "+t.t).join("\n"),"info"); return; }
      if(b==="hint"){ print(spec.hints?spec.hints.join("\n• ").replace(/^/,"• "):"No hints.","info"); return; }
      print(b+": command not found. This lab only understands the aws CLI. Type help.","err"); return; }
    const key=p.svc+" "+p.op;
    if(p.op==="help"||p.args.help){ const mine=ops.filter(o=>o.startsWith(p.svc+" ")); print(mine.length?"Available here:\n  "+mine.map(o=>"aws "+o).join("\n  "):"aws: error: service '"+p.svc+"' is not part of this lab","info"); return; }
    const fn=spec.commands[key];
    if(!fn){ print("aws: error: argument operation: Invalid choice for this lab: "+key+"\nType help to see the commands this lab supports.","err"); return; }
    try{ const r=fn(p.args,S); if(r==null) print("(no output)","dim"); else if(typeof r==="string") print(r); else if(r.err) print(r.err,"err"); else print(JSON.stringify(r,null,2)); }
    catch(e){ print("An error occurred: "+e.message,"err"); }
    drawTasks();
  }
  inp.addEventListener("keydown",e=>{
    if(e.key==="Enter"){ const v=inp.value; if(!v.trim()) return; hist.push(v); hi=hist.length; inp.value=""; exec(v); }
    else if(e.key==="ArrowUp"){ if(hi>0){ hi--; inp.value=hist[hi]; } e.preventDefault(); }
    else if(e.key==="ArrowDown"){ if(hi<hist.length){ hi++; inp.value=hist[hi]||""; } e.preventDefault(); } });
  print(spec.motd||"Simulated AWS CLI. Type help to list commands.","info");
  const term=ael("div",{className:"term",onclick:()=>inp.focus()},out,ael("div",{className:"term-line"},ael("span",{className:"ps1"},spec.prompt||"cloudshell$"),inp));
  L.body.append(ael("div",{className:"cli-grid"},term,ael("div",{},ael("div",{className:"f-h"},"Tasks"),tasks,spec.cheat?ael("details",{className:"cheat"},ael("summary",{},"Command reference"),ael("pre",{className:"code"},spec.cheat)):null)));
  drawTasks(); host.append(L.box); return {exec,S};
}

/* =====================================================================
   Engine: hunt — investigate CloudTrail-style events, answer questions
   ===================================================================== */
function labHunt(spec,host,onSolved){
  const L=labShell(spec,onSolved);
  const ev=spec.events.map((e,i)=>Object.assign({i},e));
  const q=ael("input",{type:"search",placeholder:"Filter: event name, user, IP, region…","aria-label":"Filter events"});
  const names=[...new Set(ev.map(e=>e.name))].sort();
  const sel=ael("select",{"aria-label":"Event name"},ael("option",{value:""},"All event names"),names.map(n=>ael("option",{value:n},n)));
  const errOnly=ael("input",{type:"checkbox",id:"err-"+spec.id});
  const tb=ael("tbody"), detail=ael("pre",{className:"code ev-detail"},"Click an event to see the full record.");
  function record(e){ return JSON.stringify(Object.assign({eventVersion:"1.10",eventTime:e.t,eventSource:e.src,eventName:e.name,awsRegion:e.region,sourceIPAddress:e.ip,userAgent:e.ua||"aws-cli/2.17.0 md/arch#x86_64 os/linux",
      userIdentity:{type:e.utype||"IAMUser",arn:e.arn||("arn:aws:iam::111122223333:user/"+e.user),accessKeyId:e.key||"ASIA…",userName:e.user}},
      e.err?{errorCode:e.err,errorMessage:e.errMsg||"User is not authorized to perform this operation"}:{},
      {requestParameters:e.req||null,responseElements:e.resp||null}),null,2); }
  function draw(){ const t=q.value.toLowerCase(), n=sel.value, eo=errOnly.checked; tb.innerHTML="";
    const rows=ev.filter(e=>(!n||e.name===n)&&(!eo||e.err)&&(!t||[e.name,e.user,e.ip,e.region,e.src,JSON.stringify(e.req||"")].join(" ").toLowerCase().includes(t)));
    rows.forEach(e=>tb.append(ael("tr",{tabindex:"0",className:e.err?"errrow":"",onclick:()=>{ detail.textContent=record(e); A$$("tr.sel",tb).forEach(x=>x.classList.remove("sel")); this_sel(e); },onkeydown:k=>{ if(k.key==="Enter") detail.textContent=record(e); }},
      ael("td",{className:"mono"},e.t.replace("T"," ").replace("Z","")),ael("td",{},ael("code",{},e.name)),ael("td",{},e.user),ael("td",{className:"mono"},e.ip),ael("td",{className:"mono"},e.region),ael("td",{},e.err?ael("span",{className:"pill deny"},e.err):""))));
    cnt.textContent=rows.length+" of "+ev.length+" events"; }
  function this_sel(e){ const r=[...tb.children].find(x=>x.firstChild.textContent===e.t.replace("T"," ").replace("Z","")&&x.children[1].textContent===e.name); if(r) r.classList.add("sel"); }
  const cnt=ael("span",{className:"cnt"});
  [q,sel,errOnly].forEach(x=>x.addEventListener("input",draw));
  const qs=ael("ol",{className:"hunt-q"}); const state=spec.questions.map(()=>false);
  function norm(s){ return String(s).trim().toLowerCase().replace(/\s+/g," ").replace(/^"|"$/g,""); }
  spec.questions.forEach((Q,i)=>{
    const fb=ael("div",{className:"qfb"});
    let ctl;
    if(Q.o){ ctl=ael("div",{className:"opts"},Q.o.map((o,k)=>ael("button",{className:"opt",onclick:ev2=>{ const ok=k===Q.a; ev2.target.classList.add(ok?"right":"wrong"); if(ok){ state[i]=true; fb.textContent="✓ "+Q.why; A$$("button",ctl).forEach(b=>b.disabled=true); check(); } else fb.textContent="Not quite. "+(Q.miss||"Look at the events again."); }},o))); }
    else { const inp=ael("input",{type:"text","aria-label":Q.q,placeholder:Q.ph||"Your answer"}); const go=()=>{ const ok=arr(Q.a).some(a=>norm(a)===norm(inp.value)); if(ok){ state[i]=true; inp.disabled=true; fb.textContent="✓ "+Q.why; check(); } else fb.textContent="Not quite. "+(Q.miss||"Filter the events and check again."); };
      inp.addEventListener("keydown",e=>{ if(e.key==="Enter") go(); }); ctl=ael("div",{className:"row"},inp,ael("button",{className:"btn sm",onclick:go},"Check")); }
    qs.append(ael("li",{},ael("div",{className:"qq"},Q.q),ctl,fb)); });
  function check(){ if(state.every(Boolean)) L.solved(spec.done||"Investigation complete"); else L.info(state.filter(Boolean).length+" of "+state.length+" answered"); }
  L.body.append(ael("div",{className:"hunt-tools"},q,sel,ael("label",{className:"chk",for:"err-"+spec.id},errOnly," Errors only"),cnt),
    ael("div",{className:"hunt-grid"},ael("div",{className:"tblwrap tall"},ael("table",{className:"events"},ael("thead",{},ael("tr",{},["Time (UTC)","Event","User","Source IP","Region","Error"].map(h=>ael("th",{scope:"col"},h)))),tb)),detail),
    ael("div",{className:"f-h"},"Questions"),qs);
  draw(); host.append(L.box); return {};
}

/* =====================================================================
   Engine: triage — pick the right action for each finding
   ===================================================================== */
function labTriage(spec,host,onSolved){
  const L=labShell(spec,onSolved);
  const picks={};
  const list=ael("div",{className:"findings"});
  spec.items.forEach(f=>{
    const fb=ael("div",{className:"qfb"});
    const opts=ael("div",{className:"opts"},f.options.map((o,k)=>ael("button",{className:"opt",onclick:e=>{ picks[f.id]=k; A$$("button",opts).forEach(b=>b.classList.remove("picked","right","wrong")); e.target.classList.add("picked"); fb.textContent=""; }},o)));
    list.append(ael("article",{className:"finding sev-"+f.sev.toLowerCase()},
      ael("div",{className:"f-top"},ael("span",{className:"sev"},f.sev),ael("code",{},f.type)),
      ael("h5",{},f.title),ael("div",{className:"f-res mono"},f.resource),ael("p",{},f.detail),opts,fb));
    f._fb=fb; f._opts=opts; });
  function grade(){ let right=0;
    spec.items.forEach(f=>{ const k=picks[f.id]; const bs=A$$("button",f._opts);
      if(k==null){ f._fb.textContent="Pick an action."; return; }
      if(k===f.a){ right++; bs[k].classList.add("right"); f._fb.textContent="✓ "+f.why; } else { bs[k].classList.add("wrong"); f._fb.textContent="✗ "+(f.miss||"Think about impact and whether this is expected behaviour."); } });
    if(right===spec.items.length) L.solved(spec.done||"All findings handled correctly"); else L.fail(right+" of "+spec.items.length+" correct. Read the feedback and try again."); }
  L.body.append(list,ael("div",{className:"row"},ael("button",{className:"btn primary sm",onclick:grade},"Check my triage")));
  host.append(L.box); return {grade,picks};
}

/* =====================================================================
   Engine: console — configure settings, watch live results
   ===================================================================== */
function labConsole(spec,host,onSolved){
  const L=labShell(spec,onSolved);
  const S={}; spec.controls.forEach(c=>S[c.id]=c.kind==="multi"?(c.def||[]).slice():c.def);
  const panel=ael("div",{className:"con-panel"}), result=ael("div",{className:"con-result"}), tasks=ael("ol",{className:"tasks"});
  let group=null;
  spec.controls.forEach(c=>{
    if(c.group&&c.group!==group){ group=c.group; panel.append(ael("div",{className:"f-h"},group)); }
    const id="c-"+spec.id+"-"+c.id; let ctl;
    if(c.kind==="check"){ ctl=ael("input",{type:"checkbox",id}); ctl.checked=!!S[c.id]; ctl.onchange=()=>{ S[c.id]=ctl.checked; upd(); };
      panel.append(ael("label",{className:"con-row chk",for:id},ctl,ael("span",{},c.label,c.help?ael("small",{},c.help):null))); }
    else if(c.kind==="select"){ ctl=ael("select",{id},c.options.map(o=>ael("option",{value:o},o))); ctl.value=S[c.id]; ctl.onchange=()=>{ S[c.id]=ctl.value; upd(); };
      panel.append(ael("label",{className:"con-row",for:id},ael("span",{},c.label,c.help?ael("small",{},c.help):null),ctl)); }
    else if(c.kind==="number"){ ctl=ael("input",{type:"number",id,min:c.min,max:c.max,step:c.step||1}); ctl.value=S[c.id]; ctl.oninput=()=>{ S[c.id]=+ctl.value; upd(); };
      panel.append(ael("label",{className:"con-row",for:id},ael("span",{},c.label,c.help?ael("small",{},c.help):null),ctl)); }
    else if(c.kind==="multi"){ const wrap=ael("div",{className:"multi"}); c.options.forEach(o=>{ const oid=id+"-"+o.v.replace(/\W/g,""); const cb=ael("input",{type:"checkbox",id:oid}); cb.checked=S[c.id].includes(o.v);
        cb.onchange=()=>{ S[c.id]=cb.checked?[...S[c.id],o.v]:S[c.id].filter(x=>x!==o.v); upd(); };
        wrap.append(ael("label",{className:"con-row chk",for:oid},cb,ael("span",{},ael("code",{},o.v),o.d?ael("small",{},o.d):null))); });
      panel.append(ael("div",{className:"con-row col"},ael("span",{},c.label,c.help?ael("small",{},c.help):null),wrap)); }
  });
  function upd(){ result.innerHTML=""; const r=spec.evaluate(S);
    result.append(ael("div",{className:"f-h"},r.title),ael("div",{className:"tblwrap"},ael("table",{className:"tests"},ael("thead",{},ael("tr",{},r.cols.map(h=>ael("th",{scope:"col"},h)))),ael("tbody",{},r.rows.map(row=>ael("tr",{className:row.cls||""},row.cells.map(c=>ael("td",{},c&&c.pill?ael("span",{className:"pill "+c.pill},c.t):c))))))),r.note?ael("p",{className:"muted"},r.note):null);
    tasks.innerHTML=""; let all=true; spec.tasks.forEach(t=>{ const ok=!!t.check(S,r); all=all&&ok; tasks.append(ael("li",{className:ok?"done":""},(ok?"✓ ":"")+t.t)); });
    if(all) L.solved(spec.done||"Configuration meets every requirement"); else L.info("Tasks update as you change settings."); }
  L.body.append(ael("div",{className:"con-grid"},panel,ael("div",{},ael("div",{className:"f-h"},"Requirements"),tasks,result)));
  upd(); host.append(L.box); return {S,upd};
}

const ENGINES={policy:labPolicy,cli:labCli,hunt:labHunt,triage:labTriage,console:labConsole};

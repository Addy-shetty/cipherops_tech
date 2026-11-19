/* cipherops_tech — AI & LLM course: live "Try it" controls (numbers are illustrative models, not measurements) */
"use strict";
(function(){
const L=id=>AI_LESSONS.find(l=>l.id===id).scene;
const fmtK=n=>n>=1000?(n/1000).toFixed(n>=10000?0:1)+"k":String(n);
const sec=x=>x<1?Math.round(x*1000)+" ms":x.toFixed(1)+" s";

/* 1. Latency: prompt size and answer length */
{ const sc=L("prompt-to-response");
  sc.try=[{id:"pin",type:"range",label:"Prompt tokens",min:0,max:100,step:1,value:0,fmt:v=>fmtK(pt(v))},
          {id:"out",type:"range",label:"Answer tokens",min:20,max:2000,step:20,value:180}];
  const pt=v=>Math.round(4*Math.pow(25000,v/100)); /* 4 … 100k, log scale */
  sc.try[0].apply=v=>{ sc._pin=pt(v); return null; };
  sc.try[1].apply=(out,i)=>{ if(i!==9&&i!==6) return null; const p=sc._pin||4;
    const net=0.05, prefill=0.15+p/12000, ttft=net+prefill, decode=out*0.02, total=ttft+decode;
    const items=[["network",net/total],["prefill",prefill/total],["decode",decode/total]];
    return {m:{tk:fmtK(p)+" in · "+out+" out",out:"TTFT ≈ "+sec(ttft),t:"total ≈ "+sec(total)},mt:{t:total>10?"bad":total>4?"warn":"ok"},
      b:{tok:"~50 ms network",tf:"prefill ≈ "+sec(prefill),smp:"20 ms × "+out},
      bars:{x:450,y:118,w:250,title:"Where the time goes",items:items.map(([k,v])=>[k,v,k==="decode"&&v>.5?"pick":""])},
      tryNote:"A "+fmtK(p)+"-token prompt takes about **"+sec(prefill)+"** to read (time to first token ≈ "+sec(ttft)+"). Then "+out+" output tokens at ~20 ms each add **"+sec(decode)+"**. "+(decode>prefill?"The answer length dominates: ask for shorter output to speed up.":"The prompt dominates: retrieve or trim less to speed up.")}; };
  sc.padTop=200; }

/* 2. Context window budget */
{ const sc=L("tokens-context");
  sc.try=[{id:"doc",type:"range",label:"Pasted documents",min:0,max:220,step:5,value:60,fmt:v=>v+"k tokens"},
          {id:"max",type:"range",label:"max_tokens",min:1,max:32,step:1,value:16,fmt:v=>v+"k"}];
  sc.try[0].apply=v=>{ sc._doc=v; return null; };
  sc.try[1].apply=(mx,i)=>{ if(i<1||i>3) return null; const doc=sc._doc==null?60:sc._doc, used=0.8+6+doc, room=200-used, fits=used+mx<=200;
    const st=used>200?"bad":!fits?"warn":"ok";
    return {s:{win:st},b:{win:used>200?"over by "+Math.round(used-200)+"k":"input "+Math.round(used)+"k + out "+mx+"k"},
      m:{used:Math.round(used*1000).toLocaleString(),left:(room<0?"−":"")+Math.abs(Math.round(room*1000)).toLocaleString(),cost:"input × "+Math.round(used)+"k"},mt:{used:st,left:fits?"ok":"bad"},
      bars:{x:430,y:120,w:260,title:"200k window",items:[["system",0.8/200],["history",6/200],["docs",Math.min(doc,200)/200,doc>150?"pick":""],["answer",mx/200]]},
      tryNote:used>200?"The prompt alone is bigger than the window. The API rejects it: trim history or retrieve fewer documents.":!fits?"The input fits, but there isn't room for a "+mx+"k answer. Lower max_tokens or the input, or the reply gets cut off.":"Everything fits with "+Math.round(room)+"k tokens to spare. Remember you pay for all "+Math.round(used)+"k input tokens on **every** call."}; };
  sc.padTop=200; }

/* 3. Sampling: live temperature and top-p */
{ const sc=L("sampling");
  const TOK=[["Brew",4.1],["Bean",3.7],["Daily",2.9],["Grind",2.4],["Fern",1.6],["Zebra",0.2]];
  const STEP_T=[1,0.2,1.2,1,1,0], STEP_P=[1,1,1,0.9,0.9,1];
  sc.try=[{id:"t",type:"range",label:"Temperature",min:0,max:2,step:0.1,value:1,fmt:v=>(+v).toFixed(1)},
          {id:"p",type:"range",label:"Top-p",min:0.5,max:1,step:0.05,value:1,fmt:v=>(+v).toFixed(2)}];
  function dist(T,P){ let pr;
    if(T<=0.001){ pr=TOK.map((t,k)=>k===0?1:0); }
    else { const ex=TOK.map(([,l])=>Math.exp(l/T)), Z=ex.reduce((a,b)=>a+b,0); pr=ex.map(e=>e/Z); }
    const order=pr.map((p,k)=>[p,k]).sort((a,b)=>b[0]-a[0]); let cum=0; const keep=new Set();
    for(const [p,k] of order){ if(cum<P-1e-9||keep.size===0){ keep.add(k); cum+=p; } }
    const kept=pr.reduce((a,p,k)=>a+(keep.has(k)?p:0),0);
    return TOK.map(([w],k)=>[w,keep.has(k)?pr[k]/kept:pr[k],keep.has(k)?(k===0?"pick":""):"cut"]); }
  sc.try[0].apply=v=>{ sc._t=v; return null; };
  sc.try[1].apply=(P,i)=>{ const T=sc.try[0]._touched?sc._t:STEP_T[i], PP=sc.try[1]._touched?P:STEP_P[i];
    const d=dist(T,PP), kept=d.filter(x=>x[2]!=="cut"), top=kept.slice().sort((a,b)=>b[1]-a[1]);
    const desc=T<=0.001?"always picks the top token":T<0.5?"sharp: the top choice dominates":T<=1.1?"balanced":"flat: unlikely tokens get real chances";
    return {bars:{x:450,y:105,w:250,title:"T="+(+T).toFixed(1)+" · top-p="+(+PP).toFixed(2),items:d},
      m:{t:(+T).toFixed(1),p:(+PP).toFixed(2),dist:top.slice(0,3).map(x=>x[0]+" "+Math.round(x[1]*100)).join(" · "),res:kept.length+" token"+(kept.length>1?"s":"")+" in play"},mt:{res:kept.length===1?"ok":kept.length>4?"warn":""},
      tryNote:"Temperature "+(+T).toFixed(1)+" is "+desc+". Top-p "+(+PP).toFixed(2)+" keeps "+kept.length+" of "+TOK.length+" candidates ("+(d.filter(x=>x[2]==="cut").map(x=>x[0]).join(", ")||"none cut")+(d.some(x=>x[2]==="cut")?" cut":"")+")."}; };
  sc.padTop=230; }

/* 4. Streaming on/off */
{ const sc=L("streaming");
  sc.try=[{id:"st",type:"toggle",label:"stream: true",value:true}];
  sc.try[0].apply=(on,i)=>{ if(i!==0) return null;
    return on?{m:{ttft:"0.4 s",ev:"deltas as written",shown:"text after 0.4 s"},mt:{shown:"ok"},tryNote:"With streaming, the first words appear after about the time to first token."}
             :{f:[["ui","be","req","ask"],["be","api","req","stream: false"],["api","be","ok","whole answer",{delay:1.2}]],s:{ui:"warn"},b:{ui:"spinner… 4.1 s"},m:{ttft:"—",ev:"one response",shown:"nothing for 4.1 s"},mt:{shown:"bad"},tryNote:"Without streaming the user waits for the **whole** answer. Same total time, much worse feel."}; }; }

/* 5. Tool use: approval for risky tools */
{ const sc=L("tool-use");
  sc.try=[{id:"ap",type:"toggle",label:"Approval for risky tools",value:true}];
  sc.try[0].apply=(on,i)=>{ if(i!==5) return null;
    return on?null:{f:[["model","app","bad","send_email(all)"],["app","tool","bad","runs!",{delay:.3}]],s:{app:"bad",tool:"bad"},b:{app:"no check"},m:{block:"email sent to everyone"},mt:{block:"bad"},tryNote:"With no approval step, a tool call written by the model (or by an injected instruction) runs immediately."}; }; }

/* 6. Conversation context: turns and caching */
{ const sc=L("context-mgmt");
  sc.try=[{id:"turn",type:"range",label:"Turn",min:1,max:40,step:1,value:20},{id:"cache",type:"toggle",label:"Prompt caching"}];
  sc.try[0].apply=v=>{ sc._turn=v; return null; };
  sc.try[1].apply=(cache,i)=>{ if(i<2||i>3) return null; const t=sc._turn||20, sent=800+t*1000, cached=cache?800+(t-1)*1000:0, rel=(sent-cached*0.9)/840;
    return {s:{cache:cache?"ok":"dim"},b:{cache:cache?"hit":"off",app:"turns 1–"+t},m:{turn:String(t),sent:sent.toLocaleString()+(cache?" ("+cached.toLocaleString()+" cached)":""),cost:"~"+Math.round(rel)+"× turn 1"},mt:{cost:rel>100?"bad":rel>20?"warn":"ok"},
      bars:{x:430,y:120,w:250,title:"Input tokens this turn",items:[["new",1000/sent],["history",(sent-1000)/sent,cache?"pick":""]]},
      tryNote:"At turn "+t+" you send about "+sent.toLocaleString()+" tokens to answer one new message."+(cache?" Caching bills the repeated "+cached.toLocaleString()+" at a fraction of the price.":" Turn on **Prompt caching** to make the repeated part cheap.")}; };
  sc.padTop=200; }

/* 7. Few-shot: number of examples */
{ const sc=L("few-shot");
  sc.try=[{id:"n",type:"range",label:"Examples in the prompt",min:0,max:3,step:1,value:0}];
  sc.try[0].apply=(n,i)=>{ if(i!==0&&i!==2) return null; const out=["\"billing issue!\"","Billing","billing (the customer was charged twice)","billing"][n];
    const ok=n===3; const ex=["e1","e2","e3"].slice(0,n);
    return {f:ex.map(e=>[e,"model","data"]).concat([["new","model","req","\"charged twice\""],["model","out",ok?"ok":"warn",out.slice(0,18)]]),s:Object.assign({out:ok?"ok":"warn"},...["e1","e2","e3"].map((e,k)=>({[e]:k<n?"ok":"dim"}))),
      m:{shots:String(n),input:"I was charged twice",res:out},mt:{res:ok?"ok":"warn"},
      tryNote:n===0?"No examples: the right idea, the wrong format.":n<3?"Closer, but the format still drifts. Each example pins it down more.":"Three examples: exactly `billing`, every time."}; }; }

/* 8. Chain of thought */
{ const sc=L("chain-of-thought");
  sc.try=[{id:"cot",type:"toggle",label:"Think step by step"}];
  sc.try[0].apply=(on,i)=>{ if(i!==0||!on) return null;
    return {f:[["q","model","req"],["model","think","data","rules 1→3"],["think","check","data"],["check","ans","ok","blocked"]],s:{ans:"ok",think:"ok"},b:{ans:"No, 3389 blocked"},m:{mode:"step by step",res:"no (correct)",tok:"+160"},mt:{res:"ok"},tryNote:"Given room to check each rule, the model gets it right, at the cost of ~160 extra output tokens."}; }; }

/* 9. Vector DB: tenant filter */
{ const sc=L("vector-dbs");
  sc.try=[{id:"f",type:"toggle",label:"Tenant filter in query"}];
  sc.try[0].apply=(on,i)=>{ if(i!==5||!on) return null;
    return {f:[["idx","filt","data"],["filt","rank","ok","tenant B only"],["rank","app","ok","5 results"]],s:{filt:"ok"},b:{filt:"tenant=B"},m:{res:"only tenant B's docs"},mt:{res:"ok"},tryNote:"With the tenant filter inside the query, customer A's tickets are never candidates, so they can't leak."}; }; }

/* 10. Prompt injection: least privilege + approval */
{ const sc=L("prompt-injection");
  sc.try=[{id:"tool",type:"toggle",label:"Assistant has send_email",value:true},{id:"ap",type:"toggle",label:"Human approval"}];
  sc.try[0].apply=v=>{ sc._tool=v; return null; };
  sc.try[1].apply=(ap,i)=>{ if(i!==3) return null;
    if(sc._tool===false) return {f:[["agent","send","bad","",{stop:.25}]],s:{send:"dim"},b:{agent:"no send tool"},m:{act:"nothing to call"},mt:{act:"ok"},tryNote:"A summariser with no send tool can be fooled, but can't exfiltrate anything."};
    if(ap) return {f:[["agent","guard","bad","send_email"],["guard","send","ok","",{stop:.4}]],s:{guard:"ok",send:"dim"},b:{guard:"blocked: needs approval"},m:{act:"user asked to confirm"},mt:{act:"ok"},tryNote:"The forward request is shown to the user, who declines."};
    return null; }; }

/* 11. Rate limits */
{ const sc=L("rate-limits");
  sc.try=[{id:"lim",type:"select",label:"Per-user limit",options:[["none","none"],["20","20 req/min"],["5","5 req/min"]]}];
  sc.try[0].apply=(v,i)=>{ if(i!==0&&i!==1) return null; if(v==="none") return {m:{rps:"600",spend:"$410",st:"one script, no limit"},mt:{spend:"bad"},tryNote:"No limit: one script can send 600 requests a minute and spend the budget overnight."};
    const r=+v, spend=Math.round(410*r/600*10)/10; return {f:[["users","rl","req","",{n:4}],["rl","app","ok",v+"/min"],["rl","users","bad","429",{delay:.3}]],s:{rl:"ok"},m:{rps:v+" per user",spend:"$"+spend,st:"limited"},mt:{spend:"ok",st:"ok"},tryNote:"Capped at "+v+" requests a minute, the same script costs about **$"+spend+"** and everyone else still gets served."}; }; }
})();

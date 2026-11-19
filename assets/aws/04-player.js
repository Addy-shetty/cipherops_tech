/* cipherops_tech — step-through animated walkthrough player (isometric SVG) */
"use strict";
const WALK=(()=>{
  /* self-contained DOM helpers, so the player works on any page */
  const A$=(q,r)=>(r||document).querySelector(q), A$$=(q,r)=>[...(r||document).querySelectorAll(q)];
  function ael(tag,attrs,...kids){ const e=document.createElement(tag); attrs=attrs||{};
    for(const k in attrs){ const v=attrs[k]; if(v==null||v===false) continue;
      if(k==="style") e.style.cssText=v; else if(k==="className") e.className=v; else if(k.startsWith("on")) e[k]=v; else if(k==="text") e.textContent=v; else e.setAttribute(k,v===true?"":v); }
    kids.flat(Infinity).forEach(c=>{ if(c==null||c===false) return; e.append(c.nodeType?c:document.createTextNode(String(c))); }); return e; }
  const NS="http://www.w3.org/2000/svg";
  const sv=(tag,attrs,...kids)=>{ const e=document.createElementNS(NS,tag); for(const k in (attrs||{})){ if(attrs[k]!=null) e.setAttribute(k,attrs[k]); } kids.flat().forEach(c=>{ if(c==null) return; e.append(c.nodeType?c:document.createTextNode(String(c))); }); return e; };
  const KIND={block:{w:50,h:34},big:{w:66,h:44},flat:{w:46,h:8},tall:{w:40,h:58},user:{w:0,h:0},shield:{w:40,h:22}};
  const ST={ok:"#14B8A6",bad:"#EF4444",warn:"#F59E0B",info:"#3B82F6",focus:null,dim:null};
  const FLOW={req:"#3B82F6",ok:"#14B8A6",bad:"#EF4444",data:"#8B5CF6",warn:"#F59E0B",log:"#94A3B8"};
  const shade=(hex,f)=>{ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const m=v=>Math.max(0,Math.min(255,Math.round(f<0?v*(1+f):v+(255-v)*f))); return "#"+[m(r),m(g),m(b)].map(v=>v.toString(16).padStart(2,"0")).join(""); };
  const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
  function rich(s){ // *em* and **strong**
    const out=[]; const re=/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g; let last=0, m;
    while((m=re.exec(s))){ if(m.index>last) out.push(s.slice(last,m.index)); const t=m[0];
      out.push(t.startsWith("**")?ael("strong",{},t.slice(2,-2)):t.startsWith("`")?ael("code",{},t.slice(1,-1)):ael("em",{},t.slice(1,-1))); last=m.index+t.length; }
    if(last<s.length) out.push(s.slice(last)); return out; }

  function render(mod,scene,host,opts){
    opts=opts||{};
    const key="walk-"+mod.id; let saved={max:0}; try{ saved=JSON.parse(localStorage.getItem("cipherops-"+key)||'{"max":0}'); }catch(e){}
    let i=Math.min(opts.start!=null?opts.start:0,scene.steps.length-1), paused=reduced, t0=performance.now(), raf=0, alive=true;
    const nodes={}; scene.nodes.forEach(n=>nodes[n.id]=n);
    const tryState={}; (scene.try||[]).forEach(c=>{ tryState[c.id]=c.value!=null?c.value:(c.type==="range"?c.min:c.type==="select"?c.options[0][0]:false); });
    let speedMul=1, curS=null, selNode=null; scene._touched=false;
    const LEG=Object.assign({req:"request",ok:"allowed / response",bad:"denied / attack",data:"data",warn:"warning",log:"log"},scene.legend||{});
    const anchor=id=>{ const n=nodes[id]; const k=KIND[n.kind||"block"]; return {x:n.x,y:n.y-(n.kind==="user"?28:k.h*0.55)}; };

    /* ---- layout ---- */
    const root=ael("div",{className:"walk"});
    const metricsEl=ael("div",{className:"wmetrics"});
    const svg=sv("svg",{viewBox:"0 0 900 520",class:"wsvg",role:"img","aria-label":scene.title});
    const defs=sv("defs",{},
      sv("pattern",{id:"wgrid-"+mod.id,width:"40",height:"20",patternUnits:"userSpaceOnUse",patternTransform:"translate(0,0)"},sv("path",{d:"M0 10 L20 0 L40 10 L20 20 Z",fill:"none",stroke:"currentColor","stroke-opacity":".07"})),
      ...Object.keys(FLOW).map(k=>sv("marker",{id:"wa-"+k+"-"+mod.id,viewBox:"0 0 10 10",refX:"9",refY:"5",markerWidth:"7",markerHeight:"7",orient:"auto-start-reverse"},sv("path",{d:"M0 0 L10 5 L0 10 z",fill:FLOW[k]}))));
    svg.append(defs,sv("rect",{x:0,y:0,width:900,height:520,fill:"url(#wgrid-"+mod.id+")"}));
    const gEdges=sv("g",{}), gFlows=sv("g",{}), gNodes=sv("g",{}), gDots=sv("g",{}), gTop=sv("g",{});
    svg.append(gEdges,gFlows,gNodes,gDots,gTop);
    const legend=ael("div",{className:"wlegend"},Object.entries(scene.legend||{req:"request",ok:"allowed / response",bad:"denied / attack",data:"data"}).map(([k,l])=>ael("span",{},ael("i",{style:"background:"+FLOW[k]}),l)));
    const btnReplay=ael("button",{className:"wbtn",title:"Replay this step (R)","aria-label":"Replay this step",onclick:()=>{ vt=0; }},"↺");
    const btnPause=ael("button",{className:"wbtn",title:"Pause (Space)","aria-label":"Pause animation",onclick:()=>togglePause()},"❚❚");
    const rail=ael("ol",{className:"wrail","aria-label":"Steps"});
    const btnFull=ael("button",{className:"wbtn",title:"Full screen (F)","aria-label":"Toggle full screen",onclick:()=>toggleFull()},"⛶");
    const btnSpeed=ael("button",{className:"wbtn wspeed",title:"Animation speed","aria-label":"Animation speed 1x",onclick:()=>{ speedMul=speedMul===1?2:speedMul===2?0.5:1; btnSpeed.textContent=speedMul+"×"; btnSpeed.setAttribute("aria-label","Animation speed "+speedMul+"x"); }},"1×");
    const info=ael("div",{className:"winfo",role:"dialog","aria-label":"Details",hidden:true});
    const canvas=ael("div",{className:"wcanvas"},ael("div",{className:"wscroll"},svg),ael("div",{className:"wctl"},btnSpeed,btnReplay,btnPause,btnFull),info);
    const tryBox=scene.try&&scene.try.length?ael("div",{className:"wtry"},ael("span",{className:"wtry-h"},"Try it"),scene.try.map(tryControl)):null;
    const hint=ael("div",{className:"whint"},"Tip: click any box or arrow in the diagram for details.");
    const stage=ael("div",{className:"wstage card"},metricsEl,canvas,legend,tryBox,hint);
    function tryControl(c){
      if(c.type==="range"){ const out=ael("output",{},fmt(c,tryState[c.id]));
        const inp=ael("input",{type:"range",min:c.min,max:c.max,step:c.step||1,value:tryState[c.id],"aria-label":c.label,oninput:e=>{ c._touched=true; scene._touched=true; tryState[c.id]=+e.target.value; out.textContent=fmt(c,tryState[c.id]); setStep(i,true); }});
        return ael("label",{className:"wtry-c range"},ael("span",{},c.label),inp,out); }
      if(c.type==="select"){ const sel=ael("select",{"aria-label":c.label,onchange:e=>{ c._touched=true; scene._touched=true; tryState[c.id]=e.target.value; setStep(i,true); }},c.options.map(([v,t])=>ael("option",{value:v},t)));
        sel.value=tryState[c.id]; return ael("label",{className:"wtry-c"},ael("span",{},c.label),sel); }
      const b=ael("button",{className:"wtry-t","aria-pressed":String(!!tryState[c.id]),onclick:()=>{ scene._touched=true; tryState[c.id]=!tryState[c.id]; b.setAttribute("aria-pressed",String(tryState[c.id])); b.querySelector("b").textContent=tryState[c.id]?"ON":"OFF"; setStep(i,true); }},c.label,ael("b",{},tryState[c.id]?"ON":"OFF"));
      return b; }
    function fmt(c,v){ return c.fmt?c.fmt(v):String(v); }
    function toggleFull(){ try{ if(document.fullscreenElement) document.exitFullscreen(); else if(stage.requestFullscreen) stage.requestFullscreen(); }catch(e){} }
    const railBox=ael("div",{className:"wrailbox card"},ael("div",{className:"wrail-h"},ael("span",{},"In this walkthrough"),ael("span",{className:"wcount"})),rail);
    const panel=ael("div",{className:"wpanel card","aria-live":"polite"});
    const learn=ael("div",{className:"wlearn card"},ael("div",{className:"f-h"},"You'll learn"),ael("ul",{},scene.learn.map((l,k)=>ael("li",{"data-k":k},ael("span",{className:"box"}),l))));
    root.append(ael("div",{className:"wmain"},stage,railBox),ael("aside",{className:"wside"},panel,learn));
    host.append(root);
    if(opts.scopedKeys){ root.tabIndex=-1; root.addEventListener("pointerdown",e=>{ if(!e.target.closest("button,a,input,select,textarea")) root.focus({preventScroll:true}); }); }

    /* ---- static scene ---- */
    (scene.edges||[]).forEach(([a,b])=>{ const A=anchor(a),B=anchor(b); gEdges.append(sv("line",{x1:A.x,y1:A.y,x2:B.x,y2:B.y,stroke:"currentColor","stroke-opacity":".16","stroke-width":"1.5","stroke-dasharray":"4 5"})); });
    (scene.zones||[]).forEach(z=>{ gEdges.prepend(sv("g",{},sv("path",{d:"M"+z.x+" "+(z.y+z.h/2)+" L"+(z.x+z.w/2)+" "+z.y+" L"+(z.x+z.w)+" "+(z.y+z.h/2)+" L"+(z.x+z.w/2)+" "+(z.y+z.h)+" Z",fill:z.c||"currentColor","fill-opacity":".06",stroke:z.c||"currentColor","stroke-opacity":".35","stroke-dasharray":"6 6"}),
      sv("text",{x:z.x+z.w/2,y:z.y+z.h+16,"text-anchor":"middle",class:"wzone"},z.label))); });
    const nodeEls={};
    scene.nodes.forEach(n=>{ const k=KIND[n.kind||"block"], c=n.c||mod.color||((typeof GROUPS!=="undefined"&&GROUPS[mod.group])?GROUPS[mod.group].c:"#94A3B8"), g=sv("g",{class:"wnode"});
      if(n.kind==="user"){ g.append(sv("ellipse",{cx:n.x,cy:n.y,rx:20,ry:9,fill:"currentColor","fill-opacity":".08"}),sv("rect",{x:n.x-11,y:n.y-30,width:22,height:28,rx:10,fill:c,stroke:"#1B2A4A","stroke-width":"1.6",class:"wfill"}),sv("circle",{cx:n.x,cy:n.y-38,r:8,fill:"#FFFDF9",stroke:"#1B2A4A","stroke-width":"1.6"})); }
      else { const w=k.w,h=k.h,x=n.x,y=n.y;
        const top="M"+x+" "+(y-h-w/2)+" L"+(x+w)+" "+(y-h)+" L"+x+" "+(y-h+w/2)+" L"+(x-w)+" "+(y-h)+" Z";
        const left="M"+(x-w)+" "+(y-h)+" L"+x+" "+(y-h+w/2)+" L"+x+" "+(y+w/2)+" L"+(x-w)+" "+y+" Z";
        const right="M"+x+" "+(y-h+w/2)+" L"+(x+w)+" "+(y-h)+" L"+(x+w)+" "+y+" L"+x+" "+(y+w/2)+" Z";
        g.append(sv("ellipse",{cx:x,cy:y+w/2-2,rx:w*1.05,ry:w*0.32,fill:"currentColor","fill-opacity":".07"}),
          sv("path",{d:left,fill:shade(c,-.18),stroke:"#1B2A4A","stroke-width":"1.6","stroke-linejoin":"round",class:"wl"}),
          sv("path",{d:right,fill:shade(c,-.32),stroke:"#1B2A4A","stroke-width":"1.6","stroke-linejoin":"round",class:"wr"}),
          sv("path",{d:top,fill:shade(c,.55),stroke:"#1B2A4A","stroke-width":"1.6","stroke-linejoin":"round",class:"wt"}),
          sv("text",{x,y:y-h+4,"text-anchor":"middle",class:"wglyph"},n.glyph||"")); }
      g.append(...[sv("text",{x:n.x,y:n.y+(n.kind==="user"?22:(KIND[n.kind||"block"].w/2+20)),"text-anchor":"middle",class:"wlabel"},n.label),
        n.sub?sv("text",{x:n.x,y:n.y+(n.kind==="user"?36:(KIND[n.kind||"block"].w/2+34)),"text-anchor":"middle",class:"wsub"},n.sub):null].filter(Boolean));
      g.setAttribute("tabindex","0"); g.setAttribute("role","button"); g.setAttribute("aria-label",n.label+(n.sub?", "+n.sub:"")+". Show details");
      g.addEventListener("click",e=>{ e.stopPropagation(); showNode(n.id); });
      g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.stopPropagation(); showNode(n.id); } });
      g.addEventListener("pointerenter",()=>focusNode(n.id)); g.addEventListener("pointerleave",()=>focusNode(selNode));
      gNodes.append(g); nodeEls[n.id]={g,n,c}; });
    svg.addEventListener("click",()=>hideInfo());
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!info.hidden) hideInfo(); });

    { const xs=scene.nodes.map(n=>n.x), ys=scene.nodes.map(n=>n.y); (scene.zones||[]).forEach(z=>{ xs.push(z.x,z.x+z.w); ys.push(z.y,z.y+z.h+20); });
      let x0=Math.min(...xs)-110, x1=Math.max(...xs)+120, y0=Math.min(...ys)-(scene.padTop||140), y1=Math.max(...ys)+70;
      x0=Math.max(0,x0); x1=Math.min(900,x1); y0=Math.max(0,y0); y1=Math.min(520,y1);
      if(y1-y0<340){ const c=(y0+y1)/2; y0=Math.max(0,c-170); y1=Math.min(520,y0+340); }
      svg.setAttribute("viewBox",x0+" "+y0+" "+(x1-x0)+" "+(y1-y0)); svg.style.setProperty("--wmin",Math.round((x1-x0)*0.66)+"px"); }
    /* ---- step rendering ---- */
    let flows=[];
    function setStep(k){
      i=Math.max(0,Math.min(scene.steps.length-1,k)); let S=scene.steps[i]; vt=0; hideInfo();
      if(scene._touched) (scene.try||[]).forEach(c=>{ const o=c.apply&&c.apply(tryState[c.id],i,S); if(o){ S=Object.assign({},S,o,{s:Object.assign({},S.s,o.s),b:Object.assign({},S.b,o.b),m:Object.assign({},S.m,o.m),mt:Object.assign({},S.mt,o.mt)}); if(o.b===null) S.b={}; } });
      curS=S;
      if(i>saved.max){ saved.max=i; try{ localStorage.setItem("cipherops-"+key,JSON.stringify(saved)); }catch(e){} }
      // metrics
      metricsEl.innerHTML=""; (scene.metrics||[]).forEach(m=>{ const v=(S.m&&S.m[m.id]!=null)?S.m[m.id]:(m.v!=null?m.v:"—"); const tone=(S.mt&&S.mt[m.id])||"";
        metricsEl.append(ael("div",{className:"wmet "+tone},ael("span",{},m.label),ael("b",{},String(v)))); });
      // nodes
      Object.values(nodeEls).forEach(({g,n})=>{ const st=(S.s&&S.s[n.id])||(S.dim&&S.dim.includes(n.id)?"dim":""); g.setAttribute("class","wnode "+st); });
      gTop.innerHTML="";
      Object.entries(S.b||{}).forEach(([id,txt])=>{ const n=nodes[id]; const k=KIND[n.kind||"block"]; const st=(S.s&&S.s[id])||"info"; const col=ST[st]||ST.info;
        const y=n.y-(n.kind==="user"?56:k.h+k.w/2+16), w=Math.max(46,txt.length*7.6+18);
        gTop.append(sv("g",{class:"wbadge"},sv("rect",{x:n.x-w/2,y:y-13,width:w,height:24,rx:12,fill:"#FFFDF9",stroke:col,"stroke-width":"2"}),sv("text",{x:n.x,y:y+4,"text-anchor":"middle",fill:col,class:"wbt"},txt))); });
      if(S.note){ const [x,y,t]=S.note; const w=Math.min(380,t.length*7.4+26); gTop.append(sv("g",{class:"wnote"},sv("rect",{x:x-w/2,y:y-15,width:w,height:30,rx:10,fill:"#FFFDF9",stroke:"#1B2A4A","stroke-width":"1.6"}),sv("text",{x,y:y+5,"text-anchor":"middle",class:"wnt"},t))); }
      // flows
      gFlows.innerHTML=""; gDots.innerHTML=""; flows=[];
      const rad=id=>{ const n=nodes[id]; return n.kind==="user"?20:KIND[n.kind||"block"].w*0.78; };
      (S.f||[]).forEach(FF=>{ const [a,b,type,label,o]=FF; const F={a,b,type,label,stop:(o&&o.stop!=null)?o.stop:1}; const A0=anchor(a),B0=anchor(b), col=FLOW[type]||FLOW.req, opt=o||{};
        const dx=B0.x-A0.x, dy=B0.y-A0.y, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, ra=rad(a), rb=rad(b);
        const A={x:A0.x+ux*ra,y:A0.y+uy*ra}, B={x:B0.x-ux*rb,y:B0.y-uy*rb};
        const stop=opt.stop!=null?opt.stop:1; const ex=A.x+(B.x-A.x)*stop, ey=A.y+(B.y-A.y)*stop;
        gFlows.append(sv("line",{x1:A.x,y1:A.y,x2:ex,y2:ey,stroke:col,"stroke-width":"2.4","stroke-linecap":"round","marker-end":stop<1?null:"url(#wa-"+type+"-"+mod.id+")","stroke-opacity":".85"}));
        if(stop<1) gTop.append(sv("g",{},sv("circle",{cx:ex,cy:ey,r:11,fill:"#FFFDF9",stroke:col,"stroke-width":"2"}),sv("text",{x:ex,y:ey+5,"text-anchor":"middle",fill:col,class:"wx"},"✕")));
        if(label){ const mx=(A.x+ex)/2, my=(A.y+ey)/2-12, w=label.length*6.6+16; gTop.append(sv("g",{class:"wflabel"},sv("rect",{x:mx-w/2,y:my-11,width:w,height:20,rx:6,fill:"#FFFDF9",stroke:col,"stroke-width":"1.2"}),sv("text",{x:mx,y:my+3,"text-anchor":"middle",class:"wfl",fill:col},label))); }
        const n=opt.n||3, dots=[]; for(let d=0;d<n;d++){ const c=sv("circle",{r:opt.r||5.5,fill:col,stroke:"#1B2A4A","stroke-width":"1.2"}); gDots.append(c); dots.push(c); }
        const hit=sv("line",{x1:A.x,y1:A.y,x2:ex,y2:ey,stroke:"transparent","stroke-width":"16",class:"whit",tabindex:"0",role:"button","aria-label":"Flow from "+nodes[a].label+" to "+nodes[b].label+(label?": "+label:"")});
        const showF=e=>{ e.stopPropagation(); showFlow(F,(A.x+ex)/2,(A.y+ey)/2); };
        hit.addEventListener("click",showF); hit.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); showF(e); } });
        gTop.append(hit); F.line=gFlows.lastChild||null;
        flows.push({A,ex,ey,dots,n,speed:opt.speed||0.55,stop,delay:opt.delay||0,a,b,F}); });
      // bar charts (live widgets)
      if(S.bars){ const B=S.bars, w=B.w||230, rowH=20, h=(B.items.length)*rowH+(B.title?22:6); const g=sv("g",{class:"wbars"}),x=B.x-w/2,y=B.y-h/2;
        g.append(sv("rect",{x,y,width:w,height:h+6,rx:10,fill:"#FFFDF9",stroke:"#1B2A4A","stroke-width":"1.4"}));
        if(B.title) g.append(sv("text",{x:x+10,y:y+16,class:"wbt",fill:"#1B2A4A"},B.title));
        const mx=Math.max(...B.items.map(it=>it[1]),1e-9);
        B.items.forEach((it,k)=>{ const yy=y+(B.title?24:8)+k*rowH, bw=(w-120)*(it[1]/mx), col=it[2]==="cut"?"#CBD5E1":it[2]==="pick"?"#14B8A6":"#8B5CF6";
          g.append(sv("text",{x:x+10,y:yy+12,class:"wfl",fill:"#1B2A4A"},it[0]),sv("rect",{x:x+70,y:yy+2,width:Math.max(2,bw),height:12,rx:3,fill:col}),sv("text",{x:x+w-10,y:yy+12,"text-anchor":"end",class:"wfl",fill:"#1B2A4A"},(it[1]*100).toFixed(it[1]<0.1?1:0)+"%")); });
        gTop.append(g); }
      // panel
      panel.innerHTML="";
      panel.append(...[ael("div",{className:"wp-top"},ael("span",{className:"mono"},"STEP "+(i+1)+" / "+scene.steps.length),S.tag?ael("span",{className:"wtag"},S.tag):null),
        ael("h3",{},S.t), ...S.p.map(p=>ael("p",{},rich(p))),
        S.k?ael("div",{className:"wkey"},ael("div",{className:"f-h"},"Key idea"),ael("p",{},rich(S.k))):null,
        S.tryNote?ael("div",{className:"wtrynote"},ael("div",{className:"f-h"},"With your setting"),ael("p",{},rich(S.tryNote))):null,
        ael("div",{className:"wnav"},ael("button",{className:"btn ghost",disabled:i===0,onclick:()=>setStep(i-1)},"← Back"),
          i<scene.steps.length-1?ael("button",{className:"btn primary",onclick:()=>setStep(i+1)},"Next: "+scene.steps[i+1].short+" →"):ael("button",{className:"btn primary",onclick:()=>opts.onDone&&opts.onDone()},opts.doneLabel||"Start the lab →")),
        ael("div",{className:"wkeys muted"},opts.keyHint||"← → step · 1–9 jump · R replay · Space pause · F full screen")].filter(Boolean));
      // rail
      rail.innerHTML=""; scene.steps.forEach((s,k)=>rail.append(ael("li",{className:(k===i?"cur ":"")+(k<=saved.max?"seen":"")},ael("button",{"aria-label":"Step "+(k+1)+": "+s.short,"aria-current":k===i?"step":null,onclick:()=>setStep(k)},ael("b",{},String(k+1))),k===i?ael("span",{},s.short):null)));
      A$(".wcount",railBox).textContent="Step "+(i+1)+" of "+scene.steps.length;
      // learn ticks
      const got=new Set(); scene.steps.forEach((s,k)=>{ if(k<=saved.max&&s.l!=null) got.add(s.l); });
      A$$("li",learn).forEach(li=>li.classList.toggle("on",got.has(+li.dataset.k)));
      if(opts.onStep) opts.onStep(i,saved.max);
      if(i===scene.steps.length-1&&opts.onComplete) opts.onComplete();
      if(paused){ vt=1200; lastNow=performance.now(); frame(lastNow); vt=1200; }
      if(selNode) focusNode(selNode);
    }
    /* ---- details popover ---- */
    const STW={ok:"working as intended / allowed",bad:"attacked, failing or blocked",warn:"needs attention",focus:"the focus of this step",dim:"not involved in this step"};
    function place(x,y){ const ctm=svg.getScreenCTM(), cr=canvas.getBoundingClientRect(); if(!ctm) return;
      const px=x*ctm.a+ctm.e-cr.left, py=y*ctm.d+ctm.f-cr.top; info.hidden=false;
      const w=info.offsetWidth, h=info.offsetHeight; let L=px+14, T=py-h/2;
      if(L+w>cr.width-6) L=px-w-14; if(L<6) L=Math.max(6,(cr.width-w)/2); T=Math.max(6,Math.min(cr.height-h-6,T));
      info.style.left=L+"px"; info.style.top=T+"px"; }
    function hideInfo(){ info.hidden=true; selNode=null; focusNode(null); }
    function focusNode(id){ Object.values(nodeEls).forEach(({g,n})=>g.classList.toggle("wsel",n.id===id));
      flows.forEach(fl=>{ if(fl.F.line) fl.F.line.style.opacity=id&&fl.a!==id&&fl.b!==id?".18":""; fl.dots.forEach(d=>d.style.opacity=id&&fl.a!==id&&fl.b!==id?".18":""); }); }
    function showNode(id){ const n=nodes[id], S=curS||scene.steps[i]; selNode=id; focusNode(id);
      const st=(S.s&&S.s[id])||(S.dim&&S.dim.includes(id)?"dim":""), badge=S.b&&S.b[id];
      const ins=(S.f||[]).filter(f=>f[1]===id), outs=(S.f||[]).filter(f=>f[0]===id);
      const li=(f,dir)=>ael("li",{},ael("i",{style:"background:"+(FLOW[f[2]]||FLOW.req)}),dir==="in"?"from "+nodes[f[0]].label:"to "+nodes[f[1]].label,": ",f[3]||LEG[f[2]]||f[2],(f[4]&&f[4].stop!=null&&f[4].stop<1)?" (stopped)":"");
      info.innerHTML="";
      info.append(...[ael("button",{className:"winfo-x","aria-label":"Close details",onclick:e=>{ e.stopPropagation(); hideInfo(); }},"✕"),
        ael("div",{className:"winfo-h"},n.label), n.sub?ael("div",{className:"winfo-sub"},n.sub):null,
        n.d?ael("p",{},rich(n.d)):null,
        ael("div",{className:"winfo-st "+(st||"idle")},ael("span",{},"Step "+(i+1)+": "),st?STW[st]:(ins.length||outs.length?"active in this step":"idle in this step")),
        badge?ael("div",{className:"winfo-b"},"“"+badge+"”"):null,
        ins.length||outs.length?ael("ul",{className:"winfo-fl"},ins.map(f=>li(f,"in")),outs.map(f=>li(f,"out"))):null].filter(Boolean));
      const a=anchor(id); place(a.x,a.y); }
    function showFlow(F,x,y){ info.innerHTML=""; selNode=null; focusNode(null);
      info.append(...[ael("button",{className:"winfo-x","aria-label":"Close details",onclick:e=>{ e.stopPropagation(); hideInfo(); }},"✕"),
        ael("div",{className:"winfo-h"},ael("i",{className:"winfo-dot",style:"background:"+(FLOW[F.type]||FLOW.req)}),nodes[F.a].label+" → "+nodes[F.b].label),
        ael("div",{className:"winfo-sub"},LEG[F.type]||F.type),
        F.label?ael("p",{},ael("code",{},F.label)):null,
        F.stop<1?ael("div",{className:"winfo-st bad"},"Stopped before it arrives"):ael("div",{className:"winfo-st ok"},"Arrives at "+nodes[F.b].label)].filter(Boolean));
      place(x,y); }
    let lastNow=performance.now(), vt=0;
    function frame(now){ vt+=Math.max(0,Math.min(100,now-lastNow))*speedMul; lastNow=now; const el=(t0===null?0:vt)/1000;
      flows.forEach(F=>{ F.dots.forEach((d,k)=>{ let p=((el-F.delay)*F.speed+k/F.n)%1; if(el<F.delay) p=-1;
        if(p<0){ d.setAttribute("opacity","0"); return; }
        const q=p*F.stop; const x=F.A.x+(F.ex-F.A.x)*(q/F.stop||0), y=F.A.y+(F.ey-F.A.y)*(q/F.stop||0);
        d.setAttribute("cx",x.toFixed(1)); d.setAttribute("cy",y.toFixed(1)); d.setAttribute("opacity",p>.92?((1-p)/.08).toFixed(2):"1"); }); }); }
    function loop(now){ if(!alive) return; if(!document.body.contains(root)){ alive=false; document.removeEventListener("keydown",onKey); return; } if(!paused) frame(performance.now()); raf=requestAnimationFrame(loop); }
    function togglePause(){ paused=!paused; btnPause.textContent=paused?"▶":"❚❚"; btnPause.setAttribute("aria-label",paused?"Play animation":"Pause animation"); }
    function onKey(e){ if(!document.body.contains(root)) return; if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey) return;
      if(opts.scopedKeys&&!root.contains(document.activeElement)) return;
      if(e.key==="f"||e.key==="F"){ toggleFull(); e.preventDefault(); return; }
      if(/^[1-9]$/.test(e.key)&&+e.key<=scene.steps.length){ setStep(+e.key-1); e.preventDefault(); return; }
      if(e.key==="ArrowRight"){ setStep(i+1); e.preventDefault(); } else if(e.key==="ArrowLeft"){ setStep(i-1); e.preventDefault(); }
      else if(e.key==="r"||e.key==="R"){ vt=0; } else if(e.key===" "&&root.contains(document.activeElement)||e.key===" "&&document.activeElement===document.body){ togglePause(); e.preventDefault(); } }
    document.addEventListener("keydown",onKey);
    if(reduced) btnPause.textContent="▶";
    setStep(i); raf=requestAnimationFrame(loop);
    return {setStep,get step(){ return i; },frame,destroy(){ alive=false; cancelAnimationFrame(raf); document.removeEventListener("keydown",onKey); }};
  }
  return {render};
})();

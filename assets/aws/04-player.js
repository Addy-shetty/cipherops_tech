/* cipherops_tech — step-through animated walkthrough player (isometric SVG) */
"use strict";
const WALK=(()=>{
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
    const btnReplay=ael("button",{className:"wbtn",title:"Replay this step (R)","aria-label":"Replay this step",onclick:()=>{ t0=performance.now(); }},"↺");
    const btnPause=ael("button",{className:"wbtn",title:"Pause (Space)","aria-label":"Pause animation",onclick:()=>togglePause()},"❚❚");
    const rail=ael("ol",{className:"wrail","aria-label":"Steps"});
    const stage=ael("div",{className:"wstage card"},metricsEl,ael("div",{className:"wcanvas"},svg,ael("div",{className:"wctl"},btnReplay,btnPause)),legend);
    const railBox=ael("div",{className:"wrailbox card"},ael("div",{className:"wrail-h"},ael("span",{},"In this walkthrough"),ael("span",{className:"wcount"})),rail);
    const panel=ael("div",{className:"wpanel card"});
    const learn=ael("div",{className:"wlearn card"},ael("div",{className:"f-h"},"You'll learn"),ael("ul",{},scene.learn.map((l,k)=>ael("li",{"data-k":k},ael("span",{className:"box"}),l))));
    root.append(ael("div",{className:"wmain"},stage,railBox),ael("aside",{className:"wside"},panel,learn));
    host.append(root);

    /* ---- static scene ---- */
    (scene.edges||[]).forEach(([a,b])=>{ const A=anchor(a),B=anchor(b); gEdges.append(sv("line",{x1:A.x,y1:A.y,x2:B.x,y2:B.y,stroke:"currentColor","stroke-opacity":".16","stroke-width":"1.5","stroke-dasharray":"4 5"})); });
    (scene.zones||[]).forEach(z=>{ gEdges.prepend(sv("g",{},sv("path",{d:"M"+z.x+" "+(z.y+z.h/2)+" L"+(z.x+z.w/2)+" "+z.y+" L"+(z.x+z.w)+" "+(z.y+z.h/2)+" L"+(z.x+z.w/2)+" "+(z.y+z.h)+" Z",fill:z.c||"currentColor","fill-opacity":".06",stroke:z.c||"currentColor","stroke-opacity":".35","stroke-dasharray":"6 6"}),
      sv("text",{x:z.x+z.w/2,y:z.y+z.h+16,"text-anchor":"middle",class:"wzone"},z.label))); });
    const nodeEls={};
    scene.nodes.forEach(n=>{ const k=KIND[n.kind||"block"], c=n.c||GROUPS[mod.group].c, g=sv("g",{class:"wnode"});
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
      g.append(sv("text",{x:n.x,y:n.y+(n.kind==="user"?22:(KIND[n.kind||"block"].w/2+20)),"text-anchor":"middle",class:"wlabel"},n.label),
        n.sub?sv("text",{x:n.x,y:n.y+(n.kind==="user"?36:(KIND[n.kind||"block"].w/2+34)),"text-anchor":"middle",class:"wsub"},n.sub):null);
      gNodes.append(g); nodeEls[n.id]={g,n,c}; });

    { const xs=scene.nodes.map(n=>n.x), ys=scene.nodes.map(n=>n.y); (scene.zones||[]).forEach(z=>{ xs.push(z.x,z.x+z.w); ys.push(z.y,z.y+z.h+20); });
      let x0=Math.min(...xs)-110, x1=Math.max(...xs)+120, y0=Math.min(...ys)-140, y1=Math.max(...ys)+70;
      x0=Math.max(0,x0); x1=Math.min(900,x1); y0=Math.max(0,y0); y1=Math.min(520,y1);
      if(y1-y0<340){ const c=(y0+y1)/2; y0=Math.max(0,c-170); y1=Math.min(520,y0+340); }
      svg.setAttribute("viewBox",x0+" "+y0+" "+(x1-x0)+" "+(y1-y0)); }
    /* ---- step rendering ---- */
    let flows=[];
    function setStep(k){
      i=Math.max(0,Math.min(scene.steps.length-1,k)); const S=scene.steps[i]; t0=performance.now();
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
      (S.f||[]).forEach(F=>{ const [a,b,type,label,o]=F; const A0=anchor(a),B0=anchor(b), col=FLOW[type]||FLOW.req, opt=o||{};
        const dx=B0.x-A0.x, dy=B0.y-A0.y, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L, ra=rad(a), rb=rad(b);
        const A={x:A0.x+ux*ra,y:A0.y+uy*ra}, B={x:B0.x-ux*rb,y:B0.y-uy*rb};
        const stop=opt.stop!=null?opt.stop:1; const ex=A.x+(B.x-A.x)*stop, ey=A.y+(B.y-A.y)*stop;
        gFlows.append(sv("line",{x1:A.x,y1:A.y,x2:ex,y2:ey,stroke:col,"stroke-width":"2.4","stroke-linecap":"round","marker-end":stop<1?null:"url(#wa-"+type+"-"+mod.id+")","stroke-opacity":".85"}));
        if(stop<1) gTop.append(sv("g",{},sv("circle",{cx:ex,cy:ey,r:11,fill:"#FFFDF9",stroke:col,"stroke-width":"2"}),sv("text",{x:ex,y:ey+5,"text-anchor":"middle",fill:col,class:"wx"},"✕")));
        if(label){ const mx=(A.x+ex)/2, my=(A.y+ey)/2-12, w=label.length*6.6+16; gFlows.append(sv("g",{},sv("rect",{x:mx-w/2,y:my-11,width:w,height:20,rx:6,fill:"#FFFDF9",stroke:col,"stroke-width":"1.2"}),sv("text",{x:mx,y:my+3,"text-anchor":"middle",class:"wfl",fill:col},label))); }
        const n=opt.n||3, dots=[]; for(let d=0;d<n;d++){ const c=sv("circle",{r:opt.r||5.5,fill:col,stroke:"#1B2A4A","stroke-width":"1.2"}); gDots.append(c); dots.push(c); }
        flows.push({A,ex,ey,dots,n,speed:opt.speed||0.55,stop,delay:opt.delay||0}); });
      // panel
      panel.innerHTML="";
      panel.append(...[ael("div",{className:"wp-top"},ael("span",{className:"mono"},"STEP "+(i+1)+" / "+scene.steps.length),S.tag?ael("span",{className:"wtag"},S.tag):null),
        ael("h3",{},S.t), ...S.p.map(p=>ael("p",{},rich(p))),
        S.k?ael("div",{className:"wkey"},ael("div",{className:"f-h"},"Key idea"),ael("p",{},rich(S.k))):null,
        ael("div",{className:"wnav"},ael("button",{className:"btn ghost",disabled:i===0,onclick:()=>setStep(i-1)},"← Back"),
          i<scene.steps.length-1?ael("button",{className:"btn primary",onclick:()=>setStep(i+1)},"Next: "+scene.steps[i+1].short+" →"):ael("button",{className:"btn primary",onclick:()=>opts.onDone&&opts.onDone()},opts.doneLabel||"Start the lab →")),
        ael("div",{className:"wkeys muted"},"← → step · R replay · Space pause")].filter(Boolean));
      // rail
      rail.innerHTML=""; scene.steps.forEach((s,k)=>rail.append(ael("li",{className:(k===i?"cur ":"")+(k<=saved.max?"seen":"")},ael("button",{"aria-label":"Step "+(k+1)+": "+s.short,"aria-current":k===i?"step":null,onclick:()=>setStep(k)},ael("b",{},String(k+1))),k===i?ael("span",{},s.short):null)));
      A$(".wcount",railBox).textContent="Step "+(i+1)+" of "+scene.steps.length;
      // learn ticks
      const got=new Set(); scene.steps.forEach((s,k)=>{ if(k<=saved.max&&s.l!=null) got.add(s.l); });
      A$$("li",learn).forEach(li=>li.classList.toggle("on",got.has(+li.dataset.k)));
      if(i===scene.steps.length-1&&opts.onComplete) opts.onComplete();
      if(paused) frame(performance.now()+1200);
    }
    function frame(now){ const el=(now-t0)/1000;
      flows.forEach(F=>{ F.dots.forEach((d,k)=>{ let p=((el-F.delay)*F.speed+k/F.n)%1; if(el<F.delay) p=-1;
        if(p<0){ d.setAttribute("opacity","0"); return; }
        const q=p*F.stop; const x=F.A.x+(F.ex-F.A.x)*(q/F.stop||0), y=F.A.y+(F.ey-F.A.y)*(q/F.stop||0);
        d.setAttribute("cx",x.toFixed(1)); d.setAttribute("cy",y.toFixed(1)); d.setAttribute("opacity",p>.92?((1-p)/.08).toFixed(2):"1"); }); }); }
    function loop(now){ if(!alive) return; if(!document.body.contains(root)){ alive=false; document.removeEventListener("keydown",onKey); return; } if(!paused) frame(performance.now()); raf=requestAnimationFrame(loop); }
    function togglePause(){ paused=!paused; btnPause.textContent=paused?"▶":"❚❚"; btnPause.setAttribute("aria-label",paused?"Play animation":"Pause animation"); }
    function onKey(e){ if(!document.body.contains(root)) return; if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if(e.key==="ArrowRight"){ setStep(i+1); e.preventDefault(); } else if(e.key==="ArrowLeft"){ setStep(i-1); e.preventDefault(); }
      else if(e.key==="r"||e.key==="R"){ t0=performance.now(); } else if(e.key===" "&&root.contains(document.activeElement)||e.key===" "&&document.activeElement===document.body){ togglePause(); e.preventDefault(); } }
    document.addEventListener("keydown",onKey);
    if(reduced) btnPause.textContent="▶";
    setStep(i); raf=requestAnimationFrame(loop);
    return {setStep,get step(){ return i; },frame,destroy(){ alive=false; cancelAnimationFrame(raf); document.removeEventListener("keydown",onKey); }};
  }
  return {render};
})();

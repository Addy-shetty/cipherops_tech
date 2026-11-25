/* cipherops_tech — Foundations page app: routing, lesson sheet, widgets, missions, reference, progress */
"use strict";
(function(){
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>[...(r||document).querySelectorAll(s)];
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEY="cipherops-foundations";
let P={done:{},m:{},quiz:{},last:null};try{P={...P,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
function toast(m){const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2200)}

const TRACKS=[{id:"net",n:"How the internet works",short:"Internet",lessons:NET_LESSONS,blurb:"Packets, IP, ports, DNS, HTTP, TLS, the layer models, and what happens when you type a URL."},
 {id:"linux",n:"Linux: 100 commands",short:"Linux",lessons:LINUX_LESSONS,blurb:"Ten lessons, ten commands each, all practised in a simulated terminal. From pwd to a firewall."}];
TRACKS.forEach(t=>t.lessons.forEach(l=>l.track=t));
const ALL=TRACKS.flatMap(t=>t.lessons);
const byId=id=>ALL.find(l=>l.id==id);
const missionsDone=l=>(P.m[l.id]||[]).length;
const quizDone=l=>Object.keys(P.quiz[l.id]||{}).length;
const state=l=>P.done[l.id]?"done":(missionsDone(l)||quizDone(l))?"prog":"todo";
const GLYPH={done:'<svg class="sg" viewBox="0 0 14 14" aria-label="done"><circle cx="7" cy="7" r="6.5" fill="currentColor"/><path d="M4 7.2l2 2 4-4.4" stroke="var(--card)" stroke-width="1.8" fill="none"/></svg>',
 prog:'<svg class="sg" viewBox="0 0 14 14" aria-label="in progress"><circle cx="7" cy="7" r="5.8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 1.2a5.8 5.8 0 0 1 0 11.6z" fill="currentColor"/></svg>',
 todo:'<svg class="sg" viewBox="0 0 14 14" aria-label="not started"><circle cx="7" cy="7" r="5.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>'};
const lessonCmds=l=>FOUND_CMDS.filter(c=>c.g==l.id);
function maybeDone(l){if(P.done[l.id])return;if(missionsDone(l)>=l.missions.length&&quizDone(l)>=l.quiz.length){P.done[l.id]=true;save();toast("Lesson complete ✓");drawSide();drawHdr()}}

/* ---------- one terminal, shared across lessons ---------- */
const termHost=document.createElement("div");let term=null,curLesson=null;
function ensureTerm(){if(term)return term;term=SHELL.create(termHost,{onRun:(ev,T)=>{const l=curLesson;if(!l||!l.missions)return;const got=P.m[l.id]||(P.m[l.id]=[]);
  l.missions.forEach((m,i)=>{if(got.includes(i))return;let ok=false;try{ok=m.c(ev,T)}catch(e){}if(ok){got.push(i);save();toast("✓ "+m.t);const row=$(`#mis [data-i="${i}"]`);if(row)row.classList.add("done");drawMisCount(l);drawSide();maybeDone(l)}})},onReset:()=>toast("Terminal reset to a fresh lab box")});return term}

/* ---------- header progress ---------- */
function drawHdr(){const d=ALL.filter(l=>P.done[l.id]).length;$("#fCount").textContent=d+"/"+ALL.length;$("#fBar").style.width=Math.round(d/ALL.length*100)+"%"}

/* ---------- sidebar ---------- */
function drawSide(){const cur=curLesson&&curLesson.id;
 $("#fSide").innerHTML=`<a class="fs-home${!cur&&location.hash!="#commands"?" on":""}" href="#">Foundations home</a>`+TRACKS.map(t=>{const d=t.lessons.filter(l=>P.done[l.id]).length;
  return `<div class="fs-track"><div class="fs-th"><span>${t.n}</span><span class="mono">${d}/${t.lessons.length}</span></div><div class="fs-meter">${t.lessons.map(l=>`<i class="${P.done[l.id]?"d":""}"></i>`).join("")}</div><ol>${t.lessons.map((l,i)=>`<li><a href="#${l.id}" class="st-${state(l)}${l.id==cur?" on":""}">${GLYPH[state(l)]}<span>${i+1}. ${esc(l.title)}</span></a></li>`).join("")}</ol></div>`}).join("")+
  `<a class="fs-ref${location.hash=="#commands"?" on":""}" href="#commands">⌘ All 100 commands</a>`}

/* ---------- home ---------- */
function home(){curLesson=null;const main=$("#fMain");const last=P.last&&byId(P.last);const first=ALL.find(l=>!P.done[l.id])||ALL[0];const go=last&&!P.done[last.id]?last:first;
 main.innerHTML=`<section class="f-hero"><div><p class="eyebrow">Foundations · start here</p><h1>How the internet works, and Linux from zero</h1>
  <p class="lede">Before attacking or defending anything, you need the ground it stands on. Two tracks: follow a packet from your laptop to a server and back, then learn 100 Linux commands by typing them into a safe, simulated terminal.</p>
  <div class="ctas"><a class="btn primary" href="#${go.id}">${P.last?"Continue":"Start"}: ${esc(go.title)} →</a><a class="btn ghost" href="#commands">Browse all 100 commands</a></div></div>
  <div class="f-hero-term" aria-hidden="true"><div class="fht-bar"><i></i><i></i><i></i></div><pre class="mono">student@lab:~$ dig example.com +short\n93.184.215.14\nstudent@lab:~$ curl -I https://cipherops.lab\nHTTP/1.1 200 OK\nStrict-Transport-Security: max-age=63072000\nSet-Cookie: session=7f3a9c; Secure; HttpOnly\nstudent@lab:~$ <span class="cur">▌</span></pre></div></section>
  <section class="f-tracks">${TRACKS.map(t=>{const d=t.lessons.filter(l=>P.done[l.id]).length;return `<article class="card f-track"><div class="ft-top"><h2>${t.n}</h2><span class="mono">${d}/${t.lessons.length}</span></div><p class="muted">${t.blurb}</p><div class="fs-meter big">${t.lessons.map(l=>`<i class="${P.done[l.id]?"d":""}"></i>`).join("")}</div>
   <ol class="ft-list">${t.lessons.map((l,i)=>`<li><a href="#${l.id}" class="st-${state(l)}">${GLYPH[state(l)]}<span>${i+1}. ${esc(l.title)}</span><span class="muted mono">${l.min} min</span></a></li>`).join("")}</ol></article>`}).join("")}</section>
  <section class="card f-after"><h3>Then carry on to Security Basics</h3><p class="muted" style="margin:6px 0 12px">The CIA triad, threat modelling, proxies and pentest methodology build straight on these.</p><a class="btn sm" href="/">Go to Security Basics →</a></section>`;
 drawSide();window.scrollTo(0,0)}

/* ---------- reference: all 100 commands ---------- */
function reference(){curLesson=null;const main=$("#fMain");const groups=LINUX_LESSONS.map(l=>[l.id,l.title]);
 main.innerHTML=`<section class="f-refhead"><p class="eyebrow">Reference</p><h1>100 Linux commands</h1><p class="lede">Search by name or by what you want to do. Press <b>Try</b> to type an example into the terminal at the bottom of the page.</p>
  <div class="f-refbar"><input id="rq" type="search" placeholder="Search: e.g. permissions, ports, compress, grep" aria-label="Search commands"><div class="chips" id="rg"><button type="button" class="fchip on" data-g="">All</button>${groups.map(([id,t])=>`<button type="button" class="fchip" data-g="${id}">${esc(t.replace(/:.*$/,""))}</button>`).join("")}</div></div><p class="muted mono" id="rc"></p></section>
  <div class="f-refgrid" id="rl"></div><section class="f-refterm"><h3>Terminal</h3><div id="refTerm"></div></section>`;
 let g="";const draw=()=>{const q=$("#rq").value.trim().toLowerCase();const r=FOUND_CMDS.filter(c=>(!g||c.g==g)&&(!q||(c.c+" "+c.d+" "+c.s+" "+(c.sec||"")+" "+c.e.map(x=>x.join(" ")).join(" ")).toLowerCase().includes(q)));
  $("#rc").textContent=r.length+" of 100";$("#rl").innerHTML=r.map(cmdCard).join("")||'<p class="muted">No command matches. Try a simpler word.</p>'};
 $("#rq").oninput=draw;$("#rg").onclick=e=>{const b=e.target.closest("button");if(!b)return;g=b.dataset.g;$$("#rg .fchip").forEach(x=>x.classList.toggle("on",x==b));draw()};
 $("#rl").onclick=tryClick;draw();const t=ensureTerm();$("#refTerm").append(termHost);drawSide();window.scrollTo(0,0)}
const cmdCard=c=>`<article class="cmdc" id="cmd-${esc(c.c)}"><div class="cmdc-h"><code class="cn">${esc(c.c)}</code><span>${esc(c.d)}</span></div><code class="syn">${esc(c.s)}</code>
 <ul>${c.e.map(([x,m])=>`<li><code>${esc(x)}</code><button type="button" class="try" data-cmd="${esc(x.replace(/\s+\(.*\)$/,"").replace(/^(.*?)\s{2,}.*$/,"$1"))}">Try</button><span class="muted">${esc(m)}</span></li>`).join("")}</ul>${c.sec?`<p class="cmdc-sec"><b>Security:</b> ${esc(c.sec)}</p>`:""}</article>`;
function tryClick(e){const b=e.target.closest(".try");if(!b)return;const t=ensureTerm();t.type(b.dataset.cmd);termHost.scrollIntoView({behavior:"smooth",block:"center"})}

/* ---------- lesson ---------- */
let walker=null,io=null;
function lesson(id){const l=byId(id);if(!l)return home();curLesson=l;P.last=id;save();const t=l.track,idx=t.lessons.indexOf(l),next=t.lessons[idx+1]||(t.id=="net"?LINUX_LESSONS[0]:null),isNet=t.id=="net";
 const S=[["goal","Goal"],["how","How it works"],[isNet?"explore":"cmds",isNet?"Explore":"The 10 commands"],["try","Try it"],["why",isNet?"Why it matters":"Security angle"],["check","Check"],["next","Next up"]];
 const main=$("#fMain");
 main.innerHTML=`<header class="f-lhead"><a class="f-back" href="#">← Foundations</a><div class="meta"><span class="tag basic">${esc(t.short)}</span><span>Lesson ${idx+1} of ${t.lessons.length}</span><span>⏱ ${l.min} min</span><span class="f-st st-${state(l)}" id="lst">${GLYPH[state(l)]} ${state(l)=="done"?"Done":state(l)=="prog"?"In progress":"Not started"}</span></div><h1>${esc(l.title)}</h1></header>
 <nav class="f-dock" aria-label="Sections"><div class="f-chips">${S.map(([k,n],i)=>`<a class="fchip" href="#${l.id}" data-s="${k}">${i+1} ${n}</a>`).join("")}</div><i class="f-read" id="fRead"></i></nav>
 <article class="f-sheet">
  <section class="f-sec" data-s="goal"><span class="via">1</span><h2>Goal</h2><p class="lede">${l.goal}</p><h3 class="f-sub">You'll learn</h3><ul class="f-learn">${l.learn.map(x=>`<li>${x}</li>`).join("")}</ul></section>
  <section class="f-sec" data-s="how"><span class="via">2</span><h2>How it works</h2>${l.intro.map(p=>`<p class="f-p">${p}</p>`).join("")}${l.scene?`<div class="walkhost" id="walk"></div>`:""}</section>
  <section class="f-sec" data-s="${isNet?"explore":"cmds"}"><span class="via">3</span>${isNet?`<h2>Explore it yourself</h2><div id="wid" class="f-wid"></div>`:`<h2>The 10 commands</h2><p class="muted">Press <b>Try</b> to type an example into the terminal below.</p><div class="f-refgrid">${lessonCmds(l).map(cmdCard).join("")}</div>`}</section>
  <section class="f-sec" data-s="try"><span class="via">4</span><h2>Try it: commands, in order</h2><p class="muted">Tasks tick themselves off when the terminal sees you do them. Stuck? Show the hint, then press <b>Type it</b>. Everything runs in your browser on a pretend machine.</p>
   <table class="f-mis" id="mis"><thead><tr><th>#</th><th>Task</th><th>Command</th><th><span class="sr">Status</span></th></tr></thead><tbody>${l.missions.map((m,i)=>`<tr data-i="${i}" class="${(P.m[l.id]||[]).includes(i)?"done":""}"><td>${i+1}</td><td>${esc(m.t)}</td><td><button type="button" class="mhint btn sm ghost" data-i="${i}">Show hint</button><span class="hcode" hidden><code>${esc(m.h)}</code><button type="button" class="try" data-cmd="${esc(m.h.split(/\s+then\s+/)[0])}">Type it</button></span></td><td class="tick">${GLYPH.done}</td></tr>`).join("")}</tbody></table>
   <p class="muted mono" id="misCount"></p><div id="lTerm"></div></section>
  <section class="f-sec" data-s="why"><span class="via">5</span><h2>${isNet?"Why it matters for security":"The security angle"}</h2><div class="f-why">${isNet?l.why.map(([h,p])=>`<div class="card"><h3>${h}</h3><p>${p}</p></div>`).join(""):lessonCmds(l).filter(c=>c.sec).map(c=>`<div class="card"><h3><code>${esc(c.c)}</code></h3><p>${esc(c.sec)}</p></div>`).join("")}</div></section>
  <section class="f-sec" data-s="check"><span class="via">6</span><h2>Quick check</h2><div id="quiz"></div></section>
  <section class="f-sec" data-s="next"><span class="via">7</span><div class="f-next"><div><h2>${next?"Next up: "+esc(next.title):"Track complete"}</h2><p class="muted">${next?(next.track!=t?"Next track: "+esc(next.track.n):"Lesson "+(idx+2)+" of "+t.lessons.length):"Carry on to Security Basics on the main site."}</p></div>
   <div class="ctas"><button type="button" class="btn ghost" id="markDone">${P.done[l.id]?"✓ Marked complete":"Mark complete"}</button>${next?`<a class="btn primary" href="#${next.id}">Continue →</a>`:`<a class="btn primary" href="/">Security Basics →</a>`}</div></div></section>
 </article>`;
 // walkthrough
 if(walker&&walker.destroy)try{walker.destroy()}catch(e){}walker=null;
 if(l.scene&&typeof WALK!="undefined"){try{walker=WALK.render({id:"found-"+l.id,color:"#0D9488"},{...l.scene,learn:l.scene.learn||l.learn,steps:l.scene.steps.map(st=>({...st,t:md(st.t),k:md(st.k),p:st.p.map(md)}))},$("#walk"),{scopedKeys:true,doneLabel:isNet?"Explore it yourself ↓":"Try it ↓",onDone:()=>{const s=$(`.f-sec[data-s="${isNet?"explore":"try"}"]`);s&&s.scrollIntoView({behavior:"smooth"})}})}catch(e){console.error(e);$("#walk").textContent="This animation couldn't load. The text above covers the same steps."}}
 if(isNet&&l.widget){try{WIDGETS[l.widget]($("#wid"))}catch(e){console.error(e);$("#wid").textContent="This tool couldn't load."}}
 // terminal + missions
 ensureTerm();$("#lTerm").append(termHost);drawMisCount(l);
 $("#mis").onclick=e=>{const h=e.target.closest(".mhint");if(h){h.hidden=true;h.nextElementSibling.hidden=false;return}tryClick(e)};
 $$(".f-refgrid").forEach(g=>g.onclick=tryClick);
 drawQuiz(l);
 $("#markDone").onclick=()=>{P.done[l.id]=true;save();$("#markDone").textContent="✓ Marked complete";drawSide();drawHdr();setState(l)};
 // section nav
 if(io)io.disconnect();io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){$$(".f-sec").forEach(s=>s.classList.toggle("on",s==en.target));$$(".f-chips .fchip").forEach(c=>c.classList.toggle("on",c.dataset.s==en.target.dataset.s))}}),{rootMargin:"-30% 0px -60% 0px"});$$(".f-sec").forEach(s=>io.observe(s));
 $(".f-chips").onclick=e=>{const c=e.target.closest(".fchip");if(!c)return;e.preventDefault();const s=$(`.f-sec[data-s="${c.dataset.s}"]`);s&&s.scrollIntoView({behavior:"smooth"})};
 drawSide();window.scrollTo(0,0)}
const md=x=>x==null?x:String(x).replace(/<code>(.*?)<\/code>/g,"`$1`").replace(/<b>(.*?)<\/b>/g,"**$1**").replace(/<i>(.*?)<\/i>/g,"*$1*").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
function setState(l){const s=$("#lst");if(s){const st=state(l);s.className="f-st st-"+st;s.innerHTML=GLYPH[st]+" "+(st=="done"?"Done":st=="prog"?"In progress":"Not started")}}
function drawMisCount(l){const c=$("#misCount");if(c)c.textContent=missionsDone(l)+" of "+l.missions.length+" tasks done";setState(l)}
function drawQuiz(l){const box=$("#quiz"),A=P.quiz[l.id]||{};box.innerHTML=l.quiz.map((q,i)=>`<div class="f-q"><b>${i+1}. ${esc(q[0])}</b><div class="opts">${q[1].map((o,j)=>`<button type="button" data-q="${i}" data-o="${j}" class="${A[i]==null?"":j==q[2]?"right":j==A[i]?"wrong":""}">${esc(o)}</button>`).join("")}</div>${A[i]!=null?`<p class="fb"><b>${A[i]==q[2]?"Right.":"Not quite."}</b> ${esc(q[3])}</p>`:""}</div>`).join("");
 box.onclick=e=>{const b=e.target.closest("button");if(!b)return;(P.quiz[l.id]||(P.quiz[l.id]={}))[b.dataset.q]=+b.dataset.o;save();drawQuiz(l);setState(l);drawSide();maybeDone(l)}}

/* ---------- widgets ---------- */
const WIDGETS={
 packets(host){host.innerHTML=`<p class="muted">Type a message and watch it travel as packets. Real packets carry up to about 1,500 bytes; these are tiny so you can see them.</p>
  <div class="w-row"><label>Message <input id="pm" value="Hello from my laptop to example.com!"></label><label>Bytes per packet <input id="ps" type="range" min="4" max="16" value="8"><span id="psv" class="mono">8</span></label></div>
  <div class="w-row"><button type="button" class="btn sm" id="pShuf">Send across the internet (scramble order)</button><button type="button" class="btn sm primary" id="pFix">Reassemble with TCP</button></div><div class="pk-wrap" id="pk"></div><p class="mono" id="pOut"></p>`;
  let order=null;const draw=()=>{const m=$("#pm",host).value,n=+$("#ps",host).value;$("#psv",host).textContent=n;const parts=[];for(let i=0;i<m.length;i+=n)parts.push(m.slice(i,i+n));if(!order||order.length!=parts.length)order=parts.map((_,i)=>i);
   $("#pk",host).innerHTML=order.map(i=>`<div class="pk"><span class="mono pk-h">src 192.168.1.20 → dst 93.184.215.14 · seq ${i+1}/${parts.length}</span><span class="mono pk-b">${esc(parts[i])}</span></div>`).join("");
   $("#pOut",host).textContent="Received: "+order.map(i=>parts[i]).join("")};
  $("#pm",host).oninput=()=>{order=null;draw()};$("#ps",host).oninput=()=>{order=null;draw()};
  $("#pShuf",host).onclick=()=>{order=order.slice().sort(()=>Math.random()-.5);draw()};$("#pFix",host).onclick=()=>{order=order.slice().sort((a,b)=>a-b);draw()};draw()},
 ipcalc(host){host.innerHTML=`<p class="muted">Type any IPv4 address with a prefix. Try 192.168.1.20/24, 10.0.0.5/8, 169.254.169.254/16 or 8.8.8.8/32.</p>
  <div class="w-row"><label>Address/prefix <input id="ia" value="192.168.1.20/24" class="mono"></label><label>Prefix <input id="ip" type="range" min="8" max="32" value="24"><span id="ipv" class="mono">/24</span></label></div><div id="io"></div>`;
  const ia=$("#ia",host),ipr=$("#ip",host);const toN=s=>s.split(".").reduce((a,x)=>a*256+(+x),0),toS=n=>[24,16,8,0].map(k=>Math.floor(n/2**k)%256).join(".");
  const kind=n=>{const s=toS(n),[a,b]=s.split(".").map(Number);if(a==10||(a==172&&b>=16&&b<=31)||(a==192&&b==168))return["Private","Only inside a local network. Needs NAT to reach the internet.","ok"];if(a==127)return["Loopback","This machine talking to itself.","ok"];if(a==169&&b==254)return["Link-local","Includes 169.254.169.254, the cloud metadata service: a top SSRF target.","warn"];if(a==100&&b>=64&&b<=127)return["Carrier-grade NAT","Shared by an ISP's NAT.","ok"];if(a>=224)return["Multicast or reserved","Not a normal host address.","warn"];return["Public","Reachable on the internet.","info"]};
  const draw=()=>{const m=ia.value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/);const o=$("#io",host);
   if(!m||m.slice(1,5).some(x=>+x>255)||(m[5]&&+m[5]>32)){o.innerHTML='<p class="w-bad">That isn\'t a valid IPv4 address. Four numbers 0–255, like 192.168.1.20/24.</p>';return}
   const pre=m[5]!=null?+m[5]:+ipr.value;ipr.value=pre;$("#ipv",host).textContent="/"+pre;const n=toN(m.slice(1,5).join(".")),mask=pre==0?0:(2**32-2**(32-pre)),net=Math.floor(n/2**(32-pre))*2**(32-pre),bc=net+2**(32-pre)-1,hosts=pre>=31?(pre==32?1:2):2**(32-pre)-2,[kn,kd,kc]=kind(n);
   const bits=n.toString(2).padStart(32,"0");const bin=bits.split("").map((b,i)=>`<span class="${i<pre?"nb":"hb"}">${b}</span>${i%8==7&&i<31?".":""}`).join("");
   o.innerHTML=`<div class="w-grid"><div><b>Network</b><span class="mono">${toS(net)}/${pre}</span></div><div><b>Subnet mask</b><span class="mono">${toS(mask)}</span></div><div><b>First host</b><span class="mono">${pre>=31?toS(net):toS(net+1)}</span></div><div><b>Last host</b><span class="mono">${pre>=31?toS(bc):toS(bc-1)}</span></div><div><b>Broadcast</b><span class="mono">${pre>=31?"—":toS(bc)}</span></div><div><b>Usable hosts</b><span class="mono">${hosts.toLocaleString()}</span></div></div>
    <p class="mono w-bin" aria-label="Binary">${bin}</p><p class="muted"><span class="nbk"></span> network bits (${pre}) <span class="hbk"></span> host bits (${32-pre})</p><p class="w-${kc}"><b>${kn}.</b> ${kd}</p>`};
  ia.oninput=draw;ipr.oninput=()=>{ia.value=ia.value.replace(/\/\d+$/,"").trim()+"/"+ipr.value;draw()};draw()},
 ports(host){const P=[[20,"TCP","FTP data","Old, unencrypted file transfer."],[21,"TCP","FTP","Sends passwords in clear text. Prefer SFTP."],[22,"TCP","SSH","Remote login. Constantly brute-forced; use keys."],[23,"TCP","Telnet","Unencrypted remote login. Should never be open."],[25,"TCP","SMTP","Mail between servers. Open relays send spam."],[53,"UDP/TCP","DNS","Name lookups. Abused for amplification and tunnelling."],[67,"UDP","DHCP","Hands out addresses. Rogue DHCP can redirect traffic."],[80,"TCP","HTTP","Web, unencrypted. Should redirect to 443."],[110,"TCP","POP3","Old mail download, often unencrypted."],[123,"UDP","NTP","Time sync. Correct time matters for logs and TLS."],[143,"TCP","IMAP","Mail access. Use 993 (IMAPS)."],[161,"UDP","SNMP","Device monitoring. Default 'public' community strings leak a lot."],[389,"TCP","LDAP","Directory (Active Directory). Prefer LDAPS 636."],[443,"TCP","HTTPS","Web over TLS. Most traffic today."],[445,"TCP","SMB","Windows file sharing. WannaCry spread through it. Never expose it."],[3306,"TCP","MySQL","Databases shouldn't face the internet."],[3389,"TCP","RDP","Windows remote desktop. A top ransomware entry point."],[5432,"TCP","PostgreSQL","Keep on private networks."],[6379,"TCP","Redis","Often deployed with no password. Never expose it."],[8080,"TCP","HTTP alt","Dev servers and proxies, often forgotten."],[27017,"TCP","MongoDB","Thousands exposed with no auth over the years."]];
  host.innerHTML=`<p class="muted">The ports you'll meet most. Filter by number, name or risk.</p><input id="pq" type="search" placeholder="e.g. 22, mail, database, windows" aria-label="Filter ports"><table class="w-tab"><thead><tr><th>Port</th><th>Protocol</th><th>Service</th><th>Security note</th></tr></thead><tbody id="pt"></tbody></table>`;
  const draw=()=>{const q=$("#pq",host).value.toLowerCase();$("#pt",host).innerHTML=P.filter(r=>!q||r.join(" ").toLowerCase().includes(q)||(q=="database"&&/sql|redis|mongo/i.test(r[2]))||(q=="windows"&&/smb|rdp|ldap/i.test(r[2]))||(q=="mail"&&/smtp|pop|imap/i.test(r[2]))).map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")};$("#pq",host).oninput=draw;draw()},
 records(host){const R=[["A","example.com → 93.184.215.14","Name to IPv4 address.","dig example.com A +short"],["AAAA","example.com → 2606:2800:…","Name to IPv6 address.","dig example.com AAAA +short"],["CNAME","www.example.com → example.com","An alias. Dangling CNAMEs to deleted cloud resources enable subdomain takeover.","dig www.example.com CNAME +short"],["MX","github.com → aspmx.l.google.com","Where email for the domain goes. Tells you the mail provider.","dig github.com MX +short"],["NS","example.com → a.iana-servers.net","Which servers are authoritative for the domain.","dig example.com NS +short"],["TXT","\"v=spf1 -all\"","Free text: SPF, DKIM, DMARC and site-verification tokens. Missing SPF/DMARC makes spoofing easy.","dig example.com TXT +short"],["PTR","14.215.184.93.in-addr.arpa → example.com","Reverse lookup: address to name.","nslookup example.com"]];
  host.innerHTML=`<p class="muted">The record types you'll actually use. Press <b>Try</b> to look one up in the terminal.</p><table class="w-tab"><thead><tr><th>Type</th><th>Example</th><th>What it's for</th><th></th></tr></thead><tbody>${R.map(r=>`<tr><td class="mono"><b>${r[0]}</b></td><td class="mono">${esc(r[1])}</td><td>${esc(r[2])}</td><td><button type="button" class="try" data-cmd="${esc(r[3])}">Try</button></td></tr>`).join("")}</tbody></table>`;host.onclick=tryClick},
 http(host){host.innerHTML=`<p class="muted">Build a request and send it to a pretend shop. Try GET /, POST /login, GET /admin with and without the cookie, and a path that doesn't exist.</p>
  <div class="w-row"><label>Method <select id="hm"><option>GET</option><option>POST</option><option>DELETE</option></select></label><label style="flex:2">Path <input id="hp" value="/admin" class="mono"></label><label class="w-chk"><input type="checkbox" id="hc"> Send session cookie</label></div>
  <label id="hbw">Body <input id="hb" value="username=dana&amp;password=hunter2" class="mono"></label><div class="w-two"><div><b>Request</b><pre class="w-pre" id="hreq"></pre></div><div><b>Response</b><pre class="w-pre" id="hres"></pre></div></div><p id="hexp"></p>`;
  const S={200:"OK: it worked.",201:"Created.",302:"Found: go to the Location header (a redirect).",401:"Unauthorized: really means not logged in.",403:"Forbidden: logged in, but not allowed.",404:"Not Found: nothing at that path.",405:"Method Not Allowed: that path doesn't accept this method.",500:"Internal Server Error: the server's code crashed."};
  const draw=()=>{const m=$("#hm",host).value,p=$("#hp",host).value.trim()||"/",ck=$("#hc",host).checked,b=$("#hb",host).value;$("#hbw",host).hidden=m!="POST";
   const req=`${m} ${p} HTTP/1.1\nHost: shop.example\nUser-Agent: Mozilla/5.0\nAccept: text/html`+(ck?"\nCookie: session=a91f2c":"")+(m=="POST"?`\nContent-Type: application/x-www-form-urlencoded\nContent-Length: ${b.length}\n\n${b}`:"");
   let st,h="",body="";const path=p.split("?")[0];
   if(path=="/"){st=m=="GET"?200:405;body=m=="GET"?"<h1>Shop</h1>":""}else if(path=="/login"){if(m=="POST"){if(/password=hunter2/.test(b)){st=302;h="Location: /account\nSet-Cookie: session=a91f2c; HttpOnly; Secure; SameSite=Lax"}else{st=401;body="Wrong username or password"}}else{st=200;body="<form method=post>…</form>"}}
   else if(path=="/admin"||path=="/account"){if(!ck){st=path=="/admin"?401:302;h=st==302?"Location: /login":"";body=st==401?"Please log in":""}else if(path=="/admin"){st=403;body="Admins only"}else{st=200;body="<h1>Hello dana</h1>"}}
   else if(path=="/api/crash"){st=500;body="Traceback (most recent call last): …"}else{st=404;body="<h1>Not found</h1>"}
   const reason={200:"OK",302:"Found",401:"Unauthorized",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",500:"Internal Server Error"}[st];
   $("#hreq",host).textContent=req;$("#hres",host).textContent=`HTTP/1.1 ${st} ${reason}\nContent-Type: text/html`+(h?"\n"+h:"")+(body?"\n\n"+body:"");
   const e=$("#hexp",host);e.className="w-"+(st<300?"ok":st<400?"info":st<500?"warn":"bad");e.innerHTML=`<b>${st}</b> ${S[st]}`+(st==500?" Error details like this stack trace help attackers; real sites should hide them.":"")+(st==302&&h.includes("Set-Cookie")?" The cookie is now your login: tick <i>Send session cookie</i> and try /account.":"")};
  $$("input,select",host).forEach(x=>x.oninput=draw);$("#hc",host).onchange=draw;draw()},
 sniff(host){host.innerHTML=`<p class="muted">You're the eavesdropper on café Wi-Fi. Type a password, then switch between HTTP and HTTPS to see what you capture.</p>
  <div class="w-row"><label>Password typed into the login form <input id="sp" value="hunter2" class="mono"></label><div class="seg" id="sm"><button type="button" aria-pressed="true" data-m="http">HTTP</button><button type="button" aria-pressed="false" data-m="https">HTTPS</button></div></div><pre class="w-pre" id="scap"></pre><p id="sexp"></p>`;
  let mode="http";const hex=s=>{let h="";for(let i=0;i<s.length*3+60;i++)h+="0123456789abcdef"[(s.charCodeAt(i%s.length)*7+i*13)%16];return h.match(/.{1,32}/g).join("\n")};
  const draw=()=>{const pw=$("#sp",host).value,body=`username=dana&password=${pw}`;const cap=$("#scap",host),e=$("#sexp",host);
   if(mode=="http"){cap.innerHTML=esc(`Frame 41: 10.0.0.23 → 203.0.113.80  TCP 51744 → 80\nPOST /login HTTP/1.1\nHost: bank.example\nContent-Type: application/x-www-form-urlencoded\n\nusername=dana&password=`)+`<mark>${esc(pw)}</mark>`;e.className="w-bad";e.innerHTML="<b>Captured in plain text.</b> The password, the page and any session cookie are readable, and could be changed on the way."}
   else{cap.textContent=`Frame 41: 10.0.0.23 → 203.0.113.80  TCP 51744 → 443\nTLSv1.3 Record: Application Data\n  Server Name (from the handshake): bank.example\n  Encrypted payload, ${body.length+120} bytes:\n`+hex(body);e.className="w-ok";e.innerHTML="<b>Encrypted.</b> You see who they're talking to (bank.example), when, and roughly how much, but not the password or the page."}};
  $("#sp",host).oninput=draw;$("#sm",host).onclick=ev=>{const b=ev.target.closest("button");if(!b)return;mode=b.dataset.m;$$("#sm button",host).forEach(x=>x.setAttribute("aria-pressed",x==b));draw()};draw()},
 osi(host){const L=[[7,"Application","Application","Data","HTTP, DNS, SMTP, SSH, FTP","Your apps, proxies, WAFs","SQL injection, XSS, phishing, credential stuffing","Input validation, WAF, MFA"],[6,"Presentation","Application","Data","TLS (encryption), JPEG, UTF-8","—","Weak ciphers, encoding tricks","Modern TLS, strict parsing"],[5,"Session","Application","Data","Sessions, RPC, NetBIOS","—","Session hijacking","Secure cookies, timeouts"],[4,"Transport","Transport","Segment","TCP, UDP, ports","Stateful firewalls, load balancers","SYN floods, port scans","Firewall rules, SYN cookies, rate limits"],[3,"Network","Internet","Packet","IP, ICMP, routing","Routers, L3 switches","IP spoofing, ICMP floods, route hijacks","ACLs, ingress filtering"],[2,"Data link","Link","Frame","Ethernet, Wi-Fi, ARP, MAC","Switches, access points","ARP spoofing, MAC flooding, rogue APs","Port security, WPA3, dynamic ARP inspection"],[1,"Physical","Link","Bits","Cables, radio, fibre","Hubs, repeaters, NICs","Cable taps, jamming, stealing hardware","Locked rooms, shielding"]];
  host.innerHTML=`<p class="muted">Pick a layer. The bar on the right shows how the TCP/IP model groups them.</p><div class="osi"><div class="osi-stack" id="os">${L.map(l=>`<button type="button" data-l="${l[0]}"><span class="mono">${l[0]}</span> ${l[1]}<em>${l[2]}</em></button>`).join("")}</div><div class="osi-info card" id="oi"></div></div>`;
  const show=n=>{const l=L.find(x=>x[0]==n);$$("#os button",host).forEach(b=>b.classList.toggle("on",+b.dataset.l==n));$("#oi",host).innerHTML=`<h3>Layer ${l[0]}: ${l[1]}</h3><p class="muted">TCP/IP layer: <b>${l[2]}</b> · data unit: <b>${l[3]}</b></p><dl><dt>Protocols</dt><dd>${l[4]}</dd><dt>Devices</dt><dd>${l[5]}</dd><dt>Attacks</dt><dd>${l[6]}</dd><dt>Defences</dt><dd>${l[7]}</dd></dl>`};
  $("#os",host).onclick=e=>{const b=e.target.closest("button");if(b)show(+b.dataset.l)};show(7)},
 url(host){host.innerHTML=`<p class="muted">Paste any URL to take it apart. Try <code>https://shop.example:8443/cart?id=7&amp;ref=mail#reviews</code> or the trick <code>https://bank.example@evil.test/login</code>.</p><input id="ui" class="mono" value="https://shop.example/cart?id=7&ref=mail#reviews" aria-label="URL"><div id="uo"></div>`;
  const draw=()=>{const o=$("#uo",host);let u;try{u=new URL($("#ui",host).value.trim())}catch(e){o.innerHTML='<p class="w-bad">That isn\'t a full URL yet. Start with https://</p>';return}
   const port=u.port||({"https:":"443","http:":"80","ftp:":"21"}[u.protocol]||"—")+" (default)";const q=[...u.searchParams];
   o.innerHTML=`<table class="w-tab"><tbody><tr><th>Scheme</th><td class="mono">${esc(u.protocol.replace(":",""))}</td><td>${u.protocol=="https:"?"Encrypted with TLS.":u.protocol=="http:"?"Not encrypted.":"Another protocol."}</td></tr>`+(u.username?`<tr class="w-badrow"><th>User info</th><td class="mono">${esc(u.username)}</td><td><b>Trick!</b> Everything before @ is ignored for the destination. This URL goes to <b>${esc(u.hostname)}</b>, not ${esc(u.username)}.</td></tr>`:"")+
    `<tr><th>Host</th><td class="mono">${esc(u.hostname)}</td><td>Looked up in DNS. This decides where the request really goes.</td></tr><tr><th>Port</th><td class="mono">${esc(port)}</td><td>Which service on that host.</td></tr><tr><th>Path</th><td class="mono">${esc(u.pathname)}</td><td>Which resource on the server.</td></tr>`+
    `<tr><th>Query</th><td class="mono">${q.length?q.map(([k,v])=>esc(k)+"="+esc(v)).join("<br>"):"—"}</td><td>Input sent to the server. Attackers change these; servers must check them.</td></tr><tr><th>Fragment</th><td class="mono">${esc(u.hash||"—")}</td><td>Never sent to the server: the browser keeps it.</td></tr></tbody></table>`};
  $("#ui",host).oninput=draw;draw()}
};

/* ---------- routing ---------- */
function route(){const h=location.hash.slice(1);if(h=="commands")reference();else if(byId(h))lesson(h);else home();drawHdr()}
window.addEventListener("hashchange",route);
addEventListener("scroll",()=>{const r=$("#fRead");if(!r)return;const d=document.documentElement;r.style.width=Math.min(100,d.scrollTop/(d.scrollHeight-d.clientHeight)*100)+"%"},{passive:true});
/* theme */
const applyTheme=t=>{document.documentElement.setAttribute("data-theme",t);const b=$("#themeBtn");b.textContent=t=="dark"?"☀":"☾";b.setAttribute("aria-label",t=="dark"?"Switch to light theme":"Switch to dark theme");try{localStorage.setItem("cipherops-theme",t)}catch(e){}};
let theme="light";try{theme=localStorage.getItem("cipherops-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}
applyTheme(theme);$("#themeBtn").onclick=()=>applyTheme(document.documentElement.getAttribute("data-theme")=="dark"?"light":"dark");
route();
})();

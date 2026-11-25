/* cipherops_tech — simulated Linux terminal for the Foundations track.
   Everything runs in the browser: a fake file system, users, processes and canned network answers.
   SHELL.create(host, {onRun}) returns {run(line), sh}. onRun(ev) fires after every command. */
"use strict";
const SHELL=(()=>{
const NOW=()=>new Date();
const pad=(s,n,r)=>{s=String(s);return r?s.padStart(n):s.padEnd(n)};
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const lsDate=d=>MON[d.getMonth()]+" "+pad(d.getDate(),2,1)+" "+pad(d.getHours(),2,1).replace(" ","0")+":"+String(d.getMinutes()).padStart(2,"0");
const human=n=>n<1024?n+"":n<1048576?(n/1024).toFixed(n<10240?1:0)+"K":(n/1048576).toFixed(1)+"M";

/* ---------- sha-256 (sync, for sha256sum / openssl dgst) ---------- */
function sha256(str){const b=new TextEncoder().encode(str),K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const l=b.length,n=((l+9+63)>>6)<<6,m=new Uint8Array(n);m.set(b);m[l]=0x80;const bits=l*8;for(let i=0;i<8;i++)m[n-1-i]=Math.floor(bits/2**(8*i))&255;
 const W=new Uint32Array(64),r=(x,k)=>(x>>>k)|(x<<(32-k));
 for(let o=0;o<n;o+=64){for(let i=0;i<16;i++)W[i]=(m[o+4*i]<<24)|(m[o+4*i+1]<<16)|(m[o+4*i+2]<<8)|m[o+4*i+3];
  for(let i=16;i<64;i++){const s0=r(W[i-15],7)^r(W[i-15],18)^(W[i-15]>>>3),s1=r(W[i-2],17)^r(W[i-2],19)^(W[i-2]>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)>>>0}
  let[a,bb,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=r(e,6)^r(e,11)^r(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+W[i])>>>0,S0=r(a,2)^r(a,13)^r(a,22),mj=(a&bb)^(a&c)^(bb&c),t2=(S0+mj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0}
  H=H.map((x,i)=>(x+[a,bb,c,d,e,f,g,h][i])>>>0)}
 return H.map(x=>x.toString(16).padStart(8,"0")).join("")}
const b64e=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64d=s=>new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s+/g,"")),c=>c.charCodeAt(0)));

/* ---------- the starting file system ---------- */
const AUTH=["Nov 24 22:41:07 lab sshd[812]: Accepted publickey for student from 192.168.1.20 port 51522",
"Nov 25 03:12:44 lab sshd[901]: Failed password for root from 203.0.113.66 port 40112 ssh2",
"Nov 25 03:12:47 lab sshd[901]: Failed password for root from 203.0.113.66 port 40118 ssh2",
"Nov 25 03:12:51 lab sshd[901]: Failed password for admin from 203.0.113.66 port 40125 ssh2",
"Nov 25 03:13:02 lab sshd[905]: Failed password for invalid user test from 198.51.100.23 port 33410 ssh2",
"Nov 25 03:13:09 lab sshd[901]: Failed password for root from 203.0.113.66 port 40131 ssh2",
"Nov 25 08:02:15 lab sshd[1102]: Accepted password for student from 192.168.1.20 port 52001",
"Nov 25 08:05:40 lab sudo:  student : TTY=pts/0 ; PWD=/home/student ; USER=root ; COMMAND=/usr/bin/apt update"].join("\n");
const ACCESS=['192.168.1.20 - - [25/Nov/2026:08:10:01] "GET / HTTP/1.1" 200 5120','192.168.1.20 - - [25/Nov/2026:08:10:02] "GET /app.js HTTP/1.1" 200 2048',
'203.0.113.66 - - [25/Nov/2026:08:14:33] "GET /login?user=admin\'-- HTTP/1.1" 500 312','203.0.113.66 - - [25/Nov/2026:08:14:35] "GET /../../etc/passwd HTTP/1.1" 404 0',
'198.51.100.23 - - [25/Nov/2026:08:20:10] "GET /admin HTTP/1.1" 403 128','192.168.1.31 - - [25/Nov/2026:08:22:47] "POST /login HTTP/1.1" 302 0',
'203.0.113.66 - - [25/Nov/2026:08:23:02] "GET /search?q=<script>alert(1)</script> HTTP/1.1" 200 4410','192.168.1.20 - - [25/Nov/2026:08:30:12] "GET /favicon.ico HTTP/1.1" 200 1150'].join("\n");
function seed(){
 const d=(ch={},o={})=>({t:"d",ch,mode:o.mode??0o755,owner:o.owner??"root",group:o.group??o.owner??"root",mt:o.mt??NOW()});
 const f=(c,o={})=>({t:"f",c,mode:o.mode??0o644,owner:o.owner??"root",group:o.group??o.owner??"root",mt:o.mt??NOW()});
 const S={owner:"student"},bin={};
 ["ls","cat","grep","bash","sed","awk","find","tar","ssh","curl","python3","nano","vim","less","sort","cut","chmod","nc","dig","ping","sudo","passwd","openssl","sha256sum","base64","xxd"].forEach(c=>bin[c]=f("\x7fELF\x02\x01\x01 binary: /usr/bin/"+c,{mode:c=="sudo"||c=="passwd"?0o4755:0o755}));
 return d({
  home:d({student:d({
   "notes.txt":f("Lab notes\nDNS turns names into IP addresses.\nHTTP is stateless; cookies carry the session.\nTODO: learn chmod\nport 22 is ssh\nport 443 is https\n",S),
   "todo.md":f("- [x] install tools\n- [ ] read auth.log\n- [ ] find the hidden flag\n- [ ] make backup.sh executable\n",S),
   ".bashrc":f("# ~/.bashrc\nexport EDITOR=nano\nalias ll='ls -la'\nalias ..='cd ..'\n",S),
   ".hidden_flag":f("CIPHER{d0tf1l3s_ar3_h1dd3n}\n",S),
   "users.csv":f("name,role,team,logins\nalice,admin,platform,42\nbob,dev,web,17\ncarol,dev,web,23\ndave,analyst,soc,8\nerin,dev,mobile,17\nalice,admin,platform,42\n",S),
   scripts:d({"backup.sh":f("#!/bin/bash\n# copies notes into backups/\necho \"Backing up notes...\"\nmkdir -p ~/backups\ncp ~/notes.txt ~/backups/\necho \"Done.\"\n",{...S,mode:0o644}),
     "hello.py":f("print('hello from python')\n",S)},S),
   projects:d({web:d({"index.html":f("<!doctype html>\n<title>Acme</title>\n<script src=\"app.js\"></script>\n",S),"app.js":f("// TODO remove before prod\nconst API_KEY = \"sk_test_51Hx9demo\";\nfetch('/api/profile');\n",S)},S)},S),
   downloads:d({"tools.tar.gz":f("TAR:"+JSON.stringify({"tools/scan.sh":"#!/bin/bash\necho scanning","tools/README":"Lab tools"}),S)},S),
   logs:d({},S)},{...S,mode:0o750})}),
  etc:d({"hostname":f("lab\n"),"hosts":f("127.0.0.1   localhost\n127.0.1.1   lab\n10.0.1.20   app.acme.internal\n10.0.2.5    db.acme.internal\n"),
   "passwd":f("root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nsshd:x:110:65534::/run/sshd:/usr/sbin/nologin\nstudent:x:1000:1000:Student,,,:/home/student:/bin/bash\n"),
   "group":f("root:x:0:\nsudo:x:27:student\nwww-data:x:33:\nstudent:x:1000:\n"),
   "shadow":f("root:$y$j9T$Q2w...:19700:0:99999:7:::\nstudent:$y$j9T$8fK...:19700:0:99999:7:::\n",{mode:0o640,group:"shadow"}),
   "os-release":f('PRETTY_NAME="Ubuntu 24.04.1 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nID=ubuntu\n'),
   "crontab":f("# m h dom mon dow user command\n17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly\n0  3  * * *  root  /usr/local/bin/backup-db\n"),
   ssh:d({"sshd_config":f("Port 22\nPermitRootLogin no\nPasswordAuthentication yes\nPubkeyAuthentication yes\n")})}),
  var:d({log:d({"auth.log":f(AUTH+"\n",{mode:0o640,group:"adm"}),"syslog":f("Nov 25 08:00:01 lab CRON[1001]: (root) CMD (run-parts /etc/cron.hourly)\nNov 25 08:02:15 lab systemd[1]: Started ssh.service\nNov 25 08:03:00 lab kernel: [UFW BLOCK] IN=eth0 SRC=203.0.113.66 DST=10.0.0.5 DPT=3306\n"),
   nginx:d({"access.log":f(ACCESS+"\n")})}),www:d({html:d({"index.html":f("<h1>It works</h1>\n")})})}),
  tmp:d({},{mode:0o1777}),root:d({"flag.txt":f("CIPHER{r00t_0nly}\n",{mode:0o600})},{mode:0o700}),
  usr:d({bin:d(bin),local:d({bin:d({"backup-db":f("#!/bin/bash\npg_dump acme > /backups/acme.sql\n",{mode:0o755})})})}),
  opt:d({}),dev:d({null:f("")}),proc:d({})});
}

/* ---------- canned network answers ---------- */
const DNS={"example.com":["93.184.215.14","2606:2800:21f:cb07:6820:80da:af6b:8b2c"],"cipherops.lab":["10.0.0.80"],"google.com":["142.250.180.14"],"github.com":["140.82.121.4"],"app.acme.internal":["10.0.1.20"],"db.acme.internal":["10.0.2.5"],"localhost":["127.0.0.1"]};
const MX={"example.com":"0 .","github.com":"1 aspmx.l.google.com.","google.com":"10 smtp.google.com."};
const SITES={"example.com":{h:"HTTP/1.1 200 OK\nContent-Type: text/html; charset=UTF-8\nContent-Length: 1256\nServer: ECAcc (lac/55B3)\nCache-Control: max-age=604800",b:"<!doctype html>\n<html><head><title>Example Domain</title></head>\n<body><h1>Example Domain</h1><p>This domain is for use in illustrative examples.</p></body></html>"},
 "cipherops.lab":{h:"HTTP/1.1 200 OK\nContent-Type: text/html\nStrict-Transport-Security: max-age=63072000\nContent-Security-Policy: default-src 'self'\nX-Frame-Options: DENY\nSet-Cookie: session=7f3a9c; Secure; HttpOnly; SameSite=Lax",b:"<h1>cipherops lab</h1>\n<!-- hint: try /robots.txt -->"},
 "cipherops.lab/robots.txt":{h:"HTTP/1.1 200 OK\nContent-Type: text/plain",b:"User-agent: *\nDisallow: /backup/\nDisallow: /admin/"},
 "localhost":{h:"HTTP/1.1 200 OK\nServer: nginx/1.24.0\nContent-Type: text/html",b:"<h1>It works</h1>"},
 "example.com/missing":{h:"HTTP/1.1 404 Not Found\nContent-Type: text/html",b:"<h1>404</h1>"}};
const hostOf=u=>u.replace(/^\w+:\/\//,"").split(/[/:]/)[0];

/* ---------- the shell ---------- */
function create(host,opts={}){
 const root=seed();
 const sh={user:"student",cwd:"/home/student",prev:"/home/student",code:0,hist:[],aliases:{ll:"ls -la","..":"cd .."},
  env:{HOME:"/home/student",USER:"student",SHELL:"/bin/bash",PATH:"/usr/local/bin:/usr/bin:/bin",LANG:"en_GB.UTF-8",TERM:"xterm-256color",EDITOR:"nano",HOSTNAME:"lab"},
  procs:[[1,"root","/sbin/init"],[412,"root","/usr/sbin/cron -f"],[512,"root","sshd: /usr/sbin/sshd -D"],[640,"www-data","nginx: worker process"],[655,"root","nginx: master process /usr/sbin/nginx"],[1102,"student","-bash"]],
  jobs:[],nextPid:2310,services:{ssh:true,nginx:true,cron:true,ufw:false},installed:new Set(["nginx","openssh-server","curl","python3","git"]),ufw:[],umask:0o022,root};
 const home=()=>sh.user=="root"?"/root":"/home/"+sh.user;

 /* paths */
 const norm=p=>{if(p==null||p==="")p=".";if(p[0]=="~")p=home()+p.slice(1);const parts=(p[0]=="/"?p:sh.cwd+"/"+p).split("/"),out=[];for(const x of parts){if(!x||x==".")continue;if(x=="..")out.pop();else out.push(x)}return "/"+out.join("/")};
 const node=(p,follow=true)=>{let n=root;const parts=norm(p).split("/").filter(Boolean);for(let i=0;i<parts.length;i++){if(!n||n.t!="d")return null;n=n.ch[parts[i]];if(n&&n.t=="l"&&(follow||i<parts.length-1))n=node(n.to)}return n||null};
 const parent=p=>{const a=norm(p),i=a.lastIndexOf("/");return[a.slice(0,i)||"/",a.slice(i+1)]};
 const isRoot=()=>sh.user=="root";
 const canR=n=>isRoot()||n.owner==sh.user?(n.mode&0o400||isRoot()):n.mode&0o004||(n.group=="sudo"||n.group==sh.user)&&n.mode&0o040;
 const canW=n=>isRoot()||(n.owner==sh.user&&n.mode&0o200)||(n.mode&0o002);
 const mk=(t,c="")=>({t,ch:t=="d"?{}:undefined,c:t=="f"?c:undefined,mode:t=="d"?0o777&~sh.umask:0o666&~sh.umask,owner:sh.user,group:sh.user,mt:NOW()});
 function write(p,content,append){const n=node(p);if(n){if(n.t=="d")throw p+": Is a directory";if(!canW(n))throw p+": Permission denied";n.c=append?n.c+content:content;n.mt=NOW();return}
  const[dir,name]=parent(p),dn=node(dir);if(!dn||dn.t!="d")throw p+": No such file or directory";if(!canW(dn))throw p+": Permission denied";dn.ch[name]=mk("f",content)}
 function read(p){const n=node(p);if(!n)throw p+": No such file or directory";if(n.t=="d")throw p+": Is a directory";if(!canR(n))throw p+": Permission denied";return n.c}
 const modeStr=n=>{const m=n.mode,t=n.t=="d"?"d":n.t=="l"?"l":"-",r=(b,s,x)=>(m&b?"r":"-")+(m&(b>>1)?"w":"-")+(m&(b>>2)?(m&s?x:"x"):(m&s?x.toUpperCase():"-"));return t+r(0o400,0o4000,"s")+r(0o040,0o2000,"s")+(m&4?"r":"-")+(m&2?"w":"-")+(m&1?(m&0o1000?"t":"x"):(m&0o1000?"T":"-"))};
 const size=n=>n.t=="d"?4096:(n.c||"").length;
 const walk=(p,fn,depth=0)=>{const n=node(p,false);if(!n)return;fn(p,n,depth);if(n.t=="d"&&canR(n))Object.keys(n.ch).sort().forEach(k=>walk((p=="/"?"":p)+"/"+k,fn,depth+1))};
 const glob=pat=>{if(!/[*?]/.test(pat))return[pat];const[dir,base]=pat.includes("/")?parent(pat):[sh.cwd,pat],dn=node(dir);if(!dn||dn.t!="d")return[pat];
  const re=new RegExp("^"+base.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$");const hit=Object.keys(dn.ch).filter(k=>re.test(k)&&(base[0]=="."||k[0]!=".")).sort();
  return hit.length?hit.map(k=>pat.includes("/")?(dir=="/"?"":dir)+"/"+k:k):[pat]};

 /* parsing: quotes, $VARS, ~, globs, | ; && > >> 2> & */
 function lex(line){const toks=[];let cur="",q=null,had=false,quotedGlob=false;const push=()=>{if(had){toks.push({w:cur,g:!quotedGlob});cur="";had=false;quotedGlob=false}};
  for(let i=0;i<line.length;i++){const c=line[i];
   if(q){if(c==q){q=null;continue}if(q=='"'&&c=="$"){const m=line.slice(i).match(/^\$(\?|\{\w+\}|\w+)/);if(m){cur+=vv(m[1]);i+=m[0].length-1;continue}}cur+=c;if(/[*?]/.test(c))quotedGlob=true;continue}
   if(c=="'"||c=='"'){q=c;had=true;continue}
   if(c=="\\"&&i+1<line.length){cur+=line[++i];had=true;continue}
   if(/\s/.test(c)){push();continue}
   if(c=="|"||c==";"||c=="&"||c==">"||(c=="2"&&line[i+1]==">"&&!had)){push();let op=c;if(c=="2"){op="2>";i++}else if(line[i+1]==c&&(c=="&"||c==">"||c=="|")){op=c+c;i++}toks.push({op});continue}
   if(c=="$"){const m=line.slice(i).match(/^\$(\?|\{\w+\}|\w+)/);if(m){cur+=vv(m[1]);i+=m[0].length-1;had=true;continue}}
   if(c=="~"&&!had&&(line[i+1]==undefined||/[\s/]/.test(line[i+1]))){cur+=home();had=true;continue}
   cur+=c;had=true}
  if(q)throw"unexpected end of input: missing "+q;push();return toks}
 const vv=k=>{k=k.replace(/[{}]/g,"");return k=="?"?String(sh.code):sh.env[k]??""};

 const out=[];let pending=null;
 function run(line){
  line=line.replace(/\s+$/,"");out.length=0;if(!line.trim()){return render("")}
  if(line.trim()!=sh.hist[sh.hist.length-1])sh.hist.push(line.trim());
  const ev={line,cmds:[],out:"",err:"",code:0};
  try{const toks=lex(line);let seq=[[]],cons=[];toks.forEach(t=>{if(t.op==";"||t.op=="&&"||t.op=="||"){cons.push(t.op);seq.push([])}else seq[seq.length-1].push(t)});
   let last={code:0};for(let i=0;i<seq.length;i++){if(i>0&&cons[i-1]=="&&"&&last.code!==0)continue;if(i>0&&cons[i-1]=="||"&&last.code===0)continue;if(!seq[i].length)continue;last=pipeline(seq[i],ev);sh.code=last.code}
   ev.code=sh.code}catch(e){err(typeof e=="string"?"bash: "+e:"bash: "+e.message);ev.code=sh.code=2}
  ev.out=out.filter(x=>!x.e).map(x=>x.t).join("\n");ev.err=out.filter(x=>x.e).map(x=>x.t).join("\n");
  render(line);try{opts.onRun&&opts.onRun(ev,api)}catch(e){console.error(e)}return ev}
 const err=t=>out.push({t,e:1});
 function pipeline(toks,ev){let bg=false;if(toks.length&&toks[toks.length-1].op=="&"){bg=true;toks=toks.slice(0,-1)}
  const parts=[[]];toks.forEach(t=>t.op=="|"?parts.push([]):parts[parts.length-1].push(t));let input=null,res={code:0,out:""};
  for(let i=0;i<parts.length;i++){const p=parts[i],argv=[],redir=[];for(let j=0;j<p.length;j++){const t=p[j];if(t.op==">"||t.op==">>"||t.op=="2>"){const f=p[++j];if(!f||f.op)throw"syntax error near unexpected token `newline'";redir.push([t.op,f.w])}else if(t.op)throw"syntax error near `"+t.op+"'";else (t.g?glob(t.w):[t.w]).forEach(w=>argv.push(w))}
   if(!argv.length)continue;
   if(sh.aliases[argv[0]]&&!(i==0&&ev._noalias)){const ex=lex(sh.aliases[argv[0]]).map(t=>t.w);argv.splice(0,1,...ex)}
   ev.cmds.push(argv.slice());
   if(bg){const pid=sh.nextPid++;sh.jobs.push({id:sh.jobs.length+1,pid,cmd:argv.join(" "),state:"Running"});sh.procs.push([pid,sh.user,argv.join(" ")]);out.push({t:"["+sh.jobs.length+"] "+pid});return{code:0}}
   res=exec(argv,input);const o=res.out??"";
   const outR=redir.find(r=>r[0]!="2>"),errR=redir.find(r=>r[0]=="2>");
   if(res.err){if(errR){if(errR[1]!="/dev/null")write(errR[1],res.err+"\n",false)}else err(res.err)}
   if(outR){if(outR[1]!="/dev/null")write(outR[1],o?o+(o.endsWith("\n")?"":"\n"):"",outR[0]==">>");input=""}
   else input=o;
   if(i==parts.length-1&&!outR&&o!=="")out.push({t:o.replace(/\n$/,"")})}
  return res}

 /* option helper: flags('-la','--all') */
 function opt(args,withVal=""){const f=new Set(),v={},pos=[];for(let i=0;i<args.length;i++){const a=args[i];
   if(a=="--"){pos.push(...args.slice(i+1));break}
   if(a.startsWith("--")){const[k,val]=a.slice(2).split("=");f.add(k);if(val!=null)v[k]=val;continue}
   if(a[0]=="-"&&a.length>1&&!/^-\d/.test(a)||(a[0]=="-"&&withVal.includes(a[1]))){for(let j=1;j<a.length;j++){const c=a[j];if(withVal.includes(c)){v[c]=a.slice(j+1)||args[++i];f.add(c);break}f.add(c)}continue}
   pos.push(a)}return{f,v,pos}}
 const ok=(o="")=>({code:0,out:o}),fail=(e,c=1)=>({code:c,err:e,out:""});
 const lines=s=>(s??"").replace(/\n$/,"").split("\n");
 const src=(files,stdin,name)=>{if(!files.length){if(stdin==null)return{err:name+": reading from the keyboard isn't supported here; give a file or pipe text in"};return{txt:stdin}}let t="";for(const f of files){try{t+=read(f)}catch(e){return{err:name+": "+e}}}return{txt:t}};
 const needRoot=(name)=>isRoot()?null:fail(name+": Permission denied (try sudo)");
 const sim=t=>"\x01"+t; // dim "simulated" note

 const C={
 /* 1 shell basics */
 pwd:()=>ok(sh.cwd),
 whoami:()=>ok(sh.user),
 echo:a=>{const{f,pos}=opt(a.filter(x=>x=="-n"||x=="-e"||x[0]!="-"));let t=pos.join(" ");if(f.has("e"))t=t.replace(/\\n/g,"\n").replace(/\\t/g,"\t");return ok(t)},
 man:a=>{const c=a[0];if(!c)return fail("What manual page do you want?\nFor example, try 'man ls'.");const r=(typeof FOUND_CMDS!="undefined")&&FOUND_CMDS.find(x=>x.c==c);if(!r)return fail("No manual entry for "+c);
  return ok(`${c.toUpperCase()}(1)                 User Commands\n\nNAME\n       ${c} - ${r.d}\n\nSYNOPSIS\n       ${r.s}\n\nEXAMPLES\n${r.e.map(x=>"       "+x[0]+"\n           "+x[1]).join("\n")}\n${r.sec?"\nSECURITY\n       "+r.sec+"\n":""}\n(Short page from cipherops. Real man pages are longer: press q to quit them.)`)},
 clear:()=>{pending="clear";return ok()},
 history:a=>{if(a[0]=="-c"){sh.hist.length=0;return ok()}return ok(sh.hist.map((h,i)=>pad(i+1,5,1)+"  "+h).join("\n"))},
 type:a=>ok(a.map(c=>sh.aliases[c]?`${c} is aliased to \`${sh.aliases[c]}'`:BUILTIN.has(c)?c+" is a shell builtin":C[c]?c+" is /usr/bin/"+c:"bash: type: "+c+": not found").join("\n")),
 which:a=>{const r=a.filter(c=>C[c]&&!BUILTIN.has(c)).map(c=>(c=="backup-db"?"/usr/local/bin/":"/usr/bin/")+c);return r.length?ok(r.join("\n")):{code:1,out:""}},
 alias:a=>{if(!a.length)return ok(Object.entries(sh.aliases).map(([k,v])=>`alias ${k}='${v}'`).join("\n"));for(const x of a){const i=x.indexOf("=");if(i<0){if(!sh.aliases[x])return fail("alias: "+x+": not found");return ok(`alias ${x}='${sh.aliases[x]}'`)}sh.aliases[x.slice(0,i)]=x.slice(i+1)}return ok()},
 unalias:a=>{a.forEach(x=>delete sh.aliases[x]);return ok()},
 date:a=>{const d=NOW();if(a[0]&&a[0].startsWith("+"))return ok(a[0].slice(1).replace(/%Y/g,d.getFullYear()).replace(/%m/g,String(d.getMonth()+1).padStart(2,"0")).replace(/%d/g,String(d.getDate()).padStart(2,"0")).replace(/%H/g,String(d.getHours()).padStart(2,"0")).replace(/%M/g,String(d.getMinutes()).padStart(2,"0")).replace(/%s/g,Math.floor(d/1000)));return ok(d.toString().replace(/ \(.*\)$/,""))},
 /* 2 navigating */
 ls:a=>{const{f,pos}=opt(a);const paths=pos.length?pos:["."],res=[];let code=0;
  for(const p of paths){const n=node(p);if(!n){res.push("ls: cannot access '"+p+"': No such file or directory");code=2;continue}
   if(n.t=="d"&&!canR(n)){res.push("ls: cannot open directory '"+p+"': Permission denied");code=2;continue}
   let ents=n.t=="d"?Object.keys(n.ch).sort().filter(k=>f.has("a")||f.has("A")||k[0]!=".").map(k=>[k,n.ch[k]]):[[p,n]];
   if(n.t=="d"&&f.has("a"))ents=[[".",n],["..",node(norm(p)+"/..")||n],...ents];
   if(f.has("t"))ents.sort((x,y)=>y[1].mt-x[1].mt);if(f.has("S"))ents.sort((x,y)=>size(y[1])-size(x[1]));if(f.has("r"))ents.reverse();
   if(paths.length>1&&n.t=="d")res.push(p+":");
   if(f.has("l")){if(n.t=="d")res.push("total "+ents.length*4);ents.forEach(([k,x])=>res.push(`${modeStr(x)} 1 ${pad(x.owner,8)} ${pad(x.group,8)} ${pad(f.has("h")?human(size(x)):size(x),6,1)} ${lsDate(x.mt)} ${k}${x.t=="l"?" -> "+x.to:""}`))}
   else res.push(ents.map(([k,x])=>k+(f.has("F")&&x.t=="d"?"/":"")).join("  "))}
  return{code,out:res.filter(x=>x!=="").join("\n")}},
 cd:a=>{let p=a[0]??home();if(p=="-"){p=sh.prev}const n=node(p);if(!n)return fail("cd: "+a[0]+": No such file or directory");if(n.t!="d")return fail("cd: "+a[0]+": Not a directory");if(!(isRoot()||n.mode&0o001||n.owner==sh.user))return fail("cd: "+a[0]+": Permission denied");sh.prev=sh.cwd;sh.cwd=norm(p);sh.env.PWD=sh.cwd;return ok(a[0]=="-"?sh.cwd:"")},
 tree:a=>{const{f,pos}=opt(a,"L");const p=pos[0]||".",max=f.has("L")?+opt(a,"L").v.L:9,n=node(p);if(!n||n.t!="d")return fail(p+" [error opening dir]");let dirs=0,files=0;const res=[p];
  const rec=(dn,pre,depth)=>{if(depth>=max)return;const ks=Object.keys(dn.ch).filter(k=>f.has("a")||k[0]!=".").sort();ks.forEach((k,i)=>{const last=i==ks.length-1,c=dn.ch[k];res.push(pre+(last?"└── ":"├── ")+k);if(c.t=="d"){dirs++;if(canR(c))rec(c,pre+(last?"    ":"│   "),depth+1)}else files++})};
  rec(n,"",0);res.push("",`${dirs} director${dirs==1?"y":"ies"}, ${files} file${files==1?"":"s"}`);return ok(res.join("\n"))},
 find:a=>{let p=".",i=0;if(a[0]&&a[0][0]!="-"){p=a[0];i=1}const t={};for(;i<a.length;i++){const k=a[i];if(["-name","-iname","-type","-perm","-user","-size"].includes(k))t[k.slice(1)]=a[++i];else if(k=="-exec")break;else return fail("find: unknown predicate `"+k+"'")}
  if(!node(p))return fail(`find: '${p}': No such file or directory`);const res=[],errs=[];
  const re=x=>new RegExp("^"+x.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$",t.iname?"i":"");
  walk(norm(p),(path,n)=>{const name=path.split("/").pop()||"/";if(n.t=="d"&&!canR(n)&&path!=norm(p)){errs.push(`find: '${path}': Permission denied`)}
   if(t.name&&!re(t.name).test(name))return;if(t.iname&&!re(t.iname).test(name))return;if(t.type&&(t.type=="f"?n.t!="f":n.t!="d"))return;if(t.user&&n.owner!=t.user)return;
   if(t.perm){const want=parseInt(t.perm.replace(/^[-/]/,"").replace("u=s","4000"),8);if((n.mode&want)!=want)return}
   if(t.size){const m=t.size.match(/^([+-]?)(\d+)([ckM]?)$/);if(m){const mult={c:1,k:1024,M:1048576,"":512}[m[3]],s=size(n),v=+m[2]*mult;if(m[1]=="+"?s<=v:m[1]=="-"?s>=v:Math.abs(s-v)>mult)return}}
   const shown=p.startsWith("/")?path:path.replace(norm(p),p).replace("//","/");res.push(shown)});
  return{code:errs.length?1:0,out:res.join("\n"),err:errs.slice(0,3).join("\n")}},
 locate:a=>{if(!a[0])return fail("locate: no pattern to search for specified");const r=[];walk("/",(p)=>{if(p.includes(a[0]))r.push(p)});return r.length?ok(r.join("\n")):{code:1,out:""}},
 file:a=>ok(a.map(p=>{const n=node(p);if(!n)return p+": cannot open (No such file or directory)";if(n.t=="d")return p+": directory";const c=n.c||"";
  return p+": "+(c.startsWith("\x7fELF")?"ELF 64-bit LSB pie executable, x86-64, dynamically linked":c.startsWith("TAR:")?"gzip compressed data, from Unix":c.startsWith("GZ:")?"gzip compressed data":c.startsWith("ZIP:")?"Zip archive data":c.startsWith("#!/bin/bash")?"Bourne-Again shell script, ASCII text executable":/^<!doctype|<html|<h1/i.test(c)?"HTML document, ASCII text":c.includes(",")&&p.endsWith(".csv")?"CSV text":c?"ASCII text":"empty")}).join("\n")),
 stat:a=>{const n=node(a[0]);if(!n)return fail(`stat: cannot statx '${a[0]}': No such file or directory`);return ok(`  File: ${a[0]}\n  Size: ${size(n)}\t\tBlocks: 8\t${n.t=="d"?"directory":"regular file"}\nAccess: (0${(n.mode&0o7777).toString(8)}/${modeStr(n)})  Uid: ( ${n.owner})   Gid: ( ${n.group})\nModify: ${n.mt.toISOString().replace("T"," ").slice(0,19)}`)},
 du:a=>{const{f,pos}=opt(a);const p=pos[0]||".";if(!node(p))return fail(`du: cannot access '${p}': No such file or directory`);let tot=0;const rows=[];walk(norm(p),(path,n)=>{tot+=size(n)});
  if(!f.has("s"))walk(norm(p),(path,n,d)=>{if(n.t=="d"&&d==1){let s=0;walk(path,(q,m)=>s+=size(m));rows.push((f.has("h")?human(s):Math.ceil(s/1024))+"\t"+path)}});rows.push((f.has("h")?human(tot):Math.ceil(tot/1024))+"\t"+p);return ok(rows.join("\n"))},
 df:a=>ok(opt(a).f.has("h")?"Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm\n/dev/sda15      105M  6.1M   99M   6% /boot/efi":"Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/sda1       41152736 12582912  26428632  32% /"),
 realpath:a=>ok(a.map(norm).join("\n")),
 /* 3 files */
 touch:a=>{for(const p of a){const n=node(p);if(n){n.mt=NOW();continue}try{write(p,"")}catch(e){return fail("touch: cannot touch '"+p+"': "+String(e).split(": ").pop())}}return ok()},
 mkdir:a=>{const{f,pos}=opt(a);if(!pos.length)return fail("mkdir: missing operand");for(const p of pos){if(node(p)){if(f.has("p"))continue;return fail(`mkdir: cannot create directory '${p}': File exists`)}
   const parts=norm(p).split("/").filter(Boolean);let cur="";for(let i=0;i<parts.length;i++){cur+="/"+parts[i];const n=node(cur);if(n)continue;if(i<parts.length-1&&!f.has("p"))return fail(`mkdir: cannot create directory '${p}': No such file or directory`);const dn=node(cur.slice(0,cur.lastIndexOf("/"))||"/");if(!canW(dn))return fail(`mkdir: cannot create directory '${p}': Permission denied`);dn.ch[parts[i]]=mk("d")}}return ok()},
 cp:a=>{const{f,pos}=opt(a);if(pos.length<2)return fail("cp: missing destination file operand");const dst=pos.pop(),dn=node(dst);
  for(const s of pos){const n=node(s);if(!n)return fail(`cp: cannot stat '${s}': No such file or directory`);if(n.t=="d"&&!f.has("r")&&!f.has("R"))return fail(`cp: -r not specified; omitting directory '${s}'`);if(n.t=="f"&&!canR(n))return fail(`cp: cannot open '${s}' for reading: Permission denied`);
   const target=dn&&dn.t=="d"?norm(dst)+"/"+norm(s).split("/").pop():dst;const[pd,nm]=parent(target),pn=node(pd);if(!pn)return fail(`cp: cannot create '${target}': No such file or directory`);if(!canW(pn))return fail(`cp: cannot create '${target}': Permission denied`);
   const clone=x=>x.t=="d"?{...x,owner:sh.user,group:sh.user,mt:NOW(),ch:Object.fromEntries(Object.entries(x.ch).map(([k,v])=>[k,clone(v)]))}:{...x,owner:sh.user,group:sh.user,mt:NOW()};pn.ch[nm]=clone(n)}return ok()},
 mv:a=>{const{pos}=opt(a);if(pos.length<2)return fail("mv: missing destination file operand");const dst=pos.pop(),dn=node(dst);
  for(const s of pos){const[sp,sn]=parent(s),spn=node(sp),n=spn&&spn.ch[sn];if(!n)return fail(`mv: cannot stat '${s}': No such file or directory`);if(!canW(spn))return fail(`mv: cannot move '${s}': Permission denied`);
   const target=dn&&dn.t=="d"?norm(dst)+"/"+sn:dst;const[pd,nm]=parent(target),pn=node(pd);if(!pn)return fail(`mv: cannot move '${s}' to '${target}': No such file or directory`);if(!canW(pn))return fail(`mv: cannot move '${s}' to '${target}': Permission denied`);delete spn.ch[sn];pn.ch[nm]=n}return ok()},
 rm:a=>{const{f,pos}=opt(a);if(!pos.length)return fail("rm: missing operand");for(const p of pos){if(norm(p)=="/")return fail("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe (and please don't)");
   const[d,nm]=parent(p),dn=node(d),n=dn&&dn.ch[nm];if(!n){if(f.has("f"))continue;return fail(`rm: cannot remove '${p}': No such file or directory`)}if(n.t=="d"&&!f.has("r")&&!f.has("R"))return fail(`rm: cannot remove '${p}': Is a directory`);if(!canW(dn))return fail(`rm: cannot remove '${p}': Permission denied`);delete dn.ch[nm]}return ok()},
 rmdir:a=>{for(const p of a){const[d,nm]=parent(p),dn=node(d),n=dn&&dn.ch[nm];if(!n)return fail(`rmdir: failed to remove '${p}': No such file or directory`);if(n.t!="d")return fail(`rmdir: failed to remove '${p}': Not a directory`);if(Object.keys(n.ch).length)return fail(`rmdir: failed to remove '${p}': Directory not empty`);delete dn.ch[nm]}return ok()},
 ln:a=>{const{f,pos}=opt(a);if(pos.length<2)return fail("ln: missing destination file operand");if(!f.has("s"))return fail("ln: hard links aren't simulated here; use ln -s");const[d,nm]=parent(pos[1]),dn=node(d);if(!dn)return fail("ln: failed: No such file or directory");if(!canW(dn))return fail(`ln: failed to create symbolic link '${pos[1]}': Permission denied`);dn.ch[nm]={t:"l",to:norm(pos[0]),mode:0o777,owner:sh.user,group:sh.user,mt:NOW()};return ok()},
 cat:(a,i)=>{const{f,pos}=opt(a);const s=src(pos,i,"cat");if(s.err)return fail(s.err);return ok(f.has("n")?lines(s.txt).map((l,k)=>pad(k+1,6,1)+"\t"+l).join("\n"):s.txt.replace(/\n$/,""))},
 less:(a,i)=>{const r=C.cat(a,i);if(r.out)r.out+="\n"+sim("(less shows a page at a time in a real terminal: Space for next, / to search, q to quit)");return r},
 head:(a,i)=>{a=a.map(x=>/^-\d+$/.test(x)?"-n"+x.slice(1):x);const{v,pos}=opt(a,"nc");const n=+(v.n||10),s=src(pos,i,"head");if(s.err)return fail(s.err);return ok(lines(s.txt).slice(0,n).join("\n"))},
 /* 4 text */
 tail:(a,i)=>{a=a.map(x=>/^-\d+$/.test(x)?"-n"+x.slice(1):x);const{f,v,pos}=opt(a,"n");const n=+(v.n||10),s=src(pos,i,"tail");if(s.err)return fail(s.err);const r=lines(s.txt).slice(-n).join("\n");return ok(f.has("f")?r+"\n"+sim("(tail -f keeps following new lines until Ctrl+C; here it stops)"):r)},
 grep:(a,i)=>{const{f,pos}=opt(a.filter(x=>x!="--color"&&x!="--color=auto"),"e");let pat=opt(a,"e").v.e??pos.shift();if(pat==null)return fail("Usage: grep [OPTION]... PATTERNS [FILE]...");let re;try{re=new RegExp(pat,f.has("i")?"i":"")}catch(e){return fail("grep: Invalid regular expression")}
  const res=[];let files=pos.slice();if(f.has("r")||f.has("R")){const all=[];(files.length?files:["."]).forEach(p=>walk(norm(p),(q,n)=>{if(n.t=="f"&&canR(n))all.push(p.startsWith("/")?q:q.replace(norm(p)+"/",p=="."?"":p.replace(/\/$/,"")+"/"))}));files=all}
  const multi=files.length>1||f.has("r")||f.has("R");let count=0;
  const scan=(txt,name)=>{let c=0;lines(txt).forEach((l,k)=>{const hit=re.test(l)!==f.has("v");if(hit){c++;if(!f.has("c")&&!f.has("l"))res.push((multi?name+":":"")+(f.has("n")?(k+1)+":":"")+(f.has("o")?(l.match(re)||[""])[0]:l))}});if(f.has("c"))res.push((multi?name+":":"")+c);if(f.has("l")&&c)res.push(name);count+=c};
  if(!files.length){if(i==null)return fail("grep: give a file, or pipe text in, e.g. cat notes.txt | grep port");scan(i,"(stdin)")}
  else for(const p of files){try{scan(read(p),p)}catch(e){res.push("grep: "+e)}}
  return{code:count?0:1,out:res.join("\n")}},
 cut:(a,i)=>{const{v,pos}=opt(a,"dfc");const s=src(pos,i,"cut");if(s.err)return fail(s.err);const d=v.d??"\t";const sel=spec=>{const want=[];spec.split(",").forEach(x=>{const[m,n]=x.split("-");if(x.includes("-"))for(let k=+(m||1);k<=(n?+n:999);k++)want.push(k);else want.push(+x)});return want};
  if(v.c)return ok(lines(s.txt).map(l=>sel(v.c).map(k=>l[k-1]??"").join("")).join("\n"));if(!v.f)return fail("cut: you must specify a list of bytes, characters, or fields");return ok(lines(s.txt).map(l=>{const p=l.split(d);return sel(v.f).filter(k=>k<=p.length).map(k=>p[k-1]).join(d)}).join("\n"))},
 sort:(a,i)=>{const{f,v,pos}=opt(a,"tk");const s=src(pos,i,"sort");if(s.err)return fail(s.err);let L=lines(s.txt);const key=l=>v.k?(l.split(v.t||/\s+/)[+v.k.split(",")[0]-1]??""):l;
  L.sort((x,y)=>f.has("n")?parseFloat(key(x))-parseFloat(key(y))||0:key(x).localeCompare(key(y)));if(f.has("r"))L.reverse();if(f.has("u"))L=[...new Set(L)];return ok(L.join("\n"))},
 uniq:(a,i)=>{const{f,pos}=opt(a);const s=src(pos,i,"uniq");if(s.err)return fail(s.err);const r=[];lines(s.txt).forEach(l=>{const last=r[r.length-1];if(last&&last[0]==l)last[1]++;else r.push([l,1])});
  return ok(r.filter(x=>!f.has("d")||x[1]>1).map(([l,c])=>f.has("c")?pad(c,7,1)+" "+l:l).join("\n"))},
 wc:(a,i)=>{const{f,pos}=opt(a);const one=(t,name)=>{const L=t?t.split("\n").length-(t.endsWith("\n")?1:0):0,W=(t.match(/\S+/g)||[]).length,B=new TextEncoder().encode(t).length;const all=!f.size,c=[];if(all||f.has("l"))c.push(pad(L,f.size==1?0:7,1));if(all||f.has("w"))c.push(pad(W,f.size==1?0:7,1));if(all||f.has("c"))c.push(pad(B,f.size==1?0:7,1));return c.join(" ")+(name?" "+name:"")};
  if(!pos.length){if(i==null)return fail("wc: give a file or pipe text in");return ok(one(i,""))}const r=[];for(const p of pos){try{r.push(one(read(p),p))}catch(e){r.push("wc: "+e)}}return ok(r.join("\n"))},
 tr:(a,i)=>{const{f,pos}=opt(a);if(i==null)return fail("tr: pipe text in, e.g. echo hello | tr a-z A-Z");const ex=s=>s.replace(/(.)-(.)/g,(m,x,y)=>{let o="";for(let c=x.charCodeAt(0);c<=y.charCodeAt(0);c++)o+=String.fromCharCode(c);return o}).replace("[:lower:]","abcdefghijklmnopqrstuvwxyz").replace("[:upper:]","ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  const s1=ex(pos[0]||"");if(f.has("d"))return ok(i.replace(/\n$/,"").split("").filter(c=>!s1.includes(c)).join(""));const s2=ex(pos[1]||"");return ok(i.replace(/\n$/,"").split("").map(c=>{const k=s1.indexOf(c);return k<0?c:s2[Math.min(k,s2.length-1)]??c}).join(""))},
 sed:(a,i)=>{const{f,pos}=opt(a);const prog=pos.shift();if(!prog)return fail("Usage: sed [OPTION]... {script} [input-file]...");const m=prog.match(/^s(.)(.*?)\1(.*?)\1([gi]*)$/);let fn;
  if(m){let re;try{re=new RegExp(m[2],m[4].replace("g","")+(m[4].includes("g")?"g":""))}catch(e){return fail("sed: bad regex")}fn=l=>l.replace(re,m[3].replace(/&/g,"$&"))}
  else{const d=prog.match(/^\/(.*)\/d$/),p=prog.match(/^(\d+)(?:,(\d+))?p$/);if(d){const re=new RegExp(d[1]);fn=l=>re.test(l)?null:l}else if(p&&f.has("n")){const s0=+p[1],e0=+(p[2]||p[1]);let k=0;fn=l=>{k++;return k>=s0&&k<=e0?l:null}}else return fail("sed: only s/old/new/[g], /pattern/d and -n 'N,Mp' are simulated")}
  if(f.has("i")){for(const p of pos){try{write(p,lines(read(p)).map(fn).filter(x=>x!=null).join("\n")+"\n")}catch(e){return fail("sed: "+e)}}return ok()}
  const s=src(pos,i,"sed");if(s.err)return fail(s.err);return ok(lines(s.txt).map(fn).filter(x=>x!=null).join("\n"))},
 awk:(a,i)=>{const{v,pos}=opt(a,"F");const prog=pos.shift();if(!prog)return fail("usage: awk [-F fs] 'program' [file ...]");const m=prog.match(/^\s*(?:\/(.*?)\/|(NR\s*[<>=!]+\s*\d+|\$\d+\s*[<>=!]=?\s*"?[^"{]*"?))?\s*\{\s*print\s*(.*?)\s*;?\s*\}\s*$/);if(!m)return fail("awk: only '{print ...}', '/pattern/{print ...}' and simple conditions are simulated");
  const s=src(pos,i,"awk");if(s.err)return fail(s.err);const fs=v.F==null?/\s+/:v.F=="\\t"?"\t":v.F;const re=m[1]!=null?new RegExp(m[1]):null;
  const res=[];lines(s.txt).forEach((l,k)=>{const F=(fs instanceof RegExp?l.trim():l).split(fs);const get=t=>{t=t.trim();if(t=="$0")return l;if(t=="NF")return F.length;if(t=="NR")return k+1;if(t=="$NF")return F[F.length-1];const d=t.match(/^\$(\d+)$/);if(d)return F[+d[1]-1]??"";const q=t.match(/^"(.*)"$/);if(q)return q[1];return t};
   if(re&&!re.test(l))return;if(m[2]){const c=m[2].match(/^(NR|\$\d+)\s*([<>=!]+)\s*"?([^"]*)"?$/);if(c){const L=get(c[1]),R=c[3],n=!isNaN(+L)&&!isNaN(+R);const x=n?+L:L,y=n?+R:R;const ok2={"==":x==y,"!=":x!=y,">":x>y,"<":x<y,">=":x>=y,"<=":x<=y}[c[2]];if(!ok2)return}}
   const parts=(m[3]||"$0").match(/"[^"]*"|[^,\s][^,]*/g)||["$0"];res.push(parts.map(get).join(m[3]&&m[3].includes(",")?" ":""))});return ok(res.join("\n"))},
 diff:a=>{const{pos}=opt(a);if(pos.length<2)return fail("diff: missing operand");let A,B;try{A=lines(read(pos[0]));B=lines(read(pos[1]))}catch(e){return fail("diff: "+e)}const res=[];const max=Math.max(A.length,B.length);let same=true;
  const setB=new Set(B),setA=new Set(A);A.forEach((l,k)=>{if(!setB.has(l)){res.push(`${k+1}d${k}`,"< "+l);same=false}});B.forEach((l,k)=>{if(!setA.has(l)){res.push(`${k}a${k+1}`,"> "+l);same=false}});return same?ok():{code:1,out:res.join("\n")}},
 /* 5 permissions & users */
 chmod:a=>{const{pos}=opt(a.filter(x=>!/^-[R]$/.test(x)));const spec=pos.shift();if(!spec||!pos.length)return fail("chmod: missing operand");for(const p of pos){const n=node(p);if(!n)return fail(`chmod: cannot access '${p}': No such file or directory`);if(!isRoot()&&n.owner!=sh.user)return fail(`chmod: changing permissions of '${p}': Operation not permitted`);
   if(/^[0-7]{3,4}$/.test(spec)){n.mode=parseInt(spec,8);continue}
   for(const part of spec.split(",")){const m=part.match(/^([ugoa]*)([+\-=])([rwxst]*)$/);if(!m)return fail("chmod: invalid mode: '"+spec+"'");const who=m[1]||"a",bits={r:4,w:2,x:1};let mask=0;
    for(const c of m[3]){if(c=="s"){mask|=who.includes("g")?0o2000:0o4000;continue}if(c=="t"){mask|=0o1000;continue}const b=bits[c];if(who.includes("u")||who=="a")mask|=b<<6;if(who.includes("g")||who=="a")mask|=b<<3;if(who.includes("o")||who=="a")mask|=b}
    if(m[2]=="+")n.mode|=mask;else if(m[2]=="-")n.mode&=~mask;else{let clear=0;if(who.includes("u")||who=="a")clear|=0o700;if(who.includes("g")||who=="a")clear|=0o070;if(who.includes("o")||who=="a")clear|=0o007;n.mode=(n.mode&~clear)|mask}}}return ok()},
 chown:a=>{const{pos}=opt(a.filter(x=>x!="-R"));const[u,g]=(pos.shift()||"").split(":");const nr=needRoot("chown");if(nr)return fail("chown: changing ownership of '"+pos[0]+"': Operation not permitted (only root can give files away; try sudo)");for(const p of pos){const n=node(p);if(!n)return fail(`chown: cannot access '${p}': No such file or directory`);if(u)n.owner=u;if(g)n.group=g}return ok()},
 chgrp:a=>{const{pos}=opt(a);const g=pos.shift();for(const p of pos){const n=node(p);if(!n)return fail(`chgrp: cannot access '${p}': No such file or directory`);if(!isRoot()&&n.owner!=sh.user)return fail(`chgrp: changing group of '${p}': Operation not permitted`);n.group=g}return ok()},
 umask:a=>{if(a[0]){sh.umask=parseInt(a[0],8);return ok()}return ok("0"+sh.umask.toString(8).padStart(3,"0"))},
 id:a=>{const u=a[0]||sh.user;if(u=="root")return ok("uid=0(root) gid=0(root) groups=0(root)");if(u=="student")return ok("uid=1000(student) gid=1000(student) groups=1000(student),27(sudo)");const l=lines(root.ch.etc.ch.passwd.c).find(x=>x.startsWith(u+":"));if(!l)return fail("id: '"+u+"': no such user");const p=l.split(":");return ok(`uid=${p[2]}(${u}) gid=${p[3]}(${u}) groups=${p[3]}(${u})`)},
 groups:a=>ok((a[0]||sh.user)=="root"?"root":"student sudo"),
 sudo:(a,i)=>{if(!a.length)return fail("usage: sudo command");if(a[0]=="-l")return ok("User student may run the following commands on lab:\n    (ALL : ALL) ALL");if(a[0]=="su"||a[0]=="-i"||(a[0]=="-s")){sh._was=sh.user;sh.user="root";sh.cwd="/root";return ok(sim("(you are now root: the prompt ends in #. Type exit to go back.)"))}
  const was=sh.user;sh.user="root";try{return exec(a,i)}finally{sh.user=was}},
 su:a=>{const u=a.filter(x=>x!="-")[0]||"root";if(u=="root")return fail("su: Authentication failure\n"+"\x01(root has no password you know here. Use sudo su, or better, sudo for one command.)");if(u==sh.user)return ok();return fail("su: user "+u+" does not exist or has no shell")},
 passwd:a=>ok("Changing password for "+(a[0]||sh.user)+".\n"+sim("(simulated: the sandbox doesn't change passwords. A real passwd asks for the current password, then the new one twice, and shows nothing as you type.)")),
 useradd:a=>{const nr=needRoot("useradd");if(nr)return nr;const{pos}=opt(a,"sg");const u=pos[0];if(!u)return fail("Usage: useradd [options] LOGIN");if(root.ch.etc.ch.passwd.c.includes("\n"+u+":"))return fail("useradd: user '"+u+"' already exists");const uid=1000+lines(root.ch.etc.ch.passwd.c).length;root.ch.etc.ch.passwd.c+=`${u}:x:${uid}:${uid}::/home/${u}:/bin/bash\n`;if(a.includes("-m"))root.ch.home.ch[u]={t:"d",ch:{},mode:0o750,owner:u,group:u,mt:NOW()};return ok()},
 /* 6 processes */
 ps:a=>{const all=a.some(x=>/a|e/.test(x));const rows=sh.procs.filter(p=>all||p[1]==sh.user);if(a.join("").includes("u")||a.includes("aux"))return ok("USER         PID %CPU %MEM COMMAND\n"+rows.map(p=>pad(p[1],10)+pad(p[0],6,1)+"  0.0  0.1 "+p[2]).join("\n"));return ok("    PID TTY          TIME CMD\n"+rows.map(p=>pad(p[0],7,1)+" pts/0    00:00:00 "+p[2].split(" ")[0].replace(/^-/,"")).join("\n")+"\n"+pad(sh.nextPid,7,1)+" pts/0    00:00:00 ps")},
 top:()=>ok(`top - ${NOW().toTimeString().slice(0,8)} up 3 days,  2:14,  1 user,  load average: 0.08, 0.05, 0.01\nTasks: ${sh.procs.length} total,   1 running\n%Cpu(s):  1.3 us,  0.7 sy, 98.0 id\nMiB Mem :   3936.2 total,   2410.5 free,    612.0 used\n\n    PID USER      %CPU %MEM COMMAND\n`+sh.procs.map(p=>pad(p[0],7,1)+" "+pad(p[1],9)+"  0.3  0.4 "+p[2].split(" ")[0]).join("\n")+"\n"+sim("(top refreshes live until you press q; this is one snapshot. Try htop on a real box.)")),
 kill:a=>{const{pos}=opt(a.filter(x=>!/^-(9|15|KILL|TERM)$/.test(x)));if(a[0]=="-l")return ok(" 1) SIGHUP  2) SIGINT  9) SIGKILL 15) SIGTERM 19) SIGSTOP");if(!pos.length)return fail("kill: usage: kill [-s sigspec | -n signum | -sigspec] pid");
  for(const x of pos){const pid=x.startsWith("%")?(sh.jobs[+x.slice(1)-1]||{}).pid:+x;const k=sh.procs.findIndex(p=>p[0]==pid);if(k<0)return fail(`kill: (${x}) - No such process`);if(!isRoot()&&sh.procs[k][1]!=sh.user)return fail(`kill: (${pid}) - Operation not permitted`);sh.procs.splice(k,1);sh.jobs=sh.jobs.filter(j=>j.pid!=pid)}return ok()},
 pkill:a=>{const n=a.filter(x=>x[0]!="-")[0];if(!n)return fail("pkill: no matching criteria specified");const hits=sh.procs.filter(p=>p[2].includes(n));if(!hits.length)return{code:1,out:""};if(!isRoot()&&hits.some(p=>p[1]!=sh.user))return fail("pkill: killing pid "+hits[0][0]+" failed: Operation not permitted");sh.procs=sh.procs.filter(p=>!p[2].includes(n));sh.jobs=sh.jobs.filter(j=>!j.cmd.includes(n));return ok()},
 jobs:()=>ok(sh.jobs.map((j,k)=>`[${j.id}]${k==sh.jobs.length-1?"+":"-"}  ${pad(j.state,22)} ${j.cmd} &`).join("\n")),
 bg:a=>{const j=sh.jobs[a[0]?+a[0].replace("%","")-1:sh.jobs.length-1];if(!j)return fail("bg: current: no such job");j.state="Running";return ok(`[${j.id}]+ ${j.cmd} &`)},
 fg:a=>{const j=sh.jobs[a[0]?+a[0].replace("%","")-1:sh.jobs.length-1];if(!j)return fail("fg: current: no such job");sh.jobs=sh.jobs.filter(x=>x!=j);sh.procs=sh.procs.filter(p=>p[0]!=j.pid);return ok(j.cmd+"\n"+sim("(brought to the foreground; it finishes here at once. In a real terminal, Ctrl+Z pauses it again.)"))},
 nohup:a=>{if(!a.length)return fail("nohup: missing operand");try{write("nohup.out",(exec(a,"").out||"")+"\n",true)}catch(e){}return ok("nohup: ignoring input and appending output to 'nohup.out'")},
 sleep:a=>a[0]&&!isNaN(parseFloat(a[0]))?ok(sim("(slept "+a[0]+"s instantly; run it with & to keep it in the background)")):fail("sleep: missing operand"),
 uptime:()=>ok(` ${NOW().toTimeString().slice(0,8)} up 3 days,  2:14,  1 user,  load average: 0.08, 0.05, 0.01`),
 free:a=>ok(opt(a).f.has("h")?"               total        used        free      shared  buff/cache   available\nMem:           3.8Gi       612Mi       2.4Gi        12Mi       850Mi       3.0Gi\nSwap:          2.0Gi          0B       2.0Gi":"               total        used        free\nMem:         4030668      626688     2468352\nSwap:        2097148           0     2097148"),
 /* 7 networking */
 ip:a=>{const s=a[0]||"";if(/^a/.test(s))return ok("1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500\n    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff\n    inet 10.0.0.5/24 brd 10.0.0.255 scope global eth0\n    inet6 fe80::5054:ff:fe12:3456/64 scope link");if(/^r/.test(s))return ok("default via 10.0.0.1 dev eth0 proto dhcp\n10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.5");if(/^n/.test(s))return ok("10.0.0.1 dev eth0 lladdr 52:54:00:aa:bb:01 REACHABLE");return fail("Usage: ip addr | ip route | ip neigh")},
 ping:a=>{const{v,pos}=opt(a,"c");const h=pos[0];if(!h)return fail("ping: usage error: Destination address required");const ip=DNS[h]?.[0]||(/^\d+\.\d+\.\d+\.\d+$/.test(h)?h:null);if(!ip)return fail("ping: "+h+": Name or service not known",2);
  const n=+(v.c||4),ms=()=>(h.includes("internal")||ip.startsWith("10.")||ip.startsWith("127.")?.3+Math.random()*.4:11+Math.random()*9).toFixed(1);const r=[`PING ${h} (${ip}) 56(84) bytes of data.`];for(let k=1;k<=n;k++)r.push(`64 bytes from ${ip}: icmp_seq=${k} ttl=${ip.startsWith("10.")?64:56} time=${ms()} ms`);r.push("",`--- ${h} ping statistics ---`,`${n} packets transmitted, ${n} received, 0% packet loss`);if(!v.c)r.push("\x01(ping runs until Ctrl+C on Linux; here it stops after 4. Use -c to choose.)");return ok(r.join("\n"))},
 traceroute:a=>{const h=a.filter(x=>x[0]!="-")[0];const ip=DNS[h]?.[0]||h;if(!h)return fail("Usage: traceroute host");if(!DNS[h]&&!/^\d+\.\d+\.\d+\.\d+$/.test(h))return fail(h+": Name or service not known");const hops=ip.startsWith("10.")?[["10.0.0.1","0.4"],[ip,"0.9"]]:[["10.0.0.1","0.5"],["100.64.0.1","4.1"],["isp-core.example.net (198.51.100.9)","8.7"],["ix-lon1.example.net (192.0.2.33)","11.2"],["* * *",""],[h+" ("+ip+")","14.8"]];
  return ok(`traceroute to ${h} (${ip}), 30 hops max, 60 byte packets\n`+hops.map((x,k)=>pad(k+1,2,1)+"  "+x[0]+(x[1]?"  "+x[1]+" ms":"")).join("\n"))},
 ss:a=>ok("Netid State  Local Address:Port  Peer Address:Port Process\ntcp   LISTEN 0.0.0.0:22          0.0.0.0:*          users:((\"sshd\",pid=512))\ntcp   LISTEN 0.0.0.0:80          0.0.0.0:*          users:((\"nginx\",pid=655))\ntcp   LISTEN 127.0.0.1:5432      0.0.0.0:*          users:((\"postgres\",pid=702))\nudp   UNCONN 127.0.0.53:53       0.0.0.0:*          users:((\"systemd-resolve\",pid=390))\ntcp   ESTAB  10.0.0.5:22         192.168.1.20:52001 users:((\"sshd\",pid=1102))"),
 netstat:a=>C.ss(a),
 dig:a=>{const pos=a.filter(x=>x[0]!="+"&&x[0]!="@"),short=a.includes("+short"),h=pos[0],type=(pos[1]||"A").toUpperCase();if(!h)return fail("usage: dig name [type]");
  let ans=[];if(type=="A")ans=(DNS[h]||[]).filter(x=>!x.includes(":"));else if(type=="AAAA")ans=(DNS[h]||[]).filter(x=>x.includes(":"));else if(type=="MX")ans=MX[h]?[MX[h]]:[];else if(type=="NS")ans=DNS[h]?["a.iana-servers.net.","b.iana-servers.net."]:[];else if(type=="TXT")ans=DNS[h]?['"v=spf1 -all"']:[];else if(type=="CNAME")ans=h.startsWith("www.")?[h.slice(4)+"."]:[];
  if(short)return ok(ans.join("\n"));const st=DNS[h.replace(/^www\./,"")]?"NOERROR":"NXDOMAIN";return ok(`; <<>> DiG 9.18 <<>> ${h} ${type}\n;; ->>HEADER<<- opcode: QUERY, status: ${st}\n\n;; QUESTION SECTION:\n;${h}.\t\t\tIN\t${type}\n`+(ans.length?`\n;; ANSWER SECTION:\n`+ans.map(x=>`${h}.\t\t300\tIN\t${type}\t${x}`).join("\n"):"")+`\n\n;; Query time: 18 msec\n;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)`)},
 nslookup:a=>{const h=a[0];if(!h)return fail("usage: nslookup host");const ip=DNS[h];if(!ip)return fail(`Server:\t\t127.0.0.53\nAddress:\t127.0.0.53#53\n\n** server can't find ${h}: NXDOMAIN`);return ok(`Server:\t\t127.0.0.53\nAddress:\t127.0.0.53#53\n\nNon-authoritative answer:\n`+ip.map(x=>`Name:\t${h}\nAddress: ${x}`).join("\n"))},
 curl:a=>{const{f,v,pos}=opt(a,"oXHd");const u=pos[0];if(!u)return fail("curl: try 'curl --help' for more information");const key=u.replace(/^\w+:\/\//,"").replace(/\/$/,""),site=SITES[key]||SITES[hostOf(u)]&&key==hostOf(u)&&SITES[hostOf(u)];
  if(!DNS[hostOf(u)])return fail(`curl: (6) Could not resolve host: ${hostOf(u)}`,6);if(!site)return ok(f.has("I")?"HTTP/1.1 404 Not Found\nContent-Type: text/html":"<h1>404 Not Found</h1>");
  if(u.startsWith("http://")&&hostOf(u)=="cipherops.lab"&&!f.has("L"))return ok(f.has("I")||f.has("i")?"HTTP/1.1 301 Moved Permanently\nLocation: https://cipherops.lab/":"<html>301 Moved Permanently</html>\n\x01(The site redirects HTTP to HTTPS. Add -L to follow, or use https://)");
  if(f.has("I"))return ok(site.h);let body=(f.has("i")||f.has("v")?site.h+"\n\n":"")+site.b;if(f.has("v"))body=`*   Trying ${DNS[hostOf(u)][0]}:${u.startsWith("https")?443:80}...\n* Connected to ${hostOf(u)}\n`+(u.startsWith("https")?"* TLS 1.3 handshake, certificate verified\n":"")+`> GET /${key.split("/").slice(1).join("/")} HTTP/1.1\n> Host: ${hostOf(u)}\n> User-Agent: curl/8.5.0\n>\n< `+body;
  if(v.o){try{write(v.o,site.b+"\n")}catch(e){return fail("curl: "+e)}return ok("  % Total    % Received\n100  "+site.b.length+"  100  "+site.b.length)}return ok(body)},
 wget:a=>{const u=a.filter(x=>x[0]!="-")[0];if(!u)return fail("wget: missing URL");if(!DNS[hostOf(u)])return fail(`wget: unable to resolve host address '${hostOf(u)}'`,4);const key=u.replace(/^\w+:\/\//,"").replace(/\/$/,""),site=SITES[key]||SITES[hostOf(u)];const name=key.includes("/")?key.split("/").pop():"index.html";
  try{write(name,(site?site.b:"")+"\n")}catch(e){return fail("wget: "+e)}return ok(`--${NOW().toISOString().slice(0,19).replace("T"," ")}--  ${u}\nResolving ${hostOf(u)}... ${DNS[hostOf(u)][0]}\nConnecting to ${hostOf(u)}|${DNS[hostOf(u)][0]}|:${u.startsWith("https")?443:80}... connected.\nHTTP request sent, awaiting response... 200 OK\nSaving to: '${name}'\n\n'${name}' saved`)},
 nc:a=>{const{f,pos}=opt(a,"pw");if(f.has("l"))return ok(`Listening on 0.0.0.0 ${opt(a,"pw").v.p||pos[0]||"?"}\n`+sim("(a real nc -l waits here for someone to connect. Only listen on machines you control.)"));const[h,p]=pos;if(!h||!p)return fail("usage: nc [-zv] host port");const open={22:"ssh",80:"http",443:"https",5432:"postgresql"};
  const ports=p.includes("-")?Array.from({length:Math.min(+p.split("-")[1]-+p.split("-")[0]+1,1024)},(_,k)=>+p.split("-")[0]+k):[+p];const res=ports.map(x=>open[x]&&(h=="localhost"||h.startsWith("10.")||h=="127.0.0.1"||DNS[h])?`Connection to ${h} ${x} port [tcp/${open[x]}] succeeded!`:ports.length==1?`nc: connect to ${h} port ${x} (tcp) failed: Connection refused`:null).filter(Boolean);return ok(res.join("\n"))},
 hostname:a=>{if(a[0]=="-I")return ok("10.0.0.5");if(a[0]&&a[0][0]!="-"){const nr=needRoot("hostname");if(nr)return fail("hostname: you must be root to change the host name");sh.env.HOSTNAME=a[0];return ok()}return ok(sh.env.HOSTNAME)},
 /* 8 packages, services, environment */
 apt:a=>{const[cmd,...pk]=a.filter(x=>x!="-y");if(cmd=="list"&&a.includes("--installed"))return ok("Listing...\n"+[...sh.installed].sort().map(p=>p+"/noble,now amd64 [installed]").join("\n"));if(cmd=="search")return ok(["nmap - The Network Mapper","jq - lightweight JSON processor","htop - interactive process viewer","tree - displays an indented directory tree"].filter(x=>x.includes(pk[0]||"")).join("\n"));if(cmd=="show")return ok(`Package: ${pk[0]}\nVersion: 1.0\nDescription: ${pk[0]} package`);
  const nr=needRoot("apt");if(nr)return fail("E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?");
  if(cmd=="update")return ok("Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nGet:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]\nReading package lists... Done\n12 packages can be upgraded. Run 'apt list --upgradable' to see them.");
  if(cmd=="upgrade")return ok("Reading package lists... Done\nCalculating upgrade... Done\n12 upgraded, 0 newly installed, 0 to remove.\n"+sim("(simulated upgrade: nothing actually changed)"));
  if(cmd=="install"){if(!pk.length)return fail("E: no package named");pk.forEach(p=>sh.installed.add(p));return ok(`Reading package lists... Done\nThe following NEW packages will be installed:\n  ${pk.join(" ")}\nSetting up ${pk.join(", ")} ...`)}
  if(cmd=="remove"||cmd=="purge"){pk.forEach(p=>sh.installed.delete(p));return ok("Removing "+pk.join(" ")+" ...")}return fail("Usage: apt update | upgrade | install PKG | remove PKG | search WORD | list --installed")},
 dpkg:a=>{if(a[0]=="-l")return ok("||/ Name              Version        Description\n+++-=================-==============-==========================\n"+[...sh.installed].sort().map(p=>"ii  "+pad(p,18)+pad("1.0",15)+p).join("\n"));if(a[0]=="-L")return ok("/usr/bin/"+(a[1]||"pkg"));return fail("dpkg: use -l to list packages")},
 systemctl:a=>{const[cmd,svc0]=a;const svc=(svc0||"").replace(".service","");if(cmd=="list-units"||!cmd)return ok(Object.entries(sh.services).map(([k,v])=>pad(k+".service",22)+(v?"loaded active running":"loaded inactive dead")).join("\n"));if(!(svc in sh.services))return fail(`Unit ${svc0}.service could not be found.`,4);
  if(cmd=="status"){const on=sh.services[svc];return{code:on?0:3,out:`${on?"●":"○"} ${svc}.service\n     Loaded: loaded (/usr/lib/systemd/system/${svc}.service; enabled)\n     Active: ${on?"active (running) since Tue 08:02:15; 1h ago":"inactive (dead)"}\n   Main PID: ${on?{ssh:512,nginx:655,cron:412,ufw:0}[svc]:"—"}`}}
  const nr=needRoot("systemctl");if(nr)return fail("Failed to "+cmd+" "+svc+".service: Access denied\nSee system logs and 'systemctl status "+svc+".service' for details. (try sudo)");if(cmd=="start"||cmd=="restart"||cmd=="enable")sh.services[svc]=true;else if(cmd=="stop"||cmd=="disable")sh.services[svc]=false;else return fail("Unknown command verb "+cmd);return ok()},
 journalctl:a=>{const{v}=opt(a,"un");const u=v.u,n=+(v.n||10);let L=lines(root.ch.var.ch.log.ch.syslog.c).concat(lines(AUTH));if(u)L=L.filter(l=>l.includes(u.replace(".service","")=="ssh"?"sshd":u));return ok(L.slice(-n).join("\n"))},
 crontab:a=>{if(a[0]=="-l")return ok(sh.cron||"no crontab for "+sh.user);if(a[0]=="-e")return ok(sim("(crontab -e opens an editor. Each line is: minute hour day month weekday command. Example: 0 3 * * * /home/student/scripts/backup.sh)"));if(a[0]&&node(a[0])){sh.cron=read(a[0]);return ok()}return fail("usage: crontab [-l | -e | file]")},
 env:()=>ok(Object.entries(sh.env).map(([k,v])=>k+"="+v).join("\n")),
 printenv:a=>a[0]?(sh.env[a[0]]!=null?ok(sh.env[a[0]]):{code:1,out:""}):C.env(),
 export:a=>{if(!a.length)return ok(Object.entries(sh.env).map(([k,v])=>`declare -x ${k}="${v}"`).join("\n"));a.forEach(x=>{const i=x.indexOf("=");if(i>0)sh.env[x.slice(0,i)]=x.slice(i+1)});return ok()},
 source:a=>{let t;try{t=read(a[0])}catch(e){return fail("source: "+e)}const r=[];lines(t).forEach(l=>{if(!l.trim()||l.trim()[0]=="#")return;const sub=exec(lex(l).map(x=>x.w),null);if(sub.out)r.push(sub.out)});return ok(r.join("\n"))},
 tee:(a,i)=>{const{f,pos}=opt(a);for(const p of pos){try{write(p,i??"",f.has("a"))}catch(e){return fail("tee: "+e)}}return ok((i??"").replace(/\n$/,""))},
 xargs:(a,i)=>{if(i==null)return fail("xargs: pipe a list in, e.g. find . -name '*.txt' | xargs wc -l");const items=(i.match(/\S+/g)||[]);if(!a.length)return ok(items.join(" "));return exec([...a,...items],null)},
 /* 9 archives & remote */
 tar:a=>{const fl=(a[0]||"").replace(/^-/,""),f=new Set(fl.split(""));const rest=a.slice(1);const name=f.has("f")?rest.shift():null;if(!name)return fail("tar: give an archive name with -f, e.g. tar -czf out.tar.gz folder/");
  if(f.has("c")){const ent={};for(const p of rest){const n=node(p);if(!n)return fail(`tar: ${p}: Cannot stat: No such file or directory`);walk(norm(p),(q,m)=>{if(m.t=="f"&&canR(m))ent[q.replace(norm(p),p.replace(/\/$/,""))]=m.c})}try{write(name,"TAR:"+JSON.stringify(ent))}catch(e){return fail("tar: "+e)}return ok(f.has("v")?Object.keys(ent).join("\n"):"")}
  let arc;try{arc=read(name)}catch(e){return fail("tar: "+e)}if(!arc.startsWith("TAR:"))return fail("tar: This does not look like a tar archive");const ent=JSON.parse(arc.slice(4));
  if(f.has("t"))return ok(Object.keys(ent).join("\n"));if(f.has("x")){for(const[k,v]of Object.entries(ent)){C.mkdir(["-p",k.split("/").slice(0,-1).join("/")||"."]);try{write(k,v)}catch(e){return fail("tar: "+e)}}return ok(f.has("v")?Object.keys(ent).join("\n"):"")}return fail("tar: You must specify one of -c, -t or -x")},
 gzip:a=>{const{f,pos}=opt(a);if(f.has("d"))return C.gunzip(pos);for(const p of pos){let c;try{c=read(p)}catch(e){return fail("gzip: "+e)}write(p+".gz","GZ:"+c);C.rm([p])}return ok()},
 gunzip:a=>{for(const p of a.filter(x=>x[0]!="-")){let c;try{c=read(p)}catch(e){return fail("gunzip: "+e)}if(!c.startsWith("GZ:"))return fail("gunzip: "+p+": not in gzip format");write(p.replace(/\.gz$/,""),c.slice(3));C.rm([p])}return ok()},
 zip:a=>{const{f,pos}=opt(a);const name=pos.shift();if(!name||!pos.length)return fail("zip error: Nothing to do! (try: zip -r out.zip folder)");const ent={};for(const p of pos){if(!node(p))return fail(`zip warning: name not matched: ${p}`);walk(norm(p),(q,m)=>{if(m.t=="f"&&canR(m))ent[q.replace(norm(p),p.replace(/\/$/,""))]=m.c})}write(name.endsWith(".zip")?name:name+".zip","ZIP:"+JSON.stringify(ent));return ok(Object.keys(ent).map(k=>"  adding: "+k+" (deflated 38%)").join("\n"))},
 unzip:a=>{const{f,pos}=opt(a);let c;try{c=read(pos[0])}catch(e){return fail("unzip: cannot find or open "+pos[0])}if(!c.startsWith("ZIP:"))return fail("unzip: "+pos[0]+" is not a zipfile");const ent=JSON.parse(c.slice(4));if(f.has("l"))return ok(Object.keys(ent).join("\n"));for(const[k,v]of Object.entries(ent)){C.mkdir(["-p",k.split("/").slice(0,-1).join("/")||"."]);write(k,v)}return ok("Archive:  "+pos[0]+"\n"+Object.keys(ent).map(k=>"  inflating: "+k).join("\n"))},
 ssh:a=>{const t=a.filter(x=>x[0]!="-")[0];if(!t)return fail("usage: ssh [-i identity_file] [-p port] user@host");const h=t.split("@").pop();if(!DNS[h]&&!/^\d+\.\d+\.\d+\.\d+$/.test(h))return fail(`ssh: Could not resolve hostname ${h}: Name or service not known`,255);
  return ok(`The authenticity of host '${h}' can't be established.\nED25519 key fingerprint is SHA256:Xq3k9yZ2mF1pL0aR7cTn4uVbWd8eHs5jKo6iQg2xYz0.\n`+sim("(simulated: a real ssh asks you to check that fingerprint and type yes, then asks for a password or uses your key. Compare fingerprints out of band the first time.)"))},
 scp:a=>{const{pos}=opt(a,"iP");if(pos.length<2)return fail("usage: scp source target");if(pos.some(p=>p.includes(":")))return ok(sim(`(simulated: scp would copy ${pos[0]} to ${pos[1]} over SSH, encrypted, after the same host-key and login checks as ssh)`));return C.cp(pos)},
 rsync:a=>{const{pos}=opt(a);if(pos.length<2)return fail("rsync: usage: rsync [-av] source dest");if(pos.some(p=>p.includes(":")))return ok(sim("(simulated: rsync over SSH copies only what changed)"));const r=C.cp(["-r",...pos]);return r.err?r:ok("sending incremental file list\n"+pos[0]+"\n\nsent 1,204 bytes  received 35 bytes  total size 1,120")},
 "ssh-keygen":a=>{const{v}=opt(a,"tfCb");const t=v.t||"ed25519",f=v.f||"~/.ssh/id_"+t;C.mkdir(["-p","~/.ssh"]);const key=b64e(sha256(f+NOW())).slice(0,68);try{write(f,"-----BEGIN OPENSSH PRIVATE KEY-----\n"+key+"\n-----END OPENSSH PRIVATE KEY-----\n");node(f).mode=0o600;write(f+".pub",`ssh-${t} AAAAC3NzaC1lZDI1NTE5AAAA${key.slice(0,40)} ${v.C||"student@lab"}\n`)}catch(e){return fail("ssh-keygen: "+e)}
  return ok(`Generating public/private ${t} key pair.\nYour identification has been saved in ${f}\nYour public key has been saved in ${f}.pub\nThe key fingerprint is:\nSHA256:${b64e(sha256(key)).slice(0,43)} ${v.C||"student@lab"}\n`+sim("(the private key stays on your machine, mode 600. Only the .pub file goes to servers.)"))},
 sha256sum:(a,i)=>{const{f,pos}=opt(a);if(f.has("c")){let t;try{t=read(pos[0])}catch(e){return fail("sha256sum: "+e)}return ok(lines(t).map(l=>{const[h,n]=l.split(/\s+/);let c;try{c=read(n)}catch(e){return n+": FAILED open or read"}return n+": "+(sha256(c)==h?"OK":"FAILED")}).join("\n"))}
  if(!pos.length){if(i==null)return fail("sha256sum: give a file or pipe text in");return ok(sha256(i)+"  -")}const r=[];for(const p of pos){try{r.push(sha256(read(p))+"  "+p)}catch(e){r.push("sha256sum: "+e)}}return ok(r.join("\n"))},
 /* 10 inspection & security */
 uname:a=>ok(a.includes("-a")?"Linux lab 6.8.0-49-generic #49-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux":a.includes("-r")?"6.8.0-49-generic":a.includes("-m")?"x86_64":"Linux"),
 lsof:a=>{if(a.includes("-i"))return ok("COMMAND  PID     USER  FD  TYPE NODE NAME\nsshd     512     root  3u  IPv4 TCP  *:ssh (LISTEN)\nnginx    655     root  6u  IPv4 TCP  *:http (LISTEN)\nsshd    1102  student  4u  IPv4 TCP  10.0.0.5:ssh->192.168.1.20:52001 (ESTABLISHED)");const p=a[0];if(p){if(!node(p))return fail("lsof: status error on "+p+": No such file or directory");return{code:1,out:""}}return ok("COMMAND  PID USER  FD  TYPE NAME\nbash    1102 student cwd DIR /home/student\n"+sim("(lsof lists open files; use -i for network connections)"))},
 last:()=>ok("student  pts/0   192.168.1.20   Tue Nov 25 08:02   still logged in\nstudent  pts/0   192.168.1.20   Mon Nov 24 22:41 - 23:58  (01:17)\nreboot   system boot  6.8.0-49-generic Sat Nov 22 06:10   still running\n\nwtmp begins Sat Nov 22 06:10:11 2026"),
 w:()=>ok(` ${NOW().toTimeString().slice(0,8)} up 3 days,  2:14,  1 user,  load average: 0.08, 0.05, 0.01\nUSER     TTY      FROM             LOGIN@   IDLE WHAT\nstudent  pts/0    192.168.1.20     08:02    0.00s w`),
 who:()=>ok("student  pts/0        2026-11-25 08:02 (192.168.1.20)"),
 base64:(a,i)=>{const{f,pos}=opt(a);let t;if(pos.length){try{t=read(pos[0])}catch(e){return fail("base64: "+e)}}else if(i==null)return fail("base64: give a file or pipe text in");else t=i;try{return ok(f.has("d")?b64d(t.trim()):b64e(t))}catch(e){return fail("base64: invalid input")}},
 xxd:(a,i)=>{const{pos}=opt(a);let t;if(pos.length){try{t=read(pos[0])}catch(e){return fail("xxd: "+e)}}else t=i??"";const b=new TextEncoder().encode(t).slice(0,256),r=[];for(let o=0;o<b.length;o+=16){const s=b.slice(o,o+16);r.push(o.toString(16).padStart(8,"0")+": "+[...s].map((x,k)=>x.toString(16).padStart(2,"0")+(k%2?" ":"")).join("").padEnd(40)+" "+[...s].map(x=>x>31&&x<127?String.fromCharCode(x):".").join(""))}return ok(r.join("\n"))},
 strings:a=>{let t;try{t=read(a.filter(x=>x[0]!="-")[0])}catch(e){return fail("strings: "+e)}return ok((t.match(/[\x20-\x7e]{4,}/g)||[]).join("\n"))},
 openssl:a=>{const[cmd,...r]=a;if(cmd=="rand"){const n=+(r[r.length-1]||16),x=Array.from({length:n},()=>Math.floor(Math.random()*256));return ok(r.includes("-hex")?x.map(v=>v.toString(16).padStart(2,"0")).join(""):b64e(String.fromCharCode(...x)))}
  if(cmd=="dgst"){const f=r.filter(x=>x[0]!="-")[0];let c;try{c=read(f)}catch(e){return fail("openssl: "+e)}return ok(`SHA2-256(${f})= ${sha256(c)}`)}
  if(cmd=="s_client"){const t=(r[r.indexOf("-connect")+1]||"").split(":")[0];if(!DNS[t])return fail("s_client: connect:errno=111");return ok(`CONNECTED(00000003)\ndepth=2 C = US, O = Example Root CA\ndepth=1 C = US, O = Example TLS CA\ndepth=0 CN = ${t}\nverify return:1\n---\nCertificate chain\n 0 s:CN = ${t}\n   i:C = US, O = Example TLS CA\n---\nNew, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384\nVerify return code: 0 (ok)`)}
  if(cmd=="version")return ok("OpenSSL 3.0.13 30 Jan 2024");return fail("usage: openssl rand -hex N | dgst -sha256 FILE | s_client -connect host:443 | version")},
 watch:a=>{const{pos}=opt(a,"n");if(!pos.length)return fail("Usage: watch [-n seconds] command");const r=exec(pos,null);return ok(`Every 2.0s: ${pos.join(" ")}\n\n`+(r.out||r.err||"")+"\n"+sim("(watch reruns the command every 2 seconds until Ctrl+C; here it ran once)"))},
 ufw:a=>{if(a[0]=="status"){if(!isRoot())return fail("ERROR: You need to be root to run this script");return ok(sh.services.ufw?"Status: active\n\nTo                         Action      From\n--                         ------      ----\n"+sh.ufw.map(x=>pad(x[1],27)+pad(x[0].toUpperCase(),12)+"Anywhere").join("\n"):"Status: inactive")}
  const nr=needRoot("ufw");if(nr)return fail("ERROR: You need to be root to run this script");if(a[0]=="enable"){sh.services.ufw=true;return ok("Firewall is active and enabled on system startup")}if(a[0]=="disable"){sh.services.ufw=false;return ok("Firewall stopped and disabled on system startup")}
  if(a[0]=="allow"||a[0]=="deny"){sh.ufw.push([a[0],a[1]]);return ok("Rule added")}if(a[0]=="default")return ok(`Default ${a[2]||"incoming"} policy changed to '${a[1]}'`);return fail("Usage: ufw enable | status | allow PORT | deny PORT | default deny incoming")},
 /* shell extras */
 help:()=>ok("Try any of the 100 commands in the lessons. A few to start: pwd, ls -la, cd, cat, grep, man ls\nKeys: ↑/↓ history · Tab completes · Ctrl+L clears"),
 exit:()=>{if(sh._was){sh.user=sh._was;sh._was=null;sh.cwd=home();return ok("logout")}return ok(sim("(this is the only terminal; it stays open)"))},
 bash:a=>{if(a[0])return exec(["./"+a[0].replace(/^\.\//,"")],null,true);return ok()},sh:a=>C.bash(a),
 python3:a=>{if(a[0]=="-c")return ok((a[1]||"").match(/print\((['"])(.*)\1\)/)?.[2]??"");if(a[0]){let t;try{t=read(a[0])}catch(e){return fail("python3: can't open file '"+a[0]+"'")}return ok(lines(t).map(l=>(l.match(/print\((['"])(.*)\1\)/)||[])[2]).filter(x=>x!=null).join("\n"))}return ok(sim("(the Python prompt isn't simulated; try python3 -c \"print('hi')\")"))},
 nano:a=>ok(sim(`(nano would open ${a[0]||"a new file"} for editing. Here, write with: echo "text" > ${a[0]||"file.txt"}  or append with >>)`)),
 vim:a=>ok(sim(`(vim would open ${a[0]||"a buffer"}. Escape it with Esc then :q!  . Here, use echo "text" > file)`)),
 htop:()=>C.top(),
 nmap:a=>{const h=a.filter(x=>x[0]!="-")[0];if(!h)return fail("nmap: no target given");return ok(`Starting Nmap 7.94 ( https://nmap.org )\nNmap scan report for ${h}\nPORT    STATE SERVICE\n22/tcp  open  ssh\n80/tcp  open  http\n443/tcp closed https\n\n`+sim("(only scan machines you own or have written permission to test)"))},
};
 const BUILTIN=new Set(["cd","echo","pwd","history","alias","unalias","type","export","source","jobs","bg","fg","umask","exit","help","kill"]);
 function exec(argv,input,asScript){let[cmd,...args]=argv;
  if(cmd.includes("/")||asScript){const n=node(cmd);if(!n)return fail("bash: "+cmd+": No such file or directory",127);if(n.t=="d")return fail("bash: "+cmd+": Is a directory",126);
   if(!(n.mode&0o111)&&!asScript)return fail("bash: "+cmd+": Permission denied",126);if(!canR(n))return fail("bash: "+cmd+": Permission denied",126);
   const r=[];for(const l of lines(n.c)){if(!l.trim()||l.trim()[0]=="#")continue;const sub=run_sub(l);if(sub.out)r.push(sub.out);if(sub.err)r.push(sub.err)}return ok(r.join("\n"))}
  const fn=C[cmd];if(!fn)return fail(cmd+": command not found"+(/^(ifconfig|service)$/.test(cmd)?"\n\x01(ifconfig/service are older tools: try "+(cmd=="ifconfig"?"ip a":"systemctl status ssh")+")":""),127);
  return fn(args,input)}
 function run_sub(l){const saved=out.splice(0);let r={out:"",err:""};try{const toks=lex(l);r=pipeline(toks,{cmds:[]});const o=out.splice(0);r={out:o.filter(x=>!x.e).map(x=>x.t).join("\n"),err:o.filter(x=>x.e).map(x=>x.t).join("\n")}}catch(e){r={err:"bash: "+e}}out.push(...saved);return r}

 /* ---------- UI ---------- */
 const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e};
 host.classList.add("fterm");host.innerHTML="";
 const bar=el("div","fterm-bar");bar.append(el("span","fterm-dots"),el("span","fterm-title","student@lab — simulated terminal"));const reset=el("button","fterm-reset","Reset");reset.type="button";bar.append(reset);
 const scr=el("div","fterm-scr");scr.setAttribute("role","log");scr.setAttribute("aria-live","polite");
 const line=el("label","fterm-line"),pr=el("span","fterm-pr"),inp=el("input","fterm-in");inp.setAttribute("aria-label","Terminal command");inp.autocomplete="off";inp.spellcheck=false;inp.setAttribute("autocapitalize","off");line.append(pr,inp);
 host.append(bar,scr,line);
 const prompt=()=>{const p=sh.cwd==home()?"~":sh.cwd.startsWith(home()+"/")?"~"+sh.cwd.slice(home().length):sh.cwd;return `${sh.user}@${sh.env.HOSTNAME}:${p}${sh.user=="root"?"#":"$"} `};
 const setPr=()=>{pr.textContent=prompt()};
 function print(t,cls){if(t==null)return;String(t).split("\n").forEach(l=>{const d=el("div","fterm-o"+(cls?" "+cls:""));if(l.startsWith("\x01")){d.classList.add("note");l=l.slice(1)}d.textContent=l||" ";scr.append(d)})}
 function render(cmdline){const p=pr.textContent;if(pending=="clear"){scr.innerHTML="";pending=null}else{const d=el("div","fterm-o cmd");d.textContent=p+cmdline;scr.append(d);out.forEach(o=>print(o.t,o.e?"err":""))}setPr();scr.scrollTop=scr.scrollHeight}
 let hi=null;
 inp.addEventListener("keydown",e=>{
  if(e.key=="Enter"){const v=inp.value;inp.value="";hi=null;run(v)}
  else if(e.key=="ArrowUp"){if(!sh.hist.length)return;hi=hi==null?sh.hist.length-1:Math.max(0,hi-1);inp.value=sh.hist[hi];e.preventDefault()}
  else if(e.key=="ArrowDown"){if(hi==null)return;hi++;if(hi>=sh.hist.length){hi=null;inp.value=""}else inp.value=sh.hist[hi];e.preventDefault()}
  else if(e.key=="Tab"){e.preventDefault();const v=inp.value,m=v.match(/(\S*)$/),w=m[1],first=!v.slice(0,v.length-w.length).trim();let c=[];
   if(first)c=Object.keys(C).concat(Object.keys(sh.aliases)).filter(x=>x.startsWith(w));
   else{const[dir,base]=w.includes("/")?[w.slice(0,w.lastIndexOf("/")+1),w.slice(w.lastIndexOf("/")+1)]:["",w];const dn=node(dir||".");if(dn&&dn.t=="d")c=Object.keys(dn.ch).filter(k=>k.startsWith(base)&&(base[0]=="."||k[0]!=".")).map(k=>dir+k+(dn.ch[k].t=="d"?"/":""))}
   if(c.length==1)inp.value=v.slice(0,v.length-w.length)+c[0]+(c[0].endsWith("/")?"":" ");else if(c.length>1){const d=el("div","fterm-o cmd");d.textContent=prompt()+v;scr.append(d);print(c.join("  "));scr.scrollTop=scr.scrollHeight}}
  else if(e.key=="l"&&e.ctrlKey){e.preventDefault();scr.innerHTML=""}
  else if(e.key=="c"&&e.ctrlKey&&!inp.selectionStart!==inp.selectionEnd){if(inp.selectionStart===inp.selectionEnd){e.preventDefault();const d=el("div","fterm-o cmd");d.textContent=prompt()+inp.value+"^C";scr.append(d);inp.value=""}}});
 host.addEventListener("click",e=>{if(!e.target.closest("button")&&!window.getSelection().toString())inp.focus({preventScroll:true})});
 const api={sh,run:l=>{inp.value="";return run(l)},type:l=>{inp.value=l;inp.focus()},exists:p=>!!node(p),read:p=>{const n=node(p);return n&&n.t=="f"?n.c:null},node,norm,print,focus:()=>inp.focus({preventScroll:true}),
  reset:()=>{const fresh=create(host,opts);Object.assign(api,fresh);return fresh}};
 reset.onclick=()=>{api.reset();opts.onReset&&opts.onReset()};
 setPr();print("\x01Welcome to the cipherops lab box (simulated Ubuntu 24.04). Nothing here touches a real machine.\n\x01Type help, or try: pwd   ls -la   man ls");
 return api}
return{create};
})();

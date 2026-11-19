"""Bounty Universe data builder v2.
Sources (all cloned from GitHub, see README):
  bounty-targets-data (MIT)  - HackerOne / Bugcrowd / Intigriti / YesWeHack full typed scopes
  Immunefi mirror (infosec-us-team, factual listing data) - Web3 programs + assets
  disclose.io diodb (CC0)    - self-hosted programs, safe-harbor flags
  ProjectDiscovery public-bugbounty-programs (MIT) - root domains for self-hosted programs
  + a small hand-curated AI-security list (0DIN, huntr) with source URLs
"""
import json, re, sys, datetime, collections
from urllib.parse import urlparse
BTD, IMM, DIODB, PD, OUT = sys.argv[1:6]

def norm(s): return re.sub(r'[^a-z0-9]','',(s or '').lower().replace('bug bounty','').replace('vdp','').replace('program',''))
def host(u):
    try: return urlparse(u).netloc.lower()
    except Exception: return ''
def platform(u):
    h=host(u)
    for k,dom in [('hackerone','hackerone.com'),('bugcrowd','bugcrowd.com'),('intigriti','intigriti.com'),('yeswehack','yeswehack.com'),('hackenproof','hackenproof.com'),('immunefi','immunefi.com'),('federacy','federacy.com'),('openbugbounty','openbugbounty.org')]:
        if h.endswith(dom): return k
    return 'self'
def clip(s,n=150):
    s=re.sub(r'\s+',' ',str(s or '')).strip(); return s if len(s)<=n else s[:n-1]+'…'

# --- asset type normalisation -> one letter
TMAP={ # hackerone
 'WILDCARD':'W','URL':'U','API':'A','GOOGLE_PLAY_APP_ID':'M','OTHER_APK':'M','APPLE_STORE_APP_ID':'I','TESTFLIGHT':'I','OTHER_IPA':'I',
 'SMART_CONTRACT':'S','AI_MODEL':'L','SOURCE_CODE':'C','IP_ADDRESS':'N','CIDR':'N','HARDWARE':'H','DOWNLOADABLE_EXECUTABLES':'E','WINDOWS_APP_STORE_APP_ID':'E','OTHER':'O',
 # bugcrowd
 'website':'U','api':'A','android':'M','ios':'I','network':'N','ip_address':'N','hardware':'H','iot':'H','other':'O','collection':'O',
 # intigriti
 'url':'U','wildcard':'W','iprange':'N','device':'H',
 # yeswehack
 'web-application':'U','mobile-application-android':'M','mobile-application-ios':'I','mobile-application':'M','application':'E','challenge':'O',
 # immunefi
 'smart_contract':'S','blockchain_dlt':'B','websites_and_applications':'U'}
def tnorm(t,target):
    k=TMAP.get(t,'O')
    if k=='U' and str(target).startswith('*.'): k='W'
    return k
AI_STRICT=re.compile(r'\b(AI|LLM|LLMs|GenAI|GPT[-\w.]*|Copilot|Chatbot|chatbot)\b')
AI_LOOSE=re.compile(r'\b(large language model|generative ai|machine learning model|prompt injection|ai model|ai assistant|ai agent|ai feature|ai-powered|llm)\b',re.I)
AI_NEG=re.compile(r'ai[- ]generated|generated (?:by|with|using) ai|use of ai|ai tools? to (?:write|generate)',re.I)
def is_ai(*texts):
    for t in texts:
        t=str(t or '')
        if not t: continue
        if AI_STRICT.search(t[:200]): return True
        s=AI_NEG.sub('',t)
        if AI_LOOSE.search(s[:600]): return True
    return False

progs={}   # key -> program
def add(key,p):
    if key in progs: return progs[key]
    progs[key]=p; return p
def base(name,url,plat,b):
    return {'n':name.strip(),'u':url,'p':plat,'b':b,'sh':-1,'sw':False,'hof':False,'mx':0,'sc':[],'oos':[],'oc':0,'ai':False,'src':''}

def scope_add(p,kind,target,desc=''):
    target=clip(target,140)
    if not target: return
    e=kind+'|'+target+(('|'+clip(desc,70)) if desc else '')
    p['sc'].append(e)
def oos_add(p,kind,target):
    p['oc']+=1
    if len(p['oos'])<40: p['oos'].append(kind+'|'+clip(target,120))

# 1) bounty-targets-data
for p in json.load(open(BTD+'/hackerone_data.json')):
    if p.get('submission_state')!='open': continue
    q=add(norm(p['name']),base(p['name'],p['url'],'hackerone',1 if p.get('offers_bounties') else 0)); q['src']+='b'; q['sw']=bool(p.get('offers_swag'))
    for t in p['targets']['in_scope']:
        k=tnorm(t['asset_type'],t['asset_identifier']); scope_add(q,k,t['asset_identifier'])
        if k=='L' or is_ai(t['asset_identifier'],t.get('instruction')): q['ai']=True; q.setdefault('aiw',clip(t['asset_identifier'],60))
    for t in p['targets']['out_of_scope']: oos_add(q,tnorm(t['asset_type'],t['asset_identifier']),t['asset_identifier'])
for p in json.load(open(BTD+'/bugcrowd_data.json')):
    q=add(norm(p['name']),base(p['name'],p['url'],'bugcrowd',1 if (p.get('max_payout') or 0)>0 else 0)); q['src']+='b'
    q['sh']={'full':2,'partial':1}.get(p.get('safe_harbor'),-1); q['mx']=p.get('max_payout') or 0
    for t in p['targets']['in_scope']:
        k=tnorm(t.get('type'),t.get('target')); scope_add(q,k,t.get('target') or t.get('name'), t.get('name') if t.get('name')!=t.get('target') else '')
        if is_ai(t.get('target'),t.get('name')): q['ai']=True; q.setdefault('aiw',clip(t.get('name') or t.get('target'),60))
    for t in p['targets']['out_of_scope']: oos_add(q,tnorm(t.get('type'),t.get('target')),t.get('target') or t.get('name'))
for p in json.load(open(BTD+'/intigriti_data.json')):
    mx=(p.get('max_bounty') or {}).get('value',0) or 0
    q=add(norm(p['name']),base(p['name'],p['url'],'intigriti',1 if mx>0 else 0)); q['src']+='b'; q['mx']=mx
    for t in p['targets']['in_scope']:
        k=tnorm(t.get('type'),t.get('endpoint')); scope_add(q,k,t.get('endpoint'))
        if is_ai(t.get('endpoint'),t.get('description')): q['ai']=True; q.setdefault('aiw',clip(t.get('endpoint'),60))
    for t in p['targets']['out_of_scope']: oos_add(q,tnorm(t.get('type'),t.get('endpoint')),t.get('endpoint'))
for p in json.load(open(BTD+'/yeswehack_data.json')):
    if p.get('disabled') or not p.get('public'): continue
    mx=p.get('max_bounty') or 0
    q=add(norm(p['name']),base(p['name'],'https://yeswehack.com/programs/'+p['id'],'yeswehack',1 if mx>0 else 0)); q['src']+='b'; q['mx']=mx
    for t in p['targets']['in_scope']:
        k=tnorm(t.get('type'),t.get('target')); scope_add(q,k,t.get('target'))
        if is_ai(t.get('target')): q['ai']=True; q.setdefault('aiw',clip(t.get('target'),60))
    for t in p['targets']['out_of_scope']: oos_add(q,tnorm(t.get('type'),t.get('target')),t.get('target'))

# 2) Immunefi (web3)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for p in json.load(open(IMM+'/projects.json')):
    if p.get('isPaused') or p.get('inviteOnly') or p.get('hideAssetsInScope'): continue
    if p.get('endDate') and p['endDate']<now: continue
    q=add(norm(p['project'])+'_imm',base(p['project'],'https://immunefi.com/bug-bounty/'+p['slug']+'/','immunefi',1)); q['src']+='i'
    q['mx']=p.get('maxBounty') or 0; q['kyc']=bool(p.get('kyc'))
    q['tags']=sorted(set((p.get('projectType') or [])+(p.get('productType') or [])))[:6]
    sh=False
    for a in p.get('assets') or []:
        scope_add(q,tnorm(a.get('type'),a.get('url')),a.get('url'),a.get('description') or '')
        sh=sh or bool(a.get('isSafeHarbor'))
    if sh: q['sh']=1
    if is_ai(p['project']): q['ai']=True

# 3) diodb (self-hosted + safe-harbor enrichment)
for p in json.load(open(DIODB)):
    if p.get('policy_url_status')!='alive': continue
    name=p.get('program_name') or ''; k=norm(name)
    sh={'full':2,'partial':1,'none':0}.get((p.get('safe_harbor') or '').lower(),-1)
    if k in progs:
        q=progs[k]; q['src']+='d'
        if q['sh']<0: q['sh']=sh
        q['hof']=q['hof'] or (p.get('hall_of_fame')=='yes')
        continue
    pl=platform(p.get('policy_url'))
    if pl in ('hackerone','bugcrowd','intigriti','yeswehack','immunefi'): continue  # platform program no longer public/open in live data
    ob=(p.get('offers_bounty') or '').lower(); b=1 if ob=='yes' else 0 if ob=='no' else -1
    q=add(k,base(name,p.get('policy_url',''),pl,b)); q['src']+='d'; q['sh']=sh
    q['sw']=(p.get('offers_swag') or '')=='yes' or p.get('offers_swag') is True; q['hof']=(p.get('hall_of_fame')=='yes')
# 4) ProjectDiscovery root domains (only for programs without platform scope)
for p in json.load(open(PD))['programs']:
    k=norm(p['name']); pl=platform(p.get('url'))
    if k in progs and progs[k]['sc']: continue
    if k not in progs:
        if pl in ('hackerone','bugcrowd','intigriti','yeswehack','immunefi'): continue
        progs[k]=base(p['name'],p.get('url',''),pl,1 if p.get('bounty') else 0)
    q=progs[k]; q['src']+='p'; q['sw']=q['sw'] or bool(p.get('swag'))
    for d in p.get('domains') or []: scope_add(q,'W' if d.startswith('*.') else 'R',d)   # R = root domain (wildcard-ish)

# 5) curated AI-security programs (verified 2026-11-19)
CUR=[
 {'n':'0DIN GenAI Bug Bounty (Mozilla)','u':'https://0din.ai/scope','b':1,'mx':15000,'note':'Model jailbreaks, prompt extraction, guardrail bypass across many vendor models and AI apps',
  'sc':['L|OpenAI GPT-5 family','L|Anthropic Claude models','L|Google Gemini models','L|Meta Muse models','L|xAI Grok models','L|Microsoft Copilot','L|Amazon Nova','L|Other models (see list)','E|AI coding apps: Claude Code, Codex, Cursor, Kiro, Devin Desktop','E|AI browsers: Atlas, Comet']},
 {'n':'huntr (AI/ML open source)','u':'https://huntr.com/bounties','b':1,'mx':0,'note':'Open-source AI/ML repos and ML model file formats (self-hosted testing only)',
  'sc':['C|AI/ML open-source repositories listed on huntr','L|Model file formats: GGUF, ONNX, SafeTensors, Keras, Joblib, TensorRT, OpenVINO…']},
]
for c in CUR:
    q=base(c['n'],c['u'],'self',c['b']); q.update(sc=c['sc'],mx=c['mx'],ai=True,src='c',note=c['note'],sh=-1); progs[norm(c['n'])]=q

# --- finalise
out=[]
for q in progs.values():
    kinds=collections.Counter(e[0] for e in q['sc'])
    cat=''
    if kinds['W'] or kinds['U'] or kinds['R']: cat+='w'
    if kinds['A']: cat+='a'
    if kinds['M'] or kinds['I']: cat+='m'
    if kinds['S'] or kinds['B'] or q['p']=='immunefi': cat+='3'
    if q['ai'] or kinds['L']: cat+='i'
    if kinds['H']: cat+='h'
    if kinds['N']: cat+='n'
    if kinds['C']: cat+='c'
    q['cat']=cat
    d=len(q['sc']); q['d']=d
    wild=kinds['W']+kinds['R']
    s=0
    s+={2:35,1:15,0:0,-1:5}[q['sh']]
    s+={0:15,1:10,-1:3}[q['b']]
    s+= 15 if (d>=5 or wild>=2) else (8 if d>=1 else 0)
    s+= 12 if q['p']!='self' else 4
    s+= 8 if str(q['u']).startswith('https://') else 0
    s+= 5 if (q['sw'] or q['hof']) else 0
    if q.get('kyc'): s-=5
    q['s']=max(0,min(100,s))
    q.pop('ai',None)
    if not q['oos']: q.pop('oos'); q.pop('oc')
    if not q['mx']: q.pop('mx')
    out.append(q)
out.sort(key=lambda x:x['n'].lower())
pc=collections.Counter(q['p'] for q in out)
print(len(out),'programs',dict(pc))
print('cats',{c:sum(1 for q in out if c in q['cat']) for c in 'wam3ihnc'})
print('scope entries',sum(q['d'] for q in out),'oos',sum(q.get('oc',0) for q in out))
print('beginner>=60',sum(1 for q in out if q['s']>=60))
json.dump({'generated':datetime.date.today().isoformat(),'sources':[
  {'name':'bounty-targets-data','url':'https://github.com/arkadiyt/bounty-targets-data','license':'MIT'},
  {'name':'Immunefi programs (unofficial mirror)','url':'https://github.com/infosec-us-team/Immunefi-Bug-Bounty-Programs-Unofficial','license':'no licence file; factual listing data'},
  {'name':'disclose.io diodb','url':'https://github.com/disclose/diodb','license':'CC0-1.0'},
  {'name':'ProjectDiscovery public-bugbounty-programs','url':'https://github.com/projectdiscovery/public-bugbounty-programs','license':'MIT'},
  {'name':'0DIN scope','url':'https://0din.ai/scope','license':'curated summary'},
  {'name':'huntr','url':'https://huntr.com/bounties','license':'curated summary'}],
  'programs':out},open(OUT,'w'),separators=(',',':'),ensure_ascii=False)
import os; print(os.path.getsize(OUT)//1024,'KB')

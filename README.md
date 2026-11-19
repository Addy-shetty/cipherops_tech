# cipherops_tech

A warm, beginner-friendly cybersecurity learning site. It covers web, Android/iOS, cloud,
red team and LLM security, from basic to advanced.

- **Attack Explorer**: 18 attacks walked through packet by packet. It has Network and
  Sequence views, a packet-flow table with play, step and speed controls, a byte-level
  decoder, a kill-chain stage bar, and a Defence toggle that replays each attack with the fix on.
- **Curriculum**: 52 original lessons in 6 modules. Each has a quick check and
  "Go deeper" links to HackTricks, PortSwigger, OWASP, MITRE ATT&CK and more.
- **Labs**: 12 CTF-style challenges with flags, points, hints and ranks. All are simulated in the browser.
- **Placement test**: 12 questions that recommend a learning path.
- **Flashcards**: spaced repetition with Leitner boxes, built from lessons, ports and HTTP status codes.
- **Bounty Universe** (`/universe`): 2,800+ public bug bounty and disclosure programs as a 3D
  universe (three.js), with Bubble chart and List views. Filter by track (Web, API, Mobile, Cloud, Web3,
  AI security, Hardware & IoT…), reward type, safe harbor and platform. Each program shows its full
  in-scope and out-of-scope lists by asset type, and scopes can be downloaded as .txt, .json, .csv
  or a .zip with one file per program. Data refreshes daily (see below).
- **Learning paths**, **cheat sheets**, **search** (press `/` or Ctrl+K) and a light/dark theme.

It's a static site with no build step, no framework and no backend. Progress is saved in the
visitor's browser (localStorage).

## Run locally
```bash
npx serve .          # or: python3 -m http.server 8000
```
Open http://localhost:3000 (or :8000).

## Deploy to Vercel
**Option A: drag and drop (no account setup beyond login)**
1. Unzip this folder.
2. Go to https://vercel.com/new and drag the `cipherops-tech` folder in.
   Framework preset: **Other**. No build command, output directory `.`.

**Option B: CLI**
```bash
npm i -g vercel
cd cipherops-tech
vercel          # preview deploy
vercel --prod   # production
```

**Option C: Git (auto-deploy on every push)**
Push this folder to a GitHub repo, then use "Import Git Repository" on vercel.com/new.

### After the first deploy
Your real URL may differ from `cipherops-tech.vercel.app`. If it does, replace that domain in:
`index.html` (canonical and og: tags), `robots.txt` and `sitemap.xml`.

## Security headers
`vercel.json` sets a strict Content-Security-Policy, HSTS, X-Frame-Options DENY,
nosniff, Referrer-Policy, Permissions-Policy and COOP/CORP.
- `script-src` is `'self'` only: there are no inline scripts and no eval.
- `style-src` allows `'unsafe-inline'`, because the markup uses style attributes.
- Fonts load from Google Fonts. To self-host them, drop the Google domains from the CSP.

Check the result at https://securityheaders.com after deploying.

## Project structure
```
index.html              page markup
404.html                custom not-found page
assets/css/app.css      design system ("blueprint on paper") + dark theme
assets/js/01-core.js    helpers
assets/js/02-lessons.js curriculum content (6 modules, 52 lessons)
assets/js/03-curriculum.js  sidebar, reader, progress
assets/js/04-explorer.js    Attack Explorer engine + first 13 scenarios
assets/js/05-labs.js    CTF labs, cheat sheets, paths, search
assets/js/06-learning.js    5 more scenarios, placement test, flashcards
assets/js/07-boot.js    start-up
vercel.json             headers & clean URLs
```

### Adding content
- **New lesson**: add an object to a module in `02-lessons.js`.
- **New attack walkthrough**: add a scenario to `XS` in `04-explorer.js` or `06-learning.js`,
  built from `p(src, dst, protocol, info, kind, stage, raw, fields)` packets.
- **New lab**: add an entry to `LABS` with a `render(host)` function. Flags are base64-encoded.

Bump the `?v=` number on the CSS and JS links in `index.html` when you change assets.

See `NOTICE.md` for attribution and licensing of referenced material.

## Bounty Universe data
`assets/universe/programs.json` is built by `scripts/build_universe.py` from public datasets and
refreshed daily by `.github/workflows/refresh-universe.yml` (03:17 UTC). The workflow only commits
when the programs actually change, and refuses to publish if the dataset looks too small.
Run it by hand from the repo's **Actions** tab → *Refresh Bounty Universe data* → *Run workflow*.

To rebuild locally:
```bash
mkdir -p /tmp/src && cd /tmp/src
git clone --depth 1 https://github.com/arkadiyt/bounty-targets-data.git btd
git clone --depth 1 https://github.com/infosec-us-team/Immunefi-Bug-Bounty-Programs-Unofficial.git imm
git clone --depth 1 https://github.com/disclose/diodb.git diodb
git clone --depth 1 https://github.com/projectdiscovery/public-bugbounty-programs.git pd
cd -
python3 scripts/build_universe.py /tmp/src/btd/data /tmp/src/imm /tmp/src/diodb/program-list.json /tmp/src/pd/dist/data.json assets/universe/programs.json
```
three.js r128 is vendored at `assets/universe/three.min.js` so the strict `script-src 'self'` CSP still holds.

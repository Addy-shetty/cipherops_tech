/* Security LLMs you can run locally. Curated by cipherops_tech, checked 24 Nov 2026.
   Sizes and VRAM are approximate for 4-bit (Q4) files with a normal context window. */
(function () {
  "use strict";
  var CHECKED = "24 Nov 2026";
  // kind: sec (security-tuned) | gen (general model strong at security) | tool
  // tasks: intel, triage, code, offense, grc, base, chat
  // hw: cpu | 8 | 16 | 24
  var M = [
    { kind: "sec", name: "Foundation-Sec-8B-Reasoning", by: "Cisco Foundation AI", host: "Hugging Face · fdtn-ai", url: "https://huggingface.co/fdtn-ai/Foundation-Sec-8B-Reasoning",
      what: "An 8B reasoning model built for security: it thinks through multi-step problems before answering. Released January 2026.",
      best: "Threat intelligence, mapping CVEs to CWEs, explaining why an alert matters", tasks: ["intel", "triage"], size: "8B · Llama 3.1 base", file: "~5 GB at Q4", hw: 8, vram: "8 GB VRAM, or 16 GB RAM on CPU (slow)",
      licence: "See model card (Llama 3.1 base)", catchTxt: "Training data stops in April 2025, so pair it with current advisories (RAG) for newer CVEs.",
      run: "vllm serve fdtn-ai/Foundation-Sec-8B-Reasoning" },
    { kind: "sec", name: "Foundation-Sec-8B-Instruct", by: "Cisco Foundation AI", host: "Hugging Face · fdtn-ai", url: "https://huggingface.co/fdtn-ai/Foundation-Sec-8B-Instruct",
      what: "The chat version of Cisco's security model. Cisco piloted it in its CSIRT for alert classification, MITRE ATT&CK mapping and timeline reconstruction.",
      best: "A day-to-day SOC copilot that answers directly without long reasoning", tasks: ["triage", "intel", "chat"], size: "8B · Llama 3.1 base", file: "~5 GB at Q4", hw: 8, vram: "8 GB VRAM",
      licence: "See model card (Llama 3.1 base)", catchTxt: "Faster than the Reasoning version but weaker on multi-step analysis.",
      run: "docker model run hf.co/fdtn-ai/Foundation-Sec-8B-Instruct" },
    { kind: "sec", name: "Foundation-Sec-8B (base)", by: "Cisco Foundation AI", host: "Hugging Face · fdtn-ai", url: "https://huggingface.co/fdtn-ai/Foundation-Sec-8B",
      what: "The pretrained base model, trained on about 5.1 billion tokens of security text. Not a chat model.",
      best: "Fine-tuning on your own detections, telemetry or threat intel", tasks: ["base"], size: "8B · Llama 3.1 base", file: "~5 GB at Q4", hw: 8, vram: "8 GB VRAM to run; more to fine-tune",
      licence: "See model card", catchTxt: "A base model completes text rather than following instructions. Start from Instruct unless you plan to train.",
      run: "vllm serve fdtn-ai/Foundation-Sec-8B" },
    { kind: "sec", name: "Antares-1B / Antares-350M", by: "Cisco Foundation AI", host: "Hugging Face · fdtn-ai (gated)", url: "https://huggingface.co/fdtn-ai/antares-1b",
      what: "Tiny agentic models that find which files in a codebase contain a known vulnerability, by searching the repo with shell commands. Released July 2026.",
      best: "Vulnerability localisation: \"where in our repo does this advisory apply?\"", tasks: ["code"], size: "1B / 350M · IBM Granite 4.0 base", file: "under 1 GB at Q4", hw: "cpu", vram: "Runs on a laptop CPU",
      licence: "Apache 2.0 (access is manually approved)", catchTxt: "Gated: request access first. It points to files, not lines or fixes, and results vary between runs, so verify every lead. Run it in a sandbox with no network.",
      run: "vllm serve fdtn-ai/antares-1b   # after access is approved" },
    { kind: "sec", name: "RedSage-Qwen3-8B-DPO", by: "RISys-Lab (Khalifa University and partners)", host: "Hugging Face · RISys-Lab", url: "https://huggingface.co/RISys-Lab",
      what: "A fully open security generalist (weights, data and code), presented at ICLR 2026. Beats its Qwen3-8B base on security benchmarks while staying good at general tasks.",
      best: "General security Q&A, log analysis, threat-intel summaries, learning", tasks: ["chat", "intel", "triage"], size: "8B · Qwen3 base", file: "~5 GB at Q4", hw: 8, vram: "8 GB VRAM",
      licence: "See model card", catchTxt: "A sibling, RedSage-K-SFT, turns plain-English requests into Kali/Linux commands. Useful in authorised labs only.",
      run: "vllm serve RISys-Lab/RedSage-Qwen3-8B-DPO" },
    { kind: "sec", name: "Llama-Primus-Reasoning", by: "Trend Micro (Trend Cybertron)", host: "Hugging Face · trendmicro-ailab", url: "https://huggingface.co/trendmicro-ailab/Llama-Primus-Reasoning",
      what: "Trained on Trend Micro's open Primus security datasets, then taught to reason. Trend reports a 15.8% gain on CISSP-style questions over its base model.",
      best: "Certification-style reasoning, security concepts, study help", tasks: ["chat", "grc"], size: "8B · Llama 3.1 base", file: "~5 GB at Q4", hw: 8, vram: "8 GB VRAM",
      licence: "MIT, plus the Llama 3.1 Community License", catchTxt: "Older (early 2025). Also see Llama-Primus-Merged for a non-reasoning chat version.",
      run: "vllm serve trendmicro-ailab/Llama-Primus-Reasoning" },
    { kind: "sec", name: "WhiteRabbitNeo V3 7B", by: "WhiteRabbitNeo / Kindo", host: "Hugging Face · WhiteRabbitNeo", url: "https://huggingface.co/WhiteRabbitNeo",
      what: "The best-known \"uncensored\" security model, built for both offensive and defensive work on a Qwen2.5-Coder base. Good at code, IaC and spotting flaws in configs.",
      best: "Authorised penetration testing, red-team prep, reviewing IAM policies, k8s configs and code", tasks: ["offense", "code"], size: "7B · Qwen2.5-Coder base", file: "~4.7 GB at Q4", hw: 8, vram: "8 GB VRAM",
      licence: "Apache 2.0 with extra use restrictions on the card", catchTxt: "Dual-use by design. Its terms forbid harmful uses, and you're responsible for staying inside your scope and the law.",
      run: "vllm serve WhiteRabbitNeo/WhiteRabbitNeo-V3-7B" },
    { kind: "sec", name: "DeepHat V1 7B", by: "Kindo (formerly WhiteRabbitNeo)", host: "deephat.ai", url: "https://www.deephat.ai",
      what: "WhiteRabbitNeo's successor. V1 is open-weight on Hugging Face; the newer Deep Hat v2 is Kindo's proprietary hosted model.",
      best: "Same jobs as WhiteRabbitNeo, from the newer line", tasks: ["offense", "code"], size: "7B", file: "~4.7 GB at Q4", hw: 8, vram: "8 GB VRAM",
      licence: "See model card", catchTxt: "Only V1 is downloadable. Check the card's terms before use.",
      run: "docker model run hf.co/DeepHat/DeepHat-V1-7B" },
    { kind: "sec", name: "ZySec-7B (SecurityLLM)", by: "ZySec AI", host: "Hugging Face · ZySec-AI", url: "https://huggingface.co/ZySec-AI/ZySec-7B",
      what: "A Zephyr/Mistral-based assistant trained across 30+ security domains, with a strong governance and compliance slant (CIS, PCI DSS, ISO 27001, FedRAMP).",
      best: "GRC questions, policy drafting, risk and architecture review", tasks: ["grc", "chat"], size: "7B · Mistral base", file: "~4.4 GB at Q4", hw: 8, vram: "6–8 GB VRAM",
      licence: "Apache 2.0", catchTxt: "From 2024; weaker than newer 8B models on technical tasks.",
      run: "ollama run hf.co/koesn/ZySec-7B-v2-GGUF:Q4_K_M" },
    { kind: "sec", name: "Lily-Cybersecurity-7B v0.2", by: "Sego Lily Labs", host: "Hugging Face · segolilylabs", url: "https://huggingface.co/segolilylabs/Lily-Cybersecurity-7B-v0.2",
      what: "A small, popular security assistant fine-tuned from Mistral-7B-Instruct on about 22K hand-crafted security examples.",
      best: "Lightweight security chat on modest hardware", tasks: ["chat"], size: "7B · Mistral base", file: "~4.1 GB at Q4", hw: 8, vram: "6–8 GB VRAM",
      licence: "Apache 2.0", catchTxt: "January 2024 and not updated since, so knowledge is dated. Fine for learning, not for current threats.",
      run: "ollama run hf.co/QuantFactory/Lily-Cybersecurity-7B-v0.2-GGUF:Q4_K_S" },
    { kind: "gen", name: "Qwen3.5 9B", by: "Alibaba (Qwen)", host: "Ollama library · Hugging Face", url: "https://huggingface.co/Qwen/Qwen3.5-9B",
      what: "A general model, not security-tuned, but in an October 2026 alert-triage study (Alert-Bench) it matched GPT-4.1 out of the box. 262K-token context.",
      best: "Alert triage and long log or document analysis kept on your own hardware", tasks: ["triage", "chat"], size: "9B · dense", file: "~5.7 GB at Q4", hw: 8, vram: "8 GB VRAM",
      licence: "Apache 2.0", catchTxt: "Results depend heavily on how you prompt and test it; check it on your own alerts.",
      run: "ollama run qwen3.5:9b" },
    { kind: "gen", name: "Qwen3.6 35B-A3B", by: "Alibaba (Qwen)", host: "Ollama library", url: "https://ollama.com/library/qwen3.6",
      what: "A mixture-of-experts model (35B total, about 3B active per token), with tool calling and thinking. A strong local choice for agentic security work.",
      best: "Agentic vulnerability research and code review with tools", tasks: ["code", "offense", "chat"], size: "35B total / 3B active", file: "~24 GB at Q4", hw: 24, vram: "24 GB VRAM, or split across GPU and RAM",
      licence: "Apache 2.0", catchTxt: "The agentic-security claim rests on one researcher's small private benchmark. Treat it as a lead.",
      run: "ollama run qwen3.6:35b-a3b" },
    { kind: "tool", name: "Ollama", by: "Ollama", host: "ollama.com", url: "https://ollama.com",
      what: "The simplest way to run models locally. Pulls models by name, and can pull any GGUF from Hugging Face with hf.co/<repo>:<quant>.",
      best: "Getting started on Windows, macOS or Linux", tasks: [], size: "Runner", file: "—", hw: "cpu", vram: "Uses your GPU if present",
      licence: "MIT", catchTxt: "Gated Hugging Face models need a token before they'll download.",
      run: "curl -fsSL https://ollama.com/install.sh | sh" },
    { kind: "tool", name: "LM Studio", by: "LM Studio", host: "lmstudio.ai", url: "https://lmstudio.ai",
      what: "A desktop app with a model browser, chat window and a local OpenAI-compatible server. No terminal needed.",
      best: "People who prefer a GUI; searching Hugging Face for security GGUFs", tasks: [], size: "Desktop app", file: "—", hw: "cpu", vram: "Shows what fits your machine",
      licence: "Free app (check its terms for work use)", catchTxt: "Closed-source app, though the models you run are open.",
      run: "Download from lmstudio.ai, then search \"Foundation-Sec\" or \"ZySec\"" },
    { kind: "tool", name: "llama.cpp", by: "ggml-org", host: "GitHub", url: "https://github.com/ggml-org/llama.cpp",
      what: "The engine under most local tools. llama-server gives you a web UI and an OpenAI-compatible API from any GGUF.",
      best: "Maximum control, CPU-only machines, servers", tasks: [], size: "Runner", file: "—", hw: "cpu", vram: "CPU, CUDA, Metal, Vulkan",
      licence: "MIT", catchTxt: "More flags to learn than Ollama.",
      run: "brew install llama.cpp   # or: winget install llama.cpp\nllama-server -hf koesn/ZySec-7B-v2-GGUF:Q4_K_M" },
    { kind: "tool", name: "vLLM", by: "vLLM project", host: "GitHub · PyPI", url: "https://github.com/vllm-project/vllm",
      what: "A high-throughput server for full-precision Hugging Face models, used for the run commands on this page.",
      best: "Serving a model to a team or a pipeline on a Linux GPU box", tasks: [], size: "Server", file: "—", hw: 16, vram: "Needs a GPU; full 8B weights want ~16 GB",
      licence: "Apache 2.0", catchTxt: "Runs unquantised weights by default, so it needs more VRAM than a Q4 file in Ollama.",
      run: "pip install vllm" },
    { kind: "tool", name: "Open WebUI", by: "Open WebUI", host: "GitHub", url: "https://github.com/open-webui/open-webui",
      what: "A self-hosted ChatGPT-style interface for Ollama or any OpenAI-compatible server, with document upload for RAG.",
      best: "Giving a team a private chat UI over your local security models", tasks: [], size: "Web app", file: "—", hw: "cpu", vram: "Runs alongside your model server",
      licence: "Open source (see repo)", catchTxt: "Put it behind authentication; don't expose it to the internet.",
      run: "pip install open-webui\nopen-webui serve" },
  ];
  var TASKS = { all: "All tasks", intel: "Threat intel", triage: "Alert triage", code: "Code and vulns", offense: "Pentest / red team", grc: "GRC and compliance", chat: "General security chat", base: "Fine-tuning base" };
  var KINDS = { all: "All", sec: "Security-tuned", gen: "General, strong at security", tool: "Runners and tools" };
  var HW = [["all", "Any hardware"], ["cpu", "CPU / laptop"], ["8", "8 GB GPU"], ["16", "16 GB GPU"], ["24", "24 GB GPU"]];
  var hwRank = function (h) { return h === "cpu" ? 0 : +h; };
  var st = { kind: "all", task: "all", hw: "all" };

  function el(t, a, kids) { var e = document.createElement(t); if (a) for (var k in a) { if (k === "class") e.className = a[k]; else if (k === "text") e.textContent = a[k]; else e.setAttribute(k, a[k]); } (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; }
  function chips(box, map, key) {
    box.textContent = "";
    var list = Array.isArray(map) ? map : Object.keys(map).map(function (k) { return [k, map[k]]; });
    list.forEach(function (p) { var k = p[0];
      var b = el("button", { type: "button", "aria-pressed": String(st[key] === k), text: p[1] });
      b.onclick = function () { st[key] = k; chips(box, map, key); draw(); };
      box.appendChild(b);
    });
  }
  function copyBtn(text) {
    var b = el("button", { type: "button", class: "btn sm ghost lm-copy", text: "Copy" });
    b.onclick = function () { try { navigator.clipboard.writeText(text); b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); } catch (e) {} };
    return b;
  }
  function card(m, i) {
    var tagCls = m.kind === "sec" ? "tag basic" : m.kind === "gen" ? "tag intermediate" : "tag advanced";
    return el("article", { class: "card lm-card", id: "m-" + i }, [
      el("div", { class: "lm-top" }, [el("span", { class: "lm-num mono", text: String(i + 1).padStart(2, "0") }), el("span", { class: tagCls, text: KINDS[m.kind] })]),
      el("h3", { text: m.name }),
      el("div", { class: "lm-by muted" }, [m.by + " · ", el("a", { href: m.url, target: "_blank", rel: "noopener", text: m.host })]),
      el("p", { class: "lm-what", text: m.what }),
      el("dl", { class: "lm-facts" }, [
        el("div", null, [el("dt", { text: "Best for" }), el("dd", { text: m.best })]),
        el("div", null, [el("dt", { text: "Size" }), el("dd", { text: m.size + (m.file !== "—" ? " · " + m.file : "") })]),
        el("div", null, [el("dt", { text: "Hardware" }), el("dd", { text: m.vram })]),
        el("div", null, [el("dt", { text: "Licence" }), el("dd", { text: m.licence })]),
      ]),
      el("div", { class: "lm-catch" }, [el("b", { text: "The catch: " }), m.catchTxt]),
      el("div", { class: "lm-run" }, [el("pre", { class: "mono" }, [el("code", { text: m.run })]), copyBtn(m.run)]),
    ]);
  }
  function draw() {
    var grid = document.getElementById("lmGrid"); grid.textContent = "";
    var shown = M.map(function (m, i) { return [m, i]; }).filter(function (x) {
      var m = x[0];
      if (st.kind !== "all" && m.kind !== st.kind) return false;
      if (st.task !== "all" && m.tasks.indexOf(st.task) < 0) return false;
      if (st.hw !== "all" && hwRank(m.hw) > hwRank(st.hw)) return false;
      return true;
    });
    shown.forEach(function (x) { grid.appendChild(card(x[0], x[1])); });
    document.getElementById("lmCount").textContent = shown.length + " of " + M.length + " shown";
    if (!shown.length) grid.appendChild(el("p", { class: "muted", text: "Nothing matches. Try a different task or more VRAM." }));
  }
  function stats() {
    var n = function (k) { return M.filter(function (m) { return m.kind === k; }).length; };
    document.getElementById("stSec").textContent = n("sec");
    document.getElementById("stGen").textContent = n("gen");
    document.getElementById("stTool").textContent = n("tool");
    document.getElementById("lmChecked").textContent = CHECKED;
  }
  function theme() {
    var btn = document.getElementById("themeBtn"); if (!btn) return;
    var apply = function (t) { document.documentElement.setAttribute("data-theme", t); btn.textContent = t === "dark" ? "☀" : "☾"; btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme"); try { localStorage.setItem("cipherops-theme", t); } catch (e) {} };
    var t = "light"; try { t = localStorage.getItem("cipherops-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch (e) {}
    apply(t); btn.onclick = function () { apply(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); };
  }
  document.addEventListener("DOMContentLoaded", function () {
    theme(); stats();
    chips(document.getElementById("fKind"), KINDS, "kind");
    chips(document.getElementById("fTask"), TASKS, "task");
    chips(document.getElementById("fHw"), HW, "hw");
    draw();
  });
})();

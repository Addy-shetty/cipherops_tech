/* cipherops_tech — AI & LLM course, modules 1–3 (original content) */
"use strict";
/* diagram palette: user / model / API / data / output / neutral / danger */
const AC={u:"#3B82F6",m:"#8B5CF6",a:"#10B981",d:"#F59E0B",o:"#EC4899",g:"#94A3B8",r:"#EF4444",t:"#14B8A6"};
const AI_MODEL="claude-sonnet-5-5"; /* swap for the current model name in the docs */

const AI_MODULES=[
 {id:"foundations",n:1,title:"Foundations of LLMs",blurb:"What actually happens between your prompt and the answer."},
 {id:"building",n:2,title:"Building with LLM APIs",blurb:"Requests, streaming, tools and conversation state."},
 {id:"prompting",n:3,title:"Prompt Engineering",blurb:"Write prompts that get reliable, checkable results."},
 {id:"rag",n:4,title:"RAG & Knowledge",blurb:"Give a model your documents without retraining it."},
 {id:"agents",n:5,title:"Agents & Orchestration",blurb:"Models that plan, call tools and loop until done."},
 {id:"security",n:6,title:"Security & Safety",blurb:"Attacks on LLM apps and the controls that stop them."}
];

const AI_LESSONS=[];
const addL=l=>AI_LESSONS.push(l);

/* ======================= MODULE 1 · FOUNDATIONS ======================= */
addL({id:"prompt-to-response",mod:"foundations",title:"How a Prompt Becomes a Response",min:10,level:"Beginner",
 desc:"Follow one prompt through the whole pipeline: tokens, vectors, attention, probabilities and back to text.",
 scene:{title:"One prompt through the LLM pipeline",
  legend:{req:"your text",data:"tokens / vectors",warn:"generation loop",ok:"response"},
  nodes:[{id:"you",kind:"user",x:70,y:330,label:"You",c:AC.u},
   {id:"tok",kind:"block",x:190,y:270,label:"Tokenizer",glyph:"✂",c:AC.d},
   {id:"emb",kind:"block",x:310,y:330,label:"Embeddings",glyph:"⋮",c:AC.d},
   {id:"tf",kind:"big",x:445,y:260,label:"Transformer",sub:"many layers",glyph:"◈",c:AC.m},
   {id:"smp",kind:"block",x:585,y:330,label:"Sampler",glyph:"%",c:AC.a},
   {id:"dec",kind:"block",x:705,y:270,label:"Detokenizer",glyph:"Aa",c:AC.d},
   {id:"out",kind:"user",x:825,y:330,label:"Answer",c:AC.o}],
  edges:[["you","tok"],["tok","emb"],["emb","tf"],["tf","smp"],["smp","dec"],["dec","out"]],
  metrics:[{id:"in",label:"Prompt"},{id:"tk",label:"Tokens"},{id:"out",label:"Output so far"},{id:"t",label:"Time"}],
  learn:["Why models read tokens, not words","How tokens become vectors","What attention does with context","How the next token is chosen","Why long answers take longer"],
  steps:[
   {short:"Prompt",tag:"Input",t:"Everything starts as plain text",p:["You type *Explain DNS simply* and press send. To you it's a sentence. To the model it's just a string of characters, and the model can't do maths on characters.","So before anything clever happens, the text has to be turned into numbers. Follow the request to the right."],
    k:"A language model only ever sees numbers. Every step before the model exists to turn text into numbers.",f:[["you","tok","req","\"Explain DNS simply\"",{n:2}]],s:{you:"focus"},m:{in:"Explain DNS simply",tk:"—",out:"—",t:"0 ms"},l:0},
   {short:"Tokenize",tag:"Step 1",t:"The tokenizer cuts text into tokens",p:["A **tokenizer** splits the text into *tokens*: common words, pieces of words, spaces and punctuation. A frequent word like *Explain* is usually one token; a rarer word may be split into two or three.","Each token has an ID number from a fixed vocabulary of tens of thousands of entries. In English, one token is roughly four characters, or about three-quarters of a word."],
    k:"Tokens are the unit everything is measured in: context limits, speed and price are all counted in tokens.",f:[["you","tok","req"]],s:{tok:"focus"},b:{tok:"4 tokens"},note:[250,150,"Explain │ ␣DNS │ ␣simp │ ly"],m:{in:"Explain DNS simply",tk:"4 in",out:"—",t:"~1 ms"},l:0},
   {short:"Embed",tag:"Step 2",t:"Each token ID becomes a vector",p:["The model looks up each token ID in an **embedding table** and gets back a *vector*, a list of thousands of numbers learned during training. Tokens with related meanings end up with similar vectors.","Information about *position* is mixed in too, so the model knows *DNS* came after *Explain* and not before it."],
    k:"An embedding is a token's meaning written as coordinates. Similar meaning, nearby coordinates.",f:[["tok","emb","data","[IDs]"]],s:{tok:"ok",emb:"focus"},b:{emb:"4 × vectors"},m:{in:"Explain DNS simply",tk:"4 in",out:"—",t:"~1 ms"},l:1},
   {short:"Attention",tag:"Step 3",t:"Attention mixes in context",p:["The vectors flow through a stack of **transformer layers**. In each layer, *attention* lets every token look back at the earlier tokens and pull in what matters. *simply* tells the model what kind of explanation you want; *DNS* tells it the topic.","Many attention *heads* run in parallel, each picking up different patterns. After dozens of layers, the last token's vector carries a summary of the whole prompt."],
    k:"Attention is how a model uses context: each token decides which earlier tokens are worth listening to.",f:[["emb","tf","data","vectors",{n:4}]],s:{emb:"ok",tf:"focus"},b:{tf:"attention × layers"},m:{in:"Explain DNS simply",tk:"4 in",out:"—",t:"prefill"},l:2},
   {short:"Probabilities",tag:"Step 4",t:"The model scores every possible next token",p:["The final layer produces a score (a *logit*) for every token in the vocabulary. A *softmax* turns those scores into probabilities that add up to 100%.","The model never \"knows\" the answer in one go. It only ever answers one question: *which token is most likely to come next?*"],
    k:"An LLM is a next-token predictor. Long, fluent answers are many single predictions in a row.",f:[["tf","smp","data","logits"]],s:{tf:"ok",smp:"focus"},note:[585,170,"\"DNS\" 41% · \"Think\" 18% · \"The\" 12% · …"],m:{in:"Explain DNS simply",tk:"4 in",out:"—",t:"first token"},l:3},
   {short:"Sample",tag:"Step 5",t:"The sampler picks one token",p:["The **sampler** chooses one token from the distribution. With low *temperature* it almost always takes the top choice; with higher temperature it sometimes picks a less likely one, which makes the text more varied.","Here it picks *DNS*. That token is now part of the answer."],
    k:"Same prompt, different runs, different answers: that variety comes from sampling, not from the model changing its mind.",f:[["tf","smp","data"]],s:{smp:"ok"},b:{smp:"picked: DNS"},m:{in:"Explain DNS simply",tk:"4 in · 1 out",out:"DNS",t:"~0.4 s"},mt:{out:"ok"},l:3},
   {short:"Loop",tag:"Step 6",t:"Append the token and go again",p:["The chosen token is added to the end of the sequence and the model runs again to predict the *next* one. This is called **autoregressive** generation: one token at a time, each one depending on everything before it.","The model keeps a cache of earlier work (the *KV cache*), so each new token is much cheaper than the first. The loop stops at an end-of-turn token, a stop sequence, or the `max_tokens` limit."],
    k:"Output is produced one token per loop. That's why streaming works, and why output length drives response time.",f:[["smp","tf","warn","append",{n:2}],["tf","smp","data","",{delay:.3}]],s:{tf:"focus",smp:"focus"},b:{smp:"token 37…"},m:{in:"Explain DNS simply",tk:"4 in · 37 out",out:"DNS is the internet's…",t:"+20 ms / token"},l:4},
   {short:"Detokenize",tag:"Step 7",t:"Token IDs turn back into text",p:["Generated token IDs go to the **detokenizer**, which looks each one up and joins the text pieces back together, spaces included.","This step is cheap and almost instant. If you stream the response, it happens token by token as they arrive."],
    k:"Tokenizer and detokenizer are mirror images: text→IDs on the way in, IDs→text on the way out.",f:[["smp","dec","data","IDs"]],s:{smp:"ok",dec:"focus"},m:{in:"Explain DNS simply",tk:"4 in · 180 out",out:"DNS is the internet's phone book…",t:"~4 s"},l:0},
   {short:"Response",tag:"Step 8",t:"The answer arrives",p:["The finished text comes back to you, usually alongside *usage* numbers: how many input and output tokens the call used. Those numbers are what you're billed for.","Nothing about this conversation is remembered by the model itself. If you send a follow-up, the app has to send the earlier messages again."],
    k:"The model is stateless. Memory in a chat app is the app resending history, not the model remembering.",f:[["dec","out","ok","text"]],s:{dec:"ok",out:"ok"},b:{out:"180 tokens"},m:{in:"Explain DNS simply",tk:"4 in · 180 out",out:"done",t:"~4 s"},mt:{out:"ok"},l:4},
   {short:"Latency",tag:"Recap",t:"Where the time goes",p:["Typical timing (illustrative): the network adds tens of milliseconds; **prefill** (reading the whole prompt in one pass) sets your *time to first token*; then **decode** costs a roughly fixed time per output token.","So a 4-token prompt with a 180-token answer is dominated by decode: 180 × ~20 ms ≈ 3.6 s. A 50,000-token prompt makes prefill the slow part instead."],
    k:"Long prompts slow the first token. Long answers slow everything after it. Ask for shorter output when speed matters.",f:[["you","tok","req","",{n:1}],["tf","smp","warn","",{n:2}],["dec","out","ok","",{n:1}]],b:{tok:"~50 ms network",tf:"prefill ≈ TTFT",smp:"~20 ms × 180"},m:{in:"Explain DNS simply",tk:"4 in · 180 out",out:"TTFT ≈ 0.4 s",t:"total ≈ 4 s"},mt:{t:"warn"},l:4}
  ]},
 code:[{lang:"python",title:"Count tokens before you send",src:`import anthropic

client = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY

count = client.messages.count_tokens(
    model="${AI_MODEL}",
    messages=[{"role": "user", "content": "Explain DNS simply"}],
)
print(count.input_tokens)`,out:"12   # includes the message formatting, not just your words"}],
 quiz:[{q:"Why do LLMs work with tokens instead of whole words?",o:["Tokens are faster to type","Sub-word pieces cover rare words, typos and many languages with a fixed vocabulary","Words would use less memory","The internet is stored in tokens"],a:1,why:"A sub-word vocabulary (for example BPE) can spell out any word, even ones it never saw, from a few tens of thousands of pieces."},
  {q:"A user asks for a 2,000-word essay and complains it's slow. What dominates the wait?",o:["Tokenizing the prompt","Prefill of the short prompt","Decoding thousands of output tokens one by one","Detokenizing"],a:2,why:"Each output token needs another pass through the model, so long outputs dominate total time."}],
 links:[["Claude docs: tokens and models","https://platform.claude.com/docs/en/about-claude/models/overview"]]});

addL({id:"tokens-context",mod:"foundations",title:"Understanding Tokens & Context Windows",min:8,level:"Beginner",
 desc:"Why everything is counted in tokens, and what happens when a conversation outgrows the context window.",
 scene:{title:"Filling a context window",
  legend:{req:"input tokens",data:"history",warn:"near the limit",bad:"rejected / dropped"},
  nodes:[{id:"app",kind:"user",x:90,y:330,label:"Your app",c:AC.u},
   {id:"sys",kind:"flat",x:240,y:250,label:"System",sub:"instructions",c:AC.g},
   {id:"hist",kind:"tall",x:380,y:320,label:"History",sub:"earlier turns",c:AC.d},
   {id:"docs",kind:"block",x:520,y:250,label:"Documents",c:AC.d},
   {id:"win",kind:"big",x:680,y:320,label:"Context window",sub:"input + output",glyph:"▦",c:AC.m}],
  edges:[["app","sys"],["sys","hist"],["hist","docs"],["docs","win"]],
  metrics:[{id:"used",label:"Tokens used"},{id:"left",label:"Room for answer"},{id:"cost",label:"Input cost"}],
  learn:["What counts toward the context window","Why output needs reserved room","What happens at the limit","Ways to stay under it"],
  steps:[
   {short:"The window",tag:"Concept",t:"One window holds everything",p:["The **context window** is the most tokens a model can handle in one call. It covers *everything*: system instructions, the whole conversation so far, any documents you paste, tool definitions and the answer it writes.","Modern models have windows from about 200,000 tokens up to a million, but it's still a hard limit."],
    k:"The window is shared by input and output. A huge prompt leaves less room for the answer.",f:[["app","sys","req"]],s:{win:"focus"},b:{win:"200k tokens"},m:{used:"0",left:"200,000",cost:"$0"},l:0},
   {short:"Add parts",tag:"Build-up",t:"Every part of the prompt costs tokens",p:["Your system prompt is maybe 800 tokens. Ten turns of chat history might be 6,000. A pasted PDF could be 60,000 on its own.","All of it is sent, and billed, **on every call**. The model has no memory between calls, so history is re-sent each time."],
    k:"Chat history is not free. Each new message re-sends and re-bills everything before it.",f:[["app","sys","req","800"],["sys","hist","data","6k"],["hist","docs","data","60k"],["docs","win","data","67k"]],s:{win:"ok"},m:{used:"66,800",left:"133,200",cost:"input × 67k"},l:0},
   {short:"Reserve output",tag:"Rule",t:"Leave room for the answer",p:["You set `max_tokens` to cap how long the reply can be. Input tokens plus `max_tokens` must fit in the window.","If you ask for a long report but your prompt is already near the limit, the request fails or the answer is cut off with `stop_reason: \"max_tokens\"`."],
    k:"Budget the window like money: input + max output ≤ limit.",f:[["docs","win","data"]],s:{win:"warn"},b:{win:"input 190k + out 16k"},m:{used:"190,000",left:"10,000",cost:"high"},mt:{left:"bad"},l:1},
   {short:"At the limit",tag:"Failure",t:"Over the limit, something has to go",p:["Send more than the window allows and the API rejects the request with an error. Some chat apps quietly drop the oldest messages instead, which is why a long chat can \"forget\" what you said at the start.","Even under the limit, details buried in the middle of a very long prompt are easier for a model to miss."],
    k:"Don't treat a big window as a reason to send everything. Relevant beats complete.",f:[["hist","docs","bad","",{stop:.6}],["docs","win","bad","over limit",{stop:.75}]],s:{win:"bad",hist:"warn"},b:{hist:"oldest dropped"},m:{used:"212,000",left:"−12,000",cost:"error"},mt:{used:"bad",left:"bad"},l:2},
   {short:"Stay under",tag:"Fix",t:"Trim, summarise, retrieve, cache",p:["**Trim**: keep only recent turns. **Summarise**: replace old turns with a short summary. **Retrieve**: instead of pasting every document, fetch only the relevant chunks (Module 4).","**Prompt caching** doesn't make the window bigger, but it makes re-sending the same long prefix much cheaper and faster."],
    k:"Retrieval and summaries keep prompts small; caching makes the parts you must repeat cheap.",f:[["sys","hist","ok","summary"],["hist","docs","ok","top 5 chunks"],["docs","win","ok","12k"]],s:{win:"ok",hist:"ok",docs:"ok"},m:{used:"12,400",left:"187,600",cost:"low"},mt:{used:"ok"},l:3}
  ]},
 code:[{lang:"python",title:"Keep the last turns and a summary",src:`MAX_TURNS = 8

def build_messages(history, summary, user_msg):
    recent = history[-MAX_TURNS:]              # drop the oldest turns
    msgs = []
    if summary:
        msgs.append({"role": "user", "content": f"Summary so far:\\n{summary}"})
        msgs.append({"role": "assistant", "content": "Thanks, I have the context."})
    return msgs + recent + [{"role": "user", "content": user_msg}]`}],
 quiz:[{q:"Which of these does NOT count toward the context window?",o:["The system prompt","Earlier chat turns you re-send","The model's answer","Messages from a different conversation you didn't send"],a:3,why:"Only what's in this request (and the answer it generates) counts. The model can't see anything you didn't send."},
  {q:"Your prompt is 195k tokens in a 200k window and you set max_tokens to 20k. What happens?",o:["It works fine","The request is rejected or the answer is cut short","The model compresses the prompt automatically","The window grows"],a:1,why:"Input plus maximum output must fit in the window. Trim or retrieve less."}],
 links:[["Claude docs: context windows","https://platform.claude.com/docs/en/build-with-claude/context-windows"]]});

addL({id:"sampling",mod:"foundations",title:"Temperature, Top-P, and Sampling",min:12,level:"Intermediate",
 desc:"The dials that decide how predictable or creative the output is, and when to touch them.",
 scene:{title:"From scores to one chosen token",
  legend:{data:"scores / probabilities",warn:"filtered out",ok:"chosen token"},
  nodes:[{id:"tf",kind:"big",x:110,y:300,label:"Model",sub:"logits",glyph:"◈",c:AC.m},
   {id:"temp",kind:"shield",x:290,y:240,label:"Temperature",glyph:"°",c:AC.d},
   {id:"soft",kind:"block",x:440,y:310,label:"Softmax",glyph:"Σ",c:AC.g},
   {id:"topp",kind:"shield",x:590,y:240,label:"Top-p / top-k",glyph:"▾",c:AC.d},
   {id:"pick",kind:"block",x:760,y:310,label:"Pick",glyph:"✓",c:AC.a}],
  edges:[["tf","temp"],["temp","soft"],["soft","topp"],["topp","pick"]],
  metrics:[{id:"t",label:"Temperature"},{id:"p",label:"Top-p"},{id:"dist",label:"Top choices"},{id:"res",label:"Result"}],
  learn:["What temperature does to probabilities","How top-p trims the long tail","Which settings fit which tasks","Why temperature 0 isn't a guarantee"],
  steps:[
   {short:"Scores",tag:"Start",t:"The model outputs raw scores",p:["For the prompt *Write a name for a coffee shop:* the model scores every token. Say *Brew* scores highest, then *Bean*, *Daily*, and a long tail of thousands of unlikely tokens.","Sampling settings don't change what the model knows. They only change *how a token is picked* from these scores."],
    k:"Sampling is the last step. It shapes the choice, not the knowledge.",f:[["tf","temp","data","logits"]],s:{tf:"focus"},note:[300,140,"Brew 4.1 · Bean 3.7 · Daily 2.9 · … 50k more"],m:{t:"—",p:"—",dist:"raw scores",res:"—"},l:0},
   {short:"Temp low",tag:"Temperature",t:"Low temperature sharpens the curve",p:["**Temperature** divides the scores before softmax. Below 1, the gaps between scores grow, so the top token dominates. At 0.2, *Brew* might get 85% of the probability.","Use low temperature for extraction, classification, code and anything with one right answer."],
    k:"Low temperature = more predictable, more repetitive.",f:[["tf","temp","data"],["temp","soft","data","÷ 0.2"]],s:{temp:"focus"},b:{soft:"Brew 85%"},m:{t:"0.2",p:"1.0",dist:"Brew 85 · Bean 13 · Daily 2",res:"Brew"},l:0},
   {short:"Temp high",tag:"Temperature",t:"High temperature flattens it",p:["Above 1, the curve flattens: *Brew* 30%, *Bean* 24%, *Daily* 15%, and the long tail gets a real chance. Output becomes more varied, and more likely to go off track.","Use moderate-to-high temperature for brainstorming, naming and creative writing, and expect to filter the results."],
    k:"High temperature = more variety, more risk of nonsense.",f:[["tf","temp","data"],["temp","soft","data","÷ 1.2"]],s:{temp:"warn"},b:{soft:"Brew 30%"},m:{t:"1.2",p:"1.0",dist:"Brew 30 · Bean 24 · Daily 15 · tail 31",res:"varies"},mt:{res:"warn"},l:0},
   {short:"Top-p",tag:"Nucleus",t:"Top-p cuts off the long tail",p:["**Top-p** (nucleus sampling) keeps the smallest set of tokens whose probabilities add up to *p*, and drops the rest. With top-p 0.9, the weird 10% tail is removed before picking.","**Top-k** is simpler: keep only the *k* most likely tokens. Both stop rare, off-topic tokens sneaking in."],
    k:"Temperature reshapes the curve; top-p and top-k cut it off.",f:[["soft","topp","data"],["topp","pick","ok","Brew/Bean/Daily"]],s:{topp:"focus"},b:{topp:"keep 90%"},m:{t:"1.0",p:"0.9",dist:"3 tokens kept",res:"Bean"},l:1},
   {short:"Pick",tag:"Choose",t:"One token is drawn",p:["The sampler draws one token from what's left, weighted by probability. Then the whole loop runs again for the next token.","A tip from most providers: change **either** temperature **or** top-p, not both at once, so you can tell which change helped."],
    k:"Tune one dial at a time and test on real examples.",f:[["topp","pick","ok"]],s:{pick:"ok"},b:{pick:"Bean"},m:{t:"1.0",p:"0.9",dist:"weighted draw",res:"Bean"},mt:{res:"ok"},l:2},
   {short:"Temp 0",tag:"Caveat",t:"Temperature 0 isn't perfectly repeatable",p:["At temperature 0 the sampler takes the top token every time, so outputs become *nearly* identical. Tiny numeric differences on the servers can still change a close call.","If you need exactly the same output twice, store it. If you need a fixed format, ask for it explicitly and validate it."],
    k:"For reliability, rely on clear instructions and validation, not just temperature.",f:[["tf","temp","data"],["temp","soft","data","÷ ~0"],["soft","topp","data"],["topp","pick","ok"]],s:{pick:"warn"},b:{pick:"almost always Brew"},m:{t:"0",p:"—",dist:"Brew ≈ 100",res:"near-deterministic"},mt:{res:"warn"},l:3}
  ]},
 code:[{lang:"python",title:"Low temperature for extraction",src:`msg = client.messages.create(
    model="${AI_MODEL}",
    max_tokens=200,
    temperature=0.2,                      # predictable, for structured output
    messages=[{"role": "user", "content":
        "Extract the invoice number from: 'Ref INV-20931, due 3 May'"}],
)
print(msg.content[0].text)`,out:"INV-20931"}],
 quiz:[{q:"You want 20 different product-name ideas. Which setting helps most?",o:["Temperature 0","A moderate-to-high temperature","max_tokens = 5","top-k = 1"],a:1,why:"Higher temperature flattens the distribution and gives more varied options."},
  {q:"What does top-p 0.9 do?",o:["Keeps the top 90 tokens","Keeps the smallest set of tokens covering 90% of the probability","Lowers temperature by 10%","Makes the answer 90% shorter"],a:1,why:"Nucleus sampling keeps the most likely tokens until their probabilities add up to p."}]});

/* ======================= MODULE 2 · BUILDING ======================= */
addL({id:"first-api-call",mod:"building",title:"Your First API Call",min:15,level:"Beginner",
 desc:"What's inside a Messages API request and response, and the three things that go wrong first.",
 scene:{title:"One Messages API call, end to end",
  legend:{req:"HTTPS request",ok:"response",bad:"error",data:"usage / billing"},
  nodes:[{id:"code",kind:"user",x:90,y:320,label:"Your code",c:AC.u},
   {id:"sdk",kind:"block",x:240,y:260,label:"SDK",glyph:"{ }",c:AC.g},
   {id:"api",kind:"shield",x:400,y:320,label:"API gateway",glyph:"⇄",c:AC.a},
   {id:"model",kind:"big",x:570,y:250,label:"Model",glyph:"◈",c:AC.m},
   {id:"bill",kind:"flat",x:740,y:320,label:"Usage",sub:"tokens billed",c:AC.d}],
  edges:[["code","sdk"],["sdk","api"],["api","model"],["api","bill"]],
  metrics:[{id:"status",label:"HTTP status"},{id:"in",label:"Input tokens"},{id:"out",label:"Output tokens"},{id:"stop",label:"stop_reason"}],
  learn:["The parts of a request","Where the API key goes, and where it must not","How to read a response","The common first errors"],
  steps:[
   {short:"Request",tag:"Build",t:"A request has four essentials",p:["A Messages API call needs a **model** name, **max_tokens** (the longest answer you'll accept), and a list of **messages**, each with a *role* (`user` or `assistant`) and *content*. An optional **system** prompt sets the rules.","The SDK turns this into an HTTPS POST to `/v1/messages`."],
    k:"model + max_tokens + messages is the minimum. Everything else is optional.",f:[["code","sdk","req","messages=[…]"]],s:{code:"focus",sdk:"focus"},m:{status:"—",in:"—",out:"—",stop:"—"},l:0},
   {short:"Auth",tag:"Secrets",t:"The API key goes in a header, from the server",p:["The SDK sends your key in the `x-api-key` header, plus an `anthropic-version` header. It reads the key from the `ANTHROPIC_API_KEY` environment variable.","**Never** ship the key in browser JavaScript or a mobile app. Anyone can read it there and spend your money. Call the API from your own backend."],
    k:"API keys live on servers, in environment variables or a secrets manager. Never in client code or git.",f:[["sdk","api","req","x-api-key ••••"]],s:{api:"focus"},b:{api:"key checked"},m:{status:"—",in:"—",out:"—",stop:"—"},l:1},
   {short:"Generate",tag:"Run",t:"The model reads and writes",p:["The gateway checks the key, your rate limits and the request shape, then passes it to the model. The model reads your messages (prefill) and generates the reply token by token.","By default the full answer is returned only when generation finishes. Streaming (next lesson) sends it as it's written."],
    k:"A plain request waits for the whole answer. Fine for short replies, slow-feeling for long ones.",f:[["sdk","api","req"],["api","model","req","prompt"]],s:{api:"ok",model:"focus"},m:{status:"…",in:"18",out:"…",stop:"—"},l:2},
   {short:"Response",tag:"Read",t:"The response is a list of content blocks",p:["You get back JSON with a `content` array. For a normal reply it holds one `text` block, so the answer is `msg.content[0].text`. With tools it can hold several blocks of different types.","`stop_reason` tells you *why* it stopped: `end_turn` (finished), `max_tokens` (cut off) or `tool_use` (wants a tool)."],
    k:"Always check stop_reason. max_tokens means the answer is incomplete.",f:[["model","api","ok","content[]"],["api","sdk","ok","200 OK"],["sdk","code","ok","msg"]],s:{model:"ok",api:"ok",code:"ok"},m:{status:"200",in:"18",out:"96",stop:"end_turn"},mt:{status:"ok"},l:2},
   {short:"Usage",tag:"Cost",t:"usage tells you what you paid for",p:["Every response includes `usage.input_tokens` and `usage.output_tokens`. Output tokens usually cost several times more than input tokens.","Log these numbers per user and per feature from day one. It's how you'll find the feature that quietly costs the most."],
    k:"You're billed for tokens in and out, on every call. Measure it.",f:[["api","bill","data","18 in · 96 out"]],s:{bill:"focus"},b:{bill:"logged"},m:{status:"200",in:"18",out:"96",stop:"end_turn"},l:2},
   {short:"Errors",tag:"Debug",t:"The first three errors you'll meet",p:["**401**: missing or wrong API key. **400**: the request is malformed, for example messages that don't alternate roles or a missing `max_tokens`. **429**: you've hit a rate limit; wait and retry with backoff.","**529/overloaded** and **5xx** errors are temporary on the provider's side. The official SDKs already retry some of these for you."],
    k:"4xx errors are usually yours to fix; 429 and 5xx deserve a retry with backoff.",f:[["sdk","api","bad","no key",{stop:.8}]],s:{api:"bad"},b:{api:"401"},m:{status:"401",in:"—",out:"—",stop:"—"},mt:{status:"bad"},l:3}
  ]},
 code:[{lang:"python",title:"Hello, Claude",src:`import anthropic

client = anthropic.Anthropic()   # uses ANTHROPIC_API_KEY from the environment

msg = client.messages.create(
    model="${AI_MODEL}",
    max_tokens=1024,
    system="You are a concise security tutor.",
    messages=[{"role": "user", "content": "What is a CSRF token, in two sentences?"}],
)

print(msg.content[0].text)
print(msg.stop_reason, msg.usage.input_tokens, msg.usage.output_tokens)`,out:"A CSRF token is a secret, unpredictable value the server puts in each form…\nend_turn 31 58"},
  {lang:"bash",title:"The same call with curl",src:`curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{"model": "${AI_MODEL}", "max_tokens": 256,
       "messages": [{"role": "user", "content": "Hello"}]}'`}],
 quiz:[{q:"Where should an API key for a public web app live?",o:["In the front-end JavaScript bundle","In a server-side environment variable or secrets manager","In the HTML as a data attribute","In localStorage"],a:1,why:"Anything shipped to the browser can be read by users. Keep keys server-side and proxy the call."},
  {q:"stop_reason is \"max_tokens\". What does that mean?",o:["The answer finished normally","The answer was cut off at your limit","The model refused","You were rate limited"],a:1,why:"The model hit the max_tokens cap you set, so the output is incomplete."}],
 links:[["Claude docs: Messages API","https://platform.claude.com/docs/en/api/messages"]]});

addL({id:"streaming",mod:"building",title:"Streaming Responses",min:10,level:"Intermediate",
 desc:"Show the answer as it's written using server-sent events, and handle the events correctly.",
 scene:{title:"Server-sent events, one delta at a time",
  legend:{req:"request",data:"stream events",ok:"rendered text",bad:"dropped connection"},
  nodes:[{id:"ui",kind:"user",x:90,y:320,label:"Browser",c:AC.u},
   {id:"be",kind:"block",x:250,y:260,label:"Your backend",glyph:"⚙",c:AC.g},
   {id:"api",kind:"shield",x:420,y:320,label:"API",glyph:"⇄",c:AC.a},
   {id:"model",kind:"big",x:600,y:250,label:"Model",glyph:"◈",c:AC.m}],
  edges:[["ui","be"],["be","api"],["api","model"]],
  metrics:[{id:"ttft",label:"First text"},{id:"ev",label:"Event"},{id:"shown",label:"On screen"}],
  learn:["Why streaming feels faster","The order of stream events","Where to assemble the text","How to handle a broken stream"],
  steps:[
   {short:"Why",tag:"Concept",t:"Same total time, much better feel",p:["Without streaming, the user stares at a spinner until the last token is written. With `stream: true`, text appears within about the time to first token, then keeps flowing.","Total generation time is the same. *Perceived* speed is completely different."],
    k:"Streaming doesn't make the model faster. It shows the work sooner.",f:[["ui","be","req","ask"],["be","api","req","stream: true"]],s:{api:"focus"},m:{ttft:"—",ev:"—",shown:"—"},l:0},
   {short:"Start",tag:"Event 1",t:"message_start opens the stream",p:["The response is a stream of **server-sent events** (SSE). The first is `message_start`, with the message ID and the input token count.","Then `content_block_start` announces a new block, for example a text block at index 0."],
    k:"Events arrive in a fixed order. Read the type field and handle each one.",f:[["api","model","req"],["model","api","data","message_start",{n:1}]],s:{model:"focus"},m:{ttft:"0.4 s",ev:"message_start",shown:""},l:1},
   {short:"Deltas",tag:"Events",t:"content_block_delta carries the text",p:["Most events are `content_block_delta` with a small `text_delta`: a few characters or one token at a time.","Your backend forwards each delta to the browser, which appends it to the message on screen."],
    k:"Append deltas in order. Never assume one delta is one word.",f:[["model","api","data","delta",{n:4,speed:.9}],["api","be","data","",{n:4,speed:.9}],["be","ui","ok","\"DNS is…\"",{n:4,speed:.9}]],s:{ui:"ok"},m:{ttft:"0.4 s",ev:"content_block_delta",shown:"DNS is the internet's ph"},l:1},
   {short:"Finish",tag:"Events",t:"message_delta and message_stop close it",p:["`content_block_stop` ends the block. `message_delta` carries the final `stop_reason` and output token count. `message_stop` ends the stream.","Only after `message_stop` do you know the answer is complete. Save it to your database then, not halfway through."],
    k:"Treat the stream as complete only on message_stop.",f:[["model","api","data","message_stop",{n:1}],["be","ui","ok","done"]],s:{ui:"ok",model:"ok"},m:{ttft:"0.4 s",ev:"message_stop",shown:"full answer"},mt:{shown:"ok"},l:2},
   {short:"Breaks",tag:"Errors",t:"Streams can fail halfway",p:["Networks drop. An `error` event can arrive mid-stream, for example when the service is overloaded. You may already have shown half an answer.","Show the user that the reply was interrupted, keep what arrived, and offer a retry. Don't silently present half an answer as finished."],
    k:"Design for interruption: partial text, a clear notice and a retry.",f:[["model","api","data"],["api","be","bad","error",{stop:.6}]],s:{be:"warn"},b:{be:"stream cut"},m:{ttft:"0.4 s",ev:"error: overloaded",shown:"partial + retry"},mt:{ev:"bad"},l:3}
  ]},
 code:[{lang:"python",title:"Stream text with the SDK helper",src:`with client.messages.stream(
    model="${AI_MODEL}",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Explain TLS in five steps"}],
) as stream:
    for text in stream.text_stream:     # yields each text delta
        print(text, end="", flush=True)

final = stream.get_final_message()       # full message after message_stop
print("\\n", final.stop_reason, final.usage.output_tokens)`}],
 quiz:[{q:"Which event tells you the stream is complete?",o:["message_start","content_block_delta","message_stop","ping"],a:2,why:"message_stop is the last event. message_delta just before it carries the stop_reason."},
  {q:"Does streaming reduce total generation time?",o:["Yes, by about half","No, it shows output sooner but total time is similar","Only for short answers","Only with temperature 0"],a:1,why:"The model generates at the same speed. Streaming improves how fast it feels."}],
 links:[["Claude docs: streaming","https://platform.claude.com/docs/en/build-with-claude/streaming"]]});

addL({id:"tool-use",mod:"building",title:"Function Calling & Tool Use",min:20,level:"Intermediate",
 desc:"Let the model ask your code to run a function, then use the result in its answer.",
 scene:{title:"The tool-use round trip",
  legend:{req:"request",data:"tool call / result",ok:"final answer",warn:"your code runs"},
  nodes:[{id:"app",kind:"user",x:90,y:320,label:"Your app",c:AC.u},
   {id:"model",kind:"big",x:300,y:250,label:"Model",glyph:"◈",c:AC.m},
   {id:"tool",kind:"block",x:520,y:320,label:"get_weather()",glyph:"ƒ",c:AC.a},
   {id:"svc",kind:"block",x:720,y:250,label:"Weather API",glyph:"☁",c:AC.g}],
  edges:[["app","model"],["app","tool"],["tool","svc"]],
  metrics:[{id:"turn",label:"Turn"},{id:"stop",label:"stop_reason"},{id:"block",label:"Content"}],
  learn:["How tools are described","What a tool_use block is","Who actually runs the tool","How the result goes back","Why tool input must be validated"],
  steps:[
   {short:"Describe",tag:"Setup",t:"You describe tools, the model never sees your code",p:["You send a `tools` list with each tool's **name**, a plain-English **description** and an **input_schema** (JSON Schema) for its arguments.","The model only sees these descriptions. Clear names and descriptions are the single biggest factor in whether it picks the right tool."],
    k:"A tool definition is documentation for the model. Write it like you're onboarding a new colleague.",f:[["app","model","req","tools + question"]],s:{model:"focus"},b:{app:"Weather in Oslo?"},m:{turn:"1",stop:"—",block:"—"},l:0},
   {short:"tool_use",tag:"Model",t:"The model asks for a tool",p:["Instead of answering, the model replies with a `tool_use` block: an `id`, the tool `name` and an `input` object, for example `{\"city\": \"Oslo\"}`. `stop_reason` is `tool_use`.","The model has not called anything. It has written a *request* for you to call it."],
    k:"The model proposes; your code decides and executes.",f:[["model","app","data","tool_use"]],s:{model:"ok"},b:{model:"get_weather(Oslo)"},m:{turn:"1",stop:"tool_use",block:"tool_use · id toolu_01"},mt:{stop:"warn"},l:1},
   {short:"Run it",tag:"Your code",t:"Your code runs the function",p:["Your app matches the name to a real function, **validates the input**, and runs it. Here it calls a weather service and gets back 4 °C and light rain.","This is where permissions live. If a tool could send email or delete data, check that this user is allowed and consider asking a human first."],
    k:"Treat tool input like any untrusted input: validate types, ranges and permissions.",f:[["app","tool","warn","city=Oslo"],["tool","svc","req","GET /weather"],["svc","tool","ok","4°C, rain"]],s:{tool:"focus",svc:"ok"},m:{turn:"1 → app",stop:"tool_use",block:"running get_weather"},l:2},
   {short:"tool_result",tag:"Return",t:"Send the result back",p:["You call the API again with the whole conversation plus a new `user` message containing a `tool_result` block. Its `tool_use_id` must match the `id` from the request.","If the tool failed, send the error text with `is_error: true`. The model can then explain or try something else."],
    k:"Every tool_use needs a matching tool_result in the next user message.",f:[["tool","app","ok","result"],["app","model","data","tool_result"]],s:{model:"focus"},m:{turn:"2",stop:"—",block:"tool_result · toolu_01"},l:3},
   {short:"Answer",tag:"Model",t:"The model writes the final answer",p:["With the result in context, the model answers normally: *It's 4 °C and raining lightly in Oslo, so take a jacket.* `stop_reason` is `end_turn`.","It may also ask for *another* tool. That's the start of an agent loop (Module 5)."],
    k:"Tool use is a loop: call → run → result → answer (or another call).",f:[["model","app","ok","text"]],s:{model:"ok",app:"ok"},m:{turn:"2",stop:"end_turn",block:"text"},mt:{stop:"ok"},l:3},
   {short:"Risks",tag:"Security",t:"Tools turn text into actions",p:["Once a model can call tools, a malicious instruction hidden in a document or web page can try to make it call them (*indirect prompt injection*, Module 6).","Give tools the least privilege that works, require confirmation for anything irreversible, and log every call."],
    k:"The more a tool can do, the more you need validation, confirmation and logs.",f:[["model","app","bad","send_email(all)",{stop:.7}]],s:{app:"bad"},b:{app:"blocked: needs approval"},m:{turn:"—",stop:"tool_use",block:"risky call refused"},mt:{block:"bad"},l:4}
  ]},
 code:[{lang:"python",title:"Define a tool and handle the call",src:`tools = [{
    "name": "get_weather",
    "description": "Current weather for a city. Use when the user asks about weather.",
    "input_schema": {
        "type": "object",
        "properties": {"city": {"type": "string", "description": "City name, e.g. Oslo"}},
        "required": ["city"],
    },
}]

messages = [{"role": "user", "content": "What's the weather in Oslo?"}]
resp = client.messages.create(model="${AI_MODEL}", max_tokens=512,
                              tools=tools, messages=messages)

if resp.stop_reason == "tool_use":
    call = next(b for b in resp.content if b.type == "tool_use")
    result = get_weather(**call.input)            # your real function
    messages += [
        {"role": "assistant", "content": resp.content},
        {"role": "user", "content": [{"type": "tool_result",
                                      "tool_use_id": call.id,
                                      "content": result}]},
    ]
    resp = client.messages.create(model="${AI_MODEL}", max_tokens=512,
                                  tools=tools, messages=messages)
print(resp.content[0].text)`}],
 quiz:[{q:"Who executes the function when the model returns a tool_use block?",o:["The model, on the provider's servers","Your application code","The user's browser automatically","Nobody, it's simulated"],a:1,why:"For your own tools (client tools), the model only writes the request. Your code runs it and returns tool_result."},
  {q:"What links a tool_result to the right request?",o:["The tool name","The tool_use_id matching the tool_use block's id","The order of messages only","A timestamp"],a:1,why:"tool_use_id must equal the id of the tool_use block it answers."}],
 links:[["Claude docs: tool use","https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"]]});

addL({id:"context-mgmt",mod:"building",title:"Managing Conversation Context",min:12,level:"Intermediate",
 desc:"The API is stateless. Here's how chat apps fake memory, and how to keep it fast and cheap.",
 scene:{title:"Turn 1, turn 2, turn 20",
  legend:{req:"new message",data:"re-sent history",ok:"reply",warn:"growing cost"},
  nodes:[{id:"user",kind:"user",x:90,y:320,label:"User",c:AC.u},
   {id:"app",kind:"block",x:240,y:260,label:"Chat backend",glyph:"⚙",c:AC.g},
   {id:"db",kind:"tall",x:240,y:420,label:"History DB",c:AC.d},
   {id:"cache",kind:"flat",x:430,y:330,label:"Prompt cache",c:AC.t},
   {id:"model",kind:"big",x:620,y:260,label:"Model",glyph:"◈",c:AC.m}],
  edges:[["user","app"],["app","db"],["app","cache"],["cache","model"]],
  metrics:[{id:"turn",label:"Turn"},{id:"sent",label:"Tokens sent"},{id:"cost",label:"Relative cost"}],
  learn:["Why the API forgets","How history is stored and re-sent","Why cost grows every turn","How caching and summaries help"],
  steps:[
   {short:"Stateless",tag:"Concept",t:"Each call starts from nothing",p:["The Messages API keeps no memory between calls. If turn 2 says *and in French?*, the model has no idea what *it* refers to unless you send turn 1 again.","Memory is your app's job: store the messages and send them back."],
    k:"There's no session on the model side. Your app is the memory.",f:[["user","app","req","turn 1"],["app","model","req","1 message"]],s:{model:"focus"},m:{turn:"1",sent:"40",cost:"1×"},l:0},
   {short:"Store",tag:"Save",t:"Save every turn",p:["After each reply, the backend appends both the user message and the assistant reply to the conversation in its database, in order, with roles.","Roles must alternate `user` / `assistant`. Tool calls and results are messages too and must be kept with their IDs."],
    k:"Store the exact messages you sent and received, including tool blocks.",f:[["model","app","ok","reply 1"],["app","db","data","save"]],s:{db:"focus"},m:{turn:"1",sent:"40",cost:"1×"},l:1},
   {short:"Re-send",tag:"Turn 2",t:"Turn 2 re-sends turn 1",p:["For *and in French?*, the backend loads the history and sends all of it plus the new message. The model sees the whole conversation and understands *it*.","Every turn re-sends everything. By turn 20 you may be sending 20,000 tokens to answer a 10-token question."],
    k:"Cost per turn grows with conversation length. Long chats get expensive.",f:[["user","app","req","turn 2"],["db","app","data","history"],["app","model","data","all turns",{n:4}]],s:{model:"ok"},b:{app:"turns 1–2"},m:{turn:"20",sent:"20,400",cost:"~500×"},mt:{cost:"warn"},l:2},
   {short:"Cache",tag:"Speed",t:"Prompt caching makes the repeated part cheap",p:["The start of each request (system prompt, tool definitions, older turns) is identical every time. Mark it with `cache_control` and the provider can reuse its work.","Cached input tokens are billed at a fraction of the normal price and the first token comes back faster. The cache expires after a few minutes without use."],
    k:"Put stable content first and the changing part last, so the prefix can be cached.",f:[["app","cache","data","same prefix"],["cache","model","ok","cache hit"]],s:{cache:"ok"},b:{cache:"hit"},m:{turn:"20",sent:"20,400 (19k cached)",cost:"much lower"},mt:{cost:"ok"},l:3},
   {short:"Summarise",tag:"Trim",t:"Summarise or drop old turns",p:["Caching cuts cost but not length. When history nears the window, replace old turns with a short summary written by the model, or drop them and keep a few key facts (name, goal, decisions).","Tell users when the app has summarised, so they're not surprised it forgot a detail."],
    k:"Recent turns verbatim + a summary of the rest keeps long chats coherent and affordable.",f:[["db","app","data","summary + last 6"],["app","model","ok","3,200 tokens"]],s:{app:"ok",model:"ok"},m:{turn:"40",sent:"3,200",cost:"~80×"},mt:{sent:"ok"},l:3}
  ]},
 code:[{lang:"python",title:"Cache a long, stable system prompt",src:`resp = client.messages.create(
    model="${AI_MODEL}",
    max_tokens=800,
    system=[{
        "type": "text",
        "text": LONG_POLICY_HANDBOOK,             # thousands of stable tokens
        "cache_control": {"type": "ephemeral"},   # reuse across calls
    }],
    messages=history + [{"role": "user", "content": question}],
)
print(resp.usage.cache_read_input_tokens, resp.usage.input_tokens)`}],
 quiz:[{q:"Why does a chat app re-send earlier messages on every turn?",o:["To improve the model's training","Because the API keeps no memory between calls","To pay less","It doesn't need to"],a:1,why:"Each API call is independent. Context must be included in the request."},
  {q:"How should you order a prompt to benefit from prompt caching?",o:["Changing parts first, stable parts last","Stable parts first, changing parts last","Random order","Caching ignores order"],a:1,why:"Caching works on an identical prefix, so stable content must come first."}],
 links:[["Claude docs: prompt caching","https://platform.claude.com/docs/en/build-with-claude/prompt-caching"]]});

/* ======================= MODULE 3 · PROMPTING ======================= */
addL({id:"prompt-anatomy",mod:"prompting",title:"Anatomy of an Effective Prompt",min:15,level:"Beginner",
 desc:"Context, task, input, format, examples: the parts that turn a vague request into a reliable one.",
 scene:{title:"Building a prompt, part by part",
  legend:{req:"prompt part",ok:"better output",warn:"vague",data:"your data"},
  nodes:[{id:"ctx",kind:"flat",x:110,y:300,label:"Context",sub:"who & why",c:AC.u},
   {id:"task",kind:"flat",x:250,y:240,label:"Task",sub:"what to do",c:AC.u},
   {id:"data",kind:"block",x:390,y:300,label:"Input",sub:"in <tags>",glyph:"<>",c:AC.d},
   {id:"fmt",kind:"flat",x:530,y:240,label:"Format",sub:"shape of answer",c:AC.u},
   {id:"model",kind:"big",x:700,y:300,label:"Model",glyph:"◈",c:AC.m}],
  edges:[["ctx","task"],["task","data"],["data","fmt"],["fmt","model"]],
  metrics:[{id:"prompt",label:"Prompt"},{id:"q",label:"Output quality"}],
  learn:["Why vague prompts give generic answers","How context changes the answer","Why to separate data from instructions","How to ask for a format you can parse"],
  steps:[
   {short:"Vague",tag:"Before",t:"A vague prompt gets a generic answer",p:["*Summarise this.* Summarise for whom? How long? Which parts matter? The model fills the gaps with safe, average guesses, and you get a bland paragraph.","Think of the model as a brilliant new colleague with zero context about your job. What would they need to know?"],
    k:"The model can't read your mind. Missing context becomes generic output.",f:[["fmt","model","warn","\"Summarise this\""]],s:{model:"warn"},m:{prompt:"Summarise this.",q:"generic"},mt:{q:"bad"},l:0},
   {short:"Context",tag:"Add",t:"Say who it's for and why",p:["*You're helping a security team lead who has five minutes before a board meeting.* Now the model knows the audience, the stakes and the time pressure.","Context changes word choice, depth and what gets left out."],
    k:"Audience and purpose are the cheapest, biggest improvement.",f:[["ctx","task","req"]],s:{ctx:"ok"},m:{prompt:"+ audience, purpose",q:"better"},l:1},
   {short:"Task",tag:"Add",t:"Say exactly what to do",p:["*List the three findings with the highest business risk, each in one sentence, and say what decision the board needs to make.* That's a task you could check.","Use direct verbs: list, compare, extract, rewrite, classify. Number the steps if there are several."],
    k:"If you couldn't tell whether the output succeeded, the task is too vague.",f:[["ctx","task","req"],["task","data","req"]],s:{ctx:"ok",task:"ok"},m:{prompt:"+ precise task",q:"good"},l:1},
   {short:"Input",tag:"Separate",t:"Wrap the data in tags",p:["Put the report inside `<report>…</report>` tags and refer to it by name: *Using the report in the report tags…*","Tags stop the model confusing your instructions with the document's text, and make it harder for text inside the document to pose as instructions."],
    k:"Instructions outside tags, data inside tags. Name the tags in your instructions.",f:[["task","data","data","<report>"]],s:{data:"ok"},m:{prompt:"+ <report> tags",q:"good"},l:2},
   {short:"Format",tag:"Shape",t:"Ask for the format you need",p:["If code will read the answer, ask for JSON with named fields and say what to do when information is missing. If a person will read it, say *three bullets, no preamble*.","Then **check it**: parse the JSON, count the bullets, and retry or fall back if it's wrong."],
    k:"Specify the format, then validate it in code. Never assume.",f:[["data","fmt","req"],["fmt","model","ok","full prompt"]],s:{fmt:"ok",model:"ok"},m:{prompt:"context + task + <data> + format",q:"reliable"},mt:{q:"ok"},l:3},
   {short:"Iterate",tag:"Test",t:"Test on real examples",p:["Write 10–20 realistic inputs, including awkward ones, and run the prompt on all of them. Read the outputs. Change one thing at a time.","A prompt that works on the example you wrote it for is not tested."],
    k:"Prompts are code. Test them on a set of cases before you ship.",f:[["ctx","task","req"],["task","data","req"],["data","fmt","req"],["fmt","model","ok","× 20 cases",{n:5}]],s:{model:"ok"},m:{prompt:"v4, tested on 20 cases",q:"measured"},mt:{q:"ok"},l:3}
  ]},
 code:[{lang:"text",title:"Before and after",src:`BEFORE
Summarise this.

AFTER
You're helping a security team lead brief the board in five minutes.

Using the pen-test report in <report> tags:
1. List the 3 findings with the highest business risk.
2. One plain-English sentence each, no jargon.
3. End with the single decision the board needs to make.

Answer as three bullets and one "Decision:" line. No preamble.

<report>
{{REPORT_TEXT}}
</report>`}],
 quiz:[{q:"What's the main reason to wrap a pasted document in XML-style tags?",o:["Models only read XML","It separates data from instructions and makes the prompt easier to reference","It's required by the API","It makes the prompt shorter"],a:1,why:"Tags draw a clear line between your instructions and the content being worked on."},
  {q:"Your app parses the model's JSON. What else should you do?",o:["Trust it, models are precise","Validate it and handle failures","Set temperature to 2","Ask for XML instead"],a:1,why:"Always validate structured output in code and retry or fall back on errors."}],
 links:[["Claude docs: prompt engineering overview","https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview"]]});

addL({id:"system-prompts",mod:"prompting",title:"System Prompts & Personas",min:10,level:"Intermediate",
 desc:"What belongs in the system prompt, what doesn't, and why it is not a security boundary.",
 scene:{title:"System prompt vs user message",
  legend:{req:"system rules",data:"user message",ok:"answer",bad:"override attempt"},
  nodes:[{id:"dev",kind:"user",x:100,y:250,label:"You (developer)",c:AC.t},
   {id:"user",kind:"user",x:100,y:420,label:"End user",c:AC.u},
   {id:"sys",kind:"flat",x:300,y:260,label:"System prompt",c:AC.g},
   {id:"msg",kind:"flat",x:300,y:400,label:"User turn",c:AC.d},
   {id:"model",kind:"big",x:530,y:330,label:"Model",glyph:"◈",c:AC.m},
   {id:"out",kind:"user",x:740,y:330,label:"Reply",c:AC.o}],
  edges:[["dev","sys"],["user","msg"],["sys","model"],["msg","model"],["model","out"]],
  metrics:[{id:"role",label:"Persona"},{id:"rule",label:"Key rule"},{id:"res",label:"Result"}],
  learn:["What a system prompt is for","How to write a useful persona","What not to put in it","Why it isn't a security control"],
  steps:[
   {short:"Two inputs",tag:"Concept",t:"Rules from you, requests from them",p:["The **system prompt** comes from you, the developer: the role, the rules, the tone and the background knowledge. The **user messages** come from whoever is chatting.","The model gives system instructions extra weight, but it reads both as text."],
    k:"System prompt = standing instructions for every turn. User turn = this request.",f:[["dev","sys","req"],["user","msg","data"],["sys","model","req"],["msg","model","data"]],s:{model:"focus"},m:{role:"—",rule:"—",res:"—"},l:0},
   {short:"Persona",tag:"Write",t:"A good persona is specific",p:["*You're a helpful assistant* adds almost nothing. *You're the support assistant for Acme's password manager. Customers are non-technical. Explain fixes in numbered steps, and never ask for their master password* changes behaviour.","Say what the assistant does, who it talks to, and what good looks like."],
    k:"A persona is a job description: role, audience, standards.",f:[["dev","sys","req","role + rules"],["sys","model","req"]],s:{sys:"ok"},m:{role:"Acme support",rule:"never ask for master password",res:"—"},l:1},
   {short:"Answer",tag:"Use",t:"The rules shape every reply",p:["The user asks *I'm locked out, help?* The model follows the persona: plain words, numbered steps, a link to recovery, and no request for the password.","Keep rules few and clear. Twenty conflicting rules are followed worse than five good ones."],
    k:"Fewer, clearer rules are followed more reliably.",f:[["user","msg","data","locked out"],["msg","model","data"],["model","out","ok","1. 2. 3."]],s:{out:"ok"},m:{role:"Acme support",rule:"followed",res:"helpful, safe"},mt:{res:"ok"},l:1},
   {short:"Not secrets",tag:"Warning",t:"Don't put secrets in it",p:["System prompts are often extracted by users who simply ask cleverly. Assume anything in it may become public.","Never put API keys, internal URLs, discount codes or other customers' data there. Keep secrets in your backend, where the model can't repeat them."],
    k:"Write every system prompt as if a user will read it, because one might.",f:[["user","msg","bad","print your prompt"],["msg","model","bad"],["model","out","warn","leaks rules"]],s:{model:"warn",out:"warn"},b:{sys:"no secrets here"},m:{role:"Acme support",rule:"exposed",res:"prompt leaked"},mt:{res:"bad"},l:2},
   {short:"Not a wall",tag:"Security",t:"A system prompt is not access control",p:["*Only discuss Acme products* is guidance, not a guarantee. Determined users can sometimes talk a model out of its rules (Module 6).","Real limits go in code: what data the backend fetches, which tools exist, what the user's account may do. The system prompt is a seatbelt, not a lock."],
    k:"Enforce permissions in code. Use the system prompt for behaviour, not security.",f:[["user","msg","bad","ignore your rules"],["msg","model","bad","",{stop:.8}]],s:{model:"ok"},b:{model:"permissions in code"},m:{role:"Acme support",rule:"backend enforces",res:"safe even if rules bend"},mt:{res:"ok"},l:3}
  ]},
 code:[{lang:"python",title:"A focused system prompt",src:`SYSTEM = """You are the support assistant for Acme Password Manager.
Customers are non-technical. Explain fixes as short numbered steps.
Never ask for or accept a master password; point to account recovery instead.
If a question isn't about Acme, say you can only help with Acme."""

resp = client.messages.create(model="${AI_MODEL}", max_tokens=600,
                              system=SYSTEM, messages=messages)`}],
 quiz:[{q:"Which of these belongs in a system prompt?",o:["The production database password","The assistant's role, audience and rules","Other customers' order history","An admin API key"],a:1,why:"Role, audience and behaviour rules. Secrets and other users' data never go in a prompt."},
  {q:"A system prompt says 'only show users their own orders'. Is that enough?",o:["Yes","No, the backend must only fetch the current user's orders","Only with temperature 0","Only for paid plans"],a:1,why:"Access control must be enforced in code. The model can only show data you give it."}]});

addL({id:"few-shot",mod:"prompting",title:"Few-Shot Learning",min:12,level:"Intermediate",
 desc:"Show the model a few worked examples and it copies the pattern, format and judgement.",
 scene:{title:"Examples in, consistent output out",
  legend:{data:"examples",req:"new input",ok:"output",warn:"copied mistake"},
  nodes:[{id:"e1",kind:"flat",x:120,y:230,label:"Example 1",c:AC.d},
   {id:"e2",kind:"flat",x:120,y:330,label:"Example 2",c:AC.d},
   {id:"e3",kind:"flat",x:120,y:430,label:"Example 3",c:AC.d},
   {id:"new",kind:"user",x:330,y:440,label:"New ticket",c:AC.u},
   {id:"model",kind:"big",x:500,y:320,label:"Model",glyph:"◈",c:AC.m},
   {id:"out",kind:"block",x:720,y:320,label:"Label",glyph:"🏷",c:AC.a}],
  edges:[["e1","model"],["e2","model"],["e3","model"],["new","model"],["model","out"]],
  metrics:[{id:"shots",label:"Examples"},{id:"input",label:"New input"},{id:"res",label:"Output"}],
  learn:["What zero-shot and few-shot mean","How examples set the format","How to pick good examples","Why bad examples spread"],
  steps:[
   {short:"Zero-shot",tag:"Baseline",t:"Zero-shot: instructions only",p:["Task: label support tickets as `bug`, `billing` or `how-to`. With no examples (*zero-shot*), the model mostly gets it right, but it sometimes invents labels like `account issue` or adds an explanation.","Instructions say what you want. Examples *show* it."],
    k:"Zero-shot is fine for easy tasks. Inconsistency is the sign you need examples.",f:[["new","model","req","\"charged twice\""],["model","out","warn","billing issue!"]],s:{out:"warn"},m:{shots:"0",input:"I was charged twice",res:"\"billing issue!\" (wrong format)"},mt:{res:"warn"},l:0},
   {short:"Add examples",tag:"Few-shot",t:"Three examples set the pattern",p:["Add three input→label pairs, each wrapped in `<example>` tags. The model now copies the exact format: one lowercase word, no explanation.","Examples teach things that are hard to describe: tone, length, edge-case judgement."],
    k:"Examples are the most reliable way to pin down format and style.",f:[["e1","model","data"],["e2","model","data"],["e3","model","data"]],s:{e1:"ok",e2:"ok",e3:"ok"},m:{shots:"3",input:"—",res:"—"},l:1},
   {short:"Run",tag:"Use",t:"New input, consistent output",p:["Now *I was charged twice this month* comes back as exactly `billing`. Run 100 tickets and the format stays the same.","That consistency is what lets code use the output safely."],
    k:"Few-shot trades a few hundred prompt tokens for much more consistent output.",f:[["e1","model","data"],["e2","model","data"],["e3","model","data"],["new","model","req"],["model","out","ok","billing"]],s:{out:"ok"},m:{shots:"3",input:"I was charged twice",res:"billing"},mt:{res:"ok"},l:1},
   {short:"Choose well",tag:"Craft",t:"Pick diverse, realistic examples",p:["Cover each label at least once, include a tricky case (*the app crashes when I pay* is a bug, not billing), and use real-looking text, not toy sentences.","If all your examples are short, the model may struggle with long inputs. Vary them."],
    k:"Good examples are diverse, realistic and include the hard cases.",f:[["e3","model","data","edge case"]],s:{e3:"focus"},b:{e3:"crash on pay → bug"},m:{shots:"3 (1 edge case)",input:"app crashes when I pay",res:"bug"},mt:{res:"ok"},l:2},
   {short:"Bad examples",tag:"Pitfall",t:"Mistakes in examples get copied",p:["If one example is mislabelled, or all of them start with *Sure!*, the model faithfully copies that too. Examples are treated as the gold standard.","Review examples as carefully as code, and keep them in version control."],
    k:"The model imitates your examples, including their errors.",f:[["e2","model","warn","wrong label"],["model","out","warn","copies error"]],s:{e2:"bad",out:"warn"},m:{shots:"3 (1 wrong)",input:"refund request",res:"how-to (wrong)"},mt:{res:"bad"},l:3}
  ]},
 code:[{lang:"text",title:"A three-shot classifier prompt",src:`Label each support ticket as exactly one word: bug, billing or how-to.

<example>
<ticket>The export button does nothing on Safari.</ticket>
<label>bug</label>
</example>
<example>
<ticket>Can I get an invoice with our VAT number?</ticket>
<label>billing</label>
</example>
<example>
<ticket>How do I add a second admin?</ticket>
<label>how-to</label>
</example>

<ticket>{{TICKET}}</ticket>`}],
 quiz:[{q:"When are few-shot examples most useful?",o:["When you need a specific, consistent format or judgement","When the prompt is too short","Only for translation","Never with modern models"],a:0,why:"Examples pin down format, tone and edge-case decisions that are hard to describe."},
  {q:"One of your three examples has the wrong label. What's likely?",o:["The model ignores it","The model may copy the mistake","The API rejects the prompt","Accuracy improves"],a:1,why:"Models treat examples as correct, so errors in them tend to spread."}]});

addL({id:"chain-of-thought",mod:"prompting",title:"Chain-of-Thought Prompting",min:15,level:"Advanced",
 desc:"Give the model room to reason before it answers, and keep the reasoning separate from the result.",
 scene:{title:"Think first, then answer",
  legend:{req:"question",data:"reasoning",ok:"checked answer",bad:"rushed answer"},
  nodes:[{id:"q",kind:"user",x:90,y:320,label:"Question",c:AC.u},
   {id:"model",kind:"big",x:270,y:250,label:"Model",glyph:"◈",c:AC.m},
   {id:"think",kind:"tall",x:470,y:320,label:"Reasoning",sub:"<thinking>",c:AC.d},
   {id:"check",kind:"shield",x:630,y:250,label:"Self-check",glyph:"✓",c:AC.g},
   {id:"ans",kind:"block",x:790,y:320,label:"Answer",sub:"<answer>",glyph:"!",c:AC.a}],
  edges:[["q","model"],["model","think"],["think","check"],["check","ans"]],
  metrics:[{id:"mode",label:"Mode"},{id:"res",label:"Result"},{id:"tok",label:"Extra tokens"}],
  learn:["Why answering instantly fails on multi-step problems","How to ask for step-by-step reasoning","Why to separate reasoning from the answer","When it's worth the cost"],
  steps:[
   {short:"Rushed",tag:"Problem",t:"Answering at once fails multi-step problems",p:["*A firewall allows 443 and 22 from 10.0.0.0/8, then denies all. Can 10.4.2.9 reach port 3389?* Asked for just the answer, a model may pattern-match and say *yes*.","Each output token is a small amount of computation. A one-word answer leaves no room to work through the rules."],
    k:"Multi-step problems need tokens to think in, just like people need scrap paper.",f:[["q","model","req"],["model","ans","bad","yes",{n:2}]],s:{ans:"bad"},m:{mode:"answer only",res:"yes (wrong)",tok:"+0"},mt:{res:"bad"},l:0},
   {short:"Think",tag:"Technique",t:"Ask it to reason step by step",p:["Add: *Think through the rules one at a time in <thinking> tags, then give the answer in <answer> tags.* The model writes out each rule check before deciding.","Many models also have a built-in **extended thinking** mode that does this for you, with a budget you control."],
    k:"Explicit reasoning helps on maths, logic, debugging and policy questions.",f:[["q","model","req"],["model","think","data","rule 1, 2, 3…",{n:4}]],s:{think:"focus"},note:[470,170,"443? no · 22? no · deny all → blocked"],m:{mode:"step by step",res:"…",tok:"+120"},l:1},
   {short:"Check",tag:"Verify",t:"Have it check its own work",p:["Ask the model to re-check the conclusion against the original rules before answering. That catches slips like misreading a CIDR range.","For important outputs, check in code too: here you could actually evaluate the firewall rules instead of trusting prose."],
    k:"Reasoning improves answers; independent checks catch what reasoning misses.",f:[["think","check","data","verify"]],s:{check:"ok"},m:{mode:"reason + check",res:"…",tok:"+160"},l:1},
   {short:"Answer",tag:"Separate",t:"Keep reasoning and answer apart",p:["With reasoning in `<thinking>` and the result in `<answer>`, your code extracts only the answer for the user, and logs the reasoning for debugging.","Don't show raw reasoning to end users by default; it's long, and it may include wrong turns the model later corrected."],
    k:"Structured tags let you use the answer and keep the reasoning for review.",f:[["check","ans","ok","blocked"]],s:{ans:"ok"},b:{ans:"No, 3389 blocked"},m:{mode:"reason + check",res:"no (correct)",tok:"+160"},mt:{res:"ok"},l:2},
   {short:"Trade-off",tag:"Cost",t:"Reasoning costs time and tokens",p:["Thinking tokens are output tokens: you pay for them and wait for them. For *translate this sentence* it's pure waste.","Use it where errors are costly and the task has steps: analysis, planning, code review, security decisions."],
    k:"Spend reasoning tokens where a wrong answer is expensive.",f:[["model","think","data","",{n:5}]],s:{think:"warn"},b:{think:"+600 tokens"},m:{mode:"long reasoning",res:"slower, better",tok:"+600"},mt:{tok:"warn"},l:3}
  ]},
 code:[{lang:"text",title:"Reasoning in tags",src:`<rules>
1. allow tcp/443 from 10.0.0.0/8
2. allow tcp/22  from 10.0.0.0/8
3. deny all
</rules>

Can 10.4.2.9 reach tcp/3389?
Check each rule in order inside <thinking> tags.
Then re-check your conclusion against the rules.
Give only "allowed" or "blocked" inside <answer> tags.`,out:"<thinking>3389 isn't 443 or 22, so rules 1–2 don't match; rule 3 denies…</thinking>\n<answer>blocked</answer>"}],
 quiz:[{q:"Why does asking a model to think step by step help on logic problems?",o:["It switches to a bigger model","It gives the model output tokens to work through intermediate steps","It disables sampling","It makes the answer shorter"],a:1,why:"Writing out the steps lets the model use those tokens as working memory."},
  {q:"Why put the final result in <answer> tags?",o:["Fashion","So code can extract the answer and keep the reasoning separate","The API requires it","It's cheaper"],a:1,why:"Clear separation lets you show the answer and log the reasoning."}],
 links:[["Claude docs: chain-of-thought","https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/chain-of-thought"]]});

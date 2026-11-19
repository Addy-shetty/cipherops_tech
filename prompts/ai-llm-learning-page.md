# AI/LLM Learning Page - Replication Prompt

> **Goal:** Create an interactive, animated learning experience for AI/LLM concepts, following the design patterns of [designed-to-scale.vercel.app](https://designed-to-scale.vercel.app/).

---

## 1. Design System

### Typography
```css
/* Primary: JetBrains Mono for code/technical content */
font-family: 'JetBrains Mono', monospace;
font-weights: 400, 500, 600, 700, 800;

/* System stack for UI text */
font-family: system-ui, -apple-system, sans-serif;
```

### Color Palette
```css
:root {
  /* Light theme */
  --bg-primary: #FAFAF9;
  --bg-secondary: #F5F5F4;
  --bg-card: #FFFFFF;
  --text-primary: #1C1917;
  --text-secondary: #57534E;
  --text-muted: #A8A29E;
  --accent-primary: #10B981;    /* Emerald for AI/success */
  --accent-secondary: #8B5CF6;  /* Purple for LLM/model */
  --accent-warning: #F59E0B;    /* Amber for caution */
  --border: #E7E5E4;
  
  /* Diagram colors */
  --node-user: #3B82F6;         /* Blue - user/input */
  --node-model: #8B5CF6;        /* Purple - LLM */
  --node-api: #10B981;          /* Green - API */
  --node-data: #F59E0B;         /* Amber - data/tokens */
  --node-output: #EC4899;       /* Pink - response */
  --flow-line: #94A3B8;
  --flow-active: #10B981;
}

[data-theme="dark"] {
  --bg-primary: #0C0A09;
  --bg-secondary: #1C1917;
  --bg-card: #292524;
  --text-primary: #FAFAF9;
  --text-secondary: #A8A29E;
  --text-muted: #78716C;
  --border: #44403C;
}
```

### Layout
- **Max content width:** 1200px
- **Sidebar:** 320px (collapsible on mobile)
- **Diagram area:** Flexible, min 600px height
- **Card padding:** 24px
- **Border radius:** 12px (cards), 8px (buttons), 6px (inputs)

---

## 2. Page Structure

### Header
```
┌─────────────────────────────────────────────────────────────┐
│ [☰ Menu]  cipherops_tech        [🔍 Search] [◐ Theme] [EN] │
│           AI & LLM Security                                 │
└─────────────────────────────────────────────────────────────┘
```

### Main Layout
```
┌──────────────┬──────────────────────────────────────────────┐
│              │  Breadcrumb: Module / Lesson X of Y          │
│   SIDEBAR    │                                              │
│              │  ┌────────────────────────────────────────┐  │
│  Module 1    │  │                                        │  │
│  ├─ Lesson 1 │  │      ANIMATED DIAGRAM AREA             │  │
│  ├─ Lesson 2 │  │      (SVG with motion)                 │  │
│  └─ Lesson 3 │  │                                        │  │
│              │  │  [▶ Play] [⟲ Replay] [⛶ Fullscreen]   │  │
│  Module 2    │  └────────────────────────────────────────┘  │
│  ├─ ...      │                                              │
│              │  ┌────────────────────────────────────────┐  │
│  Progress:   │  │  STEP 3 / 8                            │  │
│  ████░░ 65%  │  │                                        │  │
│              │  │  Step title and explanation text       │  │
│              │  │  with highlighted keywords.            │  │
│              │  │                                        │  │
│              │  │  [← Previous]           [Next Step →]  │  │
│              │  └────────────────────────────────────────┘  │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 3. Course Content Structure

### Module 1: Foundations of LLMs
1. **How a Prompt Becomes a Response** (10 min, Beginner)
   - Step 1: User types a prompt
   - Step 2: Tokenization breaks text into tokens
   - Step 3: Tokens become embeddings (vectors)
   - Step 4: Attention mechanism processes context
   - Step 5: Model generates probability distribution
   - Step 6: Sampling selects next token
   - Step 7: Loop until stop condition
   - Step 8: Tokens decoded back to text
   - Step 9: Response returned to user
   - Step 10: Latency breakdown visualization

2. **Understanding Tokens & Context Windows** (8 min, Beginner)
3. **Temperature, Top-P, and Sampling** (12 min, Intermediate)

### Module 2: Building with LLM APIs
1. **Your First API Call** (15 min, Beginner)
2. **Streaming Responses** (10 min, Intermediate)
3. **Function Calling & Tool Use** (20 min, Intermediate)
4. **Managing Conversation Context** (12 min, Intermediate)

### Module 3: Prompt Engineering
1. **Anatomy of an Effective Prompt** (15 min, Beginner)
2. **System Prompts & Personas** (10 min, Intermediate)
3. **Few-Shot Learning** (12 min, Intermediate)
4. **Chain-of-Thought Prompting** (15 min, Advanced)

### Module 4: RAG & Knowledge Integration
1. **How RAG Works** (20 min, Intermediate)
2. **Vector Databases Explained** (15 min, Intermediate)
3. **Chunking Strategies** (12 min, Advanced)
4. **Hybrid Search** (15 min, Advanced)

### Module 5: Agents & Orchestration
1. **What is an AI Agent?** (10 min, Beginner)
2. **Tool Use & Function Calling** (15 min, Intermediate)
3. **Multi-Agent Systems** (20 min, Advanced)
4. **Building a ReAct Agent** (25 min, Advanced)

### Module 6: Security & Safety
1. **Prompt Injection Attacks** (15 min, Intermediate)
2. **Jailbreaking & Guardrails** (12 min, Intermediate)
3. **Data Leakage Prevention** (10 min, Intermediate)
4. **Rate Limiting & Cost Control** (8 min, Beginner)

---

## 4. Interactive Diagram Specifications

### Diagram: "How a Prompt Becomes a Response"

```svg
<!-- Animated flow diagram showing: -->

User Input ──► Tokenizer ──► Embeddings ──► Transformer ──► Sampling ──► Output
    │              │             │              │              │           │
    ▼              ▼             ▼              ▼              ▼           ▼
 "Hello"      [15496,        [0.23, -0.1,    Attention      p=0.3→     "Hello,
  world"       1917]          0.87, ...]     Layers         "Hello"    how can
                                                                        I help?"

<!-- Animation sequence: -->
1. User types prompt (typing animation)
2. Text splits into tokens (highlight each token)
3. Tokens transform to vectors (number grid appears)
4. Vectors flow through transformer blocks
5. Probability bars animate
6. Output tokens appear one by one
7. Final response assembles
```

### SVG Component Structure
```jsx
<DiagramContainer>
  <Nodes>
    <Node id="user" type="input" label="User" icon="👤" />
    <Node id="tokenizer" type="process" label="Tokenizer" />
    <Node id="embedding" type="process" label="Embedding Layer" />
    <Node id="transformer" type="model" label="Transformer" icon="🧠" />
    <Node id="sampling" type="process" label="Sampling" />
    <Node id="output" type="output" label="Response" icon="💬" />
  </Nodes>
  
  <Connections>
    <Flow from="user" to="tokenizer" animated={true} />
    <Flow from="tokenizer" to="embedding" animated={true} />
    <!-- ... -->
  </Connections>
  
  <DataPackets>
    <Packet type="text" value='"Hello world"' />
    <Packet type="tokens" value='[15496, 1917]' />
    <Packet type="vector" value='[0.23, -0.1, ...]' />
  </DataPackets>
</DiagramContainer>
```

---

## 5. Animation System

### Timing
```javascript
const ANIMATION_CONFIG = {
  packetSpeed: 800,        // ms to travel between nodes
  nodeHighlight: 300,      // ms for node glow effect
  textTyping: 50,          // ms per character
  stepTransition: 400,     // ms between steps
  pauseBetweenSteps: 1500, // ms to read before auto-advance
};
```

### Animation States
```typescript
type AnimationState = 
  | 'idle'           // Waiting for user
  | 'playing'        // Auto-advancing
  | 'paused'         // User paused
  | 'step-complete'  // Waiting at step end
  | 'lesson-complete'; // All steps done

interface DiagramState {
  currentStep: number;
  animationState: AnimationState;
  highlightedNodes: string[];
  activeConnections: string[];
  visiblePackets: Packet[];
}
```

### CSS Animations
```css
@keyframes packet-flow {
  0% { offset-distance: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}

@keyframes node-pulse {
  0%, 100% { filter: drop-shadow(0 0 0 var(--accent-primary)); }
  50% { filter: drop-shadow(0 0 12px var(--accent-primary)); }
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

.packet {
  offset-path: path('M 0,0 C 50,0 50,100 100,100');
  animation: packet-flow var(--packet-speed) ease-in-out forwards;
}

.node.active {
  animation: node-pulse 1s ease-in-out infinite;
}
```

---

## 6. Interactive Features

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play/Pause animation |
| `R` | Replay current step |
| `→` | Next step |
| `←` | Previous step |
| `F` | Toggle fullscreen diagram |
| `Ctrl+K` | Open search |
| `1-9` | Jump to step N |

### Progress Tracking (localStorage)
```javascript
const STORAGE_KEYS = {
  progress: 'cipherops:ai:progress',    // { lessonId: completedSteps[] }
  lastLesson: 'cipherops:ai:last',      // lessonId
  preferences: 'cipherops:ai:prefs',    // { theme, speed, autoplay }
};
```

### Search Functionality
- Fuzzy search across lesson titles, step content, and keywords
- Keyboard navigation (↑↓ to select, Enter to go)
- Recent searches stored locally

---

## 7. Code Examples (Interactive)

### Syntax Highlighting Theme
```javascript
// Use Shiki or Prism with custom theme matching site colors
const codeTheme = {
  background: 'var(--bg-secondary)',
  foreground: 'var(--text-primary)',
  comment: 'var(--text-muted)',
  keyword: '#8B5CF6',      // Purple
  string: '#10B981',       // Green
  function: '#3B82F6',     // Blue
  number: '#F59E0B',       // Amber
  operator: '#EC4899',     // Pink
};
```

### Runnable Code Blocks
```html
<CodeBlock language="python" runnable={true}>
  <Code>
import anthropic

client = anthropic.Anthropic()
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude!"}
    ]
)
print(message.content[0].text)
  </Code>
  <Output>Hello! How can I help you today?</Output>
</CodeBlock>
```

---

## 8. File Structure

```
/ai-learning/
├── index.html              # Main entry point
├── assets/
│   ├── css/
│   │   └── ai-learning.css
│   ├── js/
│   │   ├── 01-core.js          # Utilities, state management
│   │   ├── 02-lessons.js       # Lesson data and content
│   │   ├── 03-diagrams.js      # SVG diagram rendering
│   │   ├── 04-animations.js    # Animation system
│   │   ├── 05-search.js        # Search functionality
│   │   ├── 06-progress.js      # Progress tracking
│   │   └── 07-boot.js          # Initialization
│   └── img/
│       ├── og-ai-learning.png  # Social preview
│       └── icons/              # UI icons as SVG
├── lessons/
│   ├── foundations/
│   │   ├── prompt-to-response.json
│   │   ├── tokens-context.json
│   │   └── sampling.json
│   ├── building/
│   │   └── ...
│   └── security/
│       └── ...
└── diagrams/
    ├── prompt-flow.svg
    ├── tokenization.svg
    ├── transformer.svg
    ├── rag-pipeline.svg
    └── agent-loop.svg
```

---

## 9. Lesson JSON Schema

```json
{
  "id": "prompt-to-response",
  "module": "foundations",
  "title": "How a Prompt Becomes a Response",
  "description": "Follow one prompt through the entire LLM pipeline—and see where the magic happens.",
  "duration": "10 min",
  "difficulty": "Beginner",
  "diagram": "prompt-flow",
  "steps": [
    {
      "id": 1,
      "title": "The User Sends a Prompt",
      "content": "Everything starts when you type a message. The raw text needs to be transformed before the model can understand it.",
      "keywords": ["prompt", "input", "text"],
      "diagram_state": {
        "highlight_nodes": ["user"],
        "active_connections": [],
        "packets": [
          { "type": "text", "value": "\"Explain quantum computing\"", "position": "user" }
        ]
      },
      "code_example": {
        "language": "python",
        "code": "prompt = \"Explain quantum computing in simple terms\""
      }
    },
    {
      "id": 2,
      "title": "Tokenization",
      "content": "The tokenizer breaks your text into **tokens**—small pieces the model recognizes. 'Explain' might become one token, while 'quantum' becomes another.",
      "keywords": ["tokenizer", "tokens", "BPE"],
      "diagram_state": {
        "highlight_nodes": ["tokenizer"],
        "active_connections": ["user->tokenizer"],
        "packets": [
          { "type": "tokens", "value": "[31912, 18403, 25213, ...]", "position": "tokenizer" }
        ]
      }
    }
    // ... more steps
  ],
  "quiz": {
    "question": "Why do LLMs use tokens instead of whole words?",
    "options": [
      "It's faster to process",
      "Handles unknown words and multiple languages",
      "Uses less memory",
      "All of the above"
    ],
    "correct": 3,
    "explanation": "Tokenization with subword units (like BPE) handles rare words, is memory-efficient, and works across languages."
  }
}
```

---

## 10. Responsive Breakpoints

```css
/* Mobile first */
.container { padding: 16px; }
.sidebar { display: none; }
.diagram { min-height: 300px; }

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container { padding: 24px; }
  .sidebar { display: block; width: 280px; }
  .diagram { min-height: 450px; }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container { max-width: 1200px; margin: 0 auto; }
  .sidebar { width: 320px; }
  .diagram { min-height: 600px; }
}

/* Large screens (1440px+) */
@media (min-width: 1440px) {
  .diagram { min-height: 700px; }
}
```

---

## 11. Accessibility Requirements

- **Keyboard navigation:** All interactive elements focusable
- **Screen reader:** ARIA labels on diagrams, live regions for step changes
- **Reduced motion:** Respect `prefers-reduced-motion`
- **Color contrast:** WCAG AA minimum (4.5:1 for text)
- **Focus indicators:** Visible focus rings on all interactive elements

```css
@media (prefers-reduced-motion: reduce) {
  .packet, .node, * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |
| Bundle size (gzipped) | < 150KB |

### Optimization Strategies
- Lazy load lesson content and diagrams
- Preload next lesson in sequence
- Use CSS containment on diagram area
- Debounce search input
- Use `requestAnimationFrame` for animations

---

## 13. Integration with cipherops_tech

### Navigation Link
Add to main site header:
```html
<nav>
  <a href="/">Security</a>
  <a href="/ai-learning/" class="new">AI & LLM</a>  <!-- NEW badge -->
</nav>
```

### Shared Components
- Theme toggle (sync with main site)
- Search modal (extend to include AI lessons)
- Progress persistence (unified localStorage namespace)

### Cross-linking
- Link from security lessons: "See how LLMs can be manipulated → Prompt Injection"
- Link from AI lessons: "Learn to defend against this → Security Module"

---

## Usage

To build this page, provide this prompt to Claude or another AI assistant along with:

1. The reference screenshot/recording of designed-to-scale.vercel.app
2. The cipherops_tech existing codebase structure
3. Any specific branding guidelines

The AI should generate:
- Complete HTML/CSS/JS implementation
- All lesson JSON files
- SVG diagram assets
- Integration code for the main site

# 🏗️ Architecture — Moodle AI Homework Assistant

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  SCHOOL NETWORK (Moodle)                                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Student Dashboard (Moodle HTML Text Block)                  │    │
│  │                                                              │    │
│  │   ╔══════════════════════════════════════╗                   │    │
│  │   ║  🤖 Asistente IA Académico           ║                   │    │
│  │   ║  ● Online  [📝 Abrir Asistente]     ║                   │    │
│  │   ║  [📊 Sheets] [🗺️ Diagramas]        ║                   │    │
│  │   ╚══════════════════════════════════════╝                   │    │
│  │   (Pure HTML + inline CSS — no scripts/iframes)              │    │
│  └──────────────────────────────┬───────────────────────────────┘    │
└─────────────────────────────────│────────────────────────────────────┘
                                  │ Click → new browser tab
                                  │ HTTPS via Cloudflare Tunnel
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  HOME SERVER (Student's PC)                                          │
│                                                                      │
│  ┌─────────────────────┐     ┌──────────────────────────────────┐    │
│  │  Cloudflare Tunnel  │────►│  Express.js Server (:3000)       │    │
│  │  (cloudflared)      │     │                                  │    │
│  │  ai.yourdomain.com  │     │  Routes:                         │    │
│  └─────────────────────┘     │  GET  /panel → web-panel SPA     │    │
│                              │  POST /api/chat                  │    │
│                              │  POST /api/export/sheets         │    │
│                              │  POST /api/training/rate         │    │
│                              │  GET  /api/status                │    │
│                              └──────────────┬───────────────────┘    │
│                                             │                        │
│              ┌──────────────────────────────┤                        │
│              │                              │                        │
│              ▼                              ▼                        │
│  ┌─────────────────────┐     ┌──────────────────────────────────┐    │
│  │  Ollama (:11434)    │     │  PostgreSQL (:5432)              │    │
│  │  Model: Mistral 7B  │     │  DB: moodle_ai                  │    │
│  │  (primary AI)       │     │  Tables: sessions, messages,     │    │
│  └─────────────────────┘     │  exports, training_pairs (view) │    │
│                              └──────────────────────────────────┘    │
│  ┌─────────────────────┐                                             │
│  │  Gemini API         │  (fallback when Ollama unavailable)         │
│  │  (Google cloud)     │                                             │
│  └─────────────────────┘                                             │
│                                                                      │
│  ┌─────────────────────┐                                             │
│  │  Google Sheets API  │  (homework export destination)              │
│  └─────────────────────┘                                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Table

| Component | Technology | Role | Notes |
|-----------|-----------|------|-------|
| **Frontend** | HTML + inline CSS in Moodle | Launcher UI | No scripts allowed — link-out only |
| **Transport** | Cloudflare Tunnel | HTTPS exposure | Free, no open ports |
| **Orchestrator** | Express.js / Node.js | API server + SPA host | ESM modules |
| **AI Brain (Primary)** | Ollama + Mistral 7B | Local AI inference | OpenAI-compatible API |
| **AI Brain (Fallback)** | Google Gemini 2.5 Flash | Cloud AI backup | 250 req/day free |
| **Persistence** | PostgreSQL 15+ | Conversation storage | pgvector optional |
| **Rich Text** | TinyMCE Cloud | Web panel editor | 1M loads/month free |
| **Diagrams** | Mermaid.js | Flowchart rendering | Client-side |
| **Charts** | Chart.js | Stats visualization | Client-side |
| **Output** | Google Sheets API v4 | Homework delivery | Service Account auth |

---

## Data Flow

```
1. User types prompt in TinyMCE editor (web panel)
      │
      ▼
2. JavaScript POSTs to /api/chat with { prompt, sessionId, model }
      │
      ▼
3. Express chat route:
   a. Validates request (API key header)
   b. Creates or retrieves session in PostgreSQL
   c. Saves user message to messages table
   d. Loads full conversation history
   e. Builds messages array with APA system prompt
      │
      ▼
4. Tries Ollama (Mistral) first:
   POST http://localhost:11434/v1/chat/completions
   (120 second timeout)
      │
      ├── Success → use Ollama response
      │
      └── Error → tries Gemini API fallback
            POST generativelanguage.googleapis.com/...
      │
      ▼
5. AI response saved to messages table
      │
      ▼
6. Response returned to web panel as JSON
      │
      ▼
7. Web panel renders response:
   - Markdown formatting
   - Detects ```mermaid blocks → renders diagram
   - Shows rating buttons (thumbs up/down)
      │
      ▼
8. Optional: User clicks Export
   - Fills form (name, matricula, subject, teacher)
   - POST /api/export/sheets
   - Express parses AI response into sections (Intro/Dev/Concl/Refs)
   - Updates Google Sheets template via API
   - Returns sheet URL
```

---

## Security Model

```
┌─────────────────────────────────────────────────────┐
│  Security Layers                                    │
│                                                     │
│  Layer 1: Cloudflare Tunnel                         │
│  • HTTPS enforced (TLS 1.3)                         │
│  • DDoS protection                                  │
│  • No ports exposed to internet                     │
│                                                     │
│  Layer 2: API Key Authentication                    │
│  • X-API-KEY header required on all /api/* routes  │
│  • Except: /api/status (public health check)        │
│  • Key stored in .env (never committed)             │
│                                                     │
│  Layer 3: Input Validation                          │
│  • Prompt length limits                             │
│  • Session ID validation                            │
│  • Parameterized SQL queries (no injection)         │
│                                                     │
│  Layer 4: Secret Management                         │
│  • .env file excluded from git                      │
│  • Google service account JSON excluded from git    │
│  • All keys via environment variables               │
└─────────────────────────────────────────────────────┘
```

---

## Database ER Diagram

```
sessions
┌────────────────────┐
│ id          SERIAL │◄──────────────────┐
│ model       VARCHAR│                   │
│ title       VARCHAR│                   │
│ created_at  TS     │                   │
│ updated_at  TS     │                   │
└────────────────────┘                   │
                                         │
messages                                 │
┌────────────────────────────────┐       │
│ id               SERIAL        │       │
│ session_id       INT  ─────────┼───────┘
│ role             VARCHAR       │       │
│ content          TEXT          │       │
│ rating           SMALLINT      │       │
│ rated_at         TIMESTAMP     │       │
│ corrected_content TEXT         │       │
│ corrected_at     TIMESTAMP     │       │
│ tokens_used      INT           │       │
│ model_used       VARCHAR       │       │
│ created_at       TIMESTAMP     │       │
└────────────────────────────────┘       │
                                         │
exports                                  │
┌────────────────────────────────┐       │
│ id               SERIAL        │       │
│ session_id       INT  ─────────┼───────┘
│ sheet_url        TEXT          │
│ export_type      VARCHAR       │
│ created_at       TIMESTAMP     │
└────────────────────────────────┘

VIEW: training_pairs
  → JOINs user messages with corrected AI messages
  → Used for LoRA fine-tuning data export
```

---

## Network Topology

```
Internet
    │
    │ HTTPS :443
    ▼
Cloudflare Edge
    │
    │ Cloudflare Tunnel (encrypted)
    ▼
cloudflared process (student's home PC)
    │
    │ HTTP :3000 (localhost only)
    ▼
Express.js Server
    ├── HTTP :11434 → Ollama (localhost only)
    ├── TCP  :5432  → PostgreSQL (localhost only)
    └── HTTPS       → Google APIs (outbound only)
```

All internal communication uses localhost — no ports are exposed to the local network or internet except through the Cloudflare Tunnel.

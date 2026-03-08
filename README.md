# 🤖 Moodle AI Homework Assistant — Year-End Project 2026

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Cost](https://img.shields.io/badge/cost-%240%2Fmonth-blue)
![Ollama](https://img.shields.io/badge/AI-Ollama%20Mistral-orange)
![Status](https://img.shields.io/badge/status-active-success)

An AI-powered homework assistant accessible from a Moodle student dashboard. Runs entirely on free tools, generates academic documents with APA references, and uses a "link-out" architecture to work within Moodle's HTML restrictions.

---

## 📋 Project Overview

This project creates an AI homework assistant that:
- Is accessible directly from the **Moodle student dashboard** via a styled HTML launcher
- Runs on a **home server** (no cloud costs) using Ollama (Mistral) as the AI engine
- Generates **structured academic documents** with Introducción, Desarrollo, Conclusión, and APA references
- Exports completed homework directly to **Google Sheets** for printing/submission
- Supports **human-in-the-loop training** to improve AI responses over time
- Renders **Mermaid diagrams** for concept maps and flowcharts
- Costs exactly **$0/month** to operate

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOODLE DASHBOARD                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  HTML Text Block (TinyMCE)                              │    │
│  │  • Styled div with inline CSS                           │    │
│  │  • Launch button → opens panel in new tab              │    │
│  │  • Status badge image from home server                  │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────│───────────────────────────────────┘
                              │ HTTPS (Cloudflare Tunnel)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     HOME SERVER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Express/   │  │    Ollama    │  │    PostgreSQL        │   │
│  │   Node.js    │◄─│   Mistral    │  │   (sessions,         │   │
│  │   :3000      │  │   :11434     │  │   messages,          │   │
│  └──────┬───────┘  └──────────────┘  │   exports,           │   │
│         │                            │   training)          │   │
│         │          ┌──────────────┐  └─────────────────────┘   │
│         └─────────►│  Web Panel   │                             │
│                    │  (React-like │  ┌─────────────────────┐   │
│                    │  SPA)        │  │  Google Sheets API  │   │
│                    └──────────────┘  │  (homework export)  │   │
│                                      └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tool Stack (All Free)

| Tool | Purpose | Free Tier | Monthly Cost |
|------|---------|-----------|-------------|
| [Ollama](https://ollama.ai) | Local AI (Mistral) | Unlimited local | $0 |
| [TinyMCE Cloud](https://tiny.cloud) | Rich text editor | 1M loads/month | $0 |
| [Cloudflare Tunnel](https://cloudflare.com) | HTTPS exposure | Unlimited | $0 |
| [PostgreSQL](https://postgresql.org) | Database | Self-hosted | $0 |
| [Node.js](https://nodejs.org) | Backend runtime | Open source | $0 |
| [Mermaid.js](https://mermaid.js.org) | Diagram rendering | Open source | $0 |
| [Chart.js](https://chartjs.org) | Statistics charts | Open source | $0 |
| [Google Sheets API](https://developers.google.com/sheets) | Homework export | 300 writes/min | $0 |
| [Gemini API](https://ai.google.dev) | AI fallback | 250 req/day (Flash) | $0 |

**Total: $0/month** ✅

---

## 🚀 Quick Start

1. Install Ollama and pull Mistral: `ollama pull mistral`
2. Install PostgreSQL, create `moodle_ai` database
3. Clone this repo: `git clone https://github.com/fienbeh1/moodle-ai-assistant`
4. `cd home-server && npm install`
5. Copy `config/.env.example` to `.env` and fill in your values
6. Run migrations: `npm run db:setup`
7. Start server: `npm start`
8. Set up Cloudflare Tunnel to expose port 3000
9. Paste `moodle-snippet/launcher-styled.html` into your Moodle dashboard text block
10. Open `https://your-tunnel-url/panel` and start chatting!

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

---

## 📁 File Tree

```
moodle-ai-assistant/
├── README.md
├── ARCHITECTURE.md
├── SETUP_GUIDE.md
├── API_KEYS_CHECKLIST.md
├── TEST_PLAN.md
├── BUDGET.md
├── CRONOGRAMA.md
├── .gitignore
│
├── moodle-snippet/
│   ├── diagnostic-tests.html      # 15 HTML capability tests for Moodle
│   ├── launcher-styled.html       # Professional dark card launcher
│   ├── launcher-basic.html        # Minimal text-only fallback
│   └── launcher-with-status.html  # Enhanced launcher with status badge
│
├── home-server/
│   ├── package.json
│   ├── server.js                  # Main Express server
│   ├── routes/
│   │   ├── chat.js                # AI chat endpoint
│   │   ├── export.js              # Google Sheets export
│   │   ├── training.js            # Human-in-the-loop training
│   │   └── status.js              # Health check endpoints
│   ├── services/
│   │   ├── ollama-client.js       # Ollama API client
│   │   ├── gemini-client.js       # Gemini fallback client
│   │   ├── sheets-exporter.js     # Google Sheets exporter
│   │   └── mermaid-renderer.js    # Mermaid code extractor
│   ├── db/
│   │   ├── schema.sql             # Full PostgreSQL schema
│   │   ├── seed.sql               # Sample data
│   │   └── migrations/
│   │       └── 001_initial.sql    # Initial migration
│   ├── config/
│   │   ├── .env.example           # Environment variables template
│   │   └── cloudflared.yml        # Cloudflare Tunnel config
│   └── prompts/
│       ├── system-prompt-apa.txt  # APA academic assistant prompt
│       └── diagram-prompt.txt     # Diagram generation prompt
│
├── web-panel/
│   ├── index.html                 # Single-page app
│   ├── css/
│   │   └── styles.css             # Complete dark theme styles
│   ├── js/
│   │   ├── app.js                 # App initialization
│   │   ├── chat.js                # Chat manager
│   │   ├── editor.js              # TinyMCE setup
│   │   ├── diagrams.js            # Mermaid integration
│   │   ├── export.js              # Sheets export manager
│   │   ├── training.js            # Training/rating manager
│   │   └── stats.js               # Chart.js statistics
│   └── assets/
│       ├── status-online.svg      # Green status indicator
│       └── status-offline.svg     # Red status indicator
│
├── training/
│   ├── README.md                  # Training pipeline docs
│   ├── export-training-data.js    # Export JSONL from DB
│   ├── sample-training-data.jsonl # Example training data
│   └── finetune-lora.py           # LoRA fine-tuning script
│
├── google-sheets-template/
│   ├── README.md                  # How to create the template
│   └── sheet-mapping.json         # Cell mapping configuration
│
└── docs/
    ├── portada.md                 # Cover page (Spanish)
    ├── introduccion.md            # Introduction
    ├── desarrollo.md              # Development/methodology
    ├── conclusiones.md            # Conclusions
    └── referencias-apa.md         # APA 7th edition references
```

---

## ⚙️ How It Works (Link-Out Architecture)

Since Moodle's HTML Purifier strips `<script>` and `<iframe>` tags for student-level users, this project uses a **"link-out"** approach:

1. **Moodle side**: A styled HTML block (using only allowed tags: `<div>`, `<a>`, `<img>`, inline styles) is pasted into a TinyMCE text block on the student's dashboard. This acts as a launcher.

2. **Launch**: When the student clicks the launch button, a new browser tab opens pointing to the home server's web panel via Cloudflare Tunnel.

3. **Web panel**: A full-featured single-page application served by Express, featuring TinyMCE editor, real-time AI chat, diagram rendering, and export functionality.

4. **AI processing**: The Express server receives chat messages, sends them to Ollama (running Mistral locally), falls back to Gemini API if Ollama is unavailable, and saves all conversations to PostgreSQL.

5. **Export**: Completed homework can be exported directly to a Google Sheets template with structured tabs (Portada, Introducción, Desarrollo, Conclusión, Referencias).

---

## 📸 Screenshots

> *(Add screenshots of your Moodle dashboard launcher and web panel here)*

### Moodle Dashboard Launcher
```
[ Screenshot placeholder ]
```

### Web Panel — Chat View
```
[ Screenshot placeholder ]
```

### Web Panel — Diagram View
```
[ Screenshot placeholder ]
```

### Google Sheets Export
```
[ Screenshot placeholder ]
```

---

## 🔒 Security Notes

- API key authentication on all protected endpoints
- HTTPS enforced via Cloudflare Tunnel
- No ports directly exposed to the internet
- Environment variables for all secrets
- Google service account key excluded from version control

---

## 📄 License

MIT © 2026 — Year-End Student Project
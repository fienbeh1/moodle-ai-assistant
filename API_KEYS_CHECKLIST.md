# ✅ API Keys Checklist — All at $0

```
╔══════════════════════════════════════════════════════════════╗
║           API KEYS REQUIRED FOR THIS PROJECT                 ║
║                    Total Cost: $0/month                      ║
╠══════════════════════════════════════════════════════════════╣
║  [ ] TinyMCE API Key                                         ║
║  [ ] Google Gemini API Key                                   ║
║  [ ] Google Sheets Service Account JSON                      ║
║  [ ] Cloudflare Tunnel (no key — just account)               ║
║  [✓] Ollama — no key needed (local)                         ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 1. TinyMCE Cloud

| Field | Value |
|-------|-------|
| **URL** | https://www.tiny.cloud/auth/signup/ |
| **Free tier** | 1,000,000 editor loads per month |
| **Credit card** | Not required |
| **Monthly cost** | **$0** |

### Steps
1. Go to https://www.tiny.cloud/auth/signup/
2. Sign up with email (or Google/GitHub)
3. Verify your email
4. Dashboard shows your API key immediately
5. Copy key → paste into `web-panel/index.html` replacing `TINYMCE_API_KEY`
6. Also add to `home-server/.env` as `TINYMCE_API_KEY=...`

### Usage in this project
Used in `web-panel/index.html` for the rich text editor in the chat panel.

---

## 2. Google Gemini API

| Field | Value |
|-------|-------|
| **URL** | https://aistudio.google.com/app/apikey |
| **Free tier** | 250 requests/day (Gemini 2.5 Flash) |
| **Rate limits** | 15 req/min, 1,500 req/day (Gemini 1.5 Flash) |
| **Credit card** | Not required |
| **Monthly cost** | **$0** |

### Steps
1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key" in the top right
4. Click "Create API Key"
5. Select "Create API key in new project" (or existing project)
6. Copy the key
7. Add to `home-server/.env` as `GEMINI_API_KEY=your-key-here`

### Usage in this project
Fallback AI when Ollama is unavailable. Called by `home-server/services/gemini-client.js`.

---

## 3. Google Sheets API (Service Account)

| Field | Value |
|-------|-------|
| **URL** | https://console.cloud.google.com/ |
| **Free tier** | 300 write requests/minute, unlimited reads |
| **Auth method** | Service Account JSON key |
| **Credit card** | Not required (free tier) |
| **Monthly cost** | **$0** |

### Steps
1. Go to https://console.cloud.google.com/
2. Create a new project: "moodle-ai-assistant"
3. Enable **Google Sheets API**: APIs & Services → Library → search "Sheets" → Enable
4. Create Service Account: APIs & Services → Credentials → Create Credentials → Service Account
   - Name: `moodle-ai-sheets`
   - Role: Editor
5. Create JSON key: Click the service account → Keys → Add Key → JSON
6. Download JSON → save as `home-server/config/google-sheets-key.json`
7. Create a Google Sheets template (see `google-sheets-template/README.md`)
8. Share the sheet with the service account email from the JSON file
9. Copy the Sheet ID from the URL
10. Add to `.env`:
    ```
    GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-sheets-key.json
    GOOGLE_SHEET_TEMPLATE_ID=your-sheet-id
    ```

### ⚠️ Security
The JSON key file is added to `.gitignore` — **NEVER commit it to git**.

---

## 4. Cloudflare Tunnel

| Field | Value |
|-------|-------|
| **URL** | https://cloudflare.com |
| **Free tier** | Unlimited bandwidth, unlimited tunnels |
| **Credit card** | Not required |
| **Monthly cost** | **$0** |

### Steps
1. Sign up at https://cloudflare.com (free account)
2. Add your domain to Cloudflare (or use Cloudflare's free subdomain service)
3. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
4. Authenticate: `cloudflared tunnel login`
5. Create tunnel: `cloudflared tunnel create moodle-bridge`
6. Configure: edit `home-server/config/cloudflared.yml` with your hostname
7. Add DNS: `cloudflared tunnel route dns moodle-bridge ai.yourdomain.com`
8. Run: `cloudflared tunnel run moodle-bridge`

### No API key needed
Cloudflare Tunnel uses a credentials JSON file (not an API key) automatically placed in `~/.cloudflared/`.

---

## 5. Ollama (Local AI)

| Field | Value |
|-------|-------|
| **URL** | https://ollama.ai |
| **API Key** | **None required** |
| **Runs on** | Your local machine |
| **Free tier** | Unlimited (it's your own hardware) |
| **Monthly cost** | **$0** |

### Steps
1. Download and install: https://ollama.ai/download
2. Pull Mistral: `ollama pull mistral`
3. Verify: `curl http://localhost:11434/api/tags`
4. No API key needed — uses `Authorization: Bearer ollama` (literal string) for OpenAI-compatible endpoint

---

## Summary Table

| Service | Key Type | Where to Get | Cost | Required? |
|---------|---------|-------------|------|-----------|
| TinyMCE | API key string | tiny.cloud | $0 | Yes (for web panel editor) |
| Gemini | API key string | aistudio.google.com | $0 | No (fallback only) |
| Google Sheets | Service Account JSON | console.cloud.google.com | $0 | No (for homework export) |
| Cloudflare | Account + cloudflared CLI | cloudflare.com | $0 | Yes (for internet access) |
| Ollama | None needed | ollama.ai | $0 | Yes (primary AI) |

**Grand Total: $0/month** 🎉

# 📖 Setup Guide — Moodle AI Homework Assistant

## Prerequisites

### Hardware
- **RAM**: 8 GB minimum (16 GB recommended for Mistral 7B)
- **Storage**: 10 GB free (for Mistral model ~4 GB)
- **OS**: Windows 10/11, macOS 12+, or Ubuntu 20.04+
- **Internet**: Stable connection for Cloudflare Tunnel

---

## Step 1 — Install Ollama

Ollama runs the Mistral AI model locally on your computer.

### Windows
```powershell
# Download installer from https://ollama.ai/download
# Run OllamaSetup.exe
# Then open PowerShell:
ollama pull mistral
ollama run mistral
# Test: type a question, press Enter, type /bye to exit
```

### macOS
```bash
# Download from https://ollama.ai/download
# Or via Homebrew:
brew install ollama
ollama serve &
ollama pull mistral
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://ollama.ai/install.sh | sh
sudo systemctl start ollama
sudo systemctl enable ollama
ollama pull mistral
```

### Verify Ollama is running
```bash
curl http://localhost:11434/api/tags
# Should return a JSON list of installed models
```

---

## Step 2 — Install PostgreSQL

### Windows
```powershell
# Download from https://www.postgresql.org/download/windows/
# Run installer, remember your postgres password
# Open pgAdmin or SQL Shell (psql)
```

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create database and user
```bash
sudo -u postgres psql
```

```sql
CREATE USER ai_user WITH PASSWORD 'change-this-secure-password';
CREATE DATABASE moodle_ai OWNER ai_user;
GRANT ALL PRIVILEGES ON DATABASE moodle_ai TO ai_user;
\q
```

### Verify connection
```bash
psql -U ai_user -d moodle_ai -c "SELECT version();"
```

---

## Step 3 — Install Node.js LTS

### Windows / macOS
Download the LTS installer from https://nodejs.org/

### Linux
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

### Verify
```bash
node --version  # Should be 18.x or higher
npm --version
```

---

## Step 4 — Clone and Install Dependencies

```bash
git clone https://github.com/fienbeh1/moodle-ai-assistant.git
cd moodle-ai-assistant/home-server
npm install
```

---

## Step 5 — Set Up Cloudflare Tunnel

Cloudflare Tunnel exposes your local server to the internet securely without opening firewall ports.

### 5.1 Sign up for Cloudflare
1. Go to https://cloudflare.com and create a free account
2. Add your domain (or use a free Cloudflare pages subdomain)

### 5.2 Install cloudflared

**Windows**:
```powershell
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
winget install --id Cloudflare.cloudflared
```

**macOS**:
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux**:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 5.3 Authenticate cloudflared
```bash
cloudflared tunnel login
# Opens browser — log in to your Cloudflare account
```

### 5.4 Create tunnel
```bash
cloudflared tunnel create moodle-bridge
# Note the tunnel UUID — you'll need it
```

### 5.5 Configure tunnel
Edit `home-server/config/cloudflared.yml`:
```yaml
tunnel: moodle-bridge
credentials-file: /home/YOUR_USER/.cloudflared/moodle-bridge.json
ingress:
  - hostname: ai.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 5.6 Add DNS record
```bash
cloudflared tunnel route dns moodle-bridge ai.yourdomain.com
```

### 5.7 Run tunnel
```bash
cloudflared tunnel run moodle-bridge
# Or use: cd home-server && npm run tunnel
```

---

## Step 6 — Google Sheets Credentials

### 6.1 Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Click "New Project" → name it "moodle-ai-assistant"
3. Select the project

### 6.2 Enable Google Sheets API
1. Go to APIs & Services → Library
2. Search "Google Sheets API" → Enable

### 6.3 Create Service Account
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "Service Account"
3. Name: `moodle-ai-sheets`
4. Click "Create and Continue"
5. Role: Editor (or Sheets Editor)
6. Click "Done"

### 6.4 Download JSON key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key" → JSON
4. Download the JSON file
5. Save it as `home-server/config/google-sheets-key.json`
6. **This file is in .gitignore — never commit it!**

### 6.5 Create template spreadsheet
1. Go to https://sheets.google.com and create a new spreadsheet
2. Create tabs: `Portada`, `Introduccion`, `Desarrollo`, `Conclusion`, `Referencias`
3. Note the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
4. Share the sheet with your service account email (found in the JSON file, field `client_email`)
5. Give "Editor" permission

---

## Step 7 — Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key — it's free with 250 requests/day for Gemini Flash
4. No credit card required

---

## Step 8 — Get TinyMCE API Key

1. Go to https://www.tiny.cloud/auth/signup/
2. Sign up for a free account (1 million editor loads per month)
3. Copy your API key from the dashboard
4. This is used in `web-panel/index.html` for the rich text editor

---

## Step 9 — Configure .env File

```bash
cd home-server
cp config/.env.example .env
```

Edit `.env` with your values:
```env
PORT=3000
API_KEY=generate-a-random-32-char-string-here

DB_HOST=localhost
DB_PORT=5432
DB_NAME=moodle_ai
DB_USER=ai_user
DB_PASSWORD=your-postgres-password

OLLAMA_URL=http://localhost:11434
GEMINI_API_KEY=your-gemini-api-key-here

GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-sheets-key.json
GOOGLE_SHEET_TEMPLATE_ID=your-spreadsheet-id-from-url

TINYMCE_API_KEY=your-tinymce-api-key
```

To generate a random API key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 10 — Run Database Migrations

```bash
cd home-server
npm run db:setup
# Creates all tables: sessions, messages, exports
# Creates training_pairs view

# Optional: load sample data
npm run db:seed
```

---

## Step 11 — Start the Server

```bash
cd home-server
npm start
# Server starts on http://localhost:3000

# Development mode (auto-restart on changes):
npm run dev
```

Verify it's working:
```bash
curl http://localhost:3000/api/status
# Should return: {"status":"ok","db":"connected","ollama":"running",...}
```

---

## Step 12 — Paste Launcher into Moodle

### Choose your launcher
- **Best option**: `moodle-snippet/launcher-styled.html` (professional dark card)
- **Fallback**: `moodle-snippet/launcher-basic.html` (works with all style restrictions)
- **Run tests first**: `moodle-snippet/diagnostic-tests.html` (see TEST_PLAN.md)

### Replace placeholders
In your chosen launcher file, replace all instances of `YOUR-TUNNEL-URL` with your actual Cloudflare Tunnel URL (e.g., `https://ai.yourdomain.com`).

### Paste into Moodle
1. Log into Moodle
2. Go to your Dashboard/Welcome page
3. Click "Edit" on the text block (or add a new HTML/Text block)
4. In the TinyMCE editor, click "Source Code" button (or `<>` icon)
5. Paste the launcher HTML
6. Click "Save"
7. Exit editing mode and verify the launcher appears

---

## 🔧 Troubleshooting

### Ollama won't start
```bash
# Check if port is in use
netstat -tlnp | grep 11434
# Restart Ollama
sudo systemctl restart ollama  # Linux
# Or kill and restart:
pkill ollama && ollama serve
```

### PostgreSQL connection refused
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql
# Check pg_hba.conf allows local connections
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: local   moodle_ai   ai_user   md5
sudo systemctl restart postgresql
```

### Cloudflare Tunnel not connecting
```bash
# Check credentials file exists
ls ~/.cloudflared/
# Re-authenticate
cloudflared tunnel login
# Check tunnel status
cloudflared tunnel info moodle-bridge
```

### Moodle strips my HTML
Run the diagnostic tests first (see TEST_PLAN.md) to determine which HTML elements Moodle allows.

### Google Sheets export fails
- Verify service account email has Editor access to the spreadsheet
- Check the JSON key file path in .env
- Verify spreadsheet ID is correct
- Check API quotas in Google Cloud Console

### "API key invalid" error
- Verify `API_KEY` in `.env` matches `X-API-KEY` header in web panel
- Check web-panel/js/app.js has the correct API URL and key

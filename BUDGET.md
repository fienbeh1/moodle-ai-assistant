# 💰 Budget — Moodle AI Homework Assistant

## Complete Cost Breakdown

| Component | Tool | Free Tier | Monthly Cost |
|-----------|------|-----------|-------------|
| AI Engine (Primary) | Ollama + Mistral 7B | Unlimited (local) | **$0** |
| AI Engine (Fallback) | Google Gemini 2.5 Flash | 250 req/day | **$0** |
| Rich Text Editor | TinyMCE Cloud | 1,000,000 loads/month | **$0** |
| HTTPS Tunnel | Cloudflare Tunnel | Unlimited bandwidth | **$0** |
| Database | PostgreSQL | Self-hosted | **$0** |
| Backend Runtime | Node.js LTS | Open source | **$0** |
| Diagram Rendering | Mermaid.js | Open source | **$0** |
| Charts | Chart.js | Open source | **$0** |
| Homework Export | Google Sheets API | 300 writes/min | **$0** |
| Version Control | GitHub | Free for students | **$0** |
| DNS / CDN | Cloudflare | Free tier | **$0** |

---

## Monthly Total: $0.00

```
┌─────────────────────────────────────────────┐
│  MONTHLY BUDGET SUMMARY                     │
│                                             │
│  AI Processing:        $0.00                │
│  Database:             $0.00                │
│  Web Hosting:          $0.00                │
│  APIs:                 $0.00                │
│  Tools & Libraries:    $0.00                │
│  ─────────────────────────                  │
│  TOTAL:                $0.00/month  ✅      │
└─────────────────────────────────────────────┘
```

---

## Additional Notes

### Electricity
- Running Ollama (Mistral 7B) inference uses approximately 40–80W depending on hardware
- If you run the server 4 hours/day for school: ~4–10 kWh/month
- At average $0.12/kWh: approximately **$0.48–$1.20/month** in electricity
- This is often negligible as your computer may already be on for school

### Optional: Custom Domain (~$1/year)
- If you want a custom domain (e.g., `ai.yourname.com`) instead of a free subdomain
- Domain registrars: Namecheap (~$9/year), Google Domains (~$12/year)
- Optional — Cloudflare offers free subdomains on `*.workers.dev`
- **Monthly equivalent: ~$0.08/month** (optional)

### Storage
- Mistral 7B model: ~4 GB
- PostgreSQL data: grows slowly, <1 GB for a school year
- No additional storage costs on personal hardware

---

## Comparison with Paid Alternatives

| Feature | This Project | ChatGPT Plus | GitHub Copilot | Cloud Hosting |
|---------|-------------|-------------|----------------|--------------|
| AI Chat | Mistral (local) | GPT-4o | Copilot | OpenAI API |
| Monthly Cost | **$0** | $20/month | $10/month | $10–50/month |
| Data Privacy | ✅ Local | ❌ Cloud | ❌ Cloud | ❌ Cloud |
| Unlimited Use | ✅ Yes | ❌ Limits | ❌ Limits | ❌ Pay per use |
| Academic Format | ✅ APA built-in | ❌ Manual | ❌ N/A | ❌ Manual |
| Homework Export | ✅ Google Sheets | ❌ Manual | ❌ N/A | ❌ Manual |
| Fine-tuning | ✅ LoRA support | ❌ No | ❌ No | 💰 Expensive |

**Annual savings vs ChatGPT Plus: ~$240/year**
**Annual savings vs full cloud stack: ~$120–600/year**

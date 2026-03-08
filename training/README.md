# 🧠 Training Pipeline — Human-in-the-Loop AI Improvement

## Overview

This directory contains tools for improving the AI assistant's responses over time using a **human-in-the-loop** approach:

1. **Rate** — Student rates AI responses (👍/👎) in the web panel
2. **Correct** — Student provides better versions of poor responses
3. **Export** — Export rated/corrected pairs as JSONL training data
4. **Fine-tune** — Use LoRA to fine-tune Mistral with your corrections
5. **Deploy** — Import the fine-tuned model into Ollama

The more you use and correct the AI, the better it gets at your specific homework style.

---

## How It Works

```
Student rates/corrects responses (web panel)
                │
                ▼
PostgreSQL stores corrections in messages.corrected_content
                │
                ▼
export-training-data.js queries training_pairs view
                │
                ▼
training-data.jsonl (instruction → corrected output pairs)
                │
                ▼
finetune-lora.py trains Mistral with LoRA adapters
                │
                ▼
Fine-tuned model saved to ./finetuned-model/
                │
                ▼
Create Ollama Modelfile → ollama create mistral-custom
                │
                ▼
Your personalized model appears in the web panel
```

---

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 16 GB | 32 GB |
| GPU VRAM | 8 GB (RTX 3070) | 16 GB (RTX 4080) |
| Storage | 20 GB free | 40 GB free |
| Training time | ~2-4 hours (GPU) | ~30 min (high-end GPU) |

**Note**: Fine-tuning can also run on CPU, but expect 10–50x slower training times.

---

## Software Requirements

```bash
# Python 3.10+
python --version

# PyTorch with CUDA (GPU) or CPU-only
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
# OR for CPU only:
pip install torch torchvision

# Hugging Face libraries
pip install transformers peft datasets accelerate bitsandbytes

# Optional: Weights & Biases for training monitoring
pip install wandb
```

---

## Step-by-Step Workflow

### Step 1: Accumulate Training Data
Use the web panel to rate at least 50+ AI responses before fine-tuning. The more corrections, the better.

```
Recommended minimum:
- 50+ total interactions
- 20+ corrected responses
- Mix of different subjects/topics
```

### Step 2: Export Training Data

```bash
# From the project root:
cd home-server
node ../training/export-training-data.js

# Or via web panel: Training tab → "Export JSONL" button
# Or via API:
curl -H "X-API-KEY: your-key" https://your-tunnel/api/training/export-jsonl \
  -o training-data.jsonl
```

### Step 3: Inspect Training Data

```bash
# Count training pairs
wc -l training-data.jsonl

# Preview first few lines
head -5 training-data.jsonl | python -m json.tool
```

### Step 4: Run LoRA Fine-tuning

```bash
cd training
python finetune-lora.py \
  --data training-data.jsonl \
  --model mistralai/Mistral-7B-Instruct-v0.2 \
  --output ./finetuned-model \
  --epochs 3 \
  --batch-size 4
```

The script will print progress and estimated time. Expect 1–4 hours.

### Step 5: Import into Ollama

After training, create an Ollama Modelfile:

```
# Create file: Modelfile
FROM ./finetuned-model
PARAMETER temperature 0.7
PARAMETER num_predict 4096
SYSTEM "Eres un asistente académico especializado en formato APA..."
```

```bash
# Import the model
ollama create mistral-custom -f Modelfile

# Test it
ollama run mistral-custom "Explica la fotosíntesis"
```

Then in the web panel, select "mistral-custom" from the model dropdown.

---

## Expected Results and Limitations

### What fine-tuning improves:
- ✅ Consistent APA format structure
- ✅ Better quality references for your subject area
- ✅ Responses at the right academic level
- ✅ Spanish language quality
- ✅ Correct Mermaid diagram generation

### Limitations:
- ❌ Won't give the model new knowledge (it still knows only what Mistral 7B knows)
- ❌ Requires GPU for reasonable training time
- ❌ Can overfit with too few examples (< 20 pairs)
- ❌ The fine-tuned model may forget some general knowledge

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `export-training-data.js` | Node.js script to export JSONL from PostgreSQL |
| `sample-training-data.jsonl` | Example training data format |
| `finetune-lora.py` | Complete Python LoRA fine-tuning script |
| `training-data.jsonl` | Your actual training data (gitignored) |
| `finetuned-model/` | Output directory for fine-tuned model (gitignored) |

#!/usr/bin/env python3
"""
finetune-lora.py — LoRA Fine-tuning Script for Mistral 7B
==========================================================
Fine-tunes a Mistral model using human-corrected training pairs
with LoRA (Low-Rank Adaptation) for memory-efficient training.

Usage:
    python finetune-lora.py \\
        --data training-data.jsonl \\
        --model mistralai/Mistral-7B-Instruct-v0.2 \\
        --output ./finetuned-model \\
        --epochs 3 \\
        --batch-size 4

Requirements:
    pip install torch transformers peft datasets accelerate bitsandbytes
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(
        description='Fine-tune Mistral 7B with LoRA on homework assistant data'
    )
    parser.add_argument(
        '--data', type=str, default='training-data.jsonl',
        help='Path to JSONL training data file'
    )
    parser.add_argument(
        '--model', type=str, default='mistralai/Mistral-7B-Instruct-v0.2',
        help='Base model name or path'
    )
    parser.add_argument(
        '--output', type=str, default='./finetuned-model',
        help='Output directory for fine-tuned model'
    )
    parser.add_argument(
        '--epochs', type=int, default=3,
        help='Number of training epochs'
    )
    parser.add_argument(
        '--batch-size', type=int, default=4,
        help='Training batch size (reduce if OOM)'
    )
    parser.add_argument(
        '--learning-rate', type=float, default=2e-4,
        help='Learning rate'
    )
    parser.add_argument(
        '--min-rating', type=int, default=1,
        help='Minimum rating to include (-1, 0, or 1). Default: 1 (only positive)'
    )
    parser.add_argument(
        '--include-corrected', action='store_true', default=True,
        help='Include corrected examples regardless of rating'
    )
    parser.add_argument(
        '--lora-r', type=int, default=8,
        help='LoRA rank'
    )
    parser.add_argument(
        '--lora-alpha', type=int, default=32,
        help='LoRA alpha scaling'
    )
    parser.add_argument(
        '--lora-dropout', type=float, default=0.1,
        help='LoRA dropout'
    )
    return parser.parse_args()


def load_training_data(jsonl_path: str, min_rating: int = 1, include_corrected: bool = True) -> list:
    """
    Load and filter training data from JSONL file.

    Args:
        jsonl_path: Path to the JSONL training data file
        min_rating: Minimum rating to include (1 = only positively rated)
        include_corrected: Whether to include corrected examples regardless of rating

    Returns:
        List of training examples
    """
    path = Path(jsonl_path)
    if not path.exists():
        raise FileNotFoundError(f"Training data file not found: {jsonl_path}")

    examples = []
    skipped = 0

    with open(path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                example = json.loads(line)
            except json.JSONDecodeError as e:
                logger.warning(f"Skipping malformed JSON on line {line_num}: {e}")
                skipped += 1
                continue

            # Filter by rating
            rating = example.get('rating')
            was_corrected = example.get('was_corrected', False)

            # Include if: rating meets threshold OR it was manually corrected
            if include_corrected and was_corrected:
                examples.append(example)
            elif rating is not None and rating >= min_rating:
                examples.append(example)
            else:
                skipped += 1

    logger.info(f"Loaded {len(examples)} training examples (skipped {skipped})")
    return examples


def format_prompt(example: dict) -> str:
    """
    Format a training example as an instruction-following prompt.

    Uses the Mistral Instruct format:
    [INST] instruction [/INST] output

    Args:
        example: Training example with 'instruction', 'input', 'output' fields

    Returns:
        Formatted prompt string
    """
    instruction = example.get('instruction', '').strip()
    user_input = example.get('input', '').strip()
    output = example.get('output', '').strip()

    if user_input:
        full_instruction = f"{instruction}\n\n{user_input}"
    else:
        full_instruction = instruction

    return f"[INST] {full_instruction} [/INST] {output}</s>"


def create_dataset(examples: list, tokenizer, max_length: int = 2048):
    """
    Create a Hugging Face Dataset from training examples.

    Args:
        examples: List of training examples
        tokenizer: Tokenizer for the model
        max_length: Maximum sequence length

    Returns:
        datasets.Dataset
    """
    try:
        from datasets import Dataset
    except ImportError:
        logger.error("Install 'datasets': pip install datasets")
        sys.exit(1)

    prompts = [format_prompt(ex) for ex in examples]

    def tokenize(batch):
        tokenized = tokenizer(
            batch['text'],
            max_length=max_length,
            truncation=True,
            padding='max_length',
            return_tensors='pt',
        )
        tokenized['labels'] = tokenized['input_ids'].clone()
        return tokenized

    dataset = Dataset.from_dict({'text': prompts})
    tokenized_dataset = dataset.map(tokenize, batched=True, remove_columns=['text'])
    return tokenized_dataset


def main():
    args = parse_args()

    logger.info("🤖 Moodle AI Assistant — LoRA Fine-tuning Script")
    logger.info("=" * 50)

    # Check dependencies
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
        from peft import LoraConfig, get_peft_model, TaskType
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        logger.error("Install: pip install torch transformers peft datasets accelerate bitsandbytes")
        sys.exit(1)

    # Check GPU
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    if device == 'cpu':
        logger.warning("⚠️  No GPU detected. Training on CPU will be very slow (10-50x slower).")
    else:
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
        logger.info(f"✅ GPU: {gpu_name} ({gpu_memory:.1f} GB VRAM)")

    # Load training data
    logger.info(f"📂 Loading training data from: {args.data}")
    examples = load_training_data(
        args.data,
        min_rating=args.min_rating,
        include_corrected=args.include_corrected,
    )

    if len(examples) < 10:
        logger.warning(f"⚠️  Only {len(examples)} examples. Recommend at least 50 for good results.")

    # Load tokenizer
    logger.info(f"🔤 Loading tokenizer: {args.model}")
    tokenizer = AutoTokenizer.from_pretrained(
        args.model,
        trust_remote_code=True,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Load model
    logger.info(f"🧠 Loading base model: {args.model}")
    load_kwargs = {
        'trust_remote_code': True,
        'torch_dtype': torch.float16 if device == 'cuda' else torch.float32,
    }

    # Use 4-bit quantization if bitsandbytes is available (saves VRAM)
    try:
        from transformers import BitsAndBytesConfig
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type='nf4',
            bnb_4bit_compute_dtype=torch.float16,
        )
        load_kwargs['quantization_config'] = bnb_config
        load_kwargs['device_map'] = 'auto'
        logger.info("✅ Using 4-bit quantization (bitsandbytes)")
    except ImportError:
        logger.warning("bitsandbytes not available — loading in full precision (more VRAM needed)")
        if device == 'cuda':
            load_kwargs['device_map'] = 'auto'

    model = AutoModelForCausalLM.from_pretrained(args.model, **load_kwargs)

    # Apply LoRA
    logger.info(f"🔧 Applying LoRA (r={args.lora_r}, alpha={args.lora_alpha})")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        target_modules=['q_proj', 'v_proj'],  # Mistral attention layers
        bias='none',
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Create dataset
    logger.info("📊 Tokenizing training data...")
    train_dataset = create_dataset(examples, tokenizer)

    # Training arguments
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        warmup_steps=50,
        learning_rate=args.learning_rate,
        fp16=(device == 'cuda'),
        logging_steps=10,
        save_strategy='epoch',
        report_to='none',  # Set to 'wandb' for monitoring
        dataloader_drop_last=True,
    )

    # Train
    logger.info(f"🚀 Starting training for {args.epochs} epochs...")
    logger.info(f"   Training examples: {len(examples)}")
    logger.info(f"   Batch size: {args.batch_size}")
    logger.info(f"   Learning rate: {args.learning_rate}")

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
    )

    trainer.train()

    # Save model
    logger.info(f"💾 Saving fine-tuned model to: {output_dir}")
    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))

    logger.info("")
    logger.info("✅ Fine-tuning complete!")
    logger.info("=" * 50)
    logger.info("🚀 Next steps to use your model in Ollama:")
    logger.info("")
    logger.info("1. Create a Modelfile:")
    logger.info(f"   echo 'FROM {output_dir}' > Modelfile")
    logger.info("   echo 'PARAMETER temperature 0.7' >> Modelfile")
    logger.info("   echo 'PARAMETER num_predict 4096' >> Modelfile")
    logger.info("")
    logger.info("2. Import into Ollama:")
    logger.info("   ollama create mistral-custom -f Modelfile")
    logger.info("")
    logger.info("3. Test:")
    logger.info("   ollama run mistral-custom 'Explica la fotosíntesis'")
    logger.info("")
    logger.info("4. Select 'mistral-custom' in the web panel model dropdown")


if __name__ == '__main__':
    main()

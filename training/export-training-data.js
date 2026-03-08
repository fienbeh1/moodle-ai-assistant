// training/export-training-data.js
// Export human-corrected training pairs from PostgreSQL to JSONL format
// Usage: node export-training-data.js
// Or:    cd home-server && npm run export:training

import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from home-server directory
const envPath = join(__dirname, '..', 'home-server', '.env');
try {
  const { config } = await import('dotenv');
  config({ path: envPath });
} catch {
  // dotenv already loaded or not needed
}

async function main() {
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'moodle_ai',
    user: process.env.DB_USER || 'ai_user',
    password: process.env.DB_PASSWORD,
  });

  console.log('🔌 Connecting to PostgreSQL...');

  try {
    // Query all training pairs from the view
    const result = await pool.query(`
      SELECT
        instruction,
        output,
        rating,
        was_corrected,
        model_used,
        created_at
      FROM training_pairs
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  No training data found.');
      console.log('    Rate or correct some AI responses in the web panel first.');
      await pool.end();
      return;
    }

    // Format as JSONL
    const jsonlLines = result.rows.map(row =>
      JSON.stringify({
        instruction: row.instruction,
        input: '',
        output: row.output,
        rating: row.rating,
        was_corrected: row.was_corrected,
        model_used: row.model_used,
      })
    ).join('\n');

    // Write to file
    const outputPath = join(__dirname, 'training-data.jsonl');
    await writeFile(outputPath, jsonlLines, 'utf-8');

    // Statistics
    const total = result.rows.length;
    const positive = result.rows.filter(r => r.rating === 1).length;
    const negative = result.rows.filter(r => r.rating === -1).length;
    const corrected = result.rows.filter(r => r.was_corrected).length;

    console.log('');
    console.log('✅ Training data exported successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Total pairs:    ${total}`);
    console.log(`👍 Positive:       ${positive}`);
    console.log(`👎 Negative:       ${negative}`);
    console.log(`✏️  Corrected:      ${corrected}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review training-data.jsonl');
    console.log('  2. Run: python finetune-lora.py --data training-data.jsonl');
    console.log('');

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Export failed:', err.message);
  process.exit(1);
});

// home-server/routes/chat.js
// POST /api/chat — AI chat with Ollama (primary) and Gemini (fallback)

import { Router } from 'express';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { callOllama } from '../services/ollama-client.js';
import { callGemini } from '../services/gemini-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load system prompt (APA academic format)
async function getSystemPrompt() {
  try {
    const promptPath = join(__dirname, '..', 'prompts', 'system-prompt-apa.txt');
    return await readFile(promptPath, 'utf-8');
  } catch {
    // Inline fallback if file not found
    return `Eres un asistente académico profesional. SIEMPRE estructura tus respuestas así:

## Introducción
[Párrafo introductorio contextualizando el tema]

## Desarrollo
[Contenido principal, bien organizado con subtítulos si es necesario]

## Conclusión
[Síntesis de los puntos principales]

## Referencias APA (7ma edición)
[MÍNIMO 3 referencias reales y verificables en formato APA 7ma edición]
- Usa formato: Autor, A. A. (Año). Título del trabajo. Editorial/URL.

Si el usuario pide un diagrama o cuadro sinóptico, genera código Mermaid entre bloques \`\`\`mermaid.
Responde en el mismo idioma que el usuario usa.`;
  }
}

/**
 * Chat router factory — accepts pool for DB access.
 * Handles AI chat completions with full conversation history.
 * Supports dual AI providers: Ollama (local, primary) with automatic
 * fallback to Google Gemini when Ollama is unavailable.
 * @param {import('pg').Pool} pool
 * @returns {import('express').Router}
 */
export default function chatRouter(pool) {
  const router = Router();

  // POST /api/chat
  router.post('/', async (req, res) => {
    const { prompt, sessionId, model = 'mistral' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'prompt is required and must be a non-empty string' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create or reuse session
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const sessionResult = await client.query(
          `INSERT INTO sessions (model, title, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING id`,
          [model, prompt.slice(0, 100)]
        );
        activeSessionId = sessionResult.rows[0].id;
      } else {
        // Update session timestamp
        await client.query(
          `UPDATE sessions SET updated_at = NOW() WHERE id = $1`,
          [activeSessionId]
        );
      }

      // Save user message
      await client.query(
        `INSERT INTO messages (session_id, role, content, model_used, created_at)
         VALUES ($1, 'user', $2, $3, NOW())`,
        [activeSessionId, prompt.trim(), model]
      );

      // Load full conversation history for this session
      const historyResult = await client.query(
        `SELECT role, content
         FROM messages
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [activeSessionId]
      );

      // Build messages array with system prompt at top
      const systemPrompt = await getSystemPrompt();
      const messages = [
        { role: 'system', content: systemPrompt },
        ...historyResult.rows.map(row => ({ role: row.role, content: row.content })),
      ];

      // Try Ollama first, fall back to Gemini
      let aiResponse;
      let modelUsed;

      try {
        aiResponse = await callOllama(messages, model);
        modelUsed = model;
      } catch (ollamaError) {
        console.warn(`⚠️  Ollama failed (${ollamaError.message}), trying Gemini fallback...`);
        try {
          aiResponse = await callGemini(messages);
          modelUsed = 'gemini-2.5-flash';
        } catch (geminiError) {
          throw new Error(`Both AI providers failed. Ollama: ${ollamaError.message} | Gemini: ${geminiError.message}`);
        }
      }

      // Save AI response
      const aiMessageResult = await client.query(
        `INSERT INTO messages (session_id, role, content, model_used, created_at)
         VALUES ($1, 'assistant', $2, $3, NOW())
         RETURNING id`,
        [activeSessionId, aiResponse, modelUsed]
      );

      await client.query('COMMIT');

      res.json({
        sessionId: activeSessionId,
        messageId: aiMessageResult.rows[0].id,
        response: aiResponse,
        model: modelUsed,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Chat error:', err.message);
      res.status(500).json({ error: 'Failed to process chat request', detail: err.message });
    } finally {
      client.release();
    }
  });

  return router;
}

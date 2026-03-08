// home-server/services/ollama-client.js
// Client for Ollama local AI server (OpenAI-compatible API)

import fetch from 'node-fetch';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const TIMEOUT_MS = 120_000; // 120 seconds for long academic responses

/**
 * Send a chat completion request to Ollama using OpenAI-compatible API
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model - Ollama model name (default: 'mistral')
 * @returns {Promise<string>} AI response text
 */
export async function callOllama(messages, model = 'mistral') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ollama',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('Ollama returned no choices in response');
    }

    return data.choices[0].message.content;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
}

/**
 * List all models available in the local Ollama installation
 * @returns {Promise<Array<{name: string, modified_at: string, size: number}>>}
 */
export async function listModels() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.models || [];

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Ollama list models timed out');
    }
    throw err;
  }
}

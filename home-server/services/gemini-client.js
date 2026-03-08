// home-server/services/gemini-client.js
// Fallback AI client using Google Gemini API

import fetch from 'node-fetch';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Convert OpenAI-format messages to Gemini format
 * Handles: system messages (prepended as first user message), role mapping
 * @param {Array<{role: string, content: string}>} messages
 * @returns {{ contents: Array, systemInstruction?: object }}
 */
function convertToGeminiFormat(messages) {
  const contents = [];
  let systemInstruction = null;

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Gemini supports system instructions natively
      systemInstruction = {
        parts: [{ text: msg.content }],
      };
    } else if (msg.role === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.content }],
      });
    } else if (msg.role === 'assistant') {
      // OpenAI 'assistant' maps to Gemini 'model'
      contents.push({
        role: 'model',
        parts: [{ text: msg.content }],
      });
    }
  }

  // If no system instruction was found but there are messages,
  // Gemini requires contents to start with a user message
  if (contents.length === 0) {
    throw new Error('No user messages found in conversation');
  }

  return { contents, systemInstruction };
}

/**
 * Send a chat completion request to Google Gemini API
 * @param {Array<{role: string, content: string}>} messages - OpenAI format messages
 * @returns {Promise<string>} AI response text
 */
export async function callGemini(messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const { contents, systemInstruction } = convertToGeminiFormat(messages);

  const requestBody = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  if (systemInstruction) {
    requestBody.system_instruction = systemInstruction;
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini HTTP ${response.status}: ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini returned no candidates in response');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Gemini response has no content parts');
    }

    return candidate.content.parts[0].text;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Gemini request timed out after 60s');
    }
    throw err;
  }
}

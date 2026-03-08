// home-server/services/mermaid-renderer.js
// Utilities for detecting and extracting Mermaid diagram code from AI responses

/**
 * Regular expression to match Mermaid code blocks in markdown
 * Matches: ```mermaid\n...code...\n```
 */
const MERMAID_BLOCK_REGEX = /```mermaid\s*\n([\s\S]*?)```/gi;

/**
 * Extract all Mermaid diagram code blocks from a text
 * @param {string} text - Text that may contain ```mermaid blocks
 * @returns {string[]} Array of Mermaid code strings (without the ``` delimiters)
 */
export function extractMermaidCode(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const diagrams = [];
  let match;
  const regex = new RegExp(MERMAID_BLOCK_REGEX.source, 'gi');

  while ((match = regex.exec(text)) !== null) {
    const code = match[1].trim();
    if (code.length > 0) {
      diagrams.push(code);
    }
  }

  return diagrams;
}

/**
 * Check if a text contains any Mermaid diagram code blocks
 * @param {string} text
 * @returns {boolean}
 */
export function hasMermaidContent(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const regex = new RegExp(MERMAID_BLOCK_REGEX.source, 'i');
  return regex.test(text);
}

/**
 * Get the first Mermaid diagram code block from a text
 * @param {string} text
 * @returns {string|null} First diagram code or null if none found
 */
export function getFirstMermaidCode(text) {
  const diagrams = extractMermaidCode(text);
  return diagrams.length > 0 ? diagrams[0] : null;
}

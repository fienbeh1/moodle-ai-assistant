// web-panel/js/editor.js
// TinyMCE editor setup and helpers

let editorInstance = null;

/**
 * Initialize TinyMCE on the given selector
 * Falls back gracefully if TinyMCE is not loaded (e.g., invalid API key)
 * @param {string} selector - CSS selector for the textarea
 * @returns {Promise<void>}
 */
export async function initEditor(selector) {
  if (!window.tinymce) {
    console.warn('TinyMCE not loaded — using plain textarea fallback');
    return;
  }

  try {
    const editors = await window.tinymce.init({
      selector,
      height: 120,
      menubar: false,
      statusbar: false,
      plugins: 'code lists link image table searchreplace',
      toolbar: 'bold italic | bullist numlist | link | code | searchreplace',
      toolbar_mode: 'sliding',
      content_css: false,
      skin: 'oxide-dark',
      content_style: `
        body {
          background-color: #0f3460;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 14px;
          padding: 8px;
          margin: 0;
        }
      `,
      // Allow sending with Ctrl+Enter
      setup(editor) {
        editor.addShortcut('ctrl+return', 'Send message', () => {
          document.getElementById('send-btn')?.click();
        });
      },
    });

    if (editors && editors.length > 0) {
      editorInstance = editors[0];
    }
  } catch (err) {
    console.error('TinyMCE init failed:', err.message);
    // Fall through to plain textarea
  }
}

/**
 * Get the current content from the editor (TinyMCE or plain textarea)
 * @returns {string} Plain text content
 */
export function getContent() {
  if (editorInstance) {
    // Get plain text (strip HTML tags for AI prompt)
    const rawContent = editorInstance.getContent({ format: 'text' });
    return rawContent.trim();
  }

  // Fallback: plain textarea
  const textarea = document.getElementById('chat-editor');
  return textarea ? textarea.value.trim() : '';
}

/**
 * Get HTML content from TinyMCE (for rich export)
 * @returns {string}
 */
export function getHtmlContent() {
  if (editorInstance) {
    return editorInstance.getContent({ format: 'html' });
  }
  const textarea = document.getElementById('chat-editor');
  return textarea ? textarea.value : '';
}

/**
 * Set content in the editor
 * @param {string} content
 */
export function setContent(content) {
  if (editorInstance) {
    editorInstance.setContent(content);
    return;
  }

  const textarea = document.getElementById('chat-editor');
  if (textarea) textarea.value = content;
}

/**
 * Focus the editor
 */
export function focusEditor() {
  if (editorInstance) {
    editorInstance.focus();
    return;
  }
  document.getElementById('chat-editor')?.focus();
}

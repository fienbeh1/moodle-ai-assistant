// web-panel/js/chat.js
// ChatManager — handles sending messages and displaying chat history

/**
 * Manages all chat functionality for the AI assistant web panel.
 * Responsibilities: sending user prompts to the API, rendering message bubbles,
 * maintaining the current session ID, loading session history in the sidebar,
 * and providing Markdown-to-HTML rendering for AI responses.
 */
export class ChatManager {
  /**
   * @param {string} apiBaseUrl
   * @param {string} apiKey
   */
  constructor(apiBaseUrl, apiKey) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
    this.currentSessionId = null;
    this.messagesContainer = document.getElementById('messages-container');
  }

  /**
   * Send a message to the AI and display the response
   * @param {string} prompt
   * @param {string} model
   * @returns {Promise<{sessionId, messageId, response, model, timestamp}|null>}
   */
  async sendMessage(prompt, model = 'mistral') {
    // Remove welcome message on first send
    const welcome = this.messagesContainer?.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    // Display user message
    this.displayMessage('user', prompt);

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          prompt,
          sessionId: this.currentSessionId,
          model,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.currentSessionId = data.sessionId;

      // Display AI response
      this.displayMessage('assistant', data.response, data.messageId);

      return data;

    } catch (err) {
      this.displayError(`Error al procesar tu solicitud: ${err.message}`);
      return null;
    }
  }

  /**
   * Display a message bubble in the chat
   * @param {'user'|'assistant'} role
   * @param {string} content
   * @param {number|null} messageId - For assistant messages (rating/correction)
   */
  displayMessage(role, content, messageId = null) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    if (messageId) messageEl.dataset.messageId = messageId;

    const roleLabel = role === 'user' ? '👤 Tú' : '🤖 Asistente IA';
    const bubbleContent = this.renderMarkdown(content);

    messageEl.innerHTML = `
      <div class="message-role">${roleLabel}</div>
      <div class="message-bubble">${bubbleContent}</div>
      ${role === 'assistant' && messageId ? this.renderRatingButtons(messageId) : ''}
    `;

    // Render inline mermaid diagrams
    const mermaidBlocks = messageEl.querySelectorAll('.mermaid-inline');
    mermaidBlocks.forEach(block => {
      if (window.mermaid) {
        window.mermaid.render(`mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`, block.textContent)
          .then(({ svg }) => {
            block.innerHTML = svg;
            block.classList.add('mermaid-rendered');
          })
          .catch(() => {
            // Keep as code block on render failure
          });
      }
    });

    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

    // Set up rating button handlers
    if (role === 'assistant' && messageId) {
      const trainingMgr = window.appManagers?.training;
      if (trainingMgr) {
        messageEl.querySelector('.btn-rate.positive')?.addEventListener('click', () => {
          trainingMgr.rateMessage(messageId, 1, messageEl);
        });
        messageEl.querySelector('.btn-rate.negative')?.addEventListener('click', () => {
          trainingMgr.rateMessage(messageId, -1, messageEl);
        });
        messageEl.querySelector('.btn-correct')?.addEventListener('click', () => {
          trainingMgr.showCorrectionEditor(messageId, content, messageEl);
        });
      }
    }
  }

  /**
   * Display an error message in the chat
   * @param {string} errorText
   */
  displayError(errorText) {
    const errorEl = document.createElement('div');
    errorEl.className = 'message assistant';
    errorEl.innerHTML = `
      <div class="message-role">⚠️ Error</div>
      <div class="message-bubble" style="border-color: var(--danger); background-color: rgba(248,81,73,0.1);">
        ${errorText}
      </div>
    `;
    this.messagesContainer.appendChild(errorEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Convert basic markdown to HTML for display in chat bubbles
   * @param {string} text
   * @returns {string} HTML string
   */
  renderMarkdown(text) {
    if (!text) return '';

    let html = text
      // Escape HTML entities
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Mermaid code blocks — wrap in div for rendering
      .replace(/```mermaid\s*\n([\s\S]*?)```/gi, (_, code) =>
        `<div class="mermaid-in-message"><div class="mermaid-inline">${code.trim()}</div></div>`
      )
      // Other code blocks
      .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
        `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
      )
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Unordered list items
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      // Numbered list items
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Wrap consecutive <li> in <ul>
      .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Line breaks (double newline = paragraph break)
      .replace(/\n\n/g, '</p><p>')
      // Single newlines
      .replace(/\n/g, '<br>');

    return `<p>${html}</p>`;
  }

  /**
   * Generate HTML for rating buttons
   * @param {number} messageId
   * @returns {string}
   */
  renderRatingButtons(messageId) {
    return `
      <div class="message-actions">
        <button class="btn-rate positive" data-id="${messageId}" title="Buena respuesta">👍</button>
        <button class="btn-rate negative" data-id="${messageId}" title="Mala respuesta">👎</button>
        <button class="btn-correct" data-id="${messageId}" title="Corregir respuesta">✏️ Corregir</button>
      </div>
    `;
  }

  /**
   * Load session history from API and populate sidebar
   */
  async loadSessionList() {
    // This is a simplified implementation — the server would need a GET /api/sessions endpoint
    // For now, we keep track locally in the session list
    const sessionList = document.getElementById('session-list');
    if (!sessionList) return;

    if (this.currentSessionId) {
      // Check if session is already in list
      const existing = sessionList.querySelector(`[data-session-id="${this.currentSessionId}"]`);
      if (!existing) {
        const item = document.createElement('div');
        item.className = 'session-item active';
        item.dataset.sessionId = this.currentSessionId;
        item.textContent = `Sesión #${this.currentSessionId}`;
        item.addEventListener('click', () => this.loadSession(this.currentSessionId));

        // Remove 'empty' message
        const emptyEl = sessionList.querySelector('.session-empty');
        if (emptyEl) emptyEl.remove();

        // Deactivate others
        sessionList.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));
        sessionList.prepend(item);
      }
    }
  }

  /**
   * Load messages from an existing session
   * @param {number} sessionId
   */
  async loadSession(sessionId) {
    // Mark session as active in sidebar
    document.querySelectorAll('.session-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.sessionId) === sessionId);
    });

    // Clear current messages
    this.messagesContainer.innerHTML = '';
    this.currentSessionId = sessionId;

    // Update session display
    const displayEl = document.getElementById('session-id-display');
    if (displayEl) displayEl.textContent = `Sesión #${sessionId}`;
  }

  /**
   * Reset and start a new conversation session
   */
  createNewSession() {
    this.currentSessionId = null;
    this.messagesContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">🎓</div>
        <h2>Nueva sesión iniciada</h2>
        <p>Escribe tu siguiente pregunta o tema de tarea.</p>
      </div>
    `;

    // Deactivate all sessions in sidebar
    document.querySelectorAll('.session-item').forEach(el => el.classList.remove('active'));

    // Disable export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.disabled = true;
  }
}

// web-panel/js/training.js
// TrainingManager — human-in-the-loop rating and correction

/**
 * Handles human-in-the-loop training features for the AI assistant.
 * Responsibilities: rating AI responses (thumbs up/down), submitting corrected
 * responses for training, displaying inline correction editors, exporting
 * training data as JSONL, and loading/displaying training statistics.
 */
export class TrainingManager {
  /**
   * @param {string} apiBaseUrl
   * @param {string} apiKey
   */
  constructor(apiBaseUrl, apiKey) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Send a rating for an AI message
   * @param {number} messageId
   * @param {1|-1} rating - 1 for positive, -1 for negative
   * @param {HTMLElement} messageEl - The message container element
   */
  async rateMessage(messageId, rating, messageEl) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/training/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({ messageId, rating }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Visual feedback: highlight the clicked button
      if (messageEl) {
        const positiveBtn = messageEl.querySelector('.btn-rate.positive');
        const negativeBtn = messageEl.querySelector('.btn-rate.negative');

        if (positiveBtn) positiveBtn.classList.toggle('rated-positive', rating === 1);
        if (negativeBtn) negativeBtn.classList.toggle('rated-negative', rating === -1);
      }

      // Refresh stats
      await this.loadStats();

    } catch (err) {
      console.error('Rating failed:', err.message);
    }
  }

  /**
   * Show an inline correction editor for an AI message
   * @param {number} messageId
   * @param {string} originalContent
   * @param {HTMLElement} messageEl
   */
  showCorrectionEditor(messageId, originalContent, messageEl) {
    // Don't add multiple editors
    if (messageEl.querySelector('.correction-editor')) return;

    const editorDiv = document.createElement('div');
    editorDiv.className = 'correction-editor';
    editorDiv.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      background: rgba(26, 115, 232, 0.1);
      border: 1px solid rgba(26, 115, 232, 0.3);
      border-radius: 6px;
    `;

    editorDiv.innerHTML = `
      <div style="font-size: 11px; color: #8892b0; margin-bottom: 6px; font-weight: 700;">
        ✏️ CORREGIR RESPUESTA (para entrenamiento)
      </div>
      <textarea style="
        width: 100%;
        min-height: 120px;
        background: #0f3460;
        color: #e2e8f0;
        border: 1px solid #2a3550;
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        font-family: inherit;
        resize: vertical;
      ">${originalContent}</textarea>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <button class="save-correction" style="
          background: #1a73e8;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        ">✅ Guardar corrección</button>
        <button class="cancel-correction" style="
          background: transparent;
          color: #8892b0;
          border: 1px solid #2a3550;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">✕ Cancelar</button>
      </div>
    `;

    messageEl.appendChild(editorDiv);

    const textarea = editorDiv.querySelector('textarea');
    const saveBtn = editorDiv.querySelector('.save-correction');
    const cancelBtn = editorDiv.querySelector('.cancel-correction');

    saveBtn.addEventListener('click', async () => {
      const correctedContent = textarea.value.trim();
      if (correctedContent.length === 0) return;

      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Guardando...';

      await this.correctMessage(messageId, correctedContent, messageEl);
      editorDiv.remove();
    });

    cancelBtn.addEventListener('click', () => {
      editorDiv.remove();
    });

    textarea.focus();
  }

  /**
   * Save a corrected response for training
   * @param {number} messageId
   * @param {string} correctedContent
   * @param {HTMLElement} messageEl
   */
  async correctMessage(messageId, correctedContent, messageEl) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/training/correct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({ messageId, correctedContent }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Visual confirmation
      const correctBtn = messageEl?.querySelector('.btn-correct');
      if (correctBtn) {
        correctBtn.textContent = '✅ Corregido';
        correctBtn.style.color = 'var(--success)';
        correctBtn.style.borderColor = 'var(--success)';
      }

      await this.loadStats();

    } catch (err) {
      console.error('Correction failed:', err.message);
    }
  }

  /**
   * Trigger download of training data as JSONL
   */
  async exportTrainingData() {
    const btn = document.getElementById('export-jsonl-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Exportando...';
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/training/export-jsonl`, {
        headers: { 'X-API-KEY': this.apiKey },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Trigger file download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `training-data-${new Date().toISOString().split('T')[0]}.jsonl`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      alert(`Error al exportar datos de entrenamiento: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⬇️ Exportar datos de entrenamiento (JSONL)';
      }
    }
  }

  /**
   * Load and display training statistics
   */
  async loadStats() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/training/stats`, {
        headers: { 'X-API-KEY': this.apiKey },
      });

      if (!response.ok) return;

      const stats = await response.json();

      // Update sidebar summary
      const posEl = document.getElementById('stat-positive');
      const negEl = document.getElementById('stat-negative');
      const corrEl = document.getElementById('stat-corrections');

      if (posEl) posEl.textContent = stats.positiveRatings;
      if (negEl) negEl.textContent = stats.negativeRatings;
      if (corrEl) corrEl.textContent = stats.corrections;

      // Update training tab stats detail
      const detailEl = document.getElementById('training-stats-detail');
      if (detailEl) {
        detailEl.innerHTML = `
          <div class="stat-row">
            <span>Total respuestas</span>
            <span>${stats.totalResponses}</span>
          </div>
          <div class="stat-row">
            <span>👍 Positivas</span>
            <span style="color: var(--success);">${stats.positiveRatings}</span>
          </div>
          <div class="stat-row">
            <span>👎 Negativas</span>
            <span style="color: var(--danger);">${stats.negativeRatings}</span>
          </div>
          <div class="stat-row">
            <span>✏️ Correcciones</span>
            <span style="color: #64b5f6;">${stats.corrections}</span>
          </div>
          <div class="stat-row" style="margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 6px;">
            <span><strong>Pares de entrenamiento</strong></span>
            <span style="color: var(--accent-green);"><strong>${stats.trainingPairs}</strong></span>
          </div>
        `;
      }

      // Update Chart.js doughnut chart
      const statsManager = window.appManagers?.stats;
      if (statsManager) {
        statsManager.renderRatingChart(stats);
      }

    } catch {
      // Stats endpoint not available (server offline)
      const detailEl = document.getElementById('training-stats-detail');
      if (detailEl) {
        detailEl.innerHTML = '<div class="loading-text">No se pudieron cargar las estadísticas</div>';
      }
    }
  }
}

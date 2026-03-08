// web-panel/js/export.js
// ExportManager — handles Google Sheets export

/**
 * Manages Google Sheets export operations for completed homework sessions.
 * Responsibilities: collecting student metadata from the export form, posting
 * the session to POST /api/export/sheets, and displaying the success link or
 * error message to the user.
 */
export class ExportManager {
  /**
   * @param {string} apiBaseUrl
   * @param {string} apiKey
   */
  constructor(apiBaseUrl, apiKey) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Export a session to Google Sheets
   * @param {number} sessionId
   * @param {object} formData
   * @param {string} formData.studentName
   * @param {string} formData.matricula
   * @param {string} formData.subject
   * @param {string} formData.teacherName
   */
  async exportToSheets(sessionId, formData) {
    if (!sessionId) {
      this.showError('No hay sesión activa para exportar.');
      return;
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ Exportando...';
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/export/sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          sessionId,
          studentName: formData.studentName || '',
          matricula: formData.matricula || '',
          subject: formData.subject || '',
          teacherName: formData.teacherName || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      this.handleExportResult(result);

    } catch (err) {
      this.showError(`Error al exportar: ${err.message}`);
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.textContent = '📊 Exportar a Google Sheets';
      }
    }
  }

  /**
   * Show export success result with link to Sheet
   * @param {{ success: boolean, sheetUrl: string, sections: object }} result
   */
  handleExportResult(result) {
    const resultEl = document.getElementById('export-result');
    const linkEl = document.getElementById('sheet-link');

    if (!result.success) {
      this.showError('La exportación falló. Revisa el servidor.');
      return;
    }

    if (linkEl) {
      linkEl.href = result.sheetUrl;
    }

    if (resultEl) {
      resultEl.classList.remove('hidden');
    }

    // Show sections info
    const sectionsInfo = result.sections;
    if (sectionsInfo) {
      const missing = Object.entries(sectionsInfo)
        .filter(([, found]) => !found)
        .map(([key]) => key);

      if (missing.length > 0) {
        console.warn('Missing sections in export:', missing);
      }
    }
  }

  /**
   * Show an export error message
   * @param {string} message
   */
  showError(message) {
    const resultEl = document.getElementById('export-result');
    if (resultEl) {
      resultEl.classList.remove('hidden');
      resultEl.innerHTML = `
        <div style="color: var(--danger); font-size: 12px;">
          ❌ ${message}
        </div>
      `;
    }
  }
}

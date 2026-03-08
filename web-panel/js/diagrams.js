// web-panel/js/diagrams.js
// DiagramManager — Mermaid diagram rendering and export

/**
 * Handles Mermaid diagram detection, rendering, and PNG export for the web panel.
 * Responsibilities: detecting ```mermaid code blocks in AI responses, rendering
 * them in the right-panel diagram container via Mermaid.js, and exporting
 * rendered diagrams as downloadable PNG files.
 */
export class DiagramManager {
  constructor() {
    this.currentDiagramCode = null;
    this.diagramContainer = document.getElementById('diagram-container');
    this.diagramActions = document.getElementById('diagram-actions');
    this.mermaidCodeDisplay = document.getElementById('mermaid-code-display');
    this.mermaidSource = document.getElementById('mermaid-source');
  }

  /**
   * Detect Mermaid blocks in AI response and render the first one
   * @param {string} text - Full AI response text
   */
  detectAndRender(text) {
    const code = this.extractFromResponse(text);
    if (code) {
      this.renderDiagram(code);

      // Switch to diagram tab automatically
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector('.tab-btn[data-tab="diagrams"]')?.classList.add('active');
      document.getElementById('tab-diagrams')?.classList.add('active');
    }
  }

  /**
   * Extract the first Mermaid code block from a text
   * @param {string} text
   * @returns {string|null}
   */
  extractFromResponse(text) {
    if (!text) return null;
    const match = text.match(/```mermaid\s*\n([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Render a Mermaid diagram in the diagram panel
   * @param {string} mermaidCode
   */
  async renderDiagram(mermaidCode) {
    if (!window.mermaid) {
      if (this.diagramContainer) {
        this.diagramContainer.innerHTML = `
          <div class="diagram-placeholder">
            <span>⚠️</span>
            <p>Mermaid.js no está disponible</p>
          </div>
        `;
      }
      return;
    }

    this.currentDiagramCode = mermaidCode;

    if (this.diagramContainer) {
      this.diagramContainer.innerHTML = '<div class="loading-text">Renderizando diagrama...</div>';
    }

    try {
      const diagramId = `mermaid-panel-${Date.now()}`;
      const { svg } = await window.mermaid.render(diagramId, mermaidCode);

      if (this.diagramContainer) {
        this.diagramContainer.innerHTML = `
          <div style="background:white;border-radius:6px;padding:12px;max-width:100%;overflow:auto;">
            ${svg}
          </div>
        `;
      }

      // Show action buttons
      if (this.diagramActions) {
        this.diagramActions.classList.remove('hidden');
      }

      // Show code
      if (this.mermaidCodeDisplay && this.mermaidSource) {
        this.mermaidSource.textContent = mermaidCode;
        this.mermaidCodeDisplay.classList.remove('hidden');
      }

    } catch (err) {
      if (this.diagramContainer) {
        this.diagramContainer.innerHTML = `
          <div class="diagram-placeholder">
            <span>❌</span>
            <p>Error al renderizar el diagrama:</p>
            <p style="font-size:11px;color:#f85149;">${err.message}</p>
            <pre style="font-size:10px;margin-top:8px;text-align:left;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;">${mermaidCode}</pre>
          </div>
        `;
      }
    }
  }

  /**
   * Export the current diagram as a PNG file
   */
  exportAsPNG() {
    const svgEl = this.diagramContainer?.querySelector('svg');
    if (!svgEl) {
      alert('No hay diagrama para exportar.');
      return;
    }

    try {
      // Convert SVG to canvas, then to PNG
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      const bbox = svgEl.getBoundingClientRect();
      canvas.width = bbox.width || 800;
      canvas.height = bbox.height || 600;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(blob => {
          if (!blob) return;
          const link = document.createElement('a');
          link.download = `diagrama-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
        }, 'image/png');
      };

      img.src = url;

    } catch (err) {
      alert(`Error al exportar PNG: ${err.message}`);
    }
  }
}

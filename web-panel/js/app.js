// web-panel/js/app.js
// Main application initialization

import { ChatManager } from './chat.js';
import { initEditor, getContent, setContent } from './editor.js';
import { DiagramManager } from './diagrams.js';
import { ExportManager } from './export.js';
import { TrainingManager } from './training.js';
import { StatsManager } from './stats.js';

// ── Configuration ─────────────────────────────────────────────────────────
// These values should match your home server setup
// In production, set API_BASE_URL to your Cloudflare Tunnel URL
const API_BASE_URL = window.location.origin;
const API_KEY = 'YOUR-API-KEY-HERE'; // Must match API_KEY in home-server/.env

// ── Initialize Mermaid ────────────────────────────────────────────────────
if (window.mermaid) {
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1a73e8',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#2a3550',
      lineColor: '#8892b0',
      sectionBkgColor: '#1a1a2e',
      altSectionBkgColor: '#16213e',
      gridColor: '#2a3550',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    securityLevel: 'loose',
  });
}

// ── Module instances ──────────────────────────────────────────────────────
let chat, diagrams, exportMgr, training, stats;

// ── DOM Content Loaded ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize TinyMCE editor (textarea → rich editor)
  await initEditor('#chat-editor');

  // Initialize all managers
  chat = new ChatManager(API_BASE_URL, API_KEY);
  diagrams = new DiagramManager();
  exportMgr = new ExportManager(API_BASE_URL, API_KEY);
  training = new TrainingManager(API_BASE_URL, API_KEY);
  stats = new StatsManager(API_BASE_URL, API_KEY);

  // Share manager instances globally so they can call each other
  window.appManagers = { chat, diagrams, exportMgr, training, stats };

  // Set up tab switching
  setupTabs();

  // Check server status
  checkServerStatus();

  // Load session history
  await chat.loadSessionList();

  // Load training stats
  await training.loadStats();

  // Handle hash-based tab navigation from launcher buttons
  const hash = window.location.hash.replace('#', '');
  if (hash && ['diagrams', 'export', 'training'].includes(hash)) {
    switchTab(hash);
  }

  // ── Event Listeners ─────────────────────────────────────────────────────

  // Send button
  document.getElementById('send-btn').addEventListener('click', handleSend);

  // Keyboard shortcut: Ctrl+Enter to send
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSend();
    }
  });

  // New session button
  document.getElementById('new-session-btn').addEventListener('click', () => {
    chat.createNewSession();
    updateSessionDisplay(null);
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', () => {
    const sessionId = chat.currentSessionId;
    if (!sessionId) {
      alert('No hay sesión activa. Primero escribe un mensaje.');
      return;
    }

    exportMgr.exportToSheets(sessionId, {
      studentName: document.getElementById('student-name').value,
      matricula: document.getElementById('matricula').value,
      subject: document.getElementById('subject').value,
      teacherName: document.getElementById('teacher-name').value,
    });
  });

  // Export PNG button
  document.getElementById('export-png-btn')?.addEventListener('click', () => {
    diagrams.exportAsPNG();
  });

  // Copy Mermaid code button
  document.getElementById('copy-mermaid-btn')?.addEventListener('click', () => {
    const code = document.getElementById('mermaid-source')?.textContent;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copy-mermaid-btn');
        btn.textContent = '✅ Copiado!';
        setTimeout(() => { btn.textContent = '📋 Copiar código'; }, 2000);
      });
    }
  });

  // Export JSONL button
  document.getElementById('export-jsonl-btn')?.addEventListener('click', () => {
    training.exportTrainingData();
  });
});

// ── Handle send ───────────────────────────────────────────────────────────
async function handleSend() {
  const content = getContent();
  if (!content || content.trim().length === 0) return;

  const model = document.querySelector('input[name="model"]:checked')?.value || 'mistral';

  setContent('');
  setSendingState(true);

  try {
    const result = await chat.sendMessage(content, model);

    if (result) {
      updateSessionDisplay(result.sessionId);
      // Enable export button
      document.getElementById('export-btn').disabled = false;
      // Render diagram if present
      if (result.response) {
        diagrams.detectAndRender(result.response);
      }
      // Refresh stats
      await training.loadStats();
      await chat.loadSessionList();
    }
  } finally {
    setSendingState(false);
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────
function setSendingState(sending) {
  const btn = document.getElementById('send-btn');
  const textEl = btn.querySelector('.btn-text');
  const loadingEl = btn.querySelector('.btn-loading');

  btn.disabled = sending;
  if (textEl) textEl.classList.toggle('hidden', sending);
  if (loadingEl) loadingEl.classList.toggle('hidden', !sending);

  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) typingIndicator.classList.toggle('hidden', !sending);
}

function updateSessionDisplay(sessionId) {
  const display = document.getElementById('session-id-display');
  if (display) {
    display.textContent = sessionId ? `Sesión #${sessionId}` : 'Nueva sesión';
  }
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const content = document.getElementById(`tab-${tabName}`);

  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
}

async function checkServerStatus() {
  const statusEl = document.getElementById('connection-status');
  const dotEl = statusEl?.querySelector('.status-dot');
  const textEl = statusEl?.querySelector('.status-text');

  try {
    const response = await fetch(`${API_BASE_URL}/api/status`);
    const data = await response.json();

    if (statusEl) {
      statusEl.className = `status-indicator status-${data.status === 'ok' ? 'online' : 'degraded'}`;
    }
    if (textEl) {
      textEl.textContent = data.status === 'ok' ? '● En línea' : '⚠ Degradado';
    }
  } catch {
    if (statusEl) statusEl.className = 'status-indicator status-offline';
    if (textEl) textEl.textContent = '● Sin conexión';
  }
}

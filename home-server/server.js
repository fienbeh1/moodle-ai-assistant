// home-server/server.js
// Main Express server for the Moodle AI Homework Assistant

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

// Route imports
import chatRoutes from './routes/chat.js';
import exportRoutes from './routes/export.js';
import trainingRoutes from './routes/training.js';
import statusRoutes from './routes/status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── PostgreSQL connection pool ──────────────────────────────────────────────
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'moodle_ai',
  user: process.env.DB_USER || 'ai_user',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

// ── Express app setup ───────────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// CORS — allow all origins for development
// In production, restrict to your Cloudflare Tunnel hostname:
// origin: ['https://ai.yourdomain.com']
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-KEY'],
}));

// Rate limiting — protects DB and AI endpoints from abuse
// Status endpoint: generous limit (used as <img src> badge)
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 120,               // 2 req/sec average for badge polling
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Chat/export/training endpoints: stricter limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 30,                // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Body parsing — 10mb limit to handle long academic responses
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve the web panel as static files
const webPanelPath = join(__dirname, '..', 'web-panel');
app.use('/panel', express.static(webPanelPath));

// ── API key authentication middleware ──────────────────────────────────────
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid X-API-KEY header',
    });
  }
  next();
}

// ── Public routes (no auth required) ──────────────────────────────────────
app.use('/api/status', statusLimiter, statusRoutes(pool));

// Health check endpoint
app.get('/health', statusLimiter, (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Serve web panel index for /panel route
app.get('/panel', statusLimiter, (_req, res) => {
  res.sendFile(join(webPanelPath, 'index.html'));
});

// ── Protected routes (API key required) ───────────────────────────────────
app.use('/api/chat', apiLimiter, requireApiKey, chatRoutes(pool));
app.use('/api/export', apiLimiter, requireApiKey, exportRoutes(pool));
app.use('/api/training', apiLimiter, requireApiKey, trainingRoutes(pool));

// Root redirect to panel
app.get('/', (_req, res) => {
  res.redirect('/panel');
});

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ── Error handling middleware ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🤖 Moodle AI Homework Assistant — Home Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`📊 Web panel at:      http://localhost:${PORT}/panel`);
  console.log(`🔌 Health check:      http://localhost:${PORT}/health`);
  console.log(`🧠 AI endpoint:       http://localhost:${PORT}/api/chat`);
  console.log(`📋 Export endpoint:   http://localhost:${PORT}/api/export/sheets`);
  console.log('═══════════════════════════════════════════════');
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'moodle_ai'}@${process.env.DB_HOST || 'localhost'}`);
  console.log(`🤖 Ollama:   ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  console.log('');
});

export { pool };

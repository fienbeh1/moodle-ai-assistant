// home-server/routes/status.js
// Health check and status endpoints (no auth required)

import { Router } from 'express';
import fetch from 'node-fetch';

/**
 * Status router factory (no authentication required).
 * Provides public health check endpoints used by the Moodle launcher:
 * - GET /badge: returns a 12×12 SVG green/red circle for use as an <img src>
 *   status indicator in the Moodle HTML launcher
 * - GET /: returns full JSON health status including DB and Ollama availability
 * @param {import('pg').Pool} pool
 * @returns {import('express').Router}
 */
export default function statusRouter(pool) {
  const router = Router();

  // GET /api/status/badge — returns a small SVG status indicator
  // Used as an <img src> in the Moodle launcher to show server is online
  router.get('/badge', async (_req, res) => {
    let isOnline = false;

    try {
      await pool.query('SELECT 1');
      isOnline = true;
    } catch {
      isOnline = false;
    }

    const color = isOnline ? '#00cc44' : '#ff4444';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
  <circle cx="6" cy="6" r="5" fill="${color}"/>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(svg);
  });

  // GET /api/status — full health status JSON
  router.get('/', async (_req, res) => {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        db: { status: 'unknown' },
        ollama: { status: 'unknown' },
      },
    };

    // Check PostgreSQL
    try {
      const dbResult = await pool.query('SELECT NOW() as server_time');
      status.services.db = {
        status: 'connected',
        serverTime: dbResult.rows[0].server_time,
      };
    } catch (err) {
      status.services.db = { status: 'error', message: err.message };
      status.status = 'degraded';
    }

    // Check Ollama
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const ollamaRes = await fetch(`${ollamaUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        const modelNames = (ollamaData.models || []).map(m => m.name);
        status.services.ollama = {
          status: 'running',
          models: modelNames,
          url: ollamaUrl,
        };
      } else {
        status.services.ollama = { status: 'error', message: `HTTP ${ollamaRes.status}` };
        status.status = 'degraded';
      }
    } catch (err) {
      status.services.ollama = {
        status: 'offline',
        message: err.name === 'AbortError' ? 'timeout' : err.message,
        url: ollamaUrl,
      };
      status.status = 'degraded';
    }

    const httpStatus = status.status === 'ok' ? 200 : 207;
    res.status(httpStatus).json(status);
  });

  return router;
}

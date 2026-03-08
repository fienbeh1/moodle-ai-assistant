// home-server/routes/export.js
// POST /api/export/sheets — Export session to Google Sheets template

import { Router } from 'express';
import { authenticate, updateTemplate, parseAcademicSections } from '../services/sheets-exporter.js';

/**
 * Export router factory.
 * Handles exporting completed homework sessions to a Google Sheets template.
 * Parses AI responses into structured academic sections (Introducción, Desarrollo,
 * Conclusión, Referencias) and writes them to the configured spreadsheet.
 * @param {import('pg').Pool} pool
 * @returns {import('express').Router}
 */
export default function exportRouter(pool) {
  const router = Router();

  // POST /api/export/sheets
  router.post('/sheets', async (req, res) => {
    const { sessionId, studentName, matricula, subject, teacherName } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!studentName) {
      return res.status(400).json({ error: 'studentName is required' });
    }

    // Verify required environment variables
    const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    const spreadsheetId = process.env.GOOGLE_SHEET_TEMPLATE_ID;

    if (!keyFilePath || !spreadsheetId) {
      return res.status(500).json({
        error: 'Google Sheets not configured',
        message: 'GOOGLE_SERVICE_ACCOUNT_PATH and GOOGLE_SHEET_TEMPLATE_ID must be set in .env',
      });
    }

    try {
      // Load all messages for this session
      const messagesResult = await pool.query(
        `SELECT role, content, created_at
         FROM messages
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [sessionId]
      );

      if (messagesResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found or has no messages' });
      }

      // Extract the last assistant message (most complete response)
      const assistantMessages = messagesResult.rows.filter(m => m.role === 'assistant');
      const lastAiResponse = assistantMessages.length > 0
        ? assistantMessages[assistantMessages.length - 1].content
        : '';

      // Parse into academic sections
      const sections = parseAcademicSections(lastAiResponse);

      // Build export data
      const today = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const exportData = {
        studentName: studentName || '',
        matricula: matricula || '',
        date: today,
        subject: subject || '',
        teacherName: teacherName || '',
        introduction: sections.introduction,
        development: sections.development,
        conclusion: sections.conclusion,
        references: sections.references,
      };

      // Authenticate and update Google Sheet
      const auth = authenticate(keyFilePath);
      const sheetUrl = await updateTemplate(auth, spreadsheetId, exportData);

      // Log the export to database
      await pool.query(
        `INSERT INTO exports (session_id, sheet_url, export_type, created_at)
         VALUES ($1, $2, 'google_sheets', NOW())`,
        [sessionId, sheetUrl]
      );

      res.json({
        success: true,
        sheetUrl,
        sections: {
          hasIntroduction: sections.introduction.length > 0,
          hasDevelopment: sections.development.length > 0,
          hasConclusion: sections.conclusion.length > 0,
          hasReferences: sections.references.length > 0,
        },
        exportedAt: new Date().toISOString(),
      });

    } catch (err) {
      console.error('❌ Export error:', err.message);
      res.status(500).json({ error: 'Export failed', detail: err.message });
    }
  });

  return router;
}

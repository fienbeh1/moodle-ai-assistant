// home-server/routes/training.js
// Human-in-the-loop training endpoints

import { Router } from 'express';

/**
 * Training router factory.
 * Provides human-in-the-loop training endpoints:
 * - POST /rate: rate an AI message as positive (+1) or negative (-1)
 * - POST /correct: save a corrected version of an AI message for training
 * - GET /export-jsonl: download all rated/corrected pairs as a JSONL file
 * - GET /stats: retrieve training statistics (totals, ratings, corrections)
 * @param {import('pg').Pool} pool
 * @returns {import('express').Router}
 */
export default function trainingRouter(pool) {
  const router = Router();

  // POST /api/training/rate — rate an AI message (+1 good, -1 bad)
  router.post('/rate', async (req, res) => {
    const { messageId, rating } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required' });
    }
    if (rating !== 1 && rating !== -1) {
      return res.status(400).json({ error: 'rating must be 1 (positive) or -1 (negative)' });
    }

    try {
      const result = await pool.query(
        `UPDATE messages
         SET rating = $1, rated_at = NOW()
         WHERE id = $2 AND role = 'assistant'
         RETURNING id, rating`,
        [rating, messageId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Message not found or not an assistant message' });
      }

      res.json({
        success: true,
        messageId: result.rows[0].id,
        rating: result.rows[0].rating,
        message: rating === 1 ? '👍 Positive rating saved' : '👎 Negative rating saved',
      });
    } catch (err) {
      console.error('❌ Rate error:', err.message);
      res.status(500).json({ error: 'Failed to save rating', detail: err.message });
    }
  });

  // POST /api/training/correct — save a corrected version of an AI message
  router.post('/correct', async (req, res) => {
    const { messageId, correctedContent } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'messageId is required' });
    }
    if (!correctedContent || typeof correctedContent !== 'string' || correctedContent.trim().length === 0) {
      return res.status(400).json({ error: 'correctedContent is required and must be non-empty' });
    }

    try {
      const result = await pool.query(
        `UPDATE messages
         SET corrected_content = $1, corrected_at = NOW()
         WHERE id = $2 AND role = 'assistant'
         RETURNING id`,
        [correctedContent.trim(), messageId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Message not found or not an assistant message' });
      }

      res.json({
        success: true,
        messageId: result.rows[0].id,
        message: '✅ Correction saved for training',
      });
    } catch (err) {
      console.error('❌ Correct error:', err.message);
      res.status(500).json({ error: 'Failed to save correction', detail: err.message });
    }
  });

  // GET /api/training/export-jsonl — download training data as JSONL file
  router.get('/export-jsonl', async (req, res) => {
    try {
      // Join user messages with their corresponding AI responses that have corrections or ratings
      const result = await pool.query(
        `SELECT
           u.content AS instruction,
           COALESCE(a.corrected_content, a.content) AS output,
           a.rating,
           (a.corrected_content IS NOT NULL) AS was_corrected,
           a.model_used,
           a.created_at
         FROM messages u
         JOIN messages a ON (
           a.session_id = u.session_id
           AND a.role = 'assistant'
           AND a.created_at > u.created_at
         )
         WHERE u.role = 'user'
           AND (a.rating IS NOT NULL OR a.corrected_content IS NOT NULL)
         ORDER BY a.created_at DESC`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'No training data found',
          message: 'Rate or correct some AI responses first',
        });
      }

      // Format as JSONL
      const jsonlLines = result.rows.map(row =>
        JSON.stringify({
          instruction: row.instruction,
          input: '',
          output: row.output,
          rating: row.rating,
          was_corrected: row.was_corrected,
          model_used: row.model_used,
        })
      ).join('\n');

      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Content-Disposition', `attachment; filename="training-data-${Date.now()}.jsonl"`);
      res.send(jsonlLines);

    } catch (err) {
      console.error('❌ Export JSONL error:', err.message);
      res.status(500).json({ error: 'Failed to export training data', detail: err.message });
    }
  });

  // GET /api/training/stats — training data statistics
  router.get('/stats', async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE role = 'assistant') AS total_responses,
           COUNT(*) FILTER (WHERE role = 'assistant' AND rating = 1) AS positive_ratings,
           COUNT(*) FILTER (WHERE role = 'assistant' AND rating = -1) AS negative_ratings,
           COUNT(*) FILTER (WHERE role = 'assistant' AND corrected_content IS NOT NULL) AS corrections,
           COUNT(*) FILTER (WHERE role = 'user') AS total_prompts
         FROM messages`
      );

      const stats = result.rows[0];

      res.json({
        totalResponses: parseInt(stats.total_responses, 10),
        positiveRatings: parseInt(stats.positive_ratings, 10),
        negativeRatings: parseInt(stats.negative_ratings, 10),
        corrections: parseInt(stats.corrections, 10),
        totalPrompts: parseInt(stats.total_prompts, 10),
        trainingPairs: parseInt(stats.positive_ratings, 10) + parseInt(stats.corrections, 10),
      });
    } catch (err) {
      console.error('❌ Stats error:', err.message);
      res.status(500).json({ error: 'Failed to get training stats', detail: err.message });
    }
  });

  return router;
}

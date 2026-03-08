-- home-server/db/migrations/001_initial.sql
-- Initial migration: Create all tables for the Moodle AI Homework Assistant
-- Idempotent (safe to run multiple times)
-- Run with: psql -U ai_user -d moodle_ai -f db/migrations/001_initial.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 001_initial
-- Description: Create sessions, messages, exports tables and training_pairs view
-- Date: 2026
-- ─────────────────────────────────────────────────────────────────────────────

-- sessions: one per homework assignment / conversation topic
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL       PRIMARY KEY,
  model       VARCHAR(50)  NOT NULL DEFAULT 'mistral',  -- AI model used (mistral, gemini-flash, etc.)
  title       VARCHAR(255),                              -- Auto-set to first 100 chars of first prompt
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sessions IS 'AI conversation sessions — one per homework topic';
COMMENT ON COLUMN sessions.model IS 'Primary AI model used in this session';
COMMENT ON COLUMN sessions.title IS 'Auto-generated from first user prompt';

-- messages: every individual message exchange
CREATE TABLE IF NOT EXISTS messages (
  id                SERIAL       PRIMARY KEY,
  session_id        INTEGER      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role              VARCHAR(20)  NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT         NOT NULL,          -- Original message content
  rating            SMALLINT     CHECK (rating IN (-1, 1)),  -- Human rating: 1=good, -1=bad
  rated_at          TIMESTAMP,                       -- When rating was applied
  corrected_content TEXT,                            -- Human-corrected version (for training)
  corrected_at      TIMESTAMP,                       -- When correction was applied
  tokens_used       INTEGER,                         -- Token count (optional, from API response)
  model_used        VARCHAR(50),                     -- Which model generated this response
  created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messages IS 'Individual messages within a session';
COMMENT ON COLUMN messages.role IS 'user: student prompt | assistant: AI response | system: system prompt';
COMMENT ON COLUMN messages.rating IS '1 = thumbs up (good response) | -1 = thumbs down (bad response)';
COMMENT ON COLUMN messages.corrected_content IS 'Human-provided correct response, used for LoRA fine-tuning';

-- exports: log of homework exports to Google Sheets
CREATE TABLE IF NOT EXISTS exports (
  id           SERIAL      PRIMARY KEY,
  session_id   INTEGER     NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sheet_url    TEXT,                                  -- URL of exported Google Sheet
  export_type  VARCHAR(20) NOT NULL DEFAULT 'google_sheets',
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE exports IS 'Log of homework exports to Google Sheets';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_session    ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created    ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_updated    ON sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_corrected  ON messages(corrected_content) WHERE corrected_content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_rated      ON messages(rating) WHERE rating IS NOT NULL;

-- training_pairs view: ready-to-export training data pairs
CREATE OR REPLACE VIEW training_pairs AS
  SELECT
    u.id          AS user_message_id,
    u.session_id,
    u.content     AS instruction,
    a.id          AS ai_message_id,
    COALESCE(a.corrected_content, a.content) AS output,
    a.rating,
    (a.corrected_content IS NOT NULL) AS was_corrected,
    a.model_used,
    a.created_at
  FROM messages u
  JOIN messages a
    ON a.session_id = u.session_id
    AND a.role = 'assistant'
    AND a.created_at > u.created_at
  WHERE u.role = 'user'
    AND (a.rating IS NOT NULL OR a.corrected_content IS NOT NULL)
  ORDER BY a.created_at DESC;

COMMENT ON VIEW training_pairs IS 'Human-rated and corrected prompt-response pairs for LoRA fine-tuning';

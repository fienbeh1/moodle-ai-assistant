-- home-server/db/schema.sql
-- PostgreSQL schema for the Moodle AI Homework Assistant
-- Run with: psql -U ai_user -d moodle_ai -f db/schema.sql

-- ── sessions ────────────────────────────────────────────────────────────────
-- Each conversation session between the student and the AI
CREATE TABLE IF NOT EXISTS sessions (
  id          SERIAL      PRIMARY KEY,
  model       VARCHAR(50) NOT NULL DEFAULT 'mistral',
  title       VARCHAR(255),
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── messages ────────────────────────────────────────────────────────────────
-- Individual messages within a session (user prompts and AI responses)
CREATE TABLE IF NOT EXISTS messages (
  id                SERIAL      PRIMARY KEY,
  session_id        INTEGER     NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role              VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT        NOT NULL,
  rating            SMALLINT    CHECK (rating IN (-1, 1)),
  rated_at          TIMESTAMP,
  corrected_content TEXT,
  corrected_at      TIMESTAMP,
  tokens_used       INTEGER,
  model_used        VARCHAR(50),
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── exports ─────────────────────────────────────────────────────────────────
-- Log of homework exports to Google Sheets
CREATE TABLE IF NOT EXISTS exports (
  id           SERIAL      PRIMARY KEY,
  session_id   INTEGER     NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sheet_url    TEXT,
  export_type  VARCHAR(20) NOT NULL DEFAULT 'google_sheets',
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ── indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_session
  ON messages(session_id);

CREATE INDEX IF NOT EXISTS idx_messages_created
  ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_corrected
  ON messages(corrected_content)
  WHERE corrected_content IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_updated
  ON sessions(updated_at DESC);

-- ── training_pairs view ─────────────────────────────────────────────────────
-- Convenience view for exporting human-corrected training pairs
-- Used by training/export-training-data.js and GET /api/training/export-jsonl
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

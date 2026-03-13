-- Migration: Create password_reset_tokens table
-- Used for the forgot-password / email OTP reset flow.
-- Tokens are stored as SHA-256 hashes (never raw) and expire after 15 minutes.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by hashed token
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash);

-- Index for cleanup queries (expire old tokens per user)
CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id);


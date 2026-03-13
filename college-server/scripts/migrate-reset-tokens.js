// Run: node scripts/migrate-reset-tokens.js  (from the college-server folder)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "dnyanesh",
  database: process.env.DB_NAME || "college_db",
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         SERIAL PRIMARY KEY,
        user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT        NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at    TIMESTAMPTZ DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON password_reset_tokens(token_hash)"
    );
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens(user_id)"
    );
    console.log("✅ password_reset_tokens table ready");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();

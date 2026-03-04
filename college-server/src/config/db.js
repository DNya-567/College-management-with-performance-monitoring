// Database connection pool.
// Must NOT contain business logic — only connection config and pool setup.
const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log once on first successful connection — NOT on every checkout
let hasLoggedConnect = false;
pool.on("connect", () => {
  if (!hasLoggedConnect) {
    console.log("✅ Connected to PostgreSQL");
    hasLoggedConnect = true;
  }
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
  // Log but don't crash — individual queries will fail with clear errors.
  // In production, let the process manager (PM2) handle restarts if needed.
});

module.exports = pool;

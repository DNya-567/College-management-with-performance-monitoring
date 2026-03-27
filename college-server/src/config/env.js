// Centralized environment configuration.
// Validates required vars at startup — fails fast in production if missing.
// All other files should import from here instead of reading process.env directly.

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,

  // Database
  DATABASE_URL: process.env.DATABASE_URL || null,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || "college_db",

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",

  // CORS — comma-separated origins, e.g. "http://localhost:5173,https://myapp.com"
  CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174",
};

// ── Required vars that MUST exist ──
const REQUIRED = env.DATABASE_URL ? ["JWT_SECRET"] : ["DB_PASSWORD", "JWT_SECRET"];

const missing = REQUIRED.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  if (env.NODE_ENV === "production") {
    process.exit(1); // hard-fail in production
  }
}

env.isProduction = env.NODE_ENV === "production";
env.isDevelopment = env.NODE_ENV === "development";

module.exports = env;
// Run pending SQL migrations against the database.
// Usage: node src/scripts/runMigration.js <path-to-sql-file>
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const fs = require("fs");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: String(process.env.DB_PASSWORD || ""),
  database: process.env.DB_NAME || "college_db",
});

async function run() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    process.stdout.write("Usage: node runMigration.js <path-to-sql>\n");
    process.exit(1);
  }

  const fullPath = path.resolve(__dirname, "../../", sqlFile);
  const sql = fs.readFileSync(fullPath, "utf-8");

  process.stdout.write("Running: " + sqlFile + "\n");
  await pool.query(sql);
  process.stdout.write("Done!\n");
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  process.stderr.write("Migration error: " + err.message + "\n");
  process.exit(1);
});


// Seed script: creates a default admin user if one doesn't already exist.
// Usage: npm run seed:admin
// Override password: set ADMIN_PASSWORD env var before running.

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@college.com";
    const password = process.env.ADMIN_PASSWORD || "changeme123";
    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, role`,
      [email, hash]
    );

    if (result.rowCount > 0) {
      console.log(`✅ Admin seeded: ${result.rows[0].email} (${result.rows[0].id})`);
    } else {
      console.log(`ℹ️  Admin already exists (${email}), skipping.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();


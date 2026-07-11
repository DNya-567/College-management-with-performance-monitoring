require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  const client = await pool.connect();
  try {
    const dbInfo = await client.query('SELECT current_database(), inet_server_addr(), version()');
    console.log('Connected to database:', dbInfo.rows[0].current_database);
    console.log('Server address:', dbInfo.rows[0].inet_server_addr);

    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log('User count RIGHT NOW via this exact connection:', userCount.rows[0].count);

    const adminCheck = await client.query("SELECT email, role FROM users WHERE email = 'admin@college.com'");
    console.log('Admin user found:', adminCheck.rows.length > 0 ? adminCheck.rows[0] : 'NOT FOUND');
  } finally {
    client.release();
    await pool.end();
  }
})();
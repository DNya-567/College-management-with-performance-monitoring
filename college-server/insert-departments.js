#!/usr/bin/env node
/**
 * Quick script to insert 8 departments into the database
 */

const pg = require('pg');

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'dnyanesh',
  database: 'college_db',
});

const departments = [
  'Computer Science',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Chemical Engineering',
  'Biomedical Engineering',
];

async function insertDepartments() {
  try {
    console.log('🌱 Inserting 8 departments...\n');

    // First, delete existing departments (optional)
    await pool.query('DELETE FROM departments');
    console.log('✓ Cleared existing departments');

    // Insert new departments
    for (const deptName of departments) {
      const result = await pool.query(
        'INSERT INTO departments (name) VALUES ($1) RETURNING id, name',
        [deptName]
      );
      console.log(`✓ ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    console.log('\n✅ All 8 departments inserted successfully!');

    // Verify count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM departments');
    console.log(`📊 Total departments in database: ${countResult.rows[0].count}`);

    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

insertDepartments();


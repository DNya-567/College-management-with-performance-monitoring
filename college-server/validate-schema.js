#!/usr/bin/env node

/**
 * Validates the base schema deployment
 * Checks that all tables exist with correct columns and constraints
 * Usage: node validate-schema.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "dnyanesh",
  database: process.env.DB_NAME || "college_db",
});

const EXPECTED_TABLES = [
  "users",
  "departments",
  "teachers",
  "students",
  "semesters",
  "subjects",
  "classes",
  "class_enrollments",
  "marks",
  "attendance",
  "announcements",
  "audit_logs",
  "password_reset_tokens",
  "class_schedules",
];

const CRITICAL_COLUMNS = {
  users: ["id", "email", "password_hash", "role", "is_active", "created_at"],
  teachers: ["id", "user_id", "name", "department_id"],
  students: ["id", "user_id", "name", "roll_no", "year"],
  classes: ["id", "name", "subject_id", "teacher_id", "year"],
  marks: ["id", "class_id", "student_id", "subject_id", "teacher_id", "semester_id", "score", "total_marks", "exam_type"],
  attendance: ["id", "class_id", "student_id", "date", "status", "semester_id"],
  semesters: ["id", "name", "academic_year", "start_date", "end_date", "is_active"],
};

async function query(sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (err) {
    console.error(`❌ Query failed: ${err.message}`);
    throw err;
  }
}

async function validateSchema() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           DATABASE SCHEMA VALIDATION REPORT                    ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  let allPassed = true;

  try {
    // 1. Check pgcrypto extension
    console.log("🔍 Checking extensions...");
    const extensionsResult = await query(`
      SELECT extname FROM pg_extension WHERE extname = 'pgcrypto'
    `);
    if (extensionsResult.length > 0) {
      console.log("  ✅ pgcrypto extension enabled\n");
    } else {
      console.log("  ❌ pgcrypto extension NOT found\n");
      allPassed = false;
    }

    // 2. Check all tables exist
    console.log("📋 Checking tables...");
    const tablesResult = await query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const existingTables = tablesResult.map((r) => r.table_name);

    for (const table of EXPECTED_TABLES) {
      if (existingTables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} (MISSING)`);
        allPassed = false;
      }
    }
    console.log();

    // 3. Validate critical columns
    console.log("🔎 Validating critical columns...");
    for (const [table, columns] of Object.entries(CRITICAL_COLUMNS)) {
      if (!existingTables.includes(table)) continue;

      const columnsResult = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY column_name
      `, [table]);
      const existingCols = columnsResult.map((r) => r.column_name);

      let tablePassed = true;
      for (const col of columns) {
        if (!existingCols.includes(col)) {
          console.log(`  ❌ ${table}.${col} (MISSING)`);
          tablePassed = false;
          allPassed = false;
        }
      }
      if (tablePassed) {
        console.log(`  ✅ ${table} - all critical columns present`);
      }
    }
    console.log();

    // 4. Check primary keys
    console.log("🔑 Checking primary keys...");
    const pksResult = await query(`
      SELECT
        t.table_name,
        a.attname as pk_column
      FROM pg_index i
      JOIN pg_class c ON i.indrelid = c.oid
      JOIN pg_class idx ON i.indexrelid = idx.oid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
      JOIN information_schema.tables t ON t.table_name = c.relname
      WHERE i.indisprimary AND t.table_schema = 'public'
      ORDER BY t.table_name
    `);

    const pksByTable = {};
    for (const row of pksResult) {
      if (!pksByTable[row.table_name]) {
        pksByTable[row.table_name] = [];
      }
      pksByTable[row.table_name].push(row.pk_column);
    }

    for (const table of EXPECTED_TABLES) {
      if (existingTables.includes(table)) {
        const pks = pksByTable[table] || [];
        if (pks.length > 0) {
          console.log(`  ✅ ${table} - PK: (${pks.join(", ")})`);
        } else {
          console.log(`  ❌ ${table} - NO PRIMARY KEY`);
          allPassed = false;
        }
      }
    }
    console.log();

    // 5. Check foreign keys
    console.log("🔗 Checking foreign keys...");
    const fksResult = await query(`
      SELECT
        tc.constraint_name,
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY kcu.table_name, kcu.column_name
    `);

    const fksByTable = {};
    for (const row of fksResult) {
      if (!fksByTable[row.table_name]) {
        fksByTable[row.table_name] = [];
      }
      fksByTable[row.table_name].push(
        `${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`
      );
    }

    const expectedFks = {
      teachers: ["user_id", "department_id"],
      students: ["user_id", "department_id"],
      departments: ["hod_id"],
      classes: ["subject_id", "teacher_id", "semester_id"],
      class_enrollments: ["class_id", "student_id", "semester_id"],
      marks: ["class_id", "student_id", "subject_id", "teacher_id", "semester_id"],
      attendance: ["class_id", "student_id", "semester_id"],
      announcements: ["teacher_id", "class_id"],
      password_reset_tokens: ["user_id"],
      class_schedules: ["class_id", "updated_by_teacher_id"],
    };

    for (const [table, fks] of Object.entries(expectedFks)) {
      const tableFks = fksByTable[table] || [];
      if (tableFks.length > 0) {
        console.log(`  ✅ ${table}:`);
        tableFks.forEach((fk) => console.log(`     └─ ${fk}`));
      } else {
        console.log(`  ❌ ${table} - NO FOREIGN KEYS`);
      }
    }
    console.log();

    // 6. Check indexes
    console.log("📊 Checking indexes...");
    const indexesResult = await query(`
      SELECT
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexesByTable = {};
    for (const row of indexesResult) {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    }

    for (const table of EXPECTED_TABLES) {
      if (existingTables.includes(table)) {
        const indexes = (indexesByTable[table] || []).filter((idx) => !idx.includes("_pkey"));
        console.log(`  ℹ️  ${table}: ${indexes.length} indexes`);
      }
    }
    console.log();

    // 7. Check unique constraints
    console.log("🔐 Checking unique constraints...");
    const uniquesResult = await query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    const uniquesByTable = {};
    for (const row of uniquesResult) {
      if (!uniquesByTable[row.table_name]) {
        uniquesByTable[row.table_name] = [];
      }
      uniquesByTable[row.table_name].push(row.column_name);
    }

    const expectedUniques = {
      users: ["email"],
      students: ["roll_no", "user_id"],
      subjects: ["name"],
      departments: ["name"],
      teachers: ["user_id"],
    };

    for (const [table, cols] of Object.entries(expectedUniques)) {
      const uniqueCols = uniquesByTable[table] || [];
      const missing = cols.filter((c) => !uniqueCols.includes(c));
      if (missing.length === 0) {
        console.log(`  ✅ ${table} - unique constraints present`);
      } else {
        console.log(`  ⚠️  ${table} - missing unique: ${missing.join(", ")}`);
      }
    }
    console.log();

    // 8. Check CHECK constraints
    console.log("✔️  Checking CHECK constraints...");
    const checksResult = await query(`
      SELECT
        table_name,
        constraint_name,
        check_clause
      FROM information_schema.check_constraints
      WHERE constraint_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`  ℹ️  Found ${checksResult.length} CHECK constraints`);
    console.log();

    // 9. Summary
    console.log("╔════════════════════════════════════════════════════════════════╗");
    if (allPassed) {
      console.log("║                   ✅ SCHEMA VALIDATION PASSED                  ║");
    } else {
      console.log("║                   ❌ SCHEMA VALIDATION FAILED                  ║");
    }
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    console.log(`📊 Summary:`);
    console.log(`  • Total Tables: ${existingTables.length}`);
    console.log(`  • Expected Tables: ${EXPECTED_TABLES.length}`);
    console.log(`  • Foreign Keys: ${fksResult.length}`);
    console.log(`  • Unique Constraints: ${uniquesResult.length}`);
    console.log(`  • Indexes: ${indexesResult.length}`);
    console.log();

    await pool.end();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error("\n❌ Validation failed:", err.message);
    await pool.end();
    process.exit(1);
  }
}

validateSchema();


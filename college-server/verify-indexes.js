/**
 * Verify Database Indexes
 *
 * This script checks if all critical indexes are properly created
 * and suggests any missing ones.
 *
 * Run: node verify-indexes.js
 */

// Load environment variables first
require('dotenv').config();

const db = require('./src/config/db');
const logger = require('./src/config/logger');

async function verifyIndexes() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         DATABASE INDEX VERIFICATION REPORT                     ║');
  console.log('║         College Management System - Performance Audit          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Query to get all indexes in the database
    const indexQuery = `
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const result = await db.query(indexQuery);

    console.log(`✅ Total Indexes Found: ${result.rows.length}\n`);

    // Group indexes by table
    const indexesByTable = {};
    result.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push({
        name: row.indexname,
        definition: row.indexdef
      });
    });

    // Display indexes by table
    Object.keys(indexesByTable).sort().forEach(table => {
      console.log(`\n📊 Table: ${table.toUpperCase()}`);
      console.log('─'.repeat(60));
      indexesByTable[table].forEach(idx => {
        const type = idx.name.includes('idx_') ? '🔑' : '📌';
        console.log(`${type} ${idx.name}`);
      });
    });

    // Check for critical missing indexes
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              CRITICAL INDEXES VERIFICATION                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const criticalIndexes = {
      'users.email': 'idx_users_email',
      'students.user_id': 'idx_students_user_id',
      'students.roll_no': 'idx_students_roll_no',
      'teachers.user_id': 'idx_teachers_user_id',
      'teachers.department_id': 'idx_teachers_department_id',
      'classes.teacher_id': 'idx_classes_teacher_id',
      'class_enrollments (class_id, student_id)': 'idx_enrollments_class_student_status',
      'marks.student_id': 'idx_marks_student_id',
      'marks (student_id, class_id, semester_id)': 'idx_marks_student_class_semester',
      'marks (class_id, teacher_id, semester_id)': 'idx_marks_class_teacher_semester',
      'attendance.student_id': 'idx_attendance_student_id',
      'attendance (class_id, date)': 'idx_attendance_class_date',
      'announcements.class_id': 'idx_announcements_class_id'
    };

    let missingIndexes = [];
    let foundIndexes = [];

    for (const [column, indexName] of Object.entries(criticalIndexes)) {
      const found = result.rows.some(r => r.indexname === indexName);

      if (found) {
        foundIndexes.push({ column, indexName, status: '✅' });
      } else {
        missingIndexes.push({ column, indexName, status: '❌' });
      }
    }

    // Show results
    foundIndexes.forEach(idx => {
      console.log(`${idx.status} ${idx.column.padEnd(40)} → ${idx.indexName}`);
    });

    if (missingIndexes.length > 0) {
      console.log('\n\n⚠️  MISSING CRITICAL INDEXES:\n');
      missingIndexes.forEach(idx => {
        console.log(`${idx.status} ${idx.column.padEnd(40)} → ${idx.indexName}`);
      });
    } else {
      console.log('\n\n🎉 All critical indexes are present!');
    }

    // Check index size and usage
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   INDEX SIZE & USAGE STATS                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const sizeQuery = `
      SELECT
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname='public'
      ORDER BY pg_relation_size(indexrelid) DESC;
    `;

    const sizeResult = await db.query(sizeQuery);

    let totalSize = 0;
    sizeResult.rows.forEach(row => {
      const sizeNum = parseInt(row.index_size);
      if (!isNaN(sizeNum)) {
        console.log(`
📈 ${row.indexname}
   Size: ${row.index_size}
   Scans: ${row.idx_scan || 0}
   Tuples Read: ${row.idx_tup_read || 0}
   Tuples Fetched: ${row.idx_tup_fetch || 0}`);
      }
    });

    // Performance recommendations
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                PERFORMANCE RECOMMENDATIONS                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const unusedIndexes = sizeResult.rows.filter(r => r.idx_scan === 0);

    if (unusedIndexes.length > 0) {
      console.log(`⚠️  Found ${unusedIndexes.length} potentially unused indexes:\n`);
      unusedIndexes.forEach(idx => {
        console.log(`   - ${idx.indexname} (Consider dropping if not needed)`);
      });
    } else {
      console.log('✅ All indexes are actively being used');
    }

    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        SUMMARY REPORT                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Indexes: ${result.rows.length}`);
    console.log(`Critical Indexes Present: ${foundIndexes.length}/${Object.keys(criticalIndexes).length}`);
    console.log(`Missing Critical Indexes: ${missingIndexes.length}`);
    console.log(`Unused Indexes: ${unusedIndexes.length}`);
    console.log('\n✅ Index Verification Complete!\n');

    process.exit(0);
  } catch (error) {
    logger.error('Index verification error:', error);
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyIndexes();


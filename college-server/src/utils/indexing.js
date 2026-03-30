// Utility to create database indexes programmatically
// Run once on deployment to optimize queries for production
// Safe to run multiple times (indexes have IF NOT EXISTS)

import fs from 'fs';
import path from 'path';
import db from '../config/db.js';
import logger from '../config/logger.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Apply all production indexes to database
 * CRITICAL: Run this once after first deployment
 * Safe for production: Uses CONCURRENTLY flag (no table locks)
 */
export const applyIndexes = async () => {
  try {
    logger.info('Starting database indexing...');

    // Read the SQL file containing all indexes
    const sqlPath = path.join(__dirname, '../sql/2026_03_14_create_performance_indexes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Split into individual statements (remove comments)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    logger.info(`Applying ${statements.length} indexes...`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each index creation statement
    for (const statement of statements) {
      try {
        await db.query(statement);
        successCount++;
        const indexName = statement.match(/idx_[\w]+/)?.[0] || 'unknown';
        logger.debug(`✓ Created index: ${indexName}`);
      } catch (error) {
        errorCount++;
        logger.warn(`Index creation warning: ${error.message}`);
        // Continue on error (might already exist)
      }
    }

    logger.info(`Index creation complete: ${successCount} succeeded, ${errorCount} skipped`);

    return {
      success: true,
      created: successCount,
      skipped: errorCount,
      message: `Applied ${successCount} database indexes`
    };
  } catch (error) {
    logger.error('Database indexing failed', {
      message: error.message,
      stack: error.stack
    });
    return {
      success: false,
      message: `Index creation failed: ${error.message}`
    };
  }
};

/**
 * Check which indexes exist in the database
 * Useful for debugging
 */
export const listExistingIndexes = async () => {
  try {
    const result = await db.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    return result.rows;
  } catch (error) {
    logger.error('Failed to list indexes', { message: error.message });
    return [];
  }
};

/**
 * Get index statistics (size, effectiveness)
 */
export const getIndexStats = async () => {
  try {
    const result = await db.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY idx_scan DESC
    `);
    return result.rows;
  } catch (error) {
    logger.error('Failed to get index stats', { message: error.message });
    return [];
  }
};



// src/db/db.ts
/**
 * @module db
 * @description
 * This module handles the database initialization and access for the application.
 * It creates a singleton instance of a SQLite database using the better-sqlite3 package,
 * and ensures that the necessary tables and indices exist for tracking both swap and mining metrics.
 */

import Database from 'better-sqlite3';

// A singleton instance of the SQLite database.
// It remains undefined until the first call to getDatabase(), after which it will be reused.
let dbInstance: Database.Database | undefined;

/**
 * Retrieves the singleton database instance.
 *
 * If the database is not yet initialized, this function creates or opens the database file,
 * sets up the required tables (swap_metrics and mining_metrics), and creates unique indices.
 *
 * @returns {Database.Database} A singleton instance of the SQLite database.
 */
export function getDatabase(): Database.Database {
  if (!dbInstance) {
    // Use a single file (appMetrics.db) for all metrics.
    dbInstance = new Database('./src/db/appMetrics.db', {});

    // Create the swap_metrics table if it doesn’t exist.
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS swap_metrics (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_swap_rounds INTEGER DEFAULT 0,
        successful_swap_rounds INTEGER DEFAULT 0,
        failed_swap_rounds INTEGER DEFAULT 0,
        aborted_swap_rounds INTEGER DEFAULT 0,
        total_swap_attempts INTEGER DEFAULT 0,
        total_transaction_fees_sol REAL DEFAULT 0,
        volume_by_token TEXT DEFAULT '{}',
        swaps_by_token TEXT DEFAULT '{}',
        referral_fees_by_token TEXT DEFAULT '{}',
        pre_sign_failures TEXT DEFAULT '{}',
        post_sign_failures TEXT DEFAULT '{}',
        extra_swap_errors TEXT DEFAULT '{}'
      );
    `);

    // Ensure the default row exists for swap_metrics (id = 1).
    // The INSERT OR IGNORE statement prevents duplicate entries.
    dbInstance.prepare(`INSERT OR IGNORE INTO swap_metrics (id) VALUES (1)`).run();

    // Create a unique index on the id column for swap_metrics.
    dbInstance.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_swap_id ON swap_metrics (id);
    `);

    // Create the mining_metrics table if it doesn’t exist.
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS mining_metrics (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_mining_rounds INTEGER DEFAULT 0,
        successful_mining_rounds INTEGER DEFAULT 0,
        failed_mining_rounds INTEGER DEFAULT 0,
        total_claimed_amount INTEGER DEFAULT 0,
        total_unclaimed_amount INTEGER DEFAULT 0,
        avg_hash_rate REAL DEFAULT 0,
        total_mining_time_min INTEGER DEFAULT 0,
        boost REAL DEFAULT 0,
        extra_mining_data TEXT DEFAULT '{}'
      );
    `);

    // Ensure the default row exists for mining_metrics (id = 1).
    dbInstance.prepare(`INSERT OR IGNORE INTO mining_metrics (id) VALUES (1)`).run();

    // Create a unique index on the id column for mining_metrics.
    dbInstance.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_mining_id ON mining_metrics (id);
    `);
  }
  return dbInstance;
}

/**
 * Initializes the database.
 *
 * This function ensures that the singleton database instance is created and all required
 * tables and indices are set up. It can be called on application startup to prepare the database.
 *
 * @returns {void}
 */
export function initDatabase(): void {
  getDatabase(); // Simply calling this function ensures the database is initialized.
}

/**
 * A shared, pre-initialized database instance that can be imported and used across modules.
 *
 * @type {Database.Database}
 */
export const db = getDatabase();

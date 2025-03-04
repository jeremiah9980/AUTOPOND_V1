"use strict";
/**
 * @file db.ts
 * @description Initializes and provides a shared SQLite database connection using better-sqlite3.
 * It creates the necessary tables (swap_metrics and mining_metrics) and their default rows if they do not exist.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.getDatabase = getDatabase;
exports.initDatabase = initDatabase;
const tslib_1 = require("tslib");
const better_sqlite3_1 = tslib_1.__importDefault(require("better-sqlite3"));
let dbInstance;
/**
 * getDatabase
 * Returns the singleton database instance. If the instance does not exist, it is created,
 * and the required tables and indexes are initialized.
 *
 * @returns The shared Database instance.
 */
function getDatabase() {
    if (!dbInstance) {
        // Open the database file (appMetrics.db) located in ./src/db.
        dbInstance = new better_sqlite3_1.default('./src/db/appMetrics.db', {});
        // Create the swap_metrics table if it doesn't exist.
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
        // Ensure a default row exists for swap_metrics.
        dbInstance.prepare(`INSERT OR IGNORE INTO swap_metrics (id) VALUES (1)`).run();
        dbInstance.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_swap_id ON swap_metrics (id);
    `);
        // Create the mining_metrics table if it doesn't exist.
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
        // Ensure a default row exists for mining_metrics.
        dbInstance.prepare(`INSERT OR IGNORE INTO mining_metrics (id) VALUES (1)`).run();
        dbInstance.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_mining_id ON mining_metrics (id);
    `);
    }
    return dbInstance;
}
/**
 * initDatabase
 * Ensures that the database is initialized by calling getDatabase.
 */
function initDatabase() {
    getDatabase();
}
// Export a shared database instance.
exports.db = getDatabase();

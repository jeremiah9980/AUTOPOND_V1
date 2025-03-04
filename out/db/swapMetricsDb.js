"use strict";
/**
 * @file swapMetricsDb.ts
 * @description Handles persistence of swap metrics in the database.
 * It provides functions to update the cumulative swap metrics (stored in the swap_metrics table)
 * and to read the current aggregated swap metrics. It also prints an update summary showing
 * both incremental and cumulative values.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAggregatedSwapMetrics = updateAggregatedSwapMetrics;
exports.readSwapMetrics = readSwapMetrics;
const db_1 = require("./db");
const db_2 = require("./db");
const printtable_1 = require("../ui/tables/printtable");
const borderboxstyles_1 = require("../ui/styles/borderboxstyles");
const tableStyles_1 = require("../ui/styles/tableStyles"); // Ensure this exists
const print_1 = require("../ui/print");
/**
 * updateAggregatedSwapMetrics
 * Merges the metrics from a single swap cycle into the cumulative values stored in the DB.
 *
 * @param metrics - The SwapCycleMetrics from the current swap cycle.
 */
function updateAggregatedSwapMetrics(metrics) {
    var _a, _b, _c, _d, _e, _f;
    // Ensure DB is initialized.
    if (!db_1.db) {
        console.error("DB not initialized in updateAggregatedSwapMetrics");
        (0, db_2.initDatabase)(); // Attempt to initialize
    }
    try {
        // Retrieve the current cumulative metrics from the swap_metrics table.
        const current = db_1.db
            .prepare(`SELECT * FROM swap_metrics WHERE id = 1`)
            .get();
        // Parse JSON fields from the DB row, or default to empty objects.
        const volumeByToken = JSON.parse((current === null || current === void 0 ? void 0 : current.volume_by_token) || "{}");
        const swapsByToken = JSON.parse((current === null || current === void 0 ? void 0 : current.swaps_by_token) || "{}");
        const referralFeesByToken = JSON.parse((current === null || current === void 0 ? void 0 : current.referral_fees_by_token) || "{}");
        const preSignFailures = JSON.parse((current === null || current === void 0 ? void 0 : current.pre_sign_failures) || "{}");
        const postSignFailures = JSON.parse((current === null || current === void 0 ? void 0 : current.post_sign_failures) || "{}");
        const extraSwapErrors = JSON.parse((current === null || current === void 0 ? void 0 : current.extra_swap_errors) || "{}");
        // Accumulate each dictionary field from the current cycle.
        for (const token in metrics.volumeByToken) {
            volumeByToken[token] =
                (volumeByToken[token] || 0) + (metrics.volumeByToken[token] || 0);
        }
        for (const pair in metrics.swapsByToken) {
            swapsByToken[pair] =
                (swapsByToken[pair] || 0) + (metrics.swapsByToken[pair] || 0);
        }
        for (const token in metrics.referralFeesByToken) {
            referralFeesByToken[token] =
                (referralFeesByToken[token] || 0) + (metrics.referralFeesByToken[token] || 0);
        }
        for (const key in metrics.preSignFailures) {
            preSignFailures[key] =
                (preSignFailures[key] || 0) + (metrics.preSignFailures[key] || 0);
        }
        for (const key in metrics.postSignFailures) {
            postSignFailures[key] =
                (postSignFailures[key] || 0) + (metrics.postSignFailures[key] || 0);
        }
        for (const key in metrics.extraSwapErrors) {
            extraSwapErrors[key] =
                (extraSwapErrors[key] || 0) + (metrics.extraSwapErrors[key] || 0);
        }
        // Prepare the SQL update statement to merge the new values.
        const updateStmt = db_1.db.prepare(`
      UPDATE swap_metrics SET
        total_swap_rounds = total_swap_rounds + ?,
        successful_swap_rounds = successful_swap_rounds + ?,
        failed_swap_rounds = failed_swap_rounds + ?,
        aborted_swap_rounds = aborted_swap_rounds + ?,
        total_swap_attempts = total_swap_attempts + ?,
        total_transaction_fees_sol = total_transaction_fees_sol + ?,
        volume_by_token = ?,
        swaps_by_token = ?,
        referral_fees_by_token = ?,
        pre_sign_failures = ?,
        post_sign_failures = ?,
        extra_swap_errors = ?
      WHERE id = 1
    `);
        // Build the update values array.
        const values = [
            metrics.totalSwapRounds || 0,
            metrics.successfulSwapRounds || 0,
            metrics.failedSwapRounds || 0,
            metrics.abortedSwapRounds || 0,
            metrics.totalSwapAttempts || 0,
            metrics.totalTransactionFeesSOL || 0,
            JSON.stringify(volumeByToken),
            JSON.stringify(swapsByToken),
            JSON.stringify(referralFeesByToken),
            JSON.stringify(preSignFailures),
            JSON.stringify(postSignFailures),
            JSON.stringify(extraSwapErrors),
        ];
        // Execute the update.
        updateStmt.run(...values);
        // Build an incremental table showing the metrics from the current cycle.
        const incrementalTable = [
            { Metric: "Total Swap Rounds (Increment)", Value: metrics.totalSwapRounds },
            { Metric: "Successful Swap Rounds (Increment)", Value: metrics.successfulSwapRounds },
            { Metric: "Failed Swap Rounds (Increment)", Value: metrics.failedSwapRounds },
            { Metric: "Aborted Swap Rounds (Increment)", Value: metrics.abortedSwapRounds },
            { Metric: "Total Swap Attempts (Increment)", Value: metrics.totalSwapAttempts },
            { Metric: "Transaction Fees SOL (Increment)", Value: (metrics.totalTransactionFeesSOL || 0).toFixed(6) },
            { Metric: "Volume by Token (Increment)", Value: (0, print_1.formatObject)(metrics.volumeByToken) },
            { Metric: "Swaps by Token (Increment)", Value: (0, print_1.formatObject)(metrics.swapsByToken) },
            { Metric: "Referral Fees by Token (Increment)", Value: (0, print_1.formatObject)(metrics.referralFeesByToken) },
            { Metric: "Pre-Sign Failures (Increment)", Value: (0, print_1.formatObject)(metrics.preSignFailures) },
            { Metric: "Post-Sign Failures (Increment)", Value: (0, print_1.formatObject)(metrics.postSignFailures) },
            { Metric: "Extra Swap Errors (Increment)", Value: (0, print_1.formatObject)(metrics.extraSwapErrors) },
        ];
        // Build a cumulative table from the current DB row.
        const cumulativeTable = [
            { Metric: "Total Swap Rounds", Value: (_a = current === null || current === void 0 ? void 0 : current.total_swap_rounds) !== null && _a !== void 0 ? _a : 0 },
            { Metric: "Successful Swap Rounds", Value: (_b = current === null || current === void 0 ? void 0 : current.successful_swap_rounds) !== null && _b !== void 0 ? _b : 0 },
            { Metric: "Failed Swap Rounds", Value: (_c = current === null || current === void 0 ? void 0 : current.failed_swap_rounds) !== null && _c !== void 0 ? _c : 0 },
            { Metric: "Aborted Swap Rounds", Value: (_d = current === null || current === void 0 ? void 0 : current.aborted_swap_rounds) !== null && _d !== void 0 ? _d : 0 },
            { Metric: "Total Swap Attempts", Value: (_e = current === null || current === void 0 ? void 0 : current.total_swap_attempts) !== null && _e !== void 0 ? _e : 0 },
            { Metric: "Transaction Fees SOL", Value: ((_f = current === null || current === void 0 ? void 0 : current.total_transaction_fees_sol) !== null && _f !== void 0 ? _f : 0).toFixed(6) },
            {
                Metric: "Volume by Token",
                Value: (current === null || current === void 0 ? void 0 : current.volume_by_token)
                    ? (0, print_1.formatObject)(JSON.parse(current.volume_by_token))
                    : "{}",
            },
            {
                Metric: "Swaps by Token",
                Value: (current === null || current === void 0 ? void 0 : current.swaps_by_token)
                    ? (0, print_1.formatObject)(JSON.parse(current.swaps_by_token))
                    : "{}",
            },
            {
                Metric: "Referral Fees by Token",
                Value: (current === null || current === void 0 ? void 0 : current.referral_fees_by_token)
                    ? (0, print_1.formatObject)(JSON.parse(current.referral_fees_by_token))
                    : "{}",
            },
            {
                Metric: "Pre-Sign Failures",
                Value: (current === null || current === void 0 ? void 0 : current.pre_sign_failures)
                    ? (0, print_1.formatObject)(JSON.parse(current.pre_sign_failures))
                    : "{}",
            },
            {
                Metric: "Post-Sign Failures",
                Value: (current === null || current === void 0 ? void 0 : current.post_sign_failures)
                    ? (0, print_1.formatObject)(JSON.parse(current.post_sign_failures))
                    : "{}",
            },
            {
                Metric: "Extra Swap Errors",
                Value: (current === null || current === void 0 ? void 0 : current.extra_swap_errors)
                    ? (0, print_1.formatObject)(JSON.parse(current.extra_swap_errors))
                    : "{}",
            },
        ];
        // Print the update summary header and tables.
        (0, print_1.printMessageLinesBorderBox)(["==== Swap Metrics DB Update Summary ===="], borderboxstyles_1.swappingStyle);
        (0, printtable_1.printTable)(Object.assign(Object.assign({}, tableStyles_1.swappingTableOptions), { title: "Incremental Values Added:", data: incrementalTable }));
        (0, printtable_1.printTable)(Object.assign(Object.assign({}, tableStyles_1.swappingTableOptions), { title: "Cumulative Values:", data: cumulativeTable }));
    }
    catch (error) {
        console.error("Error in updateAggregatedSwapMetrics:", error);
    }
}
/**
 * readSwapMetrics
 * Reads and returns the swap metrics row from the database.
 *
 * @returns A SwapMetricsRow object if available; otherwise, undefined.
 */
function readSwapMetrics() {
    if (!db_1.db) {
        console.error("DB not initialized in readSwapMetrics");
        (0, db_2.initDatabase)(); // Attempt to initialize DB if not done
    }
    const row = db_1.db.prepare(`SELECT * FROM swap_metrics WHERE id = 1`).get();
    return row;
}

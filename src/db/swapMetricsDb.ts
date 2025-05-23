// src/db/swapMetricsDb.ts
/**
 * @module swapMetricsDb
 * @description
 * This module handles the aggregation and retrieval of swap metrics stored in the database.
 * It updates cumulative swap metrics based on incremental cycle readings and prints summaries
 * using UI components for visual feedback.
 */

import { db } from "./db";
import { SwapCycleMetrics } from "../metrics/metrics";
import { initDatabase } from "./db";
import { tryParseJSON } from "../utils/helpers";
import { printTable, PrintTableOptions } from "../ui/tables/printtable";
import { swappingStyle } from "../ui/styles/borderboxstyles";
import { swappingTableOptions } from "../ui/styles/tableStyles"; // Make sure this exists
import { printMessageLinesBorderBox, formatObject } from "../ui/print";

/**
 * Interface representing a row in the swap_metrics table.
 */
interface SwapMetricsRow {
  id: number;
  total_swap_rounds: number;
  successful_swap_rounds: number;
  failed_swap_rounds: number;
  aborted_swap_rounds: number;
  total_swap_attempts: number;
  total_transaction_fees_sol: number;
  volume_by_token: string;
  swaps_by_token: string;
  referral_fees_by_token: string;
  pre_sign_failures: string;
  post_sign_failures: string;
  extra_swap_errors: string;
}

/**
 * updateAggregatedSwapMetrics
 * -----------------------------
 * Updates the cumulative swap metrics stored in the database by incorporating the incremental
 * changes from the current swap cycle.
 *
 * This function:
 * - Reads the current swap metrics from the database.
 * - Parses JSON fields to obtain existing cumulative values.
 * - Adds the incremental values from the current cycle.
 * - Updates the database with the new cumulative values.
 * - Prints a summary of both incremental and cumulative metrics using UI tables.
 *
 * @param {SwapCycleMetrics} metrics - An object containing the incremental swap metrics for the current cycle.
 * @returns {void}
 */
export function updateAggregatedSwapMetrics(metrics: SwapCycleMetrics): void {
  // Ensure the database is initialized.
  if (!db) {
    console.error("DB not initialized in updateAggregatedSwapMetrics");
    initDatabase(); // Try to initialize if not done
  }
  try {
    // Retrieve the current swap metrics row from the database.
    const current = db
      .prepare(`SELECT * FROM swap_metrics WHERE id = 1`)
      .get() as SwapMetricsRow | undefined;

    // Parse the JSON fields, defaulting to empty objects if not set.
    const volumeByToken = JSON.parse(current?.volume_by_token || "{}");
    const swapsByToken = JSON.parse(current?.swaps_by_token || "{}");
    const referralFeesByToken = JSON.parse(current?.referral_fees_by_token || "{}");
    const preSignFailures = JSON.parse(current?.pre_sign_failures || "{}");
    const postSignFailures = JSON.parse(current?.post_sign_failures || "{}");
    const extraSwapErrors = JSON.parse(current?.extra_swap_errors || "{}");

    // Update dictionary fields by accumulating incremental values.
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

    // Prepare the SQL statement to update cumulative swap metrics.
    const updateStmt = db.prepare(`
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

    // Build the values array for the update.
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

    // Execute the update statement.
    updateStmt.run(...values);

    // Build the incremental metrics table for UI logging.
    const incrementalTable = [
      { Metric: "Total Swap Rounds (Increment)", Value: metrics.totalSwapRounds },
      { Metric: "Successful Swap Rounds (Increment)", Value: metrics.successfulSwapRounds },
      { Metric: "Failed Swap Rounds (Increment)", Value: metrics.failedSwapRounds },
      { Metric: "Aborted Swap Rounds (Increment)", Value: metrics.abortedSwapRounds },
      { Metric: "Total Swap Attempts (Increment)", Value: metrics.totalSwapAttempts },
      { Metric: "Transaction Fees SOL (Increment)", Value: (metrics.totalTransactionFeesSOL || 0).toFixed(6) },
      { Metric: "Volume by Token (Increment)", Value: formatObject(metrics.volumeByToken) },
      { Metric: "Swaps by Token (Increment)", Value: formatObject(metrics.swapsByToken) },
      { Metric: "Referral Fees by Token (Increment)", Value: formatObject(metrics.referralFeesByToken) },
      { Metric: "Pre-Sign Failures (Increment)", Value: formatObject(metrics.preSignFailures) },
      { Metric: "Post-Sign Failures (Increment)", Value: formatObject(metrics.postSignFailures) },
      { Metric: "Extra Swap Errors (Increment)", Value: formatObject(metrics.extraSwapErrors) },
    ];

    // Build the cumulative metrics table using values from the current DB row.
    const cumulativeTable = [
      { Metric: "Total Swap Rounds", Value: current?.total_swap_rounds ?? 0 },
      { Metric: "Successful Swap Rounds", Value: current?.successful_swap_rounds ?? 0 },
      { Metric: "Failed Swap Rounds", Value: current?.failed_swap_rounds ?? 0 },
      { Metric: "Aborted Swap Rounds", Value: current?.aborted_swap_rounds ?? 0 },
      { Metric: "Total Swap Attempts", Value: current?.total_swap_attempts ?? 0 },
      { Metric: "Transaction Fees SOL", Value: (current?.total_transaction_fees_sol ?? 0).toFixed(6) },
      {
        Metric: "Volume by Token",
        Value: current?.volume_by_token ? formatObject(JSON.parse(current.volume_by_token)) : "{}",
      },
      {
        Metric: "Swaps by Token",
        Value: current?.swaps_by_token ? formatObject(JSON.parse(current.swaps_by_token)) : "{}",
      },
      {
        Metric: "Referral Fees by Token",
        Value: current?.referral_fees_by_token ? formatObject(JSON.parse(current.referral_fees_by_token)) : "{}",
      },
      {
        Metric: "Pre-Sign Failures",
        Value: current?.pre_sign_failures ? formatObject(JSON.parse(current.pre_sign_failures)) : "{}",
      },
      {
        Metric: "Post-Sign Failures",
        Value: current?.post_sign_failures ? formatObject(JSON.parse(current.post_sign_failures)) : "{}",
      },
      {
        Metric: "Extra Swap Errors",
        Value: current?.extra_swap_errors ? formatObject(JSON.parse(current.extra_swap_errors)) : "{}",
      },
    ];

    // Print header and tables using the UI components.
    printMessageLinesBorderBox(
      ["==== Swap Metrics DB Update Summary ===="],
      swappingStyle
    );

    printTable({
      ...swappingTableOptions,
      title: "Incremental Values Added:",
      data: incrementalTable,
    });

    printTable({
      ...swappingTableOptions,
      title: "Cumulative Values:",
      data: cumulativeTable,
    });
  } catch (error) {
    console.error("Error in updateAggregatedSwapMetrics:", error);
  }
}

/**
 * readSwapMetrics
 * ---------------
 * Reads and returns the current swap metrics from the database.
 *
 * @returns {SwapMetricsRow | undefined} The current swap metrics row if found, or undefined otherwise.
 */
export function readSwapMetrics(): SwapMetricsRow | undefined {
  if (!db) {
    console.error("DB not initialized in readSwapMetrics");
    initDatabase(); // Try to initialize if not done
  }
  const row = db.prepare(`SELECT * FROM swap_metrics WHERE id = 1`).get() as
    | SwapMetricsRow
    | undefined;
  return row; // Return the row for external use
}

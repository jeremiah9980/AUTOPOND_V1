/**
 * @file swapMetricsDb.ts
 * @description This module handles the persistence of mining metrics in the database.
 * It provides functions to update the cumulative mining metrics (stored in the mining_metrics table)
 * and to read the current aggregated mining metrics. It also prints a summary of the incremental
 * updates using formatted tables.
 */

import { db } from "./db";
import { MiningCycleMetrics } from "../metrics/metrics";
import { initDatabase } from "./db";
import { printTable, PrintTableOptions } from "../ui/tables/printtable";
import { miningStyle } from "../ui/styles/borderboxstyles";
import { miningTableOptions } from "../ui/styles/tableStyles";
import { printMessageLinesBorderBox, formatObject } from "../ui/print";

interface MiningMetricsRow {
  id: number;
  total_mining_rounds: number;
  successful_mining_rounds: number;
  failed_mining_rounds: number;
  total_claimed_amount: number;
  total_unclaimed_amount: number;
  avg_hash_rate: number;
  total_mining_time_min: number;
  boost: number;
  extra_mining_data: string;
}

/**
 * updateAggregatedMiningMetrics
 * Updates the cumulative mining metrics stored in the database by adding either the full current reading
 * (when marked as initial) or the incremental change.
 *
 * IMPORTANT: Ensure that your mining loop sets metrics.incrementalExtraData.initial = 1 for the first update,
 * and metrics.incrementalExtraData.final = 1 on the final update.
 *
 * @param metrics - The MiningCycleMetrics from the current mining session.
 */
export function updateAggregatedMiningMetrics(
  metrics: MiningCycleMetrics
): void {
  // Ensure the database is initialized.
  if (!db) {
    console.error("DB not initialized in updateAggregatedMiningMetrics");
    initDatabase();
  }
  try {
    // Retrieve the current cumulative metrics from the mining_metrics table.
    const current = db
      .prepare(`SELECT * FROM mining_metrics WHERE id = 1`)
      .get() as MiningMetricsRow | undefined;

    // Parse the current extra mining data from the DB (defaulting to an empty object if missing).
    const extraMiningData = JSON.parse(current?.extra_mining_data || "{}");

    // Determine control flags from incrementalExtraData.
    const isFinal =
      metrics.incrementalExtraData && metrics.incrementalExtraData.final === 1;
    const isInitial =
      metrics.incrementalExtraData && metrics.incrementalExtraData.initial === 1;

    // 1. Total Mining Rounds: Increase only on an initial update.
    const newTotalMiningRounds = isInitial
      ? (current?.total_mining_rounds ?? 0) + 1
      : current?.total_mining_rounds ?? 0;

    // 2. Successful and Failed Rounds: Update only on a final update.
    const newSuccessfulMiningRounds = isFinal
      ? (current?.successful_mining_rounds ?? 0) + (metrics.claimed ? 1 : 0)
      : current?.successful_mining_rounds ?? 0;
    const newFailedMiningRounds = isFinal
      ? (current?.failed_mining_rounds ?? 0) + (metrics.claimed ? 0 : 1)
      : current?.failed_mining_rounds ?? 0;

    // 3. Total Claimed Amount: Update on final update when a claim is processed.
    const newTotalClaimedAmount =
      isFinal && metrics.claimed
        ? (current?.total_claimed_amount ?? 0) + (metrics.claimedAmount ?? 0)
        : current?.total_claimed_amount ?? 0;

    // 4. Total Unclaimed Amount:
    // If current cumulative value is zero, use the full reading; otherwise, add the incremental change.
    const currentUnclaimed = current?.total_unclaimed_amount ?? 0;
    const newTotalUnclaimedAmount =
      currentUnclaimed === 0
        ? metrics.unclaimedAmount ?? 0
        : isInitial
        ? currentUnclaimed + (metrics.unclaimedAmount ?? 0)
        : currentUnclaimed + (metrics.unclaimedIncrement ?? 0);

    // 5. Average Hash Rate: Compute a weighted average on final update.
    const newAvgHashRate = isFinal
      ? ((current?.avg_hash_rate ?? 0) * (current?.total_mining_rounds ?? 0) +
          (metrics.avgHashRate ?? 0)) /
        ((current?.total_mining_rounds ?? 0) + 1)
      : current?.avg_hash_rate ?? 0;

    // 6. Total Mining Time (min): If current cumulative time is zero, use the full time; otherwise, add incremental time.
    const currentTimeTotal = current?.total_mining_time_min ?? 0;
    const newTotalMiningTimeMin =
      currentTimeTotal === 0
        ? metrics.miningTimeMin
        : currentTimeTotal + (metrics.miningTimeIncrement ?? 0);

    // 7. Boost: Compute a weighted average of boost over rounds on final update.
    const newBoost = isFinal
      ? ((current?.boost ?? 0) * ((current?.total_mining_rounds ?? 0) - 1) +
          (metrics.maxBoost ?? 0)) /
        (current?.total_mining_rounds ?? 1)
      : current?.boost ?? 0;

    // 8. Merge incremental extra data (skip control keys "final" and "initial").
    const incrementalData = metrics.incrementalExtraData || {};
    for (const key in incrementalData) {
      if (key === "final" || key === "initial") continue;
      extraMiningData[key] =
        (extraMiningData[key] || 0) + (Number(incrementalData[key]) || 0);
    }

    // Prepare the SQL update statement.
    const updateStmt = db.prepare(`
      UPDATE mining_metrics SET
        total_mining_rounds = ?,
        successful_mining_rounds = ?,
        failed_mining_rounds = ?,
        total_claimed_amount = ?,
        total_unclaimed_amount = ?,
        avg_hash_rate = ?,
        total_mining_time_min = ?,
        boost = ?,
        extra_mining_data = ?
      WHERE id = 1
    `);

    // Build the values array.
    const values = [
      newTotalMiningRounds,
      newSuccessfulMiningRounds,
      newFailedMiningRounds,
      newTotalClaimedAmount,
      newTotalUnclaimedAmount,
      newAvgHashRate,
      newTotalMiningTimeMin,
      newBoost,
      JSON.stringify(extraMiningData),
    ];

    // Execute the update statement.
    updateStmt.run(...values);

    // Prepare a formatted string for extra mining data.
    const extraMiningDataFormatted = Object.entries(extraMiningData)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    // Build the incremental table data for logging.
    const incrementalTable = [
      { Metric: "Total Mining Rounds (Increment)", Value: isInitial ? 1 : 0 },
      {
        Metric: "Initial Unclaimed Amount",
        Value: isInitial ? metrics.unclaimedAmount ?? 0 : 0,
      },
      {
        Metric: "Claim Processed",
        Value: isFinal ? (metrics.claimed ? "Successful" : "Failed") : "",
      },
      {
        Metric: "Claimed Amount Increment",
        Value: isFinal && metrics.claimed ? metrics.claimedAmount ?? 0 : 0,
      },
      {
        Metric: "Unclaimed Increment Added",
        Value: isInitial
          ? metrics.unclaimedAmount ?? 0
          : metrics.unclaimedIncrement ?? 0,
      },
      {
        Metric: "Mining Time Increment (min)",
        Value: metrics.miningTimeIncrement ?? 0,
      },
    ];

    // Build the cumulative table data from the current DB row.
    const cumulativeTable = [
      { Metric: "Total Mining Rounds", Value: newTotalMiningRounds },
      { Metric: "Successful Mining Rounds", Value: newSuccessfulMiningRounds },
      { Metric: "Failed Mining Rounds", Value: newFailedMiningRounds },
      { Metric: "Total Claimed Amount", Value: newTotalClaimedAmount },
      { Metric: "Total Unclaimed Amount", Value: newTotalUnclaimedAmount },
      { Metric: "Average Hash Rate", Value: newAvgHashRate },
      { Metric: "Total Mining Time (min)", Value: newTotalMiningTimeMin },
      { Metric: "Boost", Value: newBoost },
      { Metric: "Extra Mining Data", Value: extraMiningDataFormatted },
    ];

    // Print the update summary header.
    printMessageLinesBorderBox(
      ["==== Mining Metrics DB Update Summary ===="],
      miningStyle
    );

    // Print the incremental update table.
    printTable({
      ...miningTableOptions,
      title: "Incremental Values Added:",
      data: incrementalTable,
    });
  } catch (error) {
    console.error("Error in updateAggregatedMiningMetrics:", error);
  }
}

/**
 * readMiningMetrics
 * Reads and returns the mining metrics row from the database.
 *
 * @returns A MiningMetricsRow object if available; otherwise, undefined.
 */
export function readMiningMetrics(): MiningMetricsRow | undefined {
  if (!db) {
    console.error("DB not initialized in readMiningMetrics");
    initDatabase();
  }
  const row = db.prepare(`SELECT * FROM mining_metrics WHERE id = 1`).get() as
    | MiningMetricsRow
    | undefined;
  return row;
}

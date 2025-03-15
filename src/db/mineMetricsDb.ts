import { db } from "./db";
import { MiningCycleMetrics } from "../metrics/metrics";
import { initDatabase } from "./db";
import { printTable, PrintTableOptions } from "../ui/tables/printtable";
import { miningStyle } from "../ui/styles/borderboxstyles";
import { miningTableOptions } from "../ui/styles/tableStyles";
import { printMessageLinesBorderBox } from "../ui/print";

/**
 * Interface representing a row in the mining_metrics table.
 */
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
 * -----------------------------
 * Updates the cumulative mining metrics stored in the database by adding either the full current reading
 * (when marked as initial) or the incremental change.
 *
 * IMPORTANT: Ensure that your mining loop sets metrics.incrementalExtraData.initial = 1 for the first update.
 *
 * @param {MiningCycleMetrics} metrics - An object containing the current cycle's mining metrics and incremental extra data.
 * @returns {void}
 */
export function updateAggregatedMiningMetrics(
  metrics: MiningCycleMetrics
): void {
  if (!db) {
    console.error("DB not initialized in updateAggregatedMiningMetrics");
    initDatabase();
  }
  try {
    // Retrieve the current mining metrics row from the database.
    const current = db
      .prepare(`SELECT * FROM mining_metrics WHERE id = 1`)
      .get() as MiningMetricsRow | undefined;

    // Parse the current extra data from the DB (or default to an empty object if not available).
    const extraMiningData = JSON.parse(current?.extra_mining_data || "{}");

    // Determine if this update is final or initial by checking control flags in incrementalExtraData.
    const isFinal =
      metrics.incrementalExtraData && metrics.incrementalExtraData.final === 1;
    const isInitial =
      metrics.incrementalExtraData &&
      metrics.incrementalExtraData.initial === 1;

    // 1. Total Mining Rounds: Increase only on an initial update.
    const newTotalMiningRounds = isInitial
      ? (current?.total_mining_rounds ?? 0) + 1
      : current?.total_mining_rounds ?? 0;

    // 2. Successful / Failed Rounds: Only update on a final update.
    const newSuccessfulMiningRounds = isFinal
      ? (current?.successful_mining_rounds ?? 0) + (metrics.claimed ? 1 : 0)
      : current?.successful_mining_rounds ?? 0;
    const newFailedMiningRounds = isFinal
      ? (current?.failed_mining_rounds ?? 0) + (metrics.claimed ? 0 : 1)
      : current?.failed_mining_rounds ?? 0;

    // 3. Claimed Amount: Only update on final update when a claim is processed.
    const newTotalClaimedAmount =
      isFinal && metrics.claimed
        ? (current?.total_claimed_amount ?? 0) + (metrics.claimedAmount ?? 0)
        : current?.total_claimed_amount ?? 0;

    // 4. Unclaimed Amount:
    // If the DB value is still zero, use the full current reading; otherwise, add the incremental update.
    const currentUnclaimed = current?.total_unclaimed_amount ?? 0;
    const newTotalUnclaimedAmount =
      currentUnclaimed === 0
        ? metrics.unclaimedAmount ?? 0
        : isInitial
        ? currentUnclaimed + (metrics.unclaimedAmount ?? 0)
        : currentUnclaimed + (metrics.unclaimedIncrement ?? 0);

    // 5. Average Hash Rate: On final update, compute a weighted average.
    const newAvgHashRate = isFinal
      ? ((current?.avg_hash_rate ?? 0) * (current?.total_mining_rounds ?? 0) +
          (metrics.avgHashRate ?? 0)) /
        ((current?.total_mining_rounds ?? 0) + 1)
      : current?.avg_hash_rate ?? 0;

    // 6. Total Mining Time (min):
    // If the current cumulative time is zero, use the full cumulative time; otherwise, add the incremental time.
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

    // 8. Merge incremental extra data from the current cycle into the existing extra mining data.
    const incrementalData = metrics.incrementalExtraData || {};
    for (const key in incrementalData) {
      if (key === "final" || key === "initial") continue;
      extraMiningData[key] =
        (extraMiningData[key] || 0) + (Number(incrementalData[key]) || 0);
    }

    // Prepare the SQL statement for updating the mining_metrics table.
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

    // Build the values array for the update.
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

    // Execute the update statement with the computed values.
    updateStmt.run(...values);

    // Prepare a formatted string for extra mining data for logging purposes.
    const extraMiningDataFormatted = Object.entries(extraMiningData)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    // Build data for the incremental metrics table for UI logging.
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

    // Build data for the cumulative metrics table for UI logging.
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

    // Print header using the border box UI.
    printMessageLinesBorderBox(
      ["==== Mining Metrics DB Update Summary ===="],
      miningStyle
    );

    // Build and print the incremental metrics table.
    printTable({
      ...miningTableOptions,
      data: incrementalTable,
      title: "Incremental Values Added:",
    });
  } catch (error) {
    console.error("Error in updateAggregatedMiningMetrics:", error);
  }
}

/**
 * readMiningMetrics
 * -----------------
 * Reads and returns the current mining metrics from the database.
 *
 * @returns {MiningMetricsRow | undefined} The mining metrics row if available, or undefined if not found.
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

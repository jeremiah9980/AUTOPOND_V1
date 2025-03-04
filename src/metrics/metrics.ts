/**
 * @file metrics.ts
 * @description Contains interfaces and functions for aggregating, accumulating, and displaying
 * both swap and mining metrics. It reads data from database tables, parses JSON fields, and prints
 * formatted tables using cli-table3 and our unified print functions.
 */

import { printMessageLinesBorderBox } from "../ui/print";
import { readSwapMetrics } from "../db/swapMetricsDb";
import {
  accumulateDictionary,
  accumulateNumericField,
  tryParseJSON,
} from "../utils/helpers";
import {
  generalStyle,
  miningStyle,
  swappingStyle,
  warningStyle,
} from "../ui/styles/borderboxstyles";
import { readMiningMetrics } from "../db/mineMetricsDb";
import { printTable } from "../ui/tables/printtable";
import { metricTableOptions } from "../ui/styles/tableStyles";

/**
 * SwapCycleMetrics
 * Metrics for a single swap cycle.
 */
export interface SwapCycleMetrics {
  totalSwapRounds: number;
  successfulSwapRounds: number;
  failedSwapRounds: number;
  abortedSwapRounds: number;
  totalSwapAttempts: number;
  volumeByToken: { [token: string]: number };
  swapsByToken: { [pair: string]: number };
  totalTransactionFeesSOL: number;
  referralFeesByToken: { [token: string]: number };
  preSignFailures: {
    [key: string]: number;
    insufficient: number;
    userAbort: number;
    other: number;
  };
  postSignFailures: {
    [key: string]: number;
    slippageTolerance: number;
    transactionReverted: number;
    other: number;
  };
  extraSwapErrors: { [errorType: string]: number };
}

/**
 * MiningCycleMetrics
 * Metrics for a single mining session.
 */
export interface MiningCycleMetrics {
  claimedAmount: number;
  unclaimedAmount: number;
  unclaimedIncrement: number;
  avgHashRate: number;
  hashes?: number;
  miningTimeMin: number;
  miningTimeIncrement: number;
  maxBoost: number;
  slashed?: number;
  exprired?: boolean;
  claimed?: boolean;
  incrementalExtraData?: { [key: string]: number };
  extraMiningData?: { [key: string]: number };
}

/**
 * OverallMetrics
 * Combines both swap and mining metrics.
 */
export interface OverallMetrics {
  swapMetrics: SwapCycleMetrics;
  miningMetrics: MiningCycleMetrics;
}

/**
 * Global overall metrics accumulator.
 */
export let overallMetrics: OverallMetrics = {
  swapMetrics: {
    totalSwapRounds: 0,
    successfulSwapRounds: 0,
    failedSwapRounds: 0,
    abortedSwapRounds: 0,
    totalSwapAttempts: 0,
    volumeByToken: {},
    swapsByToken: {},
    totalTransactionFeesSOL: 0,
    referralFeesByToken: {},
    preSignFailures: { insufficient: 0, userAbort: 0, other: 0 },
    postSignFailures: {
      slippageTolerance: 0,
      transactionReverted: 0,
      other: 0,
    },
    extraSwapErrors: {},
  },
  miningMetrics: {
    claimedAmount: 0,
    unclaimedAmount: 0,
    unclaimedIncrement: 0,
    avgHashRate: 0,
    hashes: 0,
    miningTimeMin: 0,
    miningTimeIncrement: 0,
    maxBoost: 0,
    slashed: 0,
    exprired: false,
    claimed: false,
    incrementalExtraData: { checkCount: 0 },
  },
};

/**
 * accumulateSwapMetrics
 * Merges the metrics from a single swap cycle into overall swapMetrics.
 *
 * @param current - The metrics from a single swap cycle.
 */
export function accumulateSwapMetrics(current: SwapCycleMetrics): void {
  const overall = overallMetrics.swapMetrics;

  // Accumulate simple numeric fields.
  accumulateNumericField(overall, current, [
    "totalSwapRounds",
    "successfulSwapRounds",
    "failedSwapRounds",
    "abortedSwapRounds",
    "totalSwapAttempts",
    "totalTransactionFeesSOL",
  ]);

  // Accumulate dictionary-based fields.
  accumulateDictionary(overall.volumeByToken, current.volumeByToken);
  accumulateDictionary(
    overall.referralFeesByToken,
    current.referralFeesByToken
  );
  accumulateDictionary(overall.extraSwapErrors, current.extraSwapErrors);

  // Accumulate preSignFailures and postSignFailures.
  accumulateDictionary(overall.preSignFailures, current.preSignFailures);
  accumulateDictionary(overall.postSignFailures, current.postSignFailures);

  // Accumulate swapsByToken if present.
  if (current.swapsByToken) {
    overall.swapsByToken = overall.swapsByToken || {};
    accumulateDictionary(overall.swapsByToken, current.swapsByToken);
  }
}

/**
 * viewPondStatistics
 * ------------------
 * Reads metrics from the swap_metrics and mining_metrics tables,
 * parses the JSON fields, and prints out the statistics in a formatted table display.
 */
export async function viewPondStatistics(): Promise<void> {
  // Read the swap metrics row from the database.
  const swapRow = readSwapMetrics();
  if (!swapRow) {
    printMessageLinesBorderBox(
      ["❌ No data found in swap_metrics table."],
      warningStyle
    );
    return;
  }

  // Read the mining metrics row from the database.
  const miningRow = readMiningMetrics();
  if (!miningRow) {
    printMessageLinesBorderBox(
      ["❌ No data found in mining_metrics table."],
      warningStyle
    );
    return;
  }

  // Parse swap metrics from the swapRow.
  const swapMetrics: SwapCycleMetrics = {
    totalSwapRounds: swapRow.total_swap_rounds,
    successfulSwapRounds: swapRow.successful_swap_rounds,
    failedSwapRounds: swapRow.failed_swap_rounds,
    abortedSwapRounds: swapRow.aborted_swap_rounds,
    totalSwapAttempts: swapRow.total_swap_attempts,
    volumeByToken: tryParseJSON(swapRow.volume_by_token),
    swapsByToken: tryParseJSON(swapRow.swaps_by_token),
    totalTransactionFeesSOL: swapRow.total_transaction_fees_sol,
    referralFeesByToken: tryParseJSON(swapRow.referral_fees_by_token),
    preSignFailures: tryParseJSON(swapRow.pre_sign_failures),
    postSignFailures: tryParseJSON(swapRow.post_sign_failures),
    extraSwapErrors: tryParseJSON(swapRow.extra_swap_errors),
  };

  // Parse mining metrics from the miningRow.
  const miningMetrics = {
    totalMiningRounds: miningRow.total_mining_rounds,
    successfulMiningRounds: miningRow.successful_mining_rounds,
    failedMiningRounds: miningRow.failed_mining_rounds,
    claimedAmount: miningRow.total_claimed_amount,
    unclaimedAmount: miningRow.total_unclaimed_amount,
    avgHashRate: miningRow.avg_hash_rate,
    totalMiningTimeMin: miningRow.total_mining_time_min,
    boost: miningRow.boost,
    extraMiningData: tryParseJSON(miningRow.extra_mining_data),
  };

  // Print the main header.
  printMessageLinesBorderBox(["=== Pond Statistics ==="], generalStyle);

  // Prepare swap metrics rows.
  const swapRows = [
    { Metric: "Total Swap Rounds", Value: swapMetrics.totalSwapRounds },
    {
      Metric: "Successful Swap Rounds",
      Value: swapMetrics.successfulSwapRounds,
    },
    { Metric: "Failed Swap Rounds", Value: swapMetrics.failedSwapRounds },
    { Metric: "Aborted Swap Rounds", Value: swapMetrics.abortedSwapRounds },
    { Metric: "Total Swap Attempts", Value: swapMetrics.totalSwapAttempts },
    {
      Metric: "Volume by Token",
      Value: JSON.stringify(swapMetrics.volumeByToken, null, 2),
    },
    {
      Metric: "Swaps by Token",
      Value: JSON.stringify(swapMetrics.swapsByToken, null, 2),
    },
    {
      Metric: "Total Transaction Fees (SOL)",
      Value: swapMetrics.totalTransactionFeesSOL.toFixed(6),
    },
    {
      Metric: "Referral Fees by Token",
      Value: JSON.stringify(swapMetrics.referralFeesByToken, null, 2),
    },
    {
      Metric: "Pre-Sign Failures",
      Value: JSON.stringify(swapMetrics.preSignFailures, null, 2),
    },
    {
      Metric: "Post-Sign Failures",
      Value: JSON.stringify(swapMetrics.postSignFailures, null, 2),
    },
    {
      Metric: "Extra Swap Errors",
      Value: JSON.stringify(swapMetrics.extraSwapErrors, null, 2),
    },
  ];

  // Print the swap metrics table.
  printMessageLinesBorderBox(["--- Swap Metrics ---"], swappingStyle);
  printTable(swapRows, metricTableOptions);

  // Prepare mining metrics rows.
  const miningRows = [
    { Metric: "Total Mining Rounds", Value: miningMetrics.totalMiningRounds },
    {
      Metric: "Successful Mining Rounds",
      Value: miningMetrics.successfulMiningRounds,
    },
    { Metric: "Failed Mining Rounds", Value: miningMetrics.failedMiningRounds },
    { Metric: "Total Claimed Amount", Value: miningMetrics.claimedAmount },
    { Metric: "Total Unclaimed Amount", Value: miningMetrics.unclaimedAmount },
    { Metric: "Average Hash Rate", Value: miningMetrics.avgHashRate },
    {
      Metric: "Total Mining Time (min)",
      Value: miningMetrics.totalMiningTimeMin.toFixed(2),
    },
    { Metric: "Boost", Value: miningMetrics.boost },
    {
      Metric: "Extra Mining Data",
      Value: JSON.stringify(miningMetrics.extraMiningData, null, 2),
    },
  ];

  // Print the mining metrics table.
  printMessageLinesBorderBox(["--- Mining Metrics ---"], miningStyle);
  printTable(miningRows, metricTableOptions);
}

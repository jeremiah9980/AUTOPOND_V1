"use strict";
// metrics.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.overallMetrics = void 0;
exports.accumulateSwapMetrics = accumulateSwapMetrics;
exports.viewPondStatistics = viewPondStatistics;
const print_1 = require("../ui/print");
const swapMetricsDb_1 = require("../db/swapMetricsDb");
const helpers_1 = require("../utils/helpers");
const borderboxstyles_1 = require("../ui/styles/borderboxstyles");
const mineMetricsDb_1 = require("../db/mineMetricsDb");
const printtable_1 = require("../ui/tables/printtable");
const tableStyles_1 = require("../ui/styles/tableStyles");
/**
 * Global overall metrics accumulator.
 */
exports.overallMetrics = {
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
        postSignFailures: { slippageTolerance: 0, transactionReverted: 0, other: 0 },
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
 * -----------------------
 * Merges the metrics from a single swap cycle into overall swapMetrics.
 *
 * @param {SwapCycleMetrics} current - The swap metrics from the current cycle to be accumulated.
 * @returns {void}
 */
function accumulateSwapMetrics(current) {
    const overall = exports.overallMetrics.swapMetrics;
    // Accumulate simple numeric fields.
    (0, helpers_1.accumulateNumericField)(overall, current, [
        "totalSwapRounds",
        "successfulSwapRounds",
        "failedSwapRounds",
        "abortedSwapRounds",
        "totalSwapAttempts",
        "totalTransactionFeesSOL",
    ]);
    // Accumulate dictionary-based fields.
    (0, helpers_1.accumulateDictionary)(overall.volumeByToken, current.volumeByToken);
    (0, helpers_1.accumulateDictionary)(overall.referralFeesByToken, current.referralFeesByToken);
    (0, helpers_1.accumulateDictionary)(overall.extraSwapErrors, current.extraSwapErrors);
    // Accumulate preSignFailures and postSignFailures.
    (0, helpers_1.accumulateDictionary)(overall.preSignFailures, current.preSignFailures);
    (0, helpers_1.accumulateDictionary)(overall.postSignFailures, current.postSignFailures);
    // Accumulate swapsByToken if present.
    if (current.swapsByToken) {
        overall.swapsByToken = overall.swapsByToken || {};
        (0, helpers_1.accumulateDictionary)(overall.swapsByToken, current.swapsByToken);
    }
}
/**
 * viewPondStatistics
 * ------------------
 * Reads metrics from the swap_metrics and mining_metrics tables,
 * parses the JSON fields, and prints out the statistics in a formatted table display.
 *
 * @returns {Promise<void>} A promise that resolves when the metrics have been displayed.
 */
async function viewPondStatistics() {
    // Read the swap metrics row from the database.
    const swapRow = (0, swapMetricsDb_1.readSwapMetrics)();
    if (!swapRow) {
        (0, print_1.printMessageLinesBorderBox)(["❌ No data found in swap_metrics table."], borderboxstyles_1.warningStyle);
        return;
    }
    // Read the mining metrics row from the database.
    const miningRow = (0, mineMetricsDb_1.readMiningMetrics)();
    if (!miningRow) {
        (0, print_1.printMessageLinesBorderBox)(["❌ No data found in mining_metrics table."], borderboxstyles_1.warningStyle);
        return;
    }
    // Parse swap metrics from the swapRow.
    const swapMetrics = {
        totalSwapRounds: swapRow.total_swap_rounds,
        successfulSwapRounds: swapRow.successful_swap_rounds,
        failedSwapRounds: swapRow.failed_swap_rounds,
        abortedSwapRounds: swapRow.aborted_swap_rounds,
        totalSwapAttempts: swapRow.total_swap_attempts,
        volumeByToken: (0, helpers_1.tryParseJSON)(swapRow.volume_by_token),
        swapsByToken: (0, helpers_1.tryParseJSON)(swapRow.swaps_by_token),
        totalTransactionFeesSOL: swapRow.total_transaction_fees_sol,
        referralFeesByToken: (0, helpers_1.tryParseJSON)(swapRow.referral_fees_by_token),
        preSignFailures: (0, helpers_1.tryParseJSON)(swapRow.pre_sign_failures),
        postSignFailures: (0, helpers_1.tryParseJSON)(swapRow.post_sign_failures),
        extraSwapErrors: (0, helpers_1.tryParseJSON)(swapRow.extra_swap_errors),
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
        extraMiningData: (0, helpers_1.tryParseJSON)(miningRow.extra_mining_data),
    };
    // Print the main header.
    (0, print_1.printMessageLinesBorderBox)(["=== Pond Statistics ==="], borderboxstyles_1.generalStyle);
    // Prepare swap metrics rows.
    const swapRows = [
        { Metric: "Total Swap Rounds", Value: swapMetrics.totalSwapRounds },
        { Metric: "Successful Swap Rounds", Value: swapMetrics.successfulSwapRounds },
        { Metric: "Failed Swap Rounds", Value: swapMetrics.failedSwapRounds },
        { Metric: "Aborted Swap Rounds", Value: swapMetrics.abortedSwapRounds },
        { Metric: "Total Swap Attempts", Value: swapMetrics.totalSwapAttempts },
        { Metric: "Volume by Token", Value: swapMetrics.volumeByToken },
        { Metric: "Swaps by Token", Value: swapMetrics.swapsByToken },
        { Metric: "Total Transaction Fees (SOL)", Value: swapMetrics.totalTransactionFeesSOL.toFixed(6) },
        { Metric: "Referral Fees by Token", Value: swapMetrics.referralFeesByToken },
        { Metric: "Pre-Sign Failures", Value: swapMetrics.preSignFailures },
        { Metric: "Post-Sign Failures", Value: swapMetrics.postSignFailures },
        { Metric: "Extra Swap Errors", Value: swapMetrics.extraSwapErrors },
    ];
    // Print the swap metrics table.
    (0, print_1.printMessageLinesBorderBox)(["--- Swap Metrics ---"], borderboxstyles_1.swappingStyle);
    (0, printtable_1.printTable)(swapRows, tableStyles_1.metricTableOptions);
    // Prepare mining metrics rows.
    const miningRows = [
        { Metric: "Total Mining Rounds", Value: miningMetrics.totalMiningRounds },
        { Metric: "Successful Mining Rounds", Value: miningMetrics.successfulMiningRounds },
        { Metric: "Failed Mining Rounds", Value: miningMetrics.failedMiningRounds },
        { Metric: "Total Claimed Amount", Value: miningMetrics.claimedAmount },
        { Metric: "Total Unclaimed Amount", Value: miningMetrics.unclaimedAmount },
        { Metric: "Average Hash Rate", Value: miningMetrics.avgHashRate },
        { Metric: "Total Mining Time (min)", Value: miningMetrics.totalMiningTimeMin.toFixed(2) },
        { Metric: "Boost", Value: miningMetrics.boost },
        { Metric: "Extra Mining Data", Value: miningMetrics.extraMiningData },
    ];
    // Print the mining metrics table.
    (0, print_1.printMessageLinesBorderBox)(["--- Mining Metrics ---"], borderboxstyles_1.miningStyle);
    (0, printtable_1.printTable)(miningRows, tableStyles_1.metricTableOptions);
}

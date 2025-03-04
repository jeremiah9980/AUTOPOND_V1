"use strict";
/**
 * @file runswap.ts
 * @description Executes the swap process by navigating to the swap page and initiating the swap.
 * In case of errors, it returns a SwapCycleMetrics object with error details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSwap = runSwap;
const print_1 = require("../print");
const borderboxstyles_1 = require("../styles/borderboxstyles");
const swapping_1 = require("../../swapping");
/**
 * Runs the swap process.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 * @param config - The swap configuration.
 * @returns A promise resolving to a SwapCycleMetrics object with swap metrics.
 */
async function runSwap(page, browser, config) {
    // Navigate to the swap page.
    (0, print_1.printMessageLinesBorderBox)(["🔄 Navigating to swap page..."], borderboxstyles_1.swappingStyle);
    try {
        await page.goto("https://pond0x.com/swap/solana?ref=JNp6Qzei1n1MpLKAoQcE6LQaWVnkYDoPo9buoocCQU1SaYVYLsL79V9gu79Z", { waitUntil: "networkidle0", timeout: 60000 });
        // Initiate the swap process.
        (0, print_1.printMessageLinesBorderBox)(["🤝 Initiating swap process..."], borderboxstyles_1.swappingStyle);
        return await (0, swapping_1.swappond)(page, browser, config);
    }
    catch (error) {
        (0, print_1.printMessageLinesBorderBox)(["Critical error in runSwap (navigation or setup failed):"], borderboxstyles_1.warningStyle);
        return {
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
            extraSwapErrors: {
                [error instanceof Error ? error.message : "navigation/setup failure"]: 1,
            },
        };
    }
}

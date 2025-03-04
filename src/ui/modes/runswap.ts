/**
 * @file runswap.ts
 * @description Executes the swap process by navigating to the swap page and initiating the swap.
 * In case of errors, it returns a SwapCycleMetrics object with error details.
 */

import { Browser, Page } from "puppeteer";
import { printMessageLinesBorderBox } from "../print";
import { SwapConfig } from "../../types/config";
import { swappingStyle, warningStyle } from "../styles/borderboxstyles";
import { swappond } from "../../swapping";
import { SwapCycleMetrics } from "../../metrics/metrics";

/**
 * Runs the swap process.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 * @param config - The swap configuration.
 * @returns A promise resolving to a SwapCycleMetrics object with swap metrics.
 */
export async function runSwap(
  page: Page,
  browser: Browser,
  config: SwapConfig
): Promise<SwapCycleMetrics> {
  // Navigate to the swap page.
  printMessageLinesBorderBox(["🔄 Navigating to swap page..."], swappingStyle);
  try {
    await page.goto(
      "https://pond0x.com/swap/solana?ref=JNp6Qzei1n1MpLKAoQcE6LQaWVnkYDoPo9buoocCQU1SaYVYLsL79V9gu79Z",
      { waitUntil: "networkidle0", timeout: 60000 }
    );

    // Initiate the swap process.
    printMessageLinesBorderBox(["🤝 Initiating swap process..."], swappingStyle);
    return await swappond(page, browser, config);
  } catch (error) {
    printMessageLinesBorderBox(
      ["Critical error in runSwap (navigation or setup failed):"],
      warningStyle
    );
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

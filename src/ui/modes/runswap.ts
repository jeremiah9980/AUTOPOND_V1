import { Browser, Page } from "puppeteer";
import { printMessageLinesBorderBox } from "../print";
import { SwapConfig } from "../../types/config";
import { swappingStyle, warningStyle } from "../styles/borderboxstyles";
import { swappond } from "../../swapping";
import { SwapCycleMetrics } from "../../metrics/metrics";

/**
 * runSwap
 * -------
 * Navigates to the swap page, initiates the swap process using the provided configuration,
 * and returns the swap cycle metrics. In case of a navigation or setup failure, it logs a warning
 * and returns an empty metrics object with an error noted in extraSwapErrors.
 *
 * @param {Page} page - The Puppeteer Page object used for browser interactions.
 * @param {Browser} browser - The Puppeteer Browser instance.
 * @param {SwapConfig} config - Configuration parameters for the swap operation.
 * @returns {Promise<SwapCycleMetrics>} A promise that resolves to the metrics for the current swap cycle.
 */
export async function runSwap(
  page: Page,
  browser: Browser,
  config: SwapConfig
): Promise<SwapCycleMetrics> {
  // Navigate to the swap page and indicate process initiation.
  printMessageLinesBorderBox(["🔄 Navigating to swap page..."], swappingStyle);
  try {
    await page.goto(
      "https://pond0x.com/swap/solana?ref=JNp6Qzei1n1MpLKAoQcE6LQaWVnkYDoPo9buoocCQU1SaYVYLsL79V9gu79Z",
      { waitUntil: "networkidle0", timeout: 60000 }
    );
    
    // Indicate that the swap process is about to begin.
    printMessageLinesBorderBox(["🤝 Initiating swap process..."], swappingStyle);
    
    // Call the swappond function to perform the swap process and return the resulting metrics.
    return await swappond(page, browser, config);
  } catch (error) {
    // Log a critical error if navigation or swap setup fails.
    printMessageLinesBorderBox(
      ["Critical error in runSwap (navigation or setup failed):"],
      warningStyle
    );
    
    // Return an empty metrics object with an error recorded in extraSwapErrors.
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

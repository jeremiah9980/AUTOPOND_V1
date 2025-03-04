/**
 * @file swapping.ts
 * @description This module handles the swapping logic for the Pond0x platform.
 * It includes on‐chain helper functions for interacting with Solana (via @solana/web3.js)
 * and automates UI interactions with Puppeteer. Console output is styled with chalk
 * using our unified print functions.
 */

import { Browser, Page } from "puppeteer";
import { d, pickRandom } from "./utils/helpers";
import chalk from "chalk";
import { Connection } from "@solana/web3.js";
import { SwapCycleMetrics, accumulateSwapMetrics } from "./metrics/metrics";
import { SwapConfig } from "./types/config";
import {
  printMessageLinesBorderBox,
  printSessionEndReport,
  buildOsc8Hyperlink,
  printSwapSummary,
} from "./ui/print";
import {
  getPhantomPublicKey,
  getSolBalance,
  getSplBalance,
  checkRecentWpondTransfer,
} from "./solana";
import { updateAggregatedSwapMetrics } from "./db/swapMetricsDb";
import {
  generalStyle,
  phantomStyle,
  swappingStyle,
  warningStyle,
} from "./ui/styles/borderboxstyles";
import {
  clickSelectorWtxt,
  getBoundingBox,
  outputTokenSelect,
  inputTokenSelect,
  wadapt,
  setSwapAmount,
  setMaxTx,
  swapBtn,
} from "./utils/pagehandlers";
import { handlephanpopup } from "./phantom";

// Global state for tracking current token configuration.
let currentFromToken: string;
let currentFromMint: string | undefined;
let currentThreshold: number;
let currentFromPossibleAmounts: number[];
let currentFromRewardAmounts: number[];
let currentOutputToken: string;
let currentOutputMint: string | undefined;
let currentOutputPossibleAmounts: number[];
let currentOutputRewardAmounts: number[];

// Global wallet address from the connected Phantom wallet.
let userpublickey: string;

// Global flags for turboswap mode.
let tokensAlreadySelected = false;
let swapAmountEntered = false;

/**
 * connectwallet:
 * Connects the Phantom wallet and sets the global wallet address.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 */
export const connectwallet = async (page: Page, browser: Browser) => {
  printMessageLinesBorderBox(
    ["💼 Starting wallet connection..."],
    phantomStyle
  );
  await d(1000);
  await wadapt(page);
  await d(3000);
  await handlephanpopup(page, browser, "Connect", "Phantom\nDetected");

  // Retrieve and store the connected wallet's public key.
  userpublickey = await getPhantomPublicKey(page);
  printMessageLinesBorderBox(
    ["👻 Phantom wallet connected", `${userpublickey}`],
    phantomStyle
  );
};

/**
 * flipTokenDirection:
 * Helper function to swap the current input and output token configurations.
 * Also resets flags so that new token selection and swap amount entry occur.
 *
 * @param config - The swap configuration.
 */
function flipTokenDirection(config: SwapConfig): void {
  const tempToken = currentFromToken;
  const tempMint = currentFromMint;
  const tempPossible = currentFromPossibleAmounts;
  const tempReward = currentFromRewardAmounts;

  currentFromToken = currentOutputToken;
  currentFromMint = currentOutputMint;
  currentThreshold =
    currentFromToken === config.tokenA
      ? config.tokenALowThreshold
      : config.tokenBLowThreshold;
  currentFromPossibleAmounts =
    currentFromToken === config.tokenA
      ? config.tokenAPossibleAmounts
      : config.tokenBPossibleAmounts;
  currentFromRewardAmounts =
    currentFromToken === config.tokenA
      ? config.tokenARewardAmounts
      : config.tokenBRewardAmounts;

  currentOutputToken = tempToken;
  currentOutputMint = tempMint;
  currentOutputPossibleAmounts = tempPossible;
  currentOutputRewardAmounts = tempReward;

  // Reset flags for new token direction.
  tokensAlreadySelected = false;
  swapAmountEntered = false;
}

/**
 * swappingroutine:
 * Attempts one swap round with optional turboswap mode.
 * In turboswap mode, token selection and swap amount entry may be skipped if already done.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 * @param fromToken - The input token symbol.
 * @param toToken - The output token symbol.
 * @param amount - The amount to swap (as a string).
 * @param turboswap - If true, enables turboswap mode.
 * @returns An object indicating swap success, any error type, and swap details.
 */
const swappingroutine = async (
  page: Page,
  browser: Browser,
  fromToken: string,
  toToken: string,
  amount: string,
  turboswap: boolean
): Promise<{ success: boolean; errorType?: string; swapDetails?: any }> => {
  await d(2000);

  // In turboswap mode, perform token selection only if not already selected.
  if (!(turboswap && tokensAlreadySelected)) {
    if (fromToken !== "SOL") {
      await inputTokenSelect(page);
      await d(2000);
      await clickSelectorWtxt(page, "li", fromToken);
    }
    await outputTokenSelect(page);
    await d(3000);
    await clickSelectorWtxt(page, "li", toToken);
    if (turboswap) tokensAlreadySelected = true;
  }

  let txSuccessObj: { success: boolean; errorType?: string };

  // Enter the swap amount if needed.
  if (!turboswap || (turboswap && !swapAmountEntered)) {
    txSuccessObj = (await setSwapAmount(page, amount))
      ? await signtxloop(page, browser)
      : { success: false, errorType: "other" };
    if (turboswap) swapAmountEntered = true;
  } else {
    txSuccessObj = await signtxloop(page, browser);
  }

  const swapDetails = { from: fromToken, to: toToken, amount };
  return {
    success: txSuccessObj.success,
    errorType: txSuccessObj.success ? undefined : txSuccessObj.errorType,
    swapDetails,
  };
};

/**
 * swappond:
 * Main function for executing multiple swap rounds with up to 3 retries per round.
 * Metrics are captured per round, updated in the database, and accumulated in memory.
 * Global flags are reset at the start of each run.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 * @param config - The swap configuration.
 * @returns A promise resolving to the aggregated SwapCycleMetrics.
 */
export const swappond = async (
  page: Page,
  browser: Browser,
  config: SwapConfig
): Promise<SwapCycleMetrics> => {
  // Reset global flags.
  tokensAlreadySelected = false;
  swapAmountEntered = false;

  const metrics: SwapCycleMetrics = {
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
  };

  try {
    // Rewards check section.
    if (config.enableRewardsCheck) {
      const rewardsActive = await checkRecentWpondTransfer();
      config.swapRewardsActive = rewardsActive;
      printMessageLinesBorderBox(
        [
          rewardsActive
            ? "Rewards mode ACTIVE – reward amounts will be used."
            : "Rewards mode NOT active – normal amounts will be used.",
        ],
        rewardsActive ? generalStyle : warningStyle
      );
      if (!rewardsActive && config.skipSwapIfNoRewards) {
        printMessageLinesBorderBox(
          ["Rewards are not active. Skipping swap round."],
          warningStyle
        );
        return metrics;
      }
    } else {
      config.swapRewardsActive = false;
    }

    // Locate the "You Pay" field bounding box.
    const maybeBbox = await getBoundingBox(
      page,
      ".py-5.px-4.flex.flex-col.dark\\:text-white",
      "You Pay"
    );
    if (!maybeBbox)
      throw new Error('Could not locate bounding box for "You Pay" field.');
    const { bboxX, bboxY } = maybeBbox;

    await setMaxTx(page);

    // Initialize global token configuration.
    currentFromToken = config.tokenA;
    currentFromMint = config.tokenAMint;
    currentThreshold = config.tokenALowThreshold;
    currentFromPossibleAmounts = config.tokenAPossibleAmounts;
    currentFromRewardAmounts = config.tokenARewardAmounts;
    currentOutputToken = config.tokenB;
    currentOutputMint = config.tokenBMint;
    currentOutputPossibleAmounts = config.tokenBPossibleAmounts;
    currentOutputRewardAmounts = config.tokenBRewardAmounts;

    // Reset flags for token selection.
    tokensAlreadySelected = false;
    swapAmountEntered = false;

    // Process each swap round.
    for (let round = 0; round < config.swapRounds; round++) {
      printMessageLinesBorderBox(
        [`=== Starting Swap Round ${round + 1} of ${config.swapRounds} ===`],
        swappingStyle
      );

      const currentBalance = await getRealBalance(
        page,
        currentFromToken,
        currentFromMint
      );
      const balanceStatus =
        currentBalance < currentThreshold
          ? `${currentFromToken} balance below threshold`
          : `${currentFromToken} balance is sufficient`;

      // Determine the swap amount.
      let chosenAmount: number;
      if (config.turboswap) {
        const amountsArray = config.swapRewardsActive
          ? currentFromRewardAmounts
          : currentFromPossibleAmounts;
        chosenAmount = amountsArray[0];
      } else {
        chosenAmount = pickRandom(
          config.swapRewardsActive
            ? currentFromRewardAmounts
            : currentFromPossibleAmounts
        );
      }

      printMessageLinesBorderBox(
        [
          `Current ${currentFromToken} balance: ${currentBalance}`,
          balanceStatus,
          `Chosen amount: ${chosenAmount}`,
        ],
        swappingStyle
      );

      // If balance is below threshold, flip token direction.
      if (currentBalance < currentThreshold) {
        flipTokenDirection(config);
        printMessageLinesBorderBox(
          [
            `Flipped. Now fromToken: ${currentFromToken}, toToken: ${currentOutputToken}`,
          ],
          swappingStyle
        );
        if (!config.turboswap) {
          chosenAmount = pickRandom(
            config.swapRewardsActive
              ? currentFromRewardAmounts
              : currentFromPossibleAmounts
          );
          printMessageLinesBorderBox(
            [`New chosen amount after flip: ${chosenAmount}`],
            swappingStyle
          );
        } else {
          const newAmountsArray = config.swapRewardsActive
            ? currentFromRewardAmounts
            : currentFromPossibleAmounts;
          chosenAmount = newAmountsArray[0];
          printMessageLinesBorderBox(
            [`Reusing chosen amount after flip: ${chosenAmount}`],
            swappingStyle
          );
        }
      }

      let attempts = 0;
      let roundSuccess = false;
      let feeSOL = 0;
      let referralFee = 0;
      let pair = "";

      // Retry loop for the current round.
      while (attempts < 3 && !roundSuccess) {
        attempts++;
        metrics.totalSwapAttempts++;
        printMessageLinesBorderBox(
          [`🔁 Attempt ${attempts} for round ${round + 1}`],
          generalStyle
        );

        const swapResult = await swappingroutine(
          page,
          browser,
          currentFromToken,
          currentOutputToken,
          chosenAmount.toString(),
          config.turboswap
        );

        if (!swapResult.success) {
          const errorKey = swapResult.errorType || "unknown";
          metrics.extraSwapErrors[errorKey] =
            (metrics.extraSwapErrors[errorKey] || 0) + 1;
          if (swapResult.errorType === "insufficient") {
            metrics.preSignFailures.insufficient++;
            printMessageLinesBorderBox(
              ["Pre-sign failure: insufficient balance"],
              warningStyle
            );
          } else if (
            swapResult.errorType &&
            swapResult.errorType.startsWith("postSign")
          ) {
            if (swapResult.errorType === "postSignSlippage") {
              metrics.postSignFailures.slippageTolerance++;
            } else if (swapResult.errorType === "postSignError") {
              metrics.postSignFailures.transactionReverted++;
            } else {
              metrics.postSignFailures.other++;
            }
            printMessageLinesBorderBox(
              [`Post-sign failure: ${swapResult.errorType}`],
              warningStyle
            );
          } else {
            metrics.preSignFailures.other++;
            printMessageLinesBorderBox(
              [`Pre-sign failure: ${swapResult.errorType || "unknown"}`],
              warningStyle
            );
          }
          await d(1500);
          continue;
        }

        // Attempt to retrieve the Solscan transaction URL.
        let solscanUrl: string | null = null;
        try {
          await page.waitForSelector("a[href*='solscan.io/tx/']", {
            timeout: 60000,
          });
          solscanUrl = await page.evaluate(() => {
            const anchor = document.querySelector(
              "a[href*='solscan.io/tx/']"
            ) as HTMLAnchorElement;
            return anchor ? anchor.href : null;
          });
        } catch (error) {
          const swapButtonText = await page.evaluate(() => {
            const button = document.querySelector(
              ".swapbtn"
            ) as HTMLButtonElement;
            return button ? button.innerText : "";
          });
          if (swapButtonText.toLowerCase().includes("swapping")) {
            printMessageLinesBorderBox(
              ["⏰ Swap still in progress after 1 minute. Reloading page..."],
              warningStyle
            );
            await page.reload();
            continue;
          } else {
            printMessageLinesBorderBox(
              ["❌ Timeout: Solscan TX could not be found (aggregator fail)."],
              warningStyle
            );
          }
        }

        if (solscanUrl) {
          roundSuccess = true;
          metrics.successfulSwapRounds++;
          metrics.volumeByToken[currentFromToken] =
            (metrics.volumeByToken[currentFromToken] || 0) + chosenAmount;
          pair = `${currentFromToken.toUpperCase()}-${currentOutputToken.toUpperCase()}`;
          metrics.swapsByToken[pair] = (metrics.swapsByToken[pair] || 0) + 1;

          const clickableLink = buildOsc8Hyperlink(
            solscanUrl,
            "View Solscan Transaction"
          );
          printMessageLinesBorderBox([clickableLink], generalStyle);

          const parts = solscanUrl.split("/tx/");
          const txNumber = parts.length > 1 ? parts[1] : solscanUrl;
          try {
            const connection = new Connection(
              "https://api.mainnet-beta.solana.com",
              "confirmed"
            );
            const parsedTx = await connection.getParsedTransaction(txNumber, {
              maxSupportedTransactionVersion: 0,
            });
            const { feeSOL: txFeeSOL, referralFee: txReferralFee } =
              await printSwapSummary(
                parsedTx,
                {
                  from: currentFromToken,
                  to: currentOutputToken,
                  amount: chosenAmount.toString(),
                },
                currentFromMint,
                currentOutputMint,
                userpublickey
              );
            feeSOL = txFeeSOL;
            referralFee = txReferralFee;
            metrics.totalTransactionFeesSOL += feeSOL;
            metrics.referralFeesByToken[currentFromToken] =
              (metrics.referralFeesByToken[currentFromToken] || 0) +
              referralFee;
          } catch (txError) {
            console.log(chalk.red(`Error fetching TX data: ${txError}`));
          }
        }
      } // end while attempts

      metrics.totalSwapRounds++;
      if (!roundSuccess) {
        metrics.failedSwapRounds++;
        printMessageLinesBorderBox(
          [`❌ Round ${round + 1} failed after 3 attempts.`],
          warningStyle
        );
      }

      // Update persistent cumulative metrics in DB for this round.
      updateAggregatedSwapMetrics({
        totalSwapRounds: 1,
        successfulSwapRounds: roundSuccess ? 1 : 0,
        failedSwapRounds: roundSuccess ? 0 : 1,
        abortedSwapRounds: 0,
        totalSwapAttempts: attempts,
        totalTransactionFeesSOL: feeSOL,
        volumeByToken: roundSuccess ? { [currentFromToken]: chosenAmount } : {},
        swapsByToken: roundSuccess ? { [pair]: 1 } : {},
        referralFeesByToken: roundSuccess
          ? { [currentFromToken]: referralFee }
          : {},
        preSignFailures: { ...metrics.preSignFailures },
        postSignFailures: { ...metrics.postSignFailures },
        extraSwapErrors: { ...metrics.extraSwapErrors },
      });

      // Reset round-specific counters.
      metrics.preSignFailures = { insufficient: 0, userAbort: 0, other: 0 };
      metrics.postSignFailures = {
        slippageTolerance: 0,
        transactionReverted: 0,
        other: 0,
      };
      metrics.extraSwapErrors = {};

      if (roundSuccess) await d(2000);
    } // end for rounds
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    printMessageLinesBorderBox(
      ["Error in swappond setup:", errorMessage],
      warningStyle
    );
    metrics.extraSwapErrors[errorMessage] = 1;
  }

  // Update global in-memory metrics.
  accumulateSwapMetrics(metrics);

  const summaryReport = {
    "Total Swap Rounds": metrics.totalSwapRounds,
    "Successful Swap Rounds": metrics.successfulSwapRounds,
    "Failed Swap Rounds": metrics.failedSwapRounds,
    "Aborted Swap Rounds":
      metrics.preSignFailures.insufficient +
      metrics.preSignFailures.userAbort +
      metrics.preSignFailures.other,
    "Total Swap Attempts": metrics.totalSwapAttempts,
    "Volume by Token": metrics.volumeByToken,
    "Total Transaction Fees (SOL)": metrics.totalTransactionFeesSOL.toFixed(6),
    "Referral Fees by Token": metrics.referralFeesByToken,
    "Pre-Sign Failures": metrics.preSignFailures,
    "Post-Sign Failures": metrics.postSignFailures,
    "Extra Swap Errors": metrics.extraSwapErrors,
  };
  printSessionEndReport("Swap Cycle Metrics", summaryReport);

  return metrics;
};

/**
 * getRealBalance:
 * Retrieves the on‐chain balance for the specified token using the connected wallet's public key.
 *
 * @param page - The Puppeteer page instance.
 * @param tokenSymbol - The token symbol (e.g. "SOL").
 * @param tokenMint - The SPL token mint address (if applicable).
 * @returns A promise that resolves to the token balance.
 */
async function getRealBalance(
  page: Page,
  tokenSymbol: string,
  tokenMint?: string
): Promise<number> {
  if (tokenSymbol === "SOL") {
    return await getSolBalance(userpublickey);
  } else {
    if (!tokenMint)
      throw new Error(`No mint address provided for SPL token: ${tokenSymbol}`);
    return await getSplBalance(userpublickey, tokenMint);
  }
}

/**
 * signtx:
 * Inside the Phantom pop-up, either dismisses warnings or approves the transaction.
 *
 * @param page - The Puppeteer page instance (representing the Phantom pop-up).
 * @returns A promise that resolves to the result message from the signing action.
 */
const signtx = async (page: Page): Promise<string> => {
  await d(5000);
  const resultMsg: string = await page.evaluate(() => {
    const warningContainer = document.querySelector(
      '[data-testid="warning-container"]'
    );
    if (warningContainer) {
      const secondaryButton = document.querySelector(
        '[data-testid="secondary-button"]'
      ) as HTMLButtonElement;
      secondaryButton?.click();
      return warningContainer.textContent?.trim() || "";
    } else {
      const primaryButton = document.querySelector(
        '[data-testid="primary-button"]'
      ) as HTMLButtonElement;
      if (primaryButton) {
        primaryButton.click();
        return "Transaction approved";
      }
      return "";
    }
  });
  return resultMsg;
};

/**
 * signtxloop:
 * Repeatedly attempts to sign the transaction in Phantom, checking for errors or an approval message.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 * @returns A promise resolving to an object indicating success and, if applicable, the error type.
 */
export const signtxloop = async (
  page: Page,
  browser: Browser
): Promise<{ success: boolean; errorType?: string }> => {
  const startTime = Date.now();
  let signed = false;
  let attempts = 0;
  const maxAttempts = 5;
  let lastWarning = "";

  printMessageLinesBorderBox(
    ["⏳ Waiting for transaction signature..."],
    phantomStyle
  );

  while (!signed && attempts < maxAttempts) {
    if (Date.now() - startTime > 30000) {
      printMessageLinesBorderBox(
        ["⏰ Timeout reached. Reloading page..."],
        warningStyle
      );
      await page.reload();
      break;
    }

    attempts++;
    printMessageLinesBorderBox(
      [`🔁 Attempt ${attempts} for signature...`],
      generalStyle
    );

    let popup: Page | null = null;
    try {
      popup = await new Promise<Page>(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          browser.off("targetcreated", onTargetCreated);
          reject(new Error("No popup opened within 10s"));
        }, 10000);

        const onTargetCreated = async (target: any) => {
          clearTimeout(timeoutId);
          browser.off("targetcreated", onTargetCreated);
          resolve(await target.page());
        };

        browser.on("targetcreated", onTargetCreated);
        swapBtn(page).catch((err) => {
          clearTimeout(timeoutId);
          browser.off("targetcreated", onTargetCreated);
          reject(err);
        });
      });
    } catch (e: any) {
      printMessageLinesBorderBox(
        [`❌ Error creating popup: ${e.message}`],
        warningStyle
      );
      return { success: false, errorType: "other" };
    }

    let resultMsg = "";
    try {
      resultMsg = await signtx(popup!);
      printMessageLinesBorderBox(
        [`📝 Sign message: ${resultMsg}`],
        phantomStyle
      );
    } catch (e) {
      printMessageLinesBorderBox(["❌ Error during signing."], warningStyle);
      return { success: false, errorType: "other" };
    }

    const lowerMsg = resultMsg.toLowerCase();
    if (
      lowerMsg.includes("insufficient balance") ||
      lowerMsg.includes("does not have enough sol")
    ) {
      printMessageLinesBorderBox(
        ["⚠️ Insufficient balance detected."],
        warningStyle
      );
      lastWarning = lowerMsg;
      return { success: false, errorType: "insufficient" };
    }

    if (lowerMsg.includes("transaction approved")) {
      printMessageLinesBorderBox(["✅ Transaction approved."], phantomStyle);
      signed = true;
      break;
    }

    if (
      lowerMsg.includes("transaction reverted") ||
      lowerMsg.includes("slippage tolerance exceeded") ||
      lowerMsg.includes("retry")
    ) {
      printMessageLinesBorderBox(
        [`⚠️ Transient error: ${lowerMsg}. Retrying...`],
        warningStyle
      );
      try {
        await popup!.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const retryButton = buttons.find((btn) =>
            btn.innerText.toLowerCase().includes("retry")
          );
          retryButton?.click();
        });
      } catch (e) {
        printMessageLinesBorderBox(["❌ Error during retry."], warningStyle);
        return { success: false, errorType: "other" };
      }
      lastWarning = lowerMsg;
      await d(1000);
      continue;
    }

    if (lowerMsg === "") {
      await d(1000);
      continue;
    }

    lastWarning = lowerMsg;
    await d(1000);
    browser.removeAllListeners("targetcreated");
  }

  if (!signed) {
    const isInsufficient =
      lastWarning.includes("insufficient") ||
      lastWarning.includes("not enough sol");
    return {
      success: false,
      errorType: isInsufficient ? "insufficient" : "transient",
    };
  }

  const postSignError = await checkForPostSignError(page);
  if (postSignError) {
    printMessageLinesBorderBox(
      [`⚠️ Post-sign error detected: ${postSignError}`],
      warningStyle
    );
    const lowerPostError = postSignError.toLowerCase();
    if (
      lowerPostError.includes("slippage") ||
      lowerPostError.includes("reverted")
    ) {
      return { success: false, errorType: "postSignSlippage" };
    } else if (
      lowerPostError.includes("fail") ||
      lowerPostError.includes("error")
    ) {
      return { success: false, errorType: "postSignError" };
    } else {
      return { success: false, errorType: "other" };
    }
  }

  return { success: true };
};

/**
 * checkForPostSignError:
 * Checks for any aggregator-level error messages on the main page after the Phantom transaction is approved.
 *
 * @param page - The Puppeteer page instance.
 * @returns A promise resolving to an error message string if an error is found, otherwise null.
 */
async function checkForPostSignError(page: Page): Promise<string | null> {
  await d(2000);
  return page.evaluate(() => {
    const errorElem = document.querySelector(".swap-error-message");
    if (errorElem) {
      return errorElem.textContent?.trim() || null;
    }
    return null;
  });
}

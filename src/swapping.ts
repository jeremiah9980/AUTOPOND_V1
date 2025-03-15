// swapping.ts
// This module handles the swapping logic for the Pond0x platform.
// It includes on‑chain helper functions for interacting with Solana (via @solana/web3.js)
// and automates UI interactions with Puppeteer. Console output is styled with chalk
// via our unified print functions.

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
// tokensAlreadySelected: once tokens are selected, skip token selection on subsequent swaps.
// swapAmountEntered: on the first swap, input the swap amount; later, assume it remains in the UI.
let tokensAlreadySelected = false;
let swapAmountEntered = false;

/**
 * connectwallet
 * -------------
 * Initiates connection to the Phantom wallet by triggering a popup and retrieving the wallet's public key.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @returns {Promise<void>}
 */
export const connectwallet = async (page: Page, browser: Browser): Promise<void> => {
  printMessageLinesBorderBox(["💼 Starting wallet connection..."], phantomStyle);
  await d(1000);
  await wadapt(page);
  await d(3000);
  await handlephanpopup(page, browser, "Connect", "Phantom\nDetected");

  // Get the connected wallet's public key.
  userpublickey = await getPhantomPublicKey(page);

  printMessageLinesBorderBox(
    ["👻 Phantom wallet connected", `${userpublickey}`],
    phantomStyle
  );
};

/**
 * flipTokenDirection
 * ------------------
 * Helper function to swap the current input and output token configurations.
 * Also resets the tokensAlreadySelected and swapAmountEntered flags so that new token selection and amount entry occur.
 *
 * @param {SwapConfig} config - The swap configuration object.
 * @returns {void}
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

  // Reset both flags for the new token direction.
  tokensAlreadySelected = false;
  swapAmountEntered = false;
}

/**
 * swappingroutine
 * ---------------
 * Attempts a single swap and returns an object with the result.
 * If turboswap mode is enabled and tokens have already been selected, token selection is skipped.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @param {string} fromToken - The token symbol to swap from.
 * @param {string} toToken - The token symbol to swap to.
 * @param {string} amount - The swap amount as a string.
 * @param {boolean} turboswap - Flag indicating if turboswap mode is active.
 * @returns {Promise<{ success: boolean; errorType?: string; swapDetails?: any }>} Swap result details.
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

  // Perform token selection if required.
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

  // Enter swap amount based on mode.
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
 * swappond
 * --------
 * Main function to execute multiple swap rounds. For each round, it:
 * - Checks wallet balance,
 * - Chooses a swap amount (using rewards amounts if rewards are active),
 * - Attempts up to 3 swap retries on any failure.
 * Metrics for each round are captured and aggregated.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @param {SwapConfig} config - The swap configuration parameters.
 * @returns {Promise<SwapCycleMetrics>} The aggregated swap cycle metrics.
 */
export const swappond = async (
  page: Page,
  browser: Browser,
  config: SwapConfig
): Promise<SwapCycleMetrics> => {
  // Reset global flags at the start of a run.
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
    // Rewards check section: if enabled, check recent WPOND transfer.
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

      // Exit early if rewards are not active and skipping is desired.
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

    // Get the bounding box for the "You Pay" field as a prerequisite.
    const maybeBbox = await getBoundingBox(
      page,
      ".py-5.px-4.flex.flex-col.dark\\:text-white",
      "You Pay"
    );
    if (!maybeBbox)
      throw new Error('Could not locate bounding box for "You Pay" field.');
    const { bboxX, bboxY } = maybeBbox;

    await setMaxTx(page, config.maxReferralFee);

    // Initialize token configurations.
    currentFromToken = config.tokenA;
    currentFromMint = config.tokenAMint;
    currentThreshold = config.tokenALowThreshold;
    currentFromPossibleAmounts = config.tokenAPossibleAmounts;
    currentFromRewardAmounts = config.tokenARewardAmounts;
    currentOutputToken = config.tokenB;
    currentOutputMint = config.tokenBMint;
    currentOutputPossibleAmounts = config.tokenBPossibleAmounts;
    currentOutputRewardAmounts = config.tokenBRewardAmounts;

    // Reset token selection flag for this cycle.
    tokensAlreadySelected = false;
    swapAmountEntered = false;

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

      // Determine the chosen swap amount.
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

      // If balance is below threshold, flip the token direction.
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

        let solscanUrl: string | null = null;
        try {
          // Wait concurrently for either the Solscan TX link or an error message.
          const successSelector = "a[href*='solscan.io/tx/']";
          const errorSelector =
            "#jupiter-terminal > form > div > div.w-full.px-2 > div.flex.flex-col.h-full.w-full.mt-2 > div > div > p";

          const successPromise = page.waitForSelector(successSelector, { timeout: 60000 });
          const errorPromise = page.waitForSelector(errorSelector, { timeout: 60000 });

          // Proceed with whichever element appears first.
          const element = await Promise.race([successPromise, errorPromise]);

          if (!element) {
            throw new Error("No element found for either selector.");
          }

          // Determine if the element matches the error selector.
          const isErrorElement = await page.evaluate(
            (el, errorSelector) => el ? el.matches(errorSelector) : false,
            element,
            errorSelector
          );

          if (isErrorElement) {
            const errorText = await page.evaluate(el => el ? el.innerText : "", element);
            throw new Error(errorText);
          } else {
            solscanUrl = await page.evaluate(el => (el as HTMLAnchorElement).href, element);
          }
        } catch (error) {
          const swapButtonText = await page.evaluate(() => {
            const button = document.querySelector(".swapbtn") as HTMLButtonElement;
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
              (metrics.referralFeesByToken[currentFromToken] || 0) + referralFee;
          } catch (txError) {
            console.log(chalk.red(`Error fetching TX data: ${txError}`));
          }
        }
      } // End of while attempts loop.

      metrics.totalSwapRounds++;
      if (!roundSuccess) {
        metrics.failedSwapRounds++;
        printMessageLinesBorderBox(
          [`❌ Round ${round + 1} failed after 3 attempts.`],
          warningStyle
        );
      }

      // Update persistent cumulative metrics in DB after each round.
      updateAggregatedSwapMetrics({
        totalSwapRounds: 1,
        successfulSwapRounds: roundSuccess ? 1 : 0,
        failedSwapRounds: roundSuccess ? 0 : 1,
        abortedSwapRounds: 0,
        totalSwapAttempts: attempts,
        totalTransactionFeesSOL: feeSOL,
        volumeByToken: roundSuccess ? { [currentFromToken]: chosenAmount } : {},
        swapsByToken: roundSuccess ? { [pair]: 1 } : {},
        referralFeesByToken: roundSuccess ? { [currentFromToken]: referralFee } : {},
        preSignFailures: { ...metrics.preSignFailures },
        postSignFailures: { ...metrics.postSignFailures },
        extraSwapErrors: { ...metrics.extraSwapErrors },
      });

      // Reset round-specific counters.
      metrics.preSignFailures = { insufficient: 0, userAbort: 0, other: 0 };
      metrics.postSignFailures = { slippageTolerance: 0, transactionReverted: 0, other: 0 };
      metrics.extraSwapErrors = {};

      if (roundSuccess) await d(2000);
    } // End of for rounds loop.
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
 * getRealBalance
 * --------------
 * Retrieves the on‑chain balance for the specified token using the connected wallet's public key.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {string} tokenSymbol - The token symbol (e.g., "SOL" or SPL token).
 * @param {string} [tokenMint] - The mint address for SPL tokens; not needed for SOL.
 * @returns {Promise<number>} The current token balance.
 * @throws Will throw an error if no mint address is provided for an SPL token.
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
 * signtx
 * ------
 * Inside Phantom popup, either dismiss or approve the transaction.
 *
 * @param {Page} page - The Puppeteer page instance representing the Phantom popup.
 * @returns {Promise<string>} A string message indicating the result of the transaction signing.
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
 * signtxloop
 * ---------
 * Repeatedly attempts to sign the transaction in Phantom until success or max attempts reached.
 * Checks for errors or "approved" message and handles retries.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @returns {Promise<{ success: boolean; errorType?: string }>} The result of the transaction signing.
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
 * checkForPostSignError
 * -----------------------
 * Looks for any error messages on the main page after the Phantom transaction has been approved.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @returns {Promise<string | null>} A string with the error message, or null if no error is found.
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

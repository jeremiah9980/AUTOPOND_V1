/**
 * @file miningloop.ts
 * @description Automates a mining session by tracking metrics, handling claims,
 * and updating aggregated mining metrics in the database. This function reads LCD values,
 * updates in-memory metrics, and determines when to claim tokens based on configured thresholds.
 */

import { MiningCycleMetrics } from "./metrics/metrics";
import { Browser, Page } from "puppeteer";
import { d, parseFormattedNumber, parseString } from "./utils/helpers";
import { miningStyle, warningStyle } from "./ui/styles/borderboxstyles";
import { printMessageLinesBorderBox } from "./ui/print";
import { clickbyinnertxt } from "./utils/pagehandlers";
import { loadMiningConfig } from "./utils/configloader";
import { updateAggregatedMiningMetrics } from "./db/mineMetricsDb";
import { handlephanpopup } from "./phantom";

/**
 * LCD interface for reading mining page metrics.
 */
export interface LCD {
  CONNECTION: string | null;
  STATUS: string | null;
  UNCLAIMED: string | null;
  TIME: string | null;
  HASHRATE: string | null;
  BOOST?: string | null;
}

// Load the mining configuration.
const miningConfig = loadMiningConfig();

/**
 * Reads elements with the class "lcdbox" on the page and parses their innerText into an LCD object.
 *
 * @param page - The Puppeteer page instance.
 * @returns A promise resolving to an LCD object.
 */
const updatelcd = async (page: Page): Promise<LCD> => {
  const lcd: LCD = await page.evaluate(() => {
    const LCD: LCD = {
      CONNECTION: null,
      STATUS: null,
      UNCLAIMED: null,
      TIME: null,
      HASHRATE: null,
      BOOST: null,
    };
    // Query all elements with class "lcdbox" and parse key-value pairs.
    (Array.from(document.querySelectorAll(".lcdbox")) as HTMLElement[]).forEach(
      (v) => {
        const kv = v.innerText.replace(/\n/g, "").split(":");
        if (kv.length > 1 && kv[0] in LCD) {
          LCD[kv[0] as keyof LCD] = kv[1] || null;
        }
      }
    );
    return LCD;
  });
  return lcd;
};

/**
 * Automates a mining session by tracking metrics, handling claims, and updating the aggregated metrics.
 *
 * @param page - The Puppeteer page instance.
 * @param browser - The Puppeteer browser instance.
 * @returns A promise that resolves to true when the mining loop completes.
 */
export const miningloop = async (page: Page, browser: Browser) => {
  // Display start message and delay before beginning.
  printMessageLinesBorderBox(["Starting mining loop..."], miningStyle);
  await d(miningConfig.initialDelayMs);

  // Trigger the mining popup to start the session.
  await handlephanpopup(
    page,
    browser,
    miningConfig.confirmButtonText,
    miningConfig.mineButtonTrigger
  );
  await d(miningConfig.popupDelayMs);

  // Read the initial LCD values.
  const initialLCD: LCD = await updatelcd(page);
  const sessionStartTime = Date.now();
  let previousUpdateTime = sessionStartTime;

  // Initialize in-memory mining metrics.
  let currentMiningMetrics: MiningCycleMetrics = {
    claimedAmount: 0,
    unclaimedAmount: parseFormattedNumber(initialLCD.UNCLAIMED || "0"),
    unclaimedIncrement: 0,
    avgHashRate: 0,
    miningTimeMin: 0,
    miningTimeIncrement: 0,
    maxBoost: 0,
    claimed: false,
    extraMiningData: {},
    incrementalExtraData: { checkCount: 0 },
  };

  // Mark the initial check.
  if (!currentMiningMetrics.incrementalExtraData) {
    currentMiningMetrics.incrementalExtraData = { checkCount: 0 };
  }
  currentMiningMetrics.incrementalExtraData.initial = 1;

  // Update aggregated metrics with the initial state.
  updateAggregatedMiningMetrics(currentMiningMetrics);
  delete currentMiningMetrics.incrementalExtraData.initial;

  let minecomplete = false;
  let c = 0; // Iteration counter.
  let prevReward = currentMiningMetrics.unclaimedAmount;
  let finalLCD: LCD | null = null;

  try {
    while (!minecomplete) {
      // If maximum iterations reached, attempt to claim tokens.
      if (c > miningConfig.maxIterations) {
        printMessageLinesBorderBox(
          [
            "Max iterations reached.",
            `Unclaimed tokens: ${currentMiningMetrics.unclaimedAmount}.`,
            "Attempting to claim if tokens available...",
          ],
          miningStyle
        );
        if (currentMiningMetrics.unclaimedAmount > 0) {
          currentMiningMetrics.claimedAmount = currentMiningMetrics.unclaimedAmount;
          try {
            await clickbyinnertxt(page, "button", [
              miningConfig.stopClaimButtonText,
              miningConfig.stopAnywayButtonText,
            ]);
            currentMiningMetrics.claimed = true;
            printMessageLinesBorderBox(
              [
                `Successfully claimed ${currentMiningMetrics.claimedAmount} tokens.`,
              ],
              miningStyle
            );
          } catch (error: unknown) {
            printMessageLinesBorderBox(
              ["Claim attempt failed:", "Ending session anyway."],
              warningStyle
            );
            currentMiningMetrics.claimed = false;
          }
        } else {
          printMessageLinesBorderBox(
            [
              "No unclaimed tokens to claim.",
              "Ending session without claiming.",
            ],
            miningStyle
          );
          currentMiningMetrics.claimed = false;
        }
        minecomplete = true;
        break;
      }

      // Ensure incremental metrics object exists.
      if (!currentMiningMetrics.incrementalExtraData) {
        currentMiningMetrics.incrementalExtraData = { checkCount: 0 };
      }

      // Read the latest LCD values.
      const lcd: LCD = await updatelcd(page);
      finalLCD = lcd;
      const tnum = parseInt(lcd.TIME!) || 0;
      const hnum = parseFloat(lcd.HASHRATE!) || 0;
      const unum = parseFormattedNumber(lcd.UNCLAIMED || "0");
      const statString = parseString(lcd.STATUS!);
      const connectionString = parseString(lcd.CONNECTION!);
      const bnum = lcd.BOOST ? parseFloat(lcd.BOOST) || 0 : 0;

      // Display current LCD metrics.
      printMessageLinesBorderBox(
        [
          `CONNECTION = ${connectionString}`,
          `STATUS = ${statString}`,
          `UNCLAIMED = ${unum}`,
          `TIME = ${tnum}`,
          `HASHRATE = ${hnum}`,
          `BOOST = ${bnum}`,
        ],
        miningStyle
      );

      // Update unclaimed tokens metric.
      currentMiningMetrics.unclaimedAmount = unum;
      if (unum > prevReward) {
        const diff = unum - prevReward;
        currentMiningMetrics.unclaimedIncrement = diff;
        printMessageLinesBorderBox(
          [
            `Unclaimed increased from ${prevReward} to ${unum}.`,
            "Updating unclaimed increment and resetting iteration counter.",
          ],
          miningStyle
        );
        c = 0;
        prevReward = unum;
      } else {
        currentMiningMetrics.unclaimedIncrement = 0;
        c++;
      }

      // Update average hash rate.
      const previousCount = currentMiningMetrics.incrementalExtraData.checkCount;
      const newCount = previousCount + 1;
      currentMiningMetrics.avgHashRate =
        (currentMiningMetrics.avgHashRate * previousCount + hnum) / newCount;
      currentMiningMetrics.incrementalExtraData.checkCount = newCount;

      // Update mining time metrics.
      const now = Date.now();
      currentMiningMetrics.miningTimeMin = parseFloat(
        ((now - sessionStartTime) / 60000).toFixed(2)
      );
      currentMiningMetrics.miningTimeIncrement = parseFloat(
        ((now - previousUpdateTime) / 60000).toFixed(2)
      );
      previousUpdateTime = now;

      // Update max boost if a new maximum is detected.
      if (bnum > currentMiningMetrics.maxBoost) {
        printMessageLinesBorderBox(
          [`New max boost detected: ${bnum}`],
          miningStyle
        );
        currentMiningMetrics.maxBoost = bnum;
      }

      // Update iteration count and aggregated metrics.
      currentMiningMetrics.incrementalExtraData.iterations = c;
      updateAggregatedMiningMetrics(currentMiningMetrics);

      // Reset incremental metrics for the next iteration.
      currentMiningMetrics.unclaimedIncrement = 0;
      currentMiningMetrics.miningTimeIncrement = 0;
      for (const key in currentMiningMetrics.incrementalExtraData) {
        if (key !== "final" && key !== "initial") {
          currentMiningMetrics.incrementalExtraData[key] = 0;
        }
      }

      // Evaluate claim conditions.
      if (unum >= miningConfig.claimMaxThreshold) {
        printMessageLinesBorderBox(
          [
            "Max claim condition met:",
            "Unclaimed tokens have reached the maximum threshold.",
            "Stopping using STOP & CLAIM or STOP ANYWAY.",
          ],
          miningStyle
        );
        currentMiningMetrics.claimedAmount = unum;
        console.log("Final Metrics before Claim:");
        console.log(" - Unclaimed Amount:", unum);
        console.log(" - Claimed Amount set to:", currentMiningMetrics.claimedAmount);
        console.log(" - Average Hash Rate:", currentMiningMetrics.avgHashRate);
        console.log(" - Mining Time (min):", currentMiningMetrics.miningTimeMin);
        console.log(" - Max Boost:", currentMiningMetrics.maxBoost);
        currentMiningMetrics.claimed = true;
        minecomplete = true;
        await clickbyinnertxt(page, "button", [
          miningConfig.stopClaimButtonText,
          miningConfig.stopAnywayButtonText,
        ]);
      } else if (c > 3 && hnum === 0) {
        printMessageLinesBorderBox(
          [
            "Hash rate is 0.",
            "Stopping mining session using STOP ANYWAY or STOP & CLAIM.",
          ],
          miningStyle
        );
        currentMiningMetrics.claimed = false;
        minecomplete = true;
        await clickbyinnertxt(page, "button", [
          miningConfig.stopClaimButtonText,
          miningConfig.stopAnywayButtonText,
        ]);
      } else if (tnum >= miningConfig.claimTimeThreshold) {
        if (unum < miningConfig.miningCompleteUnclaimedThreshold) {
          printMessageLinesBorderBox(
            [
              "Time limit reached but unclaimed is below the minimum threshold.",
              "Stopping using STOP ANYWAY or STOP & CLAIM.",
            ],
            miningStyle
          );
          currentMiningMetrics.claimed = false;
          minecomplete = true;
          await clickbyinnertxt(page, "button", [
            miningConfig.stopClaimButtonText,
            miningConfig.stopAnywayButtonText,
          ]);
        } else {
          printMessageLinesBorderBox(
            [
              "Time limit reached and unclaimed meets the minimum threshold.",
              "Claiming tokens using STOP & CLAIM or STOP ANYWAY.",
            ],
            miningStyle
          );
          currentMiningMetrics.claimedAmount = unum;
          currentMiningMetrics.claimed = true;
          minecomplete = true;
          await clickbyinnertxt(page, "button", [
            miningConfig.stopClaimButtonText,
            miningConfig.stopAnywayButtonText,
          ]);
        }
      } else if (
        hnum === miningConfig.miningCompleteHashRate &&
        unum > miningConfig.miningCompleteUnclaimedThreshold
      ) {
        printMessageLinesBorderBox(
          [
            "Primary claim condition met.",
            "Claiming tokens using STOP & CLAIM or STOP ANYWAY.",
          ],
          miningStyle
        );
        currentMiningMetrics.claimedAmount = unum;
        currentMiningMetrics.claimed = true;
        minecomplete = true;
        await clickbyinnertxt(page, "button", [
          miningConfig.stopClaimButtonText,
          miningConfig.stopAnywayButtonText,
        ]);
      } else if (
        tnum >= miningConfig.claimTimeThreshold &&
        unum >= miningConfig.miningCompleteUnclaimedThreshold
      ) {
        printMessageLinesBorderBox(
          [
            "Additional claim condition met:",
            "Time threshold and unclaimed threshold reached.",
            "Claiming tokens using STOP & CLAIM or STOP ANYWAY.",
          ],
          miningStyle
        );
        currentMiningMetrics.claimedAmount = unum;
        currentMiningMetrics.claimed = true;
        minecomplete = true;
        await clickbyinnertxt(page, "button", [
          miningConfig.stopClaimButtonText,
          miningConfig.stopAnywayButtonText,
        ]);
      }

      if (!minecomplete) {
        await d(miningConfig.loopIterationDelayMs);
      }
    }
  } finally {
    // Mark final iteration and update aggregated metrics.
    if (!currentMiningMetrics.incrementalExtraData) {
      currentMiningMetrics.incrementalExtraData = {};
    }
    currentMiningMetrics.incrementalExtraData.final = 1;
    updateAggregatedMiningMetrics(currentMiningMetrics);
    await d(500);
  }

  return true;
};

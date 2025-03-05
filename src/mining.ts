import { MiningCycleMetrics } from "./metrics/metrics";
import { Browser, Page } from "puppeteer";
import { d, parseFormattedNumber, parseString } from "./utils/helpers";
import { miningStyle, warningStyle } from "./ui/styles/borderboxstyles";
import { printMessageLinesBorderBox } from "./ui/print";
import { clickbyinnertxt } from "./utils/pagehandlers";
import { loadMiningConfig } from "./utils/configloader";
import { updateAggregatedMiningMetrics } from "./db/mineMetricsDb";
import { handlephanpopup } from "./phantom";

export interface LCD {
  CONNECTION: string | null;
  STATUS: string | null;
  UNCLAIMED: string | null;
  TIME: string | null;
  HASHRATE: string | null;
  BOOST?: string | null;
}

const miningConfig = loadMiningConfig();

/**
 * updatelcd:
 * Reads elements with the class "lcdbox" on the page and parses their innerText.
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
 * miningloop:
 * Automates a mining session, tracking metrics, handling claims, and updating the database.
 */
export const miningloop = async (page: Page, browser: Browser) => {
  printMessageLinesBorderBox(["Starting mining loop..."], miningStyle);
  await d(miningConfig.initialDelayMs);

  // Trigger the mining popup
  await handlephanpopup(
    page,
    browser,
    miningConfig.confirmButtonText,
    miningConfig.mineButtonTrigger
  );
  await d(miningConfig.popupDelayMs);

  // Read initial LCD values
  const initialLCD: LCD = await updatelcd(page);
  const sessionStartTime = Date.now();
  let previousUpdateTime = sessionStartTime;

  // Initialize in-memory metrics
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

  if (!currentMiningMetrics.incrementalExtraData) {
    currentMiningMetrics.incrementalExtraData = { checkCount: 0 };
  }
  currentMiningMetrics.incrementalExtraData.initial = 1;

  updateAggregatedMiningMetrics(currentMiningMetrics);
  if (currentMiningMetrics.incrementalExtraData) {
    delete currentMiningMetrics.incrementalExtraData.initial;
  }

  let minecomplete = false;
  let c = 0;
  let prevReward = currentMiningMetrics.unclaimedAmount;
  let finalLCD: LCD | null = null;

  try {
    while (!minecomplete) {
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
          currentMiningMetrics.claimedAmount =
            currentMiningMetrics.unclaimedAmount;
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

      if (!currentMiningMetrics.incrementalExtraData) {
        currentMiningMetrics.incrementalExtraData = { checkCount: 0 };
      }

      // Read latest LCD values
      const lcd: LCD = await updatelcd(page);
      finalLCD = lcd;
      const tnum = parseInt(lcd.TIME!) || 0;
      const hnum = parseFloat(lcd.HASHRATE!) || 0;
      const unum = parseFormattedNumber(lcd.UNCLAIMED || "0");
      const statString = parseString(lcd.STATUS!);
      const connectionString = parseString(lcd.CONNECTION!);
      const bnum = lcd.BOOST ? parseFloat(lcd.BOOST) || 0 : 0;

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

      currentMiningMetrics.unclaimedAmount = unum;

      // Metrics Update Logic
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

      const previousCount =
        currentMiningMetrics.incrementalExtraData.checkCount;
      const newCount = previousCount + 1;
      currentMiningMetrics.avgHashRate =
        (currentMiningMetrics.avgHashRate * previousCount + hnum) / newCount;
      currentMiningMetrics.incrementalExtraData.checkCount = newCount;

      const now = Date.now();
      currentMiningMetrics.miningTimeMin = parseFloat(
        ((now - sessionStartTime) / 60000).toFixed(2)
      );
      currentMiningMetrics.miningTimeIncrement = parseFloat(
        ((now - previousUpdateTime) / 60000).toFixed(2)
      );
      previousUpdateTime = now;

      if (bnum > currentMiningMetrics.maxBoost) {
        printMessageLinesBorderBox(
          [`New max boost detected: ${bnum}`],
          miningStyle
        );
        currentMiningMetrics.maxBoost = bnum;
      }

      currentMiningMetrics.incrementalExtraData.iterations = c;
      updateAggregatedMiningMetrics(currentMiningMetrics);

      currentMiningMetrics.unclaimedIncrement = 0;
      currentMiningMetrics.miningTimeIncrement = 0;
      if (currentMiningMetrics.incrementalExtraData) {
        for (const key in currentMiningMetrics.incrementalExtraData) {
          if (key !== "final" && key !== "initial") {
            currentMiningMetrics.incrementalExtraData[key] = 0;
          }
        }
      }

      // Claim Conditions
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
        console.log(
          " - Claimed Amount set to:",
          currentMiningMetrics.claimedAmount
        );
        console.log(" - Average Hash Rate:", currentMiningMetrics.avgHashRate);
        console.log(
          " - Mining Time (min):",
          currentMiningMetrics.miningTimeMin
        );
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
    if (!currentMiningMetrics.incrementalExtraData) {
      currentMiningMetrics.incrementalExtraData = {};
    }
    currentMiningMetrics.incrementalExtraData.final = 1;
    updateAggregatedMiningMetrics(currentMiningMetrics);
    await d(500);
  }

  return true;
};
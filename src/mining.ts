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
 * LCD - Interface representing the LCD (Liquid Crystal Display) data read from the page.
 *
 * @interface LCD
 * @property {string | null} CONNECTION - Connection status.
 * @property {string | null} STATUS - Current status message.
 * @property {string | null} UNCLAIMED - Unclaimed tokens.
 * @property {string | null} TIME - Time value.
 * @property {string | null} HASHRATE - Hash rate value.
 * @property {string | null} [BOOST] - Optional boost value.
 */
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
 * updatelcd
 * ---------
 * Reads elements with the class "lcdbox" from the current page, parses their inner text,
 * and returns an LCD object representing the current display values.
 *
 * @param {Page} page - The Puppeteer Page instance to evaluate.
 * @returns {Promise<LCD>} A promise that resolves to an LCD object containing parsed values.
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
    // Parse each element with the class "lcdbox" and map its innerText into key/value pairs.
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
 * MiningSession
 * -------------
 * Encapsulates the mining session functionality including:
 * - Initialization (delays, popups, and metric setup)
 * - Periodic LCD polling and metric updates
 * - Evaluation of claim conditions and performing stop/claim actions.
 *
 * @class MiningSession
 */
export class MiningSession {
  private page: Page;
  private browser: Browser;
  private sessionStartTime: number = 0;
  private previousUpdateTime: number = 0;
  private metrics!: MiningCycleMetrics;
  private iterationCount: number = 0; // Corresponds to variable "c" in the original code.
  private prevReward: number = 0;
  private boostRegistered: number = 0; // Stores the first positive boost after iteration 5.

  /**
   * Constructor for MiningSession.
   *
   * @param {Page} page - The Puppeteer page instance.
   * @param {Browser} browser - The Puppeteer browser instance.
   */
  constructor(page: Page, browser: Browser) {
    this.page = page;
    this.browser = browser;
  }

  /**
   * initSession
   * -----------
   * Initializes the mining session by:
   * - Waiting for an initial delay.
   * - Triggering the mining popup.
   * - Reading the initial LCD values.
   * - Setting up the initial metrics.
   *
   * @private
   * @returns {Promise<void>}
   */
  private async initSession(): Promise<void> {
    printMessageLinesBorderBox(["Starting mining loop..."], miningStyle);
    await d(miningConfig.initialDelayMs);

    // Trigger the mining popup using Phantom's popup handler.
    await handlephanpopup(
      this.page,
      this.browser,
      miningConfig.confirmButtonText,
      miningConfig.mineButtonTrigger
    );
    await d(miningConfig.popupDelayMs);

    // Read initial LCD values and initialize metrics.
    const initialLCD: LCD = await updatelcd(this.page);
    this.sessionStartTime = Date.now();
    this.previousUpdateTime = this.sessionStartTime;
    const initialUnclaimed = parseFormattedNumber(initialLCD.UNCLAIMED || "0");

    this.metrics = {
      claimedAmount: 0,
      unclaimedAmount: initialUnclaimed,
      unclaimedIncrement: 0,
      avgHashRate: 0,
      miningTimeMin: 0,
      miningTimeIncrement: 0,
      maxBoost: 0,
      claimed: false,
      extraMiningData: {},
      incrementalExtraData: { checkCount: 0 },
    };

    // Mark initial flag for incremental data.
    this.metrics.incrementalExtraData!.initial = 1;
    updateAggregatedMiningMetrics(this.metrics);
    if (this.metrics.incrementalExtraData) {
      delete this.metrics.incrementalExtraData!.initial;
    }
    this.prevReward = initialUnclaimed;
  }

  /**
   * updateMetrics
   * -------------
   * Updates the in-memory metrics based on the latest LCD values.
   * Calculates changes in unclaimed tokens, updates the average hash rate,
   * mining time, and maximum boost if applicable.
   *
   * @private
   * @param {LCD} lcd - The current LCD values.
   * @returns {void}
   */
  private updateMetrics(lcd: LCD): void {
    const tnum = parseInt(lcd.TIME!) || 0;
    const hnum = parseFloat(lcd.HASHRATE!) || 0;
    const unum = parseFormattedNumber(lcd.UNCLAIMED || "0");
    const statString = parseString(lcd.STATUS!);
    const connectionString = parseString(lcd.CONNECTION!);
    const bnum = lcd.BOOST ? parseFloat(lcd.BOOST) || 0 : 0;

    // Display the current LCD values.
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

    // Update the unclaimed amount metric.
    this.metrics.unclaimedAmount = unum;

    // Update unclaimed increment if the unclaimed amount has increased.
    if (unum > this.prevReward) {
      const diff = unum - this.prevReward;
      this.metrics.unclaimedIncrement = diff;
      printMessageLinesBorderBox(
        [
          `Unclaimed increased from ${this.prevReward} to ${unum}.`,
          "Updating unclaimed increment and resetting iteration counter.",
        ],
        miningStyle
      );
      this.iterationCount = 0;
      this.prevReward = unum;
    } else {
      this.metrics.unclaimedIncrement = 0;
      this.iterationCount++;
    }

    // Update average hash rate using a weighted average.
    const previousCount = this.metrics.incrementalExtraData!.checkCount;
    const newCount = previousCount + 1;
    this.metrics.avgHashRate =
      (this.metrics.avgHashRate * previousCount + hnum) / newCount;
    this.metrics.incrementalExtraData!.checkCount = newCount;

    // Update mining time metrics.
    const now = Date.now();
    this.metrics.miningTimeMin = parseFloat(
      ((now - this.sessionStartTime) / 60000).toFixed(2)
    );
    this.metrics.miningTimeIncrement = parseFloat(
      ((now - this.previousUpdateTime) / 60000).toFixed(2)
    );
    this.previousUpdateTime = now;

    // Update maximum boost if a new higher boost value is detected.
    if (bnum > this.metrics.maxBoost) {
      printMessageLinesBorderBox(
        [`New max boost detected: ${bnum}`],
        miningStyle
      );
      this.metrics.maxBoost = bnum;
    }

    // Register the first positive boost after 5 iterations.
    if (this.iterationCount >= 5 && bnum > 0 && this.boostRegistered === 0) {
      this.boostRegistered = bnum;
      printMessageLinesBorderBox(
        [`Registered boost value: ${bnum}`],
        miningStyle
      );
    }

    // Record the current iteration count in the incremental metrics.
    this.metrics.incrementalExtraData!.iterations = this.iterationCount;
    updateAggregatedMiningMetrics(this.metrics);

    // Reset incremental values after aggregation.
    this.metrics.unclaimedIncrement = 0;
    this.metrics.miningTimeIncrement = 0;
    for (const key in this.metrics.incrementalExtraData!) {
      if (key !== "final" && key !== "initial") {
        this.metrics.incrementalExtraData![key] = 0;
      }
    }
  }

  /**
   * stopAndClaim
   * ------------
   * Helper function to stop the mining session and claim tokens.
   * Updates the metrics with the claimed token amount, logs a success message if provided,
   * and simulates clicking the stop/claim button.
   *
   * @private
   * @param {number} tokens - The amount of tokens to claim.
   * @param {string} [successMessage] - Optional success message to log.
   * @returns {Promise<boolean>} Resolves to true upon successful claim.
   */
  private async stopAndClaim(
    tokens: number,
    successMessage?: string
  ): Promise<boolean> {
    this.metrics.claimedAmount = tokens;
    this.metrics.claimed = true;
    if (successMessage) {
      printMessageLinesBorderBox([successMessage], miningStyle);
    }
    await clickbyinnertxt(this.page, "button", [
      miningConfig.stopClaimButtonText,
      miningConfig.stopAnywayButtonText,
    ]);
    // Wait for the mining success delay before concluding the claim.
    d(miningConfig.miningSuccessDelayMs);
    return true;
  }

  /**
   * checkMaxIterations
   * ------------------
   * Checks if the maximum number of iterations has been reached.
   * If so, attempts to claim tokens if the unclaimed amount exceeds the minimum threshold,
   * logs appropriate messages, and returns true to indicate the session should end.
   *
   * @private
   * @returns {Promise<boolean>} Resolves to true if max iterations are reached and session should end.
   */
  private async checkMaxIterations(): Promise<boolean> {
    if (this.iterationCount > miningConfig.maxIterations) {
      printMessageLinesBorderBox(
        [
          "Max iterations reached.",
          `Unclaimed tokens: ${this.metrics.unclaimedAmount}.`,
          "Attempting to claim if tokens available...",
        ],
        miningStyle
      );
      if (
        this.metrics.unclaimedAmount >
        miningConfig.miningCompleteUnclaimedThreshold
      ) {
        try {
          return await this.stopAndClaim(
            this.metrics.unclaimedAmount,
            `Successfully claimed ${this.metrics.unclaimedAmount} tokens.`
          );
        } catch (error: unknown) {
          printMessageLinesBorderBox(
            ["Claim attempt failed:", "Ending session anyway."],
            warningStyle
          );
          this.metrics.claimed = false;
          return true;
        }
      } else {
        printMessageLinesBorderBox(
          ["Not enough tokens to claim.", "Ending session without claiming."],
          miningStyle
        );
        this.metrics.claimed = false;
        return true;
      }
    }
    return false;
  }

  /**
   * checkClaimMaxThreshold
   * -----------------------
   * Checks if the unclaimed token amount exceeds the maximum claim threshold.
   * Logs final metrics and attempts to claim tokens if the condition is met.
   *
   * @private
   * @param {number} unum - The current unclaimed token amount.
   * @returns {Promise<boolean>} Resolves to true if claim threshold is met and tokens are claimed.
   */
  private async checkClaimMaxThreshold(unum: number): Promise<boolean> {
    if (unum >= miningConfig.claimMaxThreshold) {
      printMessageLinesBorderBox(["Max claim condition met:"], miningStyle);
      printMessageLinesBorderBox(
        [
          "Final Metrics before Claim:",
          ` - Unclaimed Amount: ${unum}`,
          ` - Claimed Amount set to: ${unum}`,
          ` - Average Hash Rate: ${this.metrics.avgHashRate}`,
          ` - Mining Time (min): ${this.metrics.miningTimeMin}`,
          ` - Max Boost: ${this.metrics.maxBoost}`,
        ],
        miningStyle
      );
      return await this.stopAndClaim(unum);
    }
    return false;
  }

  /**
   * checkZeroHashRateStart
   * ------------------------
   * Checks if the hash rate remains zero after several iterations.
   * If true, stops the mining session.
   *
   * @private
   * @param {number} hnum - The current hash rate.
   * @returns {Promise<boolean>} Resolves to true if the hash rate is zero beyond the allowed iterations.
   */
  private async checkZeroHashRateStart(hnum: number): Promise<boolean> {
    if (this.iterationCount > 5 && hnum === 0) {
      printMessageLinesBorderBox(
        ["Hash rate is 0.", "Stopping mining session"],
        miningStyle
      );
      this.metrics.claimed = false;
      return true;
    }
    return false;
  }

  /**
   * checkTimeThreshold
   * ------------------
   * Checks if the elapsed time exceeds the claim time threshold.
   * If the unclaimed amount is below the minimum threshold, stops the session;
   * otherwise, attempts to claim tokens.
   *
   * @private
   * @param {number} tnum - The current time value.
   * @param {number} unum - The current unclaimed token amount.
   * @returns {Promise<boolean>} Resolves to true if the time threshold triggers a claim or session end.
   */
  private async checkTimeThreshold(
    tnum: number,
    unum: number
  ): Promise<boolean> {
    if (tnum >= miningConfig.claimTimeThreshold) {
      if (unum < miningConfig.miningCompleteUnclaimedThreshold) {
        printMessageLinesBorderBox(
          ["Time limit reached but unclaimed is below the minimum threshold."],
          miningStyle
        );
        this.metrics.claimed = false;
        return true;
      } else {
        printMessageLinesBorderBox(
          ["Time limit reached and unclaimed meets the minimum threshold."],
          miningStyle
        );
        return await this.stopAndClaim(unum);
      }
    }
    return false;
  }

  /**
   * checkZeroHashRateEnd
   * ----------------------
   * Checks the primary claim condition based on hash rate and unclaimed token thresholds.
   * If met, attempts to claim tokens.
   *
   * @private
   * @param {number} hnum - The current hash rate.
   * @param {number} unum - The current unclaimed token amount.
   * @returns {Promise<boolean>} Resolves to true if the claim condition is met.
   */
  private async checkZeroHashRateEnd(
    hnum: number,
    unum: number
  ): Promise<boolean> {
    if (
      hnum === miningConfig.miningCompleteHashRate &&
      unum > miningConfig.miningCompleteUnclaimedThreshold
    ) {
      printMessageLinesBorderBox(["Primary claim condition met."], miningStyle);
      return await this.stopAndClaim(unum);
    }
    return false;
  }

  /**
   * checkBoost
   * ----------
   * Checks if a previously registered positive boost (maxBoost) exists and, after at least 5 iterations,
   * whether the current boost drops below that registered maximum.
   * If so, triggers a claim action.
   *
   * @private
   * @param {LCD} lcd - The current LCD values.
   * @returns {Promise<boolean>} Resolves to true if the boost condition triggers a claim.
   */
  private async checkBoost(lcd: LCD): Promise<boolean> {
    const bnum = lcd.BOOST ? parseFloat(lcd.BOOST) || 0 : 0;
    if (
      this.iterationCount >= 5 &&
      this.metrics.maxBoost > 0 &&
      bnum < this.metrics.maxBoost
    ) {
      printMessageLinesBorderBox(
        [
          `Boost dropped from recorded maximum ${this.metrics.maxBoost} to ${bnum}.`,
          "Claiming tokens because boost has dropped below its maximum.",
        ],
        miningStyle
      );
      const unum = parseFormattedNumber(lcd.UNCLAIMED || "0");
      return await this.stopAndClaim(unum);
    }
    return false;
  }

  /**
   * checkClaimConditions
   * ----------------------
   * Sequentially evaluates all claim conditions using helper methods.
   * Returns true if any condition is met and a claim or stop action is executed.
   *
   * @private
   * @param {LCD} lcd - The current LCD values.
   * @returns {Promise<boolean>} Resolves to true if a claim condition is satisfied.
   */
  private async checkClaimConditions(lcd: LCD): Promise<boolean> {
    const tnum = parseInt(lcd.TIME!) || 0;
    const hnum = parseFloat(lcd.HASHRATE!) || 0;
    const unum = parseFormattedNumber(lcd.UNCLAIMED || "0");

    if (await this.checkMaxIterations()) return true;
    if (await this.checkClaimMaxThreshold(unum)) return true;
    if (await this.checkZeroHashRateStart(hnum)) return true;
    if (await this.checkTimeThreshold(tnum, unum)) return true;
    if (await this.checkZeroHashRateEnd(hnum, unum)) return true;
    if (await this.checkBoost(lcd)) return true;

    return false;
  }

  /**
   * start
   * -----
   * Starts the mining session by:
   * - Initializing the session.
   * - Entering a loop to periodically poll LCD values.
   * - Updating metrics and evaluating claim conditions.
   * - Finalizing metrics once a claim or stop condition is met.
   *
   * @public
   * @returns {Promise<boolean>} Resolves to true when the session completes.
   */
  public async start(): Promise<boolean> {
    await this.initSession();
    let mineComplete = false;
    try {
      while (!mineComplete) {
        // Ensure incrementalExtraData exists.
        if (!this.metrics.incrementalExtraData) {
          this.metrics.incrementalExtraData = { checkCount: 0 };
        }

        // Read the latest LCD values.
        const lcd: LCD = await updatelcd(this.page);
        this.updateMetrics(lcd);

        // Evaluate all claim conditions.
        mineComplete = await this.checkClaimConditions(lcd);

        // Wait for the loop iteration delay if no claim/stop condition met.
        if (!mineComplete) {
          await d(miningConfig.loopIterationDelayMs);
        }
      }
    } finally {
      // Mark the final state in the incremental extra data and update overall metrics.
      if (!this.metrics.incrementalExtraData) {
        this.metrics.incrementalExtraData = {};
      }
      this.metrics.incrementalExtraData!.final = 1;
      updateAggregatedMiningMetrics(this.metrics);
      await d(500);
    }
    return true;
  }
}

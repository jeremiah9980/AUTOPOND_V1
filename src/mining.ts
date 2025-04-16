import { MiningCycleMetrics } from "./metrics/metrics";
import { Browser, Page } from "puppeteer";
import { d, parseFormattedNumber, parseString } from "./utils/helpers";
import { miningStyle, warningStyle } from "./ui/styles/borderboxstyles";
import { printMessageLinesBorderBox } from "./ui/print";
import { clickbyinnertxt, waitforelement } from "./utils/pagehandlers";
import { loadMiningConfig } from "./utils/configloader";
import { updateAggregatedMiningMetrics } from "./db/mineMetricsDb";
import { handlephanpopup } from "./phantom";
import { signtxloop } from "./swapping";

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
 * Reads elements with the class "lcdbox" on the page,
 * parses their inner text, and returns an LCD object.
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
 * MiningSession:
 * Encapsulates the mining session functionality including:
 * - Initialization (delays, popups, and metric setup)
 * - Periodic LCD polling and metric updates
 * - Evaluation of claim conditions and performing stop/claim actions.
 */
export class MiningSession {
  private page: Page;
  private browser: Browser;
  private sessionStartTime: number = 0;
  private previousUpdateTime: number = 0;
  private metrics!: MiningCycleMetrics;
  private iterationCount: number = 0;
  private prevReward: number = 0;
  private boostRegistered: number = 0; // stores the first positive boost after iteration 5
  private hashBoostOn: boolean = miningConfig.boostHash;
  private hashBoosted: boolean = false;

  /**
   * Constructor for MiningSession.
   * @param page - The Puppeteer page instance.
   * @param browser - The Puppeteer browser instance.
   */
  constructor(page: Page, browser: Browser) {
    this.page = page;
    this.browser = browser;
  }

  /**
   * initSession:
   * Initializes the mining session by waiting for an initial delay,
   * triggering the mining popup, reading the initial LCD values,
   * and setting up the initial metrics.
   */
  private async initSession() {
    printMessageLinesBorderBox(["Starting mining loop..."], miningStyle);
    await d(miningConfig.initialDelayMs);

    // Trigger the mining popup.
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
   * updateMetrics:
   * Updates the in-memory metrics based on the latest LCD values.
   * Calculates changes in unclaimed tokens, hash rate, mining time,
   * and updates the maximum boost if applicable.
   * Also registers the first positive boost after iteration 5.
   * @param lcd - The current LCD values.
   */
  private updateMetrics(lcd: LCD) {
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

    this.metrics.unclaimedAmount = unum;

    // Update unclaimed metrics.
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

    // Update average hash rate.
    const previousCount = this.metrics.incrementalExtraData!.checkCount;
    const newCount = previousCount + 1;
    this.metrics.avgHashRate =
      (this.metrics.avgHashRate * previousCount + hnum) / newCount;
    this.metrics.incrementalExtraData!.checkCount = newCount;

    // Update mining time.
    const now = Date.now();
    this.metrics.miningTimeMin = parseFloat(
      ((now - this.sessionStartTime) / 60000).toFixed(2)
    );
    this.metrics.miningTimeIncrement = parseFloat(
      ((now - this.previousUpdateTime) / 60000).toFixed(2)
    );
    this.previousUpdateTime = now;

    // Update boost if a new maximum is detected.
    if (bnum > this.metrics.maxBoost) {
      printMessageLinesBorderBox(
        [`New max boost detected: ${bnum}`],
        miningStyle
      );
      this.metrics.maxBoost = bnum;
    }

    // Register the first positive boost after iteration 5.
    if (this.iterationCount >= 5 && bnum > 0 && this.boostRegistered === 0) {
      this.boostRegistered = bnum;
      printMessageLinesBorderBox(
        [`Registered boost value: ${bnum}`],
        miningStyle
      );
    }

    this.metrics.incrementalExtraData!.iterations = this.iterationCount;
    updateAggregatedMiningMetrics(this.metrics);

    // Reset incremental values.
    this.metrics.unclaimedIncrement = 0;
    this.metrics.miningTimeIncrement = 0;
    for (const key in this.metrics.incrementalExtraData!) {
      if (key !== "final" && key !== "initial") {
        this.metrics.incrementalExtraData![key] = 0;
      }
    }
  }

  /**
   * triggerBoostAndSign:
   * Initiates the boost flow by:
   * 1. Clicking the initial Boost button.
   * 2. Clicking the boost amount button (passed as boostAmount).
   * 3. Clicking the secondary Boost button.
   * 4. Then waiting for and signing the transaction via the Phantom popup.
   *
   * @param boostAmount - The boost amount button's inner text (e.g., "0.1").
   */
  private async triggerBoostAndSign(boostAmount: string): Promise<void> {
    try {
      printMessageLinesBorderBox(["Waiting for element..."], miningStyle);

      await waitforelement(this.page, "button", "BOOST", 10000);

      printMessageLinesBorderBox(
        ["Clicking initial Boost button..."],
        miningStyle
      );

      // Click the initial Boost button.
      const initialClicked = await clickbyinnertxt(
        this.page,
        "button",
        "Boost"
      );

      printMessageLinesBorderBox(
        ["Initial Boost button clicked. Waiting for boost options..."],
        miningStyle
      );

      await waitforelement(
        this.page,
        "button",
        miningConfig.boostHashAmountPerSession.toString(),
        10000
      );

      // Click the boost amount button (e.g., "0.1").
      const amountClicked = await clickbyinnertxt(
        this.page,
        "button",
        boostAmount
      );
      if (!amountClicked) {
        throw new Error(
          `Boost amount button "${boostAmount}" not found or not clickable.`
        );
      }
      printMessageLinesBorderBox(
        [`Boost amount button "${boostAmount}" clicked.`],
        miningStyle
      );

      // Click the secondary Boost button that confirms the boost option.
      const secondaryClicked = await clickbyinnertxt(
        this.page,
        "button",
        "Boost"
      );
      if (!secondaryClicked) {
        throw new Error("Secondary Boost button not found or not clickable.");
      }
      printMessageLinesBorderBox(
        ["Secondary Boost button clicked. Awaiting signature popup..."],
        miningStyle
      );

      // Now wait for the signature popup and sign the transaction using your existing logic.
      const result = await signtxloop(this.page, this.browser);
      if (result.success) {
        printMessageLinesBorderBox(
          ["✅ Boost transaction approved."],
          miningStyle
        );
      } else {
        printMessageLinesBorderBox(
          [`❌ Boost signature failed: ${result.errorType}`],
          warningStyle
        );
      }

      // Click the secondary Boost button that confirms the boost option.
      const boostWindowClosed = await clickbyinnertxt(
        this.page,
        "button",
        "Close"
      );
      if (!boostWindowClosed) {
        throw new Error("Hash boost pop-up could not be closed.");
      }
      printMessageLinesBorderBox(["Hash boost pop-up closed..."], miningStyle);
    } catch (error: any) {
      printMessageLinesBorderBox(
        [
          "⚠️ Error during boost and sign flow:",
          String(error.message || error),
        ],
        warningStyle
      );
    }
  }

  /**
   * stopAndClaim:
   * Helper function to stop the mining session and claim tokens.
   * Updates the metrics with the claimed token amount, logs an optional
   * success message, and simulates the click on the stop/claim button.
   * @param tokens - The amount of tokens to claim.
   * @param successMessage - Optional message to log on successful claim.
   * @returns Promise<boolean> - Resolves to true upon completion.
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
    d(miningConfig.miningSuccessDelayMs);
    return true;
  }

  /**
   * checkMaxIterations:
   * Checks if the maximum number of iterations has been reached.
   * If so, attempts to claim tokens if the unclaimed amount exceeds the minimum threshold,
   * logs appropriate messages, and returns true to indicate the session should end.
   * @returns Promise<boolean>
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
   * checkClaimMaxThreshold:
   * Checks if the unclaimed token amount exceeds the maximum claim threshold.
   * Logs final metrics using printMessageLinesBorderBox and attempts to claim tokens.
   * @param unum - The current unclaimed token amount.
   * @returns Promise<boolean>
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
   * checkZeroHashRateStart:
   * Checks if the hash rate remains zero for several iterations.
   * If true, stops the session.
   * @param hnum - The current hash rate.
   * @returns Promise<boolean>
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
   * checkTimeThreshold:
   * Checks if the time threshold for claiming tokens has been reached.
   * If the unclaimed tokens are below the minimum threshold, stops the session;
   * otherwise, attempts to claim tokens.
   * @param tnum - The current time value.
   * @param unum - The current unclaimed token amount.
   * @returns Promise<boolean>
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
   * checkZeroHashRateEnd:
   * Checks the primary claim condition based on hash rate and unclaimed token thresholds.
   * If met, attempts to claim tokens.
   * @param hnum - The current hash rate.
   * @param unum - The current unclaimed token amount.
   * @returns Promise<boolean>
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
   * checkBoost:
   * Checks if a positive boost was previously registered (via maxBoost) and if,
   * after at least 5 iterations, the current boost value drops below that registered value.
   * If so, triggers a claim action.
   * @param lcd - The current LCD values.
   * @returns Promise<boolean>
   */
  private async checkBoost(lcd: LCD): Promise<boolean> {
    const bnum = lcd.BOOST ? parseFloat(lcd.BOOST) || 0 : 0;
    // Only trigger boost claim if a positive boost was registered and we're past iteration 5.
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
   * checkClaimConditions:
   * Evaluates all claim conditions sequentially using helper methods.
   * Returns true if any condition is met and a claim or stop action is executed.
   * @param lcd - The current LCD values.
   * @returns Promise<boolean>
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
   * start:
   * Starts the mining session by initializing the session, entering the loop to
   * periodically poll LCD values, update metrics, and evaluate claim conditions.
   * Finalizes metrics once a claim or stop condition is met.
   * @returns Promise<boolean> - Resolves to true when the session completes.
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

        // --- NEW: Trigger boost & sign action once after 5 iterations ---
        if (!this.hashBoosted && this.iterationCount >= 1 && this.hashBoostOn) {
          await this.triggerBoostAndSign(
            miningConfig.boostHashAmountPerSession.toString()
          );
          this.hashBoosted = true;
        }
        // ----------------------------------------------------------

        // Evaluate claim conditions.
        mineComplete = await this.checkClaimConditions(lcd);

        if (!mineComplete) {
          await d(miningConfig.loopIterationDelayMs);
        }
      }
    } finally {
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

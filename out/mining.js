"use strict";
/**
 * @file miningloop.ts
 * @description Automates a mining session by tracking metrics, handling claims,
 * and updating aggregated mining metrics in the database. This function reads LCD values,
 * updates in-memory metrics, and determines when to claim tokens based on configured thresholds.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.miningloop = void 0;
const helpers_1 = require("./utils/helpers");
const borderboxstyles_1 = require("./ui/styles/borderboxstyles");
const print_1 = require("./ui/print");
const pagehandlers_1 = require("./utils/pagehandlers");
const configloader_1 = require("./utils/configloader");
const mineMetricsDb_1 = require("./db/mineMetricsDb");
const phantom_1 = require("./phantom");
// Load the mining configuration.
const miningConfig = (0, configloader_1.loadMiningConfig)();
/**
 * Reads elements with the class "lcdbox" on the page and parses their innerText into an LCD object.
 *
 * @param page - The Puppeteer page instance.
 * @returns A promise resolving to an LCD object.
 */
const updatelcd = async (page) => {
    const lcd = await page.evaluate(() => {
        const LCD = {
            CONNECTION: null,
            STATUS: null,
            UNCLAIMED: null,
            TIME: null,
            HASHRATE: null,
            BOOST: null,
        };
        // Query all elements with class "lcdbox" and parse key-value pairs.
        Array.from(document.querySelectorAll(".lcdbox")).forEach((v) => {
            const kv = v.innerText.replace(/\n/g, "").split(":");
            if (kv.length > 1 && kv[0] in LCD) {
                LCD[kv[0]] = kv[1] || null;
            }
        });
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
const miningloop = async (page, browser) => {
    // Display start message and delay before beginning.
    (0, print_1.printMessageLinesBorderBox)(["Starting mining loop..."], borderboxstyles_1.miningStyle);
    await (0, helpers_1.d)(miningConfig.initialDelayMs);
    // Trigger the mining popup to start the session.
    await (0, phantom_1.handlephanpopup)(page, browser, miningConfig.confirmButtonText, miningConfig.mineButtonTrigger);
    await (0, helpers_1.d)(miningConfig.popupDelayMs);
    // Read the initial LCD values.
    const initialLCD = await updatelcd(page);
    const sessionStartTime = Date.now();
    let previousUpdateTime = sessionStartTime;
    // Initialize in-memory mining metrics.
    let currentMiningMetrics = {
        claimedAmount: 0,
        unclaimedAmount: (0, helpers_1.parseFormattedNumber)(initialLCD.UNCLAIMED || "0"),
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
    (0, mineMetricsDb_1.updateAggregatedMiningMetrics)(currentMiningMetrics);
    delete currentMiningMetrics.incrementalExtraData.initial;
    let minecomplete = false;
    let c = 0; // Iteration counter.
    let prevReward = currentMiningMetrics.unclaimedAmount;
    let finalLCD = null;
    try {
        while (!minecomplete) {
            // If maximum iterations reached, attempt to claim tokens.
            if (c > miningConfig.maxIterations) {
                (0, print_1.printMessageLinesBorderBox)([
                    "Max iterations reached.",
                    `Unclaimed tokens: ${currentMiningMetrics.unclaimedAmount}.`,
                    "Attempting to claim if tokens available...",
                ], borderboxstyles_1.miningStyle);
                if (currentMiningMetrics.unclaimedAmount > 0) {
                    currentMiningMetrics.claimedAmount = currentMiningMetrics.unclaimedAmount;
                    try {
                        await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                            miningConfig.stopClaimButtonText,
                            miningConfig.stopAnywayButtonText,
                        ]);
                        currentMiningMetrics.claimed = true;
                        (0, print_1.printMessageLinesBorderBox)([
                            `Successfully claimed ${currentMiningMetrics.claimedAmount} tokens.`,
                        ], borderboxstyles_1.miningStyle);
                    }
                    catch (error) {
                        (0, print_1.printMessageLinesBorderBox)(["Claim attempt failed:", "Ending session anyway."], borderboxstyles_1.warningStyle);
                        currentMiningMetrics.claimed = false;
                    }
                }
                else {
                    (0, print_1.printMessageLinesBorderBox)([
                        "No unclaimed tokens to claim.",
                        "Ending session without claiming.",
                    ], borderboxstyles_1.miningStyle);
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
            const lcd = await updatelcd(page);
            finalLCD = lcd;
            const tnum = parseInt(lcd.TIME) || 0;
            const hnum = parseFloat(lcd.HASHRATE) || 0;
            const unum = (0, helpers_1.parseFormattedNumber)(lcd.UNCLAIMED || "0");
            const statString = (0, helpers_1.parseString)(lcd.STATUS);
            const connectionString = (0, helpers_1.parseString)(lcd.CONNECTION);
            const bnum = lcd.BOOST ? parseFloat(lcd.BOOST) || 0 : 0;
            // Display current LCD metrics.
            (0, print_1.printMessageLinesBorderBox)([
                `CONNECTION = ${connectionString}`,
                `STATUS = ${statString}`,
                `UNCLAIMED = ${unum}`,
                `TIME = ${tnum}`,
                `HASHRATE = ${hnum}`,
                `BOOST = ${bnum}`,
            ], borderboxstyles_1.miningStyle);
            // Update unclaimed tokens metric.
            currentMiningMetrics.unclaimedAmount = unum;
            if (unum > prevReward) {
                const diff = unum - prevReward;
                currentMiningMetrics.unclaimedIncrement = diff;
                (0, print_1.printMessageLinesBorderBox)([
                    `Unclaimed increased from ${prevReward} to ${unum}.`,
                    "Updating unclaimed increment and resetting iteration counter.",
                ], borderboxstyles_1.miningStyle);
                c = 0;
                prevReward = unum;
            }
            else {
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
            currentMiningMetrics.miningTimeMin = parseFloat(((now - sessionStartTime) / 60000).toFixed(2));
            currentMiningMetrics.miningTimeIncrement = parseFloat(((now - previousUpdateTime) / 60000).toFixed(2));
            previousUpdateTime = now;
            // Update max boost if a new maximum is detected.
            if (bnum > currentMiningMetrics.maxBoost) {
                (0, print_1.printMessageLinesBorderBox)([`New max boost detected: ${bnum}`], borderboxstyles_1.miningStyle);
                currentMiningMetrics.maxBoost = bnum;
            }
            // Update iteration count and aggregated metrics.
            currentMiningMetrics.incrementalExtraData.iterations = c;
            (0, mineMetricsDb_1.updateAggregatedMiningMetrics)(currentMiningMetrics);
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
                (0, print_1.printMessageLinesBorderBox)([
                    "Max claim condition met:",
                    "Unclaimed tokens have reached the maximum threshold.",
                    "Stopping using STOP & CLAIM or STOP ANYWAY.",
                ], borderboxstyles_1.miningStyle);
                currentMiningMetrics.claimedAmount = unum;
                console.log("Final Metrics before Claim:");
                console.log(" - Unclaimed Amount:", unum);
                console.log(" - Claimed Amount set to:", currentMiningMetrics.claimedAmount);
                console.log(" - Average Hash Rate:", currentMiningMetrics.avgHashRate);
                console.log(" - Mining Time (min):", currentMiningMetrics.miningTimeMin);
                console.log(" - Max Boost:", currentMiningMetrics.maxBoost);
                currentMiningMetrics.claimed = true;
                minecomplete = true;
                await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                    miningConfig.stopClaimButtonText,
                    miningConfig.stopAnywayButtonText,
                ]);
            }
            else if (c > 3 && hnum === 0) {
                (0, print_1.printMessageLinesBorderBox)([
                    "Hash rate is 0.",
                    "Stopping mining session using STOP ANYWAY or STOP & CLAIM.",
                ], borderboxstyles_1.miningStyle);
                currentMiningMetrics.claimed = false;
                minecomplete = true;
                await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                    miningConfig.stopClaimButtonText,
                    miningConfig.stopAnywayButtonText,
                ]);
            }
            else if (tnum >= miningConfig.claimTimeThreshold) {
                if (unum < miningConfig.miningCompleteUnclaimedThreshold) {
                    (0, print_1.printMessageLinesBorderBox)([
                        "Time limit reached but unclaimed is below the minimum threshold.",
                        "Stopping using STOP ANYWAY or STOP & CLAIM.",
                    ], borderboxstyles_1.miningStyle);
                    currentMiningMetrics.claimed = false;
                    minecomplete = true;
                    await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                        miningConfig.stopClaimButtonText,
                        miningConfig.stopAnywayButtonText,
                    ]);
                }
                else {
                    (0, print_1.printMessageLinesBorderBox)([
                        "Time limit reached and unclaimed meets the minimum threshold.",
                        "Claiming tokens using STOP & CLAIM or STOP ANYWAY.",
                    ], borderboxstyles_1.miningStyle);
                    currentMiningMetrics.claimedAmount = unum;
                    currentMiningMetrics.claimed = true;
                    minecomplete = true;
                    await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                        miningConfig.stopClaimButtonText,
                        miningConfig.stopAnywayButtonText,
                    ]);
                }
            }
            else if (hnum === miningConfig.miningCompleteHashRate &&
                unum > miningConfig.miningCompleteUnclaimedThreshold) {
                (0, print_1.printMessageLinesBorderBox)([
                    "Primary claim condition met.",
                    "Claiming tokens using STOP & CLAIM or STOP ANYWAY.",
                ], borderboxstyles_1.miningStyle);
                currentMiningMetrics.claimedAmount = unum;
                currentMiningMetrics.claimed = true;
                minecomplete = true;
                await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                    miningConfig.stopClaimButtonText,
                    miningConfig.stopAnywayButtonText,
                ]);
            }
            else if (tnum >= miningConfig.claimTimeThreshold &&
                unum >= miningConfig.miningCompleteUnclaimedThreshold) {
                (0, print_1.printMessageLinesBorderBox)([
                    "Additional claim condition met:",
                    "Time threshold and unclaimed threshold reached.",
                    "Claiming tokens using STOP & CLAIM or STOP ANYWAY.",
                ], borderboxstyles_1.miningStyle);
                currentMiningMetrics.claimedAmount = unum;
                currentMiningMetrics.claimed = true;
                minecomplete = true;
                await (0, pagehandlers_1.clickbyinnertxt)(page, "button", [
                    miningConfig.stopClaimButtonText,
                    miningConfig.stopAnywayButtonText,
                ]);
            }
            if (!minecomplete) {
                await (0, helpers_1.d)(miningConfig.loopIterationDelayMs);
            }
        }
    }
    finally {
        // Mark final iteration and update aggregated metrics.
        if (!currentMiningMetrics.incrementalExtraData) {
            currentMiningMetrics.incrementalExtraData = {};
        }
        currentMiningMetrics.incrementalExtraData.final = 1;
        (0, mineMetricsDb_1.updateAggregatedMiningMetrics)(currentMiningMetrics);
        await (0, helpers_1.d)(500);
    }
    return true;
};
exports.miningloop = miningloop;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMining = runMining;
const tslib_1 = require("tslib");
const print_1 = require("../print");
const borderboxstyles_1 = require("../styles/borderboxstyles");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const mining_1 = require("../../mining");
const websocket_1 = require("../../ws/websocket");
/**
 * runMining
 * ---------
 * Initiates the mining process by navigating to the mining page and repeatedly checking
 * the active mining status via a websocket. It then performs mining attempts until a
 * successful mining session is completed or the process is skipped due to failure settings.
 *
 * @param {Page} page - The Puppeteer Page object used for browser interactions.
 * @param {Browser} browser - The Puppeteer Browser instance.
 * @param {MiningConfig} mining - The mining configuration parameters.
 * @returns {Promise<boolean>} Resolves to true if mining completes successfully or is skipped; otherwise, false.
 */
async function runMining(page, browser, mining) {
    let attemptCount = 0;
    try {
        // Navigate to the mining page and wait until network is idle.
        (0, print_1.printMessageLinesBorderBox)(["🔄 Navigating to mining page..."], borderboxstyles_1.miningStyle);
        await page.goto("https://pond0x.com/mining", {
            waitUntil: "networkidle0",
            timeout: 60000,
        });
        // Begin the mining attempt loop.
        while (true) {
            // Check active mining status via websocket with a timeout.
            (0, print_1.printMessageLinesBorderBox)(["🔍 Checking active mining status via websocket (30s)..."], borderboxstyles_1.miningStyle);
            const active = await (0, websocket_1.seeMiningActivity)("Check Active Mining", {
                timeoutMs: 30000,
            });
            (0, print_1.printMessageLinesBorderBox)([`Status: ${active ? "Active" : "Inactive"}`], borderboxstyles_1.miningStyle);
            // If mining is not active, wait for 30 seconds before trying again.
            if (!active) {
                await new Promise((res) => setTimeout(res, 30000));
                continue;
            }
            // If active, proceed with the mining process.
            (0, print_1.printMessageLinesBorderBox)(["✅ Active mining detected; proceeding with mining process..."], borderboxstyles_1.miningStyle);
            attemptCount++;
            (0, print_1.printMessageLinesBorderBox)([`⛏️  Mining attempt #${attemptCount}...`], borderboxstyles_1.miningStyle);
            // Create a new mining session and start the mining process.
            const session = new mining_1.MiningSession(page, browser);
            const mineComplete = await session.start();
            // If the mining session completes successfully.
            if (mineComplete) {
                (0, print_1.printMessageLinesBorderBox)(["🎉 Mining process completed successfully."], borderboxstyles_1.miningStyle);
                // Wait for a defined success delay before exiting.
                await new Promise((res) => setTimeout(res, mining.miningSuccessDelayMs));
                return true;
            }
            else {
                // Handle mining attempt failure.
                (0, print_1.printMessageLinesBorderBox)(["❌ Mining attempt failed."], borderboxstyles_1.miningStyle);
                if (mining.skipMiningOnFailure) {
                    // If skipMiningOnFailure flag is enabled, skip further attempts.
                    (0, print_1.printMessageLinesBorderBox)(["🛑 skipMiningOnFailure enabled; skipping mining."], borderboxstyles_1.miningStyle);
                    await new Promise((res) => setTimeout(res, 1000));
                    return true;
                }
                else {
                    // Otherwise, wait for the retry delay before attempting again.
                    (0, print_1.printMessageLinesBorderBox)([
                        `⏳ Waiting for ${mining.miningLoopFailRetryDelayMs} ms before retrying...`,
                    ], borderboxstyles_1.miningStyle);
                    await new Promise((res) => setTimeout(res, mining.miningLoopFailRetryDelayMs));
                    continue;
                }
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("Error in runMining:"), error);
        return false;
    }
}

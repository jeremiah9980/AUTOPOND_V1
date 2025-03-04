"use strict";
/**
 * @file runmining.ts
 * @description Executes the mining process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMining = runMining;
const tslib_1 = require("tslib");
const print_1 = require("../print");
const borderboxstyles_1 = require("../styles/borderboxstyles");
const websocket_1 = require("../../websocket");
const mining_1 = require("../../mining");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Runs the mining process.
 *
 * @param page - The Puppeteer page to operate on.
 * @param browser - The Puppeteer browser instance.
 * @param mining - The mining configuration.
 * @returns A promise that resolves to true if mining succeeds, otherwise false.
 */
async function runMining(page, browser, mining) {
    let attemptCount = 0;
    try {
        // Navigate to the mining page.
        (0, print_1.printMessageLinesBorderBox)(["Navigating to mining page..."], borderboxstyles_1.miningStyle);
        await page.goto("https://pond0x.com/mining", {
            waitUntil: "networkidle0",
            timeout: 60000,
        });
        while (true) {
            // Check active mining status.
            (0, print_1.printMessageLinesBorderBox)(["Checking active mining status..."], borderboxstyles_1.miningStyle);
            const active = await (0, websocket_1.checkActiveMining)(30000);
            (0, print_1.printMessageLinesBorderBox)([`Status: ${active ? "Active" : "Inactive"}`], borderboxstyles_1.miningStyle);
            // Proceed with mining process regardless of active status.
            (0, print_1.printMessageLinesBorderBox)(["Active mining detected; proceeding with mining process..."], borderboxstyles_1.miningStyle);
            attemptCount++;
            (0, print_1.printMessageLinesBorderBox)([`Mining attempt #${attemptCount}...`], borderboxstyles_1.miningStyle);
            const mineComplete = await (0, mining_1.miningloop)(page, browser);
            if (mineComplete) {
                (0, print_1.printMessageLinesBorderBox)(["Mining process completed successfully."], borderboxstyles_1.miningStyle);
                await new Promise((res) => setTimeout(res, mining.miningSuccessDelayMs));
                return true;
            }
            else {
                (0, print_1.printMessageLinesBorderBox)(["Mining attempt failed."], borderboxstyles_1.miningStyle);
                if (mining.skipMiningOnFailure) {
                    (0, print_1.printMessageLinesBorderBox)(["skipMiningOnFailure enabled; skipping mining."], borderboxstyles_1.miningStyle);
                    await new Promise((res) => setTimeout(res, 1000));
                    return true;
                }
                else {
                    (0, print_1.printMessageLinesBorderBox)([`Waiting for ${mining.miningLoopFailRetryDelayMs} ms before retrying...`], borderboxstyles_1.miningStyle);
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

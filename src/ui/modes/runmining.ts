import { Browser, Page } from "puppeteer";
import { printMessageLinesBorderBox } from "../print";
import { MiningConfig } from "../../types/config";
import { miningStyle } from "../styles/borderboxstyles";
import chalk from "chalk";
import { MiningSession } from "../../mining";
import { seeMiningActivity } from "../../ws/websocket";

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
export async function runMining(
  page: Page,
  browser: Browser,
  mining: MiningConfig
): Promise<boolean> {
  let attemptCount = 0;
  try {
    // Navigate to the mining page and wait until network is idle.
    printMessageLinesBorderBox(
      ["🔄 Navigating to mining page..."],
      miningStyle
    );
    await page.goto("https://pond0x.com/mining", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Begin the mining attempt loop.
    while (true) {
      // Check active mining status via websocket with a timeout.
      printMessageLinesBorderBox(
        ["🔍 Checking active mining status via websocket (30s)..."],
        miningStyle
      );
      const active = await seeMiningActivity("Check Active Mining", {
        timeoutMs: 30000,
      });
      printMessageLinesBorderBox(
        [`Status: ${active ? "Active" : "Inactive"}`],
        miningStyle
      );

      // If mining is not active, wait for 30 seconds before trying again.
      if (!active) {
        await new Promise((res) => setTimeout(res, 30000));
        continue;
      }

      // If active, proceed with the mining process.
      printMessageLinesBorderBox(
        ["✅ Active mining detected; proceeding with mining process..."],
        miningStyle
      );
      attemptCount++;
      printMessageLinesBorderBox(
        [`⛏️  Mining attempt #${attemptCount}...`],
        miningStyle
      );

      // Create a new mining session and start the mining process.
      const session = new MiningSession(page, browser);
      const mineComplete = await session.start();

      // If the mining session completes successfully.
      if (mineComplete) {
        printMessageLinesBorderBox(
          ["🎉 Mining process completed successfully."],
          miningStyle
        );
        // Wait for a defined success delay before exiting.
        await new Promise((res) =>
          setTimeout(res, mining.miningSuccessDelayMs)
        );
        return true;
      } else {
        // Handle mining attempt failure.
        printMessageLinesBorderBox(["❌ Mining attempt failed."], miningStyle);
        if (mining.skipMiningOnFailure) {
          // If skipMiningOnFailure flag is enabled, skip further attempts.
          printMessageLinesBorderBox(
            ["🛑 skipMiningOnFailure enabled; skipping mining."],
            miningStyle
          );
          await new Promise((res) => setTimeout(res, 1000));
          return true;
        } else {
          // Otherwise, wait for the retry delay before attempting again.
          printMessageLinesBorderBox(
            [
              `⏳ Waiting for ${mining.miningLoopFailRetryDelayMs} ms before retrying...`,
            ],
            miningStyle
          );
          await new Promise((res) =>
            setTimeout(res, mining.miningLoopFailRetryDelayMs)
          );
          continue;
        }
      }
    }
  } catch (error) {
    console.error(chalk.red("Error in runMining:"), error);
    return false;
  }
}

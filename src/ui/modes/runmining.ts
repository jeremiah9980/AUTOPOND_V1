/**
 * @file runmining.ts
 * @description Executes the mining process.
 */

import { Browser, Page } from "puppeteer";
import { printMessageLinesBorderBox } from "../print";
import { MiningConfig } from "../../types/config";
import { miningStyle } from "../styles/borderboxstyles";
import { checkActiveMining } from "../../websocket";
import { miningloop } from "../../mining";
import chalk from "chalk";

/**
 * Runs the mining process.
 *
 * @param page - The Puppeteer page to operate on.
 * @param browser - The Puppeteer browser instance.
 * @param mining - The mining configuration.
 * @returns A promise that resolves to true if mining succeeds, otherwise false.
 */
export async function runMining(
  page: Page,
  browser: Browser,
  mining: MiningConfig
): Promise<boolean> {
  let attemptCount = 0;
  try {
    // Navigate to the mining page.
    printMessageLinesBorderBox(["Navigating to mining page..."], miningStyle);
    await page.goto("https://pond0x.com/mining", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    while (true) {
      // Check active mining status.
      printMessageLinesBorderBox(
        ["Checking active mining status..."],
        miningStyle
      );
      const active = await checkActiveMining(30000);
      printMessageLinesBorderBox(
        [`Status: ${active ? "Active" : "Inactive"}`],
        miningStyle
      );
      // Proceed with mining process regardless of active status.
      printMessageLinesBorderBox(
        ["Active mining detected; proceeding with mining process..."],
        miningStyle
      );
      attemptCount++;
      printMessageLinesBorderBox(
        [`Mining attempt #${attemptCount}...`],
        miningStyle
      );
      const mineComplete = await miningloop(page, browser);
      if (mineComplete) {
        printMessageLinesBorderBox(
          ["Mining process completed successfully."],
          miningStyle
        );
        await new Promise((res) => setTimeout(res, mining.miningSuccessDelayMs));
        return true;
      } else {
        printMessageLinesBorderBox(["Mining attempt failed."], miningStyle);
        if (mining.skipMiningOnFailure) {
          printMessageLinesBorderBox(
            ["skipMiningOnFailure enabled; skipping mining."],
            miningStyle
          );
          await new Promise((res) => setTimeout(res, 1000));
          return true;
        } else {
          printMessageLinesBorderBox(
            [`Waiting for ${mining.miningLoopFailRetryDelayMs} ms before retrying...`],
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

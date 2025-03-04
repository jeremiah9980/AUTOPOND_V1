/**
 * @file wizard.ts
 * @description Contains the main wizard loop for the autopond process, including mode selection,
 * browser/wallet setup, cycle execution, and configuration viewing/modification prompts.
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { fork } from "child_process";
import path from "path";
import {
  buildOsc8Hyperlink,
  printMessageLinesBorderBox,
  printSessionEndReport,
  centerText,
} from "../ui/print";
import { connectwallet } from "../swapping";
import { Page, Browser } from "puppeteer";
import { launchBrowser } from "../launch";
import { FullConfig } from "../types/config";
import { accumulateSwapMetrics, overallMetrics } from "../metrics/metrics";
import { miningStyle, swappingStyle, generalStyle, phantomStyle, warningStyle, magmaStyle } from "./styles/borderboxstyles";
import { viewPondStatistics } from "../metrics/metrics";
import { d } from "../utils/helpers";
import { runSwap } from "./modes/runswap";
import { runMining } from "./modes/runmining";
import {
  modifyConfigurations,
  showConfigurationSettings,
} from "./modes/runsettings";
import { promptAccountImportMethod } from "../phantom";
import { printTable } from "./tables/printtable";

/**
 * Runs the main wizard loop for autopond. This function performs the following tasks:
 * - Prompts the user to select a mode of operation.
 * - Handles mode-specific actions (e.g., launching the Magma Engine Viewer).
 * - Sets up the wallet and browser, including wallet prompts and navigation.
 * - Executes cycles based on the selected mode and rounds.
 * - Displays session end reports and handles cleanup.
 *
 * @param {FullConfig} fullConfig - The full configuration object for autopond.
 * @returns {Promise<void>} A promise that resolves when the wizard execution completes.
 */
export async function runWizard(fullConfig: FullConfig): Promise<void> {
  const { app, mining, swap } = fullConfig;

  // Outer loop: after a complete run, re‑prompt for mode selection.
  while (true) {
    await d(300);
    if (process.stdin.isPaused()) process.stdin.resume();

    // --- Mode Selection ---
    let mode:
      | "Mine"
      | "Swap"
      | "Mine and Swap"
      | "Ze Bot Stays On"
      | "Magma Engine Viewer" = "Ze Bot Stays On";
    let rounds: number = 0;
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: chalk.bold.green("🔥 Choose a mode: "),
        choices: [
          "⛏️  Mine",
          "🤝  Swap",
          "⛏️🤝  Mine and Swap",
          "💻  Ze Bot Stays On",
          "🔍  Magma Engine Viewer",
          "📊  View Pond Statistics",
          "Exit",
        ],
      },
    ]);

    const modeRaw: string = answer.mode;
    if (modeRaw === "Exit") {
      console.log(chalk.bold("Exiting..."));
      process.exit(0);
    }
    if (modeRaw.includes("View Pond Statistics")) {
      await viewPondStatistics();
      continue;
    }
    if (modeRaw.includes("Mine and Swap")) mode = "Mine and Swap";
    else if (modeRaw.includes("Mine") && !modeRaw.includes("Swap"))
      mode = "Mine";
    else if (modeRaw.includes("Swap") && !modeRaw.includes("Mine"))
      mode = "Swap";
    else if (modeRaw.includes("Magma Engine Viewer"))
      mode = "Magma Engine Viewer";
    else mode = "Ze Bot Stays On";

    if (mode !== "Ze Bot Stays On" && mode !== "Magma Engine Viewer") {
      const roundsAnswer = await inquirer.prompt([
        {
          type: "number",
          name: "rounds",
          message: chalk.bold.green(
            mode === "Mine"
              ? "⛏️  How many mining rounds do you want to run?"
              : mode === "Swap"
              ? "🤝  How many swap cycles do you want to run?"
              : "⛏️🤝  How many mine and swap rounds do you want to run?"
          ),
          default: 1,
          validate: (value: any) =>
            value > 0 || "Please enter a number greater than 0",
        },
      ]);
      rounds = Number(roundsAnswer.rounds);
    }

    // --- Special Branch: Magma Engine Viewer ---
    if (mode === "Magma Engine Viewer") {
      const viewerProcess = fork(
        path.join(__dirname, "./modes/runmagmaviewer.js"),
        { stdio: "inherit" }
      );
      await new Promise((resolve) => {
        viewerProcess.on("exit", resolve);
      });
      printMessageLinesBorderBox(["🔍 Viewer Closed"], magmaStyle);
      continue; // Restart outer loop.
    }

    // --- Wallet Prompt & Browser Setup ---
    let browser: Browser | undefined;
    let opPage: Page;
    try {
      if (app.wizardMode) {
        const walletPrompt = await inquirer.prompt([
          {
            type: "confirm",
            name: "walletReady",
            message: (() => {
              printMessageLinesBorderBox(
                [
                  "WARNING: USE A BURNER WALLET!",
                  "PRIVATE KEYS ARE AT YOUR OWN RISK!",
                  "For safety guidelines, visit:",
                  buildOsc8Hyperlink(
                    "https://help.phantom.com/hc/en-us/articles/8071074929043-How-to-Initially-Setup-Your-Phantom-Wallet",
                    "Phantom-The Basics"
                  ),
                ],
                warningStyle
              );
              printMessageLinesBorderBox(
                ["👻 Confirm that you are ready to load Phantom?"],
                phantomStyle
              );
              return "";
            })(),
            default: true,
          },
        ]);
        if (!walletPrompt.walletReady) {
          printMessageLinesBorderBox(
            ["Wallet connection cancelled. Returning to mode selection..."],
            phantomStyle
          );
          continue;
        }

        // Prompt for account import method.
        const methodChoice = await promptAccountImportMethod();
        app.manualaccountcreation = methodChoice === "manual";

        // Launch the browser, passing the methodChoice.
        const { browser: launchedBrowser } = await launchBrowser(
          app,
          methodChoice
        );
        browser = launchedBrowser;
        const pages = await browser.pages();
        // Filter out extension pages, handling any pages that might throw an error.
        const nonExtensionPages = pages.filter((page) => {
          try {
            return !page.url().startsWith("chrome-extension://");
          } catch (err) {
            return false;
          }
        });
        if (nonExtensionPages.length === 0) {
          throw new Error("No operational page found after browser launch.");
        }
        opPage = nonExtensionPages[0];

        printMessageLinesBorderBox(
          ["🌐 Navigating to Pond0x..."],
          phantomStyle
        );
        await opPage.goto("https://pond0x.com", {
          waitUntil: "load",
          timeout: 60000,
        });
        await connectwallet(opPage, browser);
      } else {
        printMessageLinesBorderBox(
          ["Default mode: automatically loading Phantom..."],
          phantomStyle
        );
        // Default mode: pass a default methodChoice (Miner 1).
        const defaultMethod = { env: "MINER1_PK", label: "Miner 1" } as {
          env: string;
          label: string;
        };
        const { browser: launchedBrowser } = await launchBrowser(
          app,
          defaultMethod
        );
        browser = launchedBrowser;
        const pages = await browser.pages();
        const nonExtensionPages = pages.filter((page) => {
          try {
            return !page.url().startsWith("chrome-extension://");
          } catch (err) {
            return false;
          }
        });
        if (nonExtensionPages.length === 0) {
          throw new Error("No operational page found after browser launch.");
        }
        opPage = nonExtensionPages[0];
        await opPage.goto("https://pond0x.com", {
          waitUntil: "load",
          timeout: 60000,
        });
        await connectwallet(opPage, browser);
      }
    } catch (err) {
      console.error(
        chalk.red("Error during browser launch or wallet connection:"),
        err
      );
      if (browser) await browser.close();
      continue;
    }

    // --- Determine Effective Mode & Rounds ---
    let effectiveMode: "Mine" | "Swap" | "Mine and Swap";
    let effectiveRounds: number;
    if (app.wizardMode) {
      effectiveMode =
        mode === "Ze Bot Stays On" ? app.defaultMode : (mode as any);
      effectiveRounds = rounds;
    } else {
      effectiveMode = app.defaultMode;
      effectiveRounds = app.defaultCycleCount || 0;
    }

    const executionSummary = {
      Mode: effectiveMode,
      "Total Cycles": effectiveRounds > 0 ? effectiveRounds : "Infinite",
      activeMiningRetryDelayMs: mining.activeMiningRetryDelayMs,
      miningLoopFailRetryDelayMs: mining.miningLoopFailRetryDelayMs,
      miningSuccessDelayMs: mining.miningSuccessDelayMs,
    };

    if (effectiveMode === "Mine" || effectiveMode === "Mine and Swap") {
      printTable("⛏️  Mining config", mining);
    }
    if (effectiveMode === "Swap" || effectiveMode === "Mine and Swap") {
      printTable("🤝  Swap config", swap);
    }

    // --- Cycle Execution ---
    try {
      if (effectiveRounds > 0) {
        for (let i = 0; i < effectiveRounds; i++) {
          printMessageLinesBorderBox(
            [
              `🚀 --- Autopond cycle ${
                i + 1
              } of ${effectiveRounds} (${effectiveMode}) ---`,
            ],
            generalStyle
          );
          if (effectiveMode === "Mine") {
            printMessageLinesBorderBox(["Mining Process:"], miningStyle);
            await runMining(opPage, browser, mining);
          } else if (effectiveMode === "Swap") {
            printMessageLinesBorderBox(["Swap Process:"], swappingStyle);
            const swapMetrics = await runSwap(opPage, browser, swap);
            accumulateSwapMetrics(swapMetrics);
          } else if (effectiveMode === "Mine and Swap") {
            printMessageLinesBorderBox(["Mining Process:"], miningStyle);
            await runMining(opPage, browser, mining);
            printMessageLinesBorderBox(["Swap Process:"], swappingStyle);
            const swapMetrics = await runSwap(opPage, browser, swap);
            accumulateSwapMetrics(swapMetrics);
          }
          printMessageLinesBorderBox(
            [`✅ Cycle ${i + 1} complete`],
            generalStyle
          );
          await new Promise((res) => setTimeout(res, mining.cycleDelayMs));
        }
      } else {
        let cycleCount = 0;
        while (true) {
          cycleCount++;
          printMessageLinesBorderBox(
            [`🚀 --- Starting cycle ${cycleCount} ---`],
            generalStyle
          );
          if (effectiveMode === "Mine") {
            printMessageLinesBorderBox(["Mining Process:"], miningStyle);
            await runMining(opPage, browser, mining);
          } else if (effectiveMode === "Swap") {
            printMessageLinesBorderBox(["Swap Process:"], swappingStyle);
            const swapMetrics = await runSwap(opPage, browser, swap);
            accumulateSwapMetrics(swapMetrics);
          } else if (effectiveMode === "Mine and Swap") {
            printMessageLinesBorderBox(["Mining Process:"], miningStyle);
            await runMining(opPage, browser, mining);
            printMessageLinesBorderBox(["Swap Process:"], swappingStyle);
            const swapMetrics = await runSwap(opPage, browser, swap);
            accumulateSwapMetrics(swapMetrics);
          }
          printMessageLinesBorderBox(
            [`✅ Cycle ${cycleCount} complete`],
            generalStyle
          );
          await new Promise((res) => setTimeout(res, mining.cycleDelayMs));
        }
      }

      printMessageLinesBorderBox(["🏁 Operation complete."], generalStyle);

      const endReport = {
        "Total Cycles": effectiveRounds > 0 ? effectiveRounds : "Infinite",
        "Successful Cycles": effectiveRounds > 0 ? effectiveRounds : "N/A",
        "Failed Attempts": 0,
        "Elapsed Time": "10m", // TODO: Calculate actual elapsed time if needed
        "Swap Metrics": overallMetrics.swapMetrics,
      };

      printSessionEndReport("End of Operation Report", endReport);
    } catch (cycleError) {
      console.error(chalk.red("Error during cycle execution:"), cycleError);
    } finally {
      if (browser) {
        await browser.close();
        printMessageLinesBorderBox(["🧹 Browser closed."], generalStyle);
      }
      process.stdin.removeAllListeners("data");
      if (process.stdin.isRaw) process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  } // end outer while
}

/**
 * Prompts the user to press a key to either view/modify configuration settings or continue.
 *
 * @param {any} configs - The configuration object to be viewed or modified.
 * @returns {Promise<boolean>} A promise that resolves to true if configurations were viewed/modified, false otherwise.
 */
export async function promptContinueOrConfig(configs: any): Promise<boolean> {
  const width = 62;
  const line1 = centerText(
    "Press 's' to view or modify configuration settings",
    width
  );
  const line2 = centerText("Press any other key to continue", width);
  process.stdout.write(line1 + "\n" + line2 + "\n");
  return new Promise<boolean>((resolve) => {
    process.stdin.removeAllListeners("data");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", async (data: Buffer) => {
      const char = data.toString().trim().toLowerCase();
      process.stdin.setRawMode(false);
      process.stdin.pause();
      console.log();
      if (char === "s") {
        const { view } = await inquirer.prompt({
          type: "list",
          name: "view",
          message: chalk.bold.blue(
            "👀  Do you want to view configuration settings? (y/n)"
          ),
          choices: ["y", "n"],
          filter: (val: string) => val.toLowerCase(),
        });
        if (view === "y") {
          showConfigurationSettings(configs);
        }
        const { modify } = await inquirer.prompt({
          type: "list",
          name: "modify",
          message: chalk.bold.blue(
            "✏️  Do you want to modify any configuration settings? (y/n)"
          ),
          choices: ["y", "n"],
          filter: (val: string) => val.toLowerCase(),
        });
        if (modify === "y") {
          await modifyConfigurations(configs);
          showConfigurationSettings(configs);
        }
        await inquirer.prompt({
          type: "input",
          name: "continue",
          message: chalk.bold(
            "🚀  Press Enter to continue to mode selection..."
          ),
        });
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Waits for the user to press any key before continuing.
 *
 * @param {string} [message=chalk.bold("Press any key to continue...")] - The message to display to the user.
 * @returns {Promise<void>} A promise that resolves when a key is pressed.
 */
export async function waitForAnyKey(
  message: string = chalk.bold("Press any key to continue...")
): Promise<void> {
  process.stdout.write(message);
  return new Promise<void>((resolve) => {
    process.stdin.removeAllListeners("data");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      console.log("\n");
      resolve();
    });
  });
}

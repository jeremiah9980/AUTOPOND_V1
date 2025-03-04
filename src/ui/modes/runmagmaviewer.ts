/**
 * @file runmagmaviewer.ts
 * @description Provides an interactive viewer for the Magma Engine.
 * It allows the user to select between viewing a miner summary or a live miner,
 * and if needed, chooses a miner address from .env or manually inputs one.
 */

import inquirer from "inquirer";
import chalk from "chalk";
import dotenv from "dotenv";
import { printMessageLinesBorderBox } from "../print";
import { magmaStyle } from "../styles/borderboxstyles";
import { viewMinerSummary, viewLiveMiner } from "../../websocket";

dotenv.config(); // Load .env variables

/**
 * Runs the Magma Engine Viewer, prompting the user to choose the desired viewing mode,
 * and handling input for miner addresses if necessary.
 */
async function runMagmaViewer(): Promise<void> {
  printMessageLinesBorderBox(["🔍 Entering Magma Engine Viewer"], magmaStyle);

  // Prompt the user for the main viewer mode.
  const { viewerMode } = await inquirer.prompt([
    {
      type: "list",
      name: "viewerMode",
      message: chalk.bold.green("Select Magma Engine Viewer mode:"),
      choices: ["📋 View Miner Summary", "👁️ View Live Miner"],
    },
  ]);

  // If user chooses "View Miner Summary", call the summary function.
  if (viewerMode === "📋 View Miner Summary") {
    await viewMinerSummary();
    process.exit(0);
  }

  // Otherwise, "View Live Miner"
  // 1) Gather .env addresses matching MINER*_ADDRESS.
  const envAddresses = Object.entries(process.env)
    .filter(([key]) => key.startsWith("MINER") && key.endsWith("_ADDRESS"))
    .map(([_, val]) => val?.trim())
    .filter((val): val is string => !!val);

  // 2) Prompt the user how they want to pick the address:
  //    - Manually input or choose from .env.
  let chosenAddress: string | undefined;
  if (envAddresses.length > 0) {
    const { pickMethod } = await inquirer.prompt([
      {
        type: "list",
        name: "pickMethod",
        message: chalk.bold.green("How do you want to watch a miner?"),
        choices: [
          { name: "Manually enter address", value: "manual" },
          { name: "Select one from .env", value: "env" },
        ],
      },
    ]);

    if (pickMethod === "manual") {
      // Call viewLiveMiner() with no params; it will prompt for the address.
      await viewLiveMiner();
      process.exit(0);
    } else {
      // User chooses to select from .env.
      if (envAddresses.length === 0) {
        console.log(chalk.yellow("No addresses found in .env. Exiting."));
        process.exit(0);
      }

      // Single-select prompt from .env addresses.
      const { selectedAddress } = await inquirer.prompt([
        {
          type: "list",
          name: "selectedAddress",
          message: "Pick which miner address to watch:",
          choices: envAddresses,
        },
      ]);

      chosenAddress = selectedAddress;
    }
  } else {
    // If no addresses are found in .env, prompt for manual input.
    console.log(chalk.yellow("No miner addresses in .env, prompting manual input..."));
    await viewLiveMiner();
    process.exit(0);
  }

  // If an address was chosen from .env, pass it to viewLiveMiner.
  if (!chosenAddress) {
    console.log(chalk.red("No address was chosen! Exiting..."));
    process.exit(0);
  }
  await viewLiveMiner(chosenAddress);
}

runMagmaViewer();

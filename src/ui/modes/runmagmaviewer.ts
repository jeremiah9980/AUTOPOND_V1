// viewer.ts
/**
 * @fileoverview This module implements the Magma Engine Viewer.
 * It prompts the user for a viewer mode via inquirer and executes the corresponding mining activity view.
 * The module also handles reading miner addresses from the .env file.
 */

import inquirer from "inquirer";
import chalk from "chalk";
import dotenv from "dotenv";
import { printMessageLinesBorderBox } from "../print";
import { magmaStyle } from "../styles/borderboxstyles";
import { seeMiningActivity } from "../../ws/websocket";

// Load environment variables from .env file.
dotenv.config();

/**
 * runMagmaViewer
 * ---------------
 * Prompts the user to select a viewer mode and, based on the selection, either:
 * - Displays a miner summary,
 * - Shows live miner details with optional address selection,
 * - Or shows live events.
 * 
 * For "View Live Miner" mode, if miner addresses are found in .env, the user can choose
 * between manual entry or selecting one from the provided addresses.
 *
 * @returns {Promise<void>} Resolves once the viewer mode is handled.
 */
async function runMagmaViewer(): Promise<void> {
  // Display the viewer header using a border box.
  printMessageLinesBorderBox(["🔍 Entering Magma Engine Viewer"], magmaStyle);

  // Prompt the user for main viewer mode.
  const { viewerMode } = await inquirer.prompt([
    {
      type: "list",
      name: "viewerMode",
      message: chalk.bold.green("Select Magma Engine Viewer mode:"),
      choices: [
        "📋 View Miner Summary",
        "👁️ View Live Miner",
        "👁️ View Live Events",
      ],
    },
  ]);

  // Handle "View Miner Summary" selection.
  if (viewerMode === "📋 View Miner Summary") {
    await seeMiningActivity(viewerMode);
    process.exit(0);
  }

  // Handle "View Live Events" selection.
  if (viewerMode === "👁️ View Live Events") {
    await seeMiningActivity(viewerMode);
    process.exit(0);
  }

  // For "View Live Miner", proceed with address selection.
  // 1) Gather miner addresses from environment variables (keys starting with "MINER" and ending with "_ADDRESS").
  const envAddresses = Object.entries(process.env)
    .filter(([key]) => key.startsWith("MINER") && key.endsWith("_ADDRESS"))
    .map(([_, val]) => val?.trim())
    .filter((val): val is string => !!val);

  // 2) Prompt user for address selection method if addresses exist in .env.
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

    // If manual selection is chosen, proceed without selecting from .env.
    if (pickMethod === "manual") {
      await seeMiningActivity(viewerMode);
      process.exit(0);
    } else {
      // Otherwise, prompt the user to select one of the provided addresses.
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
    // If no addresses are found in .env, notify the user and exit.
    console.log(chalk.yellow("No miner addresses in .env, prompting manual input..."));
    process.exit(0);
  }

  // If for any reason an address wasn't chosen, log an error and exit.
  if (!chosenAddress) {
    console.log(chalk.red("No address was chosen! Exiting..."));
    process.exit(0);
  }

  // Call the mining activity viewer with the chosen address.
  await seeMiningActivity(viewerMode, { chosenAddress });
}

// Execute the viewer.
runMagmaViewer();

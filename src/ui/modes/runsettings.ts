/**
 * @file configDisplay.ts
 * @description Provides functions for displaying and modifying configuration settings.
 */

import inquirer from "inquirer";
import { printMessageLinesBorderBox } from "../print";
import { generalStyle, warningStyle } from "../styles/borderboxstyles";
import { printTable } from "../tables/printtable";

/**
 * Displays the current configuration settings using formatted tables.
 *
 * @param configs - The configuration object containing various settings.
 */
export function showConfigurationSettings(configs: any): void {
  // Display overall header.
  printMessageLinesBorderBox(["🧠  Configuration Settings"], generalStyle);

  // Display each config section using the printTable function.
  printTable("⚙️  App config", configs.app || {});
  printTable("⛏️  Mining config", configs.mining || {});
  printTable("☀️  Solana config", configs.solana || {});
  printTable("🤝  Swap config", configs.swap || {});
}

/**
 * Provides an interactive prompt for modifying configuration settings.
 *
 * @param configs - The configuration object to be modified.
 * @returns A promise that resolves when the modification process is complete.
 */
export async function modifyConfigurations(configs: any): Promise<void> {
  let done = false;
  while (!done) {
    // Prompt user for which config section to modify.
    const { configChoice } = await inquirer.prompt({
      type: "list",
      name: "configChoice",
      message: "Which configuration would you like to modify?",
      choices: [
        "App config",
        "Mining config",
        "Solana config",
        "Swap config",
        "Done",
      ],
    });

    if (configChoice === "Done") {
      done = true;
      break;
    }

    // Select the appropriate configuration object.
    let configObject: any;
    switch (configChoice) {
      case "App config":
        configObject = configs.app || {};
        break;
      case "Mining config":
        configObject = configs.mining || {};
        break;
      case "Solana config":
        configObject = configs.solana || {};
        break;
      case "Swap config":
        configObject = configs.swap || configs;
        break;
      default:
        configObject = {};
    }

    // Get the keys available to modify.
    const keys = Object.keys(configObject);
    if (keys.length === 0) {
      printMessageLinesBorderBox(
        [`No keys to modify in ${configChoice}.`],
        warningStyle
      );
      continue;
    }

    // Prompt user to select a key to modify.
    const { keyChoice } = await inquirer.prompt({
      type: "list",
      name: "keyChoice",
      message: `Select a key to modify in ${configChoice}:`,
      choices: [...keys, "Go back"],
    });

    if (keyChoice === "Go back") {
      continue;
    }

    // Prompt user for the new value.
    const { newValue } = await inquirer.prompt({
      type: "input",
      name: "newValue",
      message: `Enter new value for ${keyChoice}:`,
    });

    // Parse the new value as a number or boolean if applicable.
    let parsedValue: any = newValue;
    if (!isNaN(Number(newValue))) {
      parsedValue = Number(newValue);
    } else if (
      newValue.toLowerCase() === "true" ||
      newValue.toLowerCase() === "false"
    ) {
      parsedValue = newValue.toLowerCase() === "true";
    }
    configObject[keyChoice] = parsedValue;

    // Inform the user of the update.
    printMessageLinesBorderBox(
      [`${keyChoice} updated to ${parsedValue} in ${configChoice}.`],
      generalStyle
    );
  }
}

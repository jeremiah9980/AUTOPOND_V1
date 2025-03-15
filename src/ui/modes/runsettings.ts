import inquirer from "inquirer";
import { printMessageLinesBorderBox } from "../print";
import { generalStyle, warningStyle } from "../styles/borderboxstyles";
import { printTable } from "../tables/printtable";

/**
 * showConfigurationSettings
 * -------------------------
 * Displays the overall configuration settings by printing each configuration section
 * (App, Mining, Solana, and Swap) using formatted tables.
 *
 * @param {any} configs - The configuration object containing various configuration sections.
 *                        Expected to have keys: app, mining, solana, and swap.
 * @returns {void}
 */
export function showConfigurationSettings(configs: any): void {
  // Overall header for configuration settings.
  printMessageLinesBorderBox(["🧠  Configuration Settings"], generalStyle);

  // Print each configuration section using the overloaded printTable function.
  printTable("⚙️  App config", configs.app || {});
  printTable("⛏️  Mining config", configs.mining || {});
  printTable("☀️  Solana config", configs.solana || {});
  printTable("🤝  Swap config", configs.swap || {});
}

/**
 * modifyConfigurations
 * ----------------------
 * Provides an interactive command-line prompt that allows the user to modify configuration settings.
 * The user can choose which configuration section to modify, select a key within that section,
 * and input a new value. Numeric and boolean values are automatically parsed.
 *
 * @param {any} configs - The configuration object containing various configuration sections.
 *                        Expected to have keys: app, mining, solana, and swap.
 * @returns {Promise<void>} A promise that resolves once the configuration modifications are complete.
 */
export async function modifyConfigurations(configs: any): Promise<void> {
  let done = false;
  while (!done) {
    // Prompt the user to select a configuration section to modify.
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

    // Exit the loop if the user is finished.
    if (configChoice === "Done") {
      done = true;
      break;
    }

    // Determine the configuration object corresponding to the selected section.
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

    // Retrieve keys available in the chosen configuration object.
    const keys = Object.keys(configObject);
    if (keys.length === 0) {
      // Warn the user if there are no keys to modify in the selected configuration section.
      printMessageLinesBorderBox(
        [`No keys to modify in ${configChoice}.`],
        warningStyle
      );
      continue;
    }

    // Prompt the user to select a specific key to modify.
    const { keyChoice } = await inquirer.prompt({
      type: "list",
      name: "keyChoice",
      message: `Select a key to modify in ${configChoice}:`,
      choices: [...keys, "Go back"],
    });
    if (keyChoice === "Go back") {
      continue;
    }

    // Prompt for the new value of the selected key.
    const { newValue } = await inquirer.prompt({
      type: "input",
      name: "newValue",
      message: `Enter new value for ${keyChoice}:`,
    });

    // Attempt to parse the new value to number or boolean, if applicable.
    let parsedValue: any = newValue;
    if (!isNaN(Number(newValue))) {
      parsedValue = Number(newValue);
    } else if (
      newValue.toLowerCase() === "true" ||
      newValue.toLowerCase() === "false"
    ) {
      parsedValue = newValue.toLowerCase() === "true";
    }

    // Update the configuration object with the parsed value.
    configObject[keyChoice] = parsedValue;
    printMessageLinesBorderBox(
      [`${keyChoice} updated to ${parsedValue} in ${configChoice}.`],
      generalStyle
    );
  }
}

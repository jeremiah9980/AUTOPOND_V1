"use strict";
/**
 * @file configDisplay.ts
 * @description Provides functions for displaying and modifying configuration settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.showConfigurationSettings = showConfigurationSettings;
exports.modifyConfigurations = modifyConfigurations;
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const print_1 = require("../print");
const borderboxstyles_1 = require("../styles/borderboxstyles");
const printtable_1 = require("../tables/printtable");
/**
 * Displays the current configuration settings using formatted tables.
 *
 * @param configs - The configuration object containing various settings.
 */
function showConfigurationSettings(configs) {
    // Display overall header.
    (0, print_1.printMessageLinesBorderBox)(["🧠  Configuration Settings"], borderboxstyles_1.generalStyle);
    // Display each config section using the printTable function.
    (0, printtable_1.printTable)("⚙️  App config", configs.app || {});
    (0, printtable_1.printTable)("⛏️  Mining config", configs.mining || {});
    (0, printtable_1.printTable)("☀️  Solana config", configs.solana || {});
    (0, printtable_1.printTable)("🤝  Swap config", configs.swap || {});
}
/**
 * Provides an interactive prompt for modifying configuration settings.
 *
 * @param configs - The configuration object to be modified.
 * @returns A promise that resolves when the modification process is complete.
 */
async function modifyConfigurations(configs) {
    let done = false;
    while (!done) {
        // Prompt user for which config section to modify.
        const { configChoice } = await inquirer_1.default.prompt({
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
        let configObject;
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
            (0, print_1.printMessageLinesBorderBox)([`No keys to modify in ${configChoice}.`], borderboxstyles_1.warningStyle);
            continue;
        }
        // Prompt user to select a key to modify.
        const { keyChoice } = await inquirer_1.default.prompt({
            type: "list",
            name: "keyChoice",
            message: `Select a key to modify in ${configChoice}:`,
            choices: [...keys, "Go back"],
        });
        if (keyChoice === "Go back") {
            continue;
        }
        // Prompt user for the new value.
        const { newValue } = await inquirer_1.default.prompt({
            type: "input",
            name: "newValue",
            message: `Enter new value for ${keyChoice}:`,
        });
        // Parse the new value as a number or boolean if applicable.
        let parsedValue = newValue;
        if (!isNaN(Number(newValue))) {
            parsedValue = Number(newValue);
        }
        else if (newValue.toLowerCase() === "true" ||
            newValue.toLowerCase() === "false") {
            parsedValue = newValue.toLowerCase() === "true";
        }
        configObject[keyChoice] = parsedValue;
        // Inform the user of the update.
        (0, print_1.printMessageLinesBorderBox)([`${keyChoice} updated to ${parsedValue} in ${configChoice}.`], borderboxstyles_1.generalStyle);
    }
}

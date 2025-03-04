"use strict";
/**
 * @file runautopond.ts
 * @description Entry point for the autopond process. This module loads the unified configuration,
 * displays a banner, prompts the user to review/modify settings, and then delegates
 * further execution to the interactive wizard.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runautopond = runautopond;
const banner_1 = require("./ui/banner");
const wizard_1 = require("./ui/wizard");
const configloader_1 = require("./utils/configloader");
// Delay before proceeding (in milliseconds)
const DELAY_MS = 2000;
/**
 * Executes the autopond process by performing the following steps:
 * 1. Loads the unified configuration from separate config files.
 * 2. Waits briefly before proceeding.
 * 3. Displays the banner.
 * 4. Prompts the user to view or modify configuration settings.
 * 5. Delegates further execution to the interactive wizard.
 *
 * @returns {Promise<void>} A promise that resolves when the process completes.
 */
async function runautopond() {
    try {
        // Load unified configuration from separate config files.
        const fullConfig = (0, configloader_1.loadFullConfig)();
        // Wait briefly before proceeding.
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        // Display the banner.
        (0, banner_1.printBanner)();
        // Prompt the user to view or modify configuration settings.
        await (0, wizard_1.promptContinueOrConfig)(fullConfig);
        // Delegate further execution to the interactive wizard.
        await (0, wizard_1.runWizard)(fullConfig);
    }
    catch (error) {
        console.error("An error occurred while running autopond:", error);
        // Additional error handling (if needed)
    }
}

"use strict";
// src/runautopond.ts
// Entry point for the autopond process. This module loads the unified configuration,
// displays a banner, prompts the user to review/modify settings, and then delegates
// further execution to the interactive wizard.
Object.defineProperty(exports, "__esModule", { value: true });
exports.runautopond = runautopond;
const banner_1 = require("./ui/banner");
const wizard_1 = require("./ui/wizard");
const wizard_2 = require("./ui/wizard");
const configloader_1 = require("./utils/configloader");
async function runautopond() {
    // Load unified configuration from separate config files.
    const fullConfig = (0, configloader_1.loadFullConfig)();
    // Wait briefly (2 seconds) before proceeding.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Display the banner.
    (0, banner_1.printBanner)();
    // Prompt the user to view or modify configuration settings.
    await (0, wizard_1.promptContinueOrConfig)(fullConfig);
    // Delegate further execution to the interactive wizard.
    await (0, wizard_2.runWizard)(fullConfig);
}

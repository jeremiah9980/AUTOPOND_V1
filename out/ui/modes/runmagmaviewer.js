"use strict";
/**
 * @file runmagmaviewer.ts
 * @description Provides an interactive viewer for the Magma Engine.
 * It allows the user to select between viewing a miner summary or a live miner,
 * and if needed, chooses a miner address from .env or manually inputs one.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const print_1 = require("../print");
const borderboxstyles_1 = require("../styles/borderboxstyles");
const websocket_1 = require("../../websocket");
dotenv_1.default.config(); // Load .env variables
/**
 * Runs the Magma Engine Viewer, prompting the user to choose the desired viewing mode,
 * and handling input for miner addresses if necessary.
 */
async function runMagmaViewer() {
    (0, print_1.printMessageLinesBorderBox)(["🔍 Entering Magma Engine Viewer"], borderboxstyles_1.magmaStyle);
    // Prompt the user for the main viewer mode.
    const { viewerMode } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "viewerMode",
            message: chalk_1.default.bold.green("Select Magma Engine Viewer mode:"),
            choices: ["📋 View Miner Summary", "👁️ View Live Miner"],
        },
    ]);
    // If user chooses "View Miner Summary", call the summary function.
    if (viewerMode === "📋 View Miner Summary") {
        await (0, websocket_1.viewMinerSummary)();
        process.exit(0);
    }
    // Otherwise, "View Live Miner"
    // 1) Gather .env addresses matching MINER*_ADDRESS.
    const envAddresses = Object.entries(process.env)
        .filter(([key]) => key.startsWith("MINER") && key.endsWith("_ADDRESS"))
        .map(([_, val]) => val === null || val === void 0 ? void 0 : val.trim())
        .filter((val) => !!val);
    // 2) Prompt the user how they want to pick the address:
    //    - Manually input or choose from .env.
    let chosenAddress;
    if (envAddresses.length > 0) {
        const { pickMethod } = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "pickMethod",
                message: chalk_1.default.bold.green("How do you want to watch a miner?"),
                choices: [
                    { name: "Manually enter address", value: "manual" },
                    { name: "Select one from .env", value: "env" },
                ],
            },
        ]);
        if (pickMethod === "manual") {
            // Call viewLiveMiner() with no params; it will prompt for the address.
            await (0, websocket_1.viewLiveMiner)();
            process.exit(0);
        }
        else {
            // User chooses to select from .env.
            if (envAddresses.length === 0) {
                console.log(chalk_1.default.yellow("No addresses found in .env. Exiting."));
                process.exit(0);
            }
            // Single-select prompt from .env addresses.
            const { selectedAddress } = await inquirer_1.default.prompt([
                {
                    type: "list",
                    name: "selectedAddress",
                    message: "Pick which miner address to watch:",
                    choices: envAddresses,
                },
            ]);
            chosenAddress = selectedAddress;
        }
    }
    else {
        // If no addresses are found in .env, prompt for manual input.
        console.log(chalk_1.default.yellow("No miner addresses in .env, prompting manual input..."));
        await (0, websocket_1.viewLiveMiner)();
        process.exit(0);
    }
    // If an address was chosen from .env, pass it to viewLiveMiner.
    if (!chosenAddress) {
        console.log(chalk_1.default.red("No address was chosen! Exiting..."));
        process.exit(0);
    }
    await (0, websocket_1.viewLiveMiner)(chosenAddress);
}
runMagmaViewer();

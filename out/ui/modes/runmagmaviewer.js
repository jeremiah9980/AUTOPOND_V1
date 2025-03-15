"use strict";
// viewer.ts
/**
 * @fileoverview This module implements the Magma Engine Viewer.
 * It prompts the user for a viewer mode via inquirer and executes the corresponding mining activity view.
 * The module also handles reading miner addresses from the .env file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const print_1 = require("../print");
const borderboxstyles_1 = require("../styles/borderboxstyles");
const websocket_1 = require("../../ws/websocket");
// Load environment variables from .env file.
dotenv_1.default.config();
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
async function runMagmaViewer() {
    // Display the viewer header using a border box.
    (0, print_1.printMessageLinesBorderBox)(["🔍 Entering Magma Engine Viewer"], borderboxstyles_1.magmaStyle);
    // Prompt the user for main viewer mode.
    const { viewerMode } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "viewerMode",
            message: chalk_1.default.bold.green("Select Magma Engine Viewer mode:"),
            choices: [
                "📋 View Miner Summary",
                "👁️ View Live Miner",
                "👁️ View Live Events",
            ],
        },
    ]);
    // Handle "View Miner Summary" selection.
    if (viewerMode === "📋 View Miner Summary") {
        await (0, websocket_1.seeMiningActivity)(viewerMode);
        process.exit(0);
    }
    // Handle "View Live Events" selection.
    if (viewerMode === "👁️ View Live Events") {
        await (0, websocket_1.seeMiningActivity)(viewerMode);
        process.exit(0);
    }
    // For "View Live Miner", proceed with address selection.
    // 1) Gather miner addresses from environment variables (keys starting with "MINER" and ending with "_ADDRESS").
    const envAddresses = Object.entries(process.env)
        .filter(([key]) => key.startsWith("MINER") && key.endsWith("_ADDRESS"))
        .map(([_, val]) => val === null || val === void 0 ? void 0 : val.trim())
        .filter((val) => !!val);
    // 2) Prompt user for address selection method if addresses exist in .env.
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
        // If manual selection is chosen, proceed without selecting from .env.
        if (pickMethod === "manual") {
            await (0, websocket_1.seeMiningActivity)(viewerMode);
            process.exit(0);
        }
        else {
            // Otherwise, prompt the user to select one of the provided addresses.
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
        // If no addresses are found in .env, notify the user and exit.
        console.log(chalk_1.default.yellow("No miner addresses in .env, prompting manual input..."));
        process.exit(0);
    }
    // If for any reason an address wasn't chosen, log an error and exit.
    if (!chosenAddress) {
        console.log(chalk_1.default.red("No address was chosen! Exiting..."));
        process.exit(0);
    }
    // Call the mining activity viewer with the chosen address.
    await (0, websocket_1.seeMiningActivity)(viewerMode, { chosenAddress });
}
// Execute the viewer.
runMagmaViewer();

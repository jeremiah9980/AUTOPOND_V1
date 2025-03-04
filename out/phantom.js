"use strict";
/**
 * @file phantom.ts
 * @description Contains helper functions to automate the Phantom Wallet onboarding
 * and account import process. This includes prompting the user for an import method,
 * handling form input (e.g. entering private keys, passwords), and interacting with the Phantom pop-up.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlephanpopup = exports.evalPhan = void 0;
exports.promptAccountImportMethod = promptAccountImportMethod;
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const print_1 = require("./ui/print");
const borderboxstyles_1 = require("./ui/styles/borderboxstyles");
const pagehandlers_1 = require("./utils/pagehandlers");
const helpers_1 = require("./utils/helpers");
// Make sure these helper functions are imported or defined:
// mm, enterpw, clickcontinuepw
/**
 * Evaluates and handles the Phantom Wallet onboarding flow.
 *
 * For manual import, it prompts the user to complete the process via the Phantom pop-up.
 * For automated import, it retrieves the private key from .env and fills the necessary fields.
 *
 * @param page - The Puppeteer page instance.
 * @param config - The application configuration.
 * @param methodChoice - Either "manual" or an object containing the env variable and label.
 */
const evalPhan = async (page, config, methodChoice) => {
    if (methodChoice === "manual") {
        // Inform the user to complete manual account import.
        (0, print_1.printMessageLinesBorderBox)([
            "Manual account import selected.",
            "Please open the Phantom pop-up and manually create or import your wallet.",
            "Follow all steps until you're finished, then press ENTER.",
        ], borderboxstyles_1.phantomStyle);
        await inquirer_1.default.prompt([
            {
                type: "input",
                name: "manualDone",
                message: "Press ENTER after finishing manual account creation/import...",
            },
        ]);
        return;
    }
    // Automated flow: inform user and retrieve private key from .env.
    (0, print_1.printMessageLinesBorderBox)(["🔮 Initializing Phantom Wallet (Auto-Import from .env)"], borderboxstyles_1.phantomStyle);
    const pkToImport = process.env[methodChoice.env];
    if (!pkToImport) {
        throw new Error(`No private key found in .env for "${methodChoice.env}". Make sure it's defined.`);
    }
    // Wait for the necessary buttons to appear.
    await (0, pagehandlers_1.waitforelement)(page, "button", "I already have a wallet", 5000);
    await (0, pagehandlers_1.waitforelement)(page, "button", "Import Private Key", 5000);
    // Fill in the private key and miner label using helper function mm.
    await mm(page, pkToImport, methodChoice.label);
    // Wait for the "Import" button and proceed.
    await (0, pagehandlers_1.waitforelement)(page, "button", "Import", 5000);
    // Complete password entry and confirmations.
    await enterpw(page);
    await clickcontinuepw(page);
    await (0, helpers_1.d)(3000);
    await clickcontinuepw(page);
};
exports.evalPhan = evalPhan;
/**
 * mm - Fills the Phantom Wallet import form.
 *
 * It clicks on the "Name" input to set it to `minerLabel` and then moves to the "Private key"
 * textarea to enter the private key.
 *
 * @param page - The Puppeteer page instance.
 * @param privateKey - The private key to import.
 * @param minerLabel - The label to assign (e.g., "Miner 1").
 */
const mm = async (page, privateKey, minerLabel) => {
    // Retrieve center coordinates for both the name input and PK textarea.
    const coords = await selecttextareabyplaceholder(page, privateKey, minerLabel);
    // Simulate smooth mouse movements and click on the "Name" field.
    await page.mouse.move(coords.centerX - 100, coords.centerY - 100);
    await page.mouse.move(coords.centerX - 60, coords.centerY - 60);
    await page.mouse.move(coords.centerX - 40, coords.centerY - 40);
    await page.mouse.move(coords.centerX, coords.centerY);
    await page.mouse.click(coords.centerX, coords.centerY);
    // Move and click on the "Private key" field.
    await page.mouse.move(coords.centerX1 - 100, coords.centerY1 - 100);
    await page.mouse.move(coords.centerX1 - 60, coords.centerY1 - 60);
    await page.mouse.move(coords.centerX1 - 20, coords.centerY1 - 20);
    await page.mouse.move(coords.centerX1, coords.centerY1);
    await page.mouse.click(coords.centerX1, coords.centerY1);
    // Additional clicks to ensure both fields are focused.
    await page.mouse.click(coords.centerX, coords.centerY);
    await page.mouse.click(coords.centerX1, coords.centerY1);
};
/**
 * Prompts the user to choose the Phantom account import method.
 *
 * Returns either "manual" for manual import or an object with the env variable and label for automated import.
 *
 * @returns A promise that resolves to either "manual" or an object with env and label.
 */
async function promptAccountImportMethod() {
    // Build choices for automated import from .env.
    const automatedMinerChoices = [
        {
            name: "Miner 1 (from .env)",
            value: { env: "MINER1_PK", label: "Miner 1" },
        },
        {
            name: "Miner 2 (from .env)",
            value: { env: "MINER2_PK", label: "Miner 2" },
        },
        // Add more miner choices as needed.
    ].filter((choice) => Boolean(process.env[choice.value.env]));
    // Build the final list of choices.
    const choices = [
        { name: "Manual account import (use Phantom pop-up)", value: "manual" },
        ...automatedMinerChoices,
    ];
    // If no automated choices are available, add a disabled option.
    if (automatedMinerChoices.length === 0) {
        choices.push({
            name: "No miner accounts saved to .env",
            value: "manual",
            disabled: "No keys found",
        });
    }
    // Display heading.
    (0, print_1.printMessageLinesBorderBox)(["How do you want to import your account?"], borderboxstyles_1.phantomStyle);
    const { chosenMethod } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "chosenMethod",
            message: "Select account import method:",
            choices,
        },
    ]);
    return chosenMethod;
}
/**
 * selecttextareabyplaceholder - Finds the "Name" input and "Private key" textarea,
 * sets the "Name" to `minerLabel` and "Private key" to `pk`, and returns their center coordinates.
 *
 * @param page - The Puppeteer page instance.
 * @param pk - The private key to fill.
 * @param minerLabel - The label for the account.
 * @returns A promise resolving to the coordinates of the elements.
 */
const selecttextareabyplaceholder = async (page, pk, minerLabel) => {
    // Wait for input and textarea elements to be present.
    await page.waitForSelector("input");
    await page.waitForSelector("textarea");
    // Evaluate in-page script to set values and calculate center coordinates.
    const coords = await page.evaluate((thePk, theLabel) => {
        // Find and fill the "Name" input.
        const nameInput = Array.from(document.querySelectorAll("input")).find((t) => t.placeholder === "Name");
        if (nameInput) {
            nameInput.click();
            nameInput.value = theLabel; // e.g. "Miner 1"
            nameInput.click();
        }
        // Find and fill the "Private key" textarea.
        const pkTextarea = Array.from(document.querySelectorAll("textarea")).find((t) => t.placeholder === "Private key");
        if (pkTextarea) {
            pkTextarea.click();
            pkTextarea.value = thePk;
            pkTextarea.click();
        }
        // Calculate center coordinates for both elements.
        const nameRect = nameInput === null || nameInput === void 0 ? void 0 : nameInput.getBoundingClientRect();
        const centerX = nameRect ? nameRect.left + nameRect.width / 2 : 0;
        const centerY = nameRect ? nameRect.top + nameRect.height / 2 : 0;
        const pkRect = pkTextarea === null || pkTextarea === void 0 ? void 0 : pkTextarea.getBoundingClientRect();
        const centerX1 = pkRect ? pkRect.left + pkRect.width / 2 : 0;
        const centerY1 = pkRect ? pkRect.top + pkRect.height / 2 : 0;
        return { centerX, centerY, centerX1, centerY1 };
    }, pk, minerLabel);
    return coords;
};
/**
 * enterpw - Enters the wallet password ("testphant") into both the Password
 * and Confirm Password fields.
 *
 * @param page - The Puppeteer page instance.
 */
const enterpw = async (page) => {
    await (0, helpers_1.d)(1000);
    const coords = await handlenewpassword(page);
    await (0, helpers_1.d)(1000);
    const pw = "testphant";
    // Click the Password field and type the password.
    await page.mouse.click(coords.centerX, coords.centerY);
    await page.keyboard.type(pw);
    await (0, helpers_1.d)(1000);
    // Click the Confirm Password field and type the password.
    await page.mouse.click(coords.centerX1, coords.centerY1);
    await page.keyboard.type(pw);
    await (0, helpers_1.d)(1000);
};
/**
 * handlenewpassword - Finds the password fields, clicks the Terms-of-Service checkbox,
 * and returns the center coordinates of the Password and Confirm Password inputs.
 *
 * @param page - The Puppeteer page instance.
 * @returns A promise resolving to an object with center coordinates.
 */
const handlenewpassword = async (page) => {
    await page.waitForSelector("input");
    await page.waitForSelector('[data-testid="onboarding-form-terms-of-service-checkbox"]');
    const coords = await page.evaluate(() => {
        const passInput = Array.from(document.querySelectorAll("input")).find((t) => t.placeholder === "Password");
        const confirmInput = Array.from(document.querySelectorAll("input")).find((t) => t.placeholder === "Confirm Password");
        // Click the Terms-of-Service checkbox.
        const tos = document.querySelector('[data-testid="onboarding-form-terms-of-service-checkbox"]');
        if (tos)
            tos.click();
        const passRect = passInput === null || passInput === void 0 ? void 0 : passInput.getBoundingClientRect();
        const centerX = passRect ? passRect.left + passRect.width / 2 : 0;
        const centerY = passRect ? passRect.top + passRect.height / 2 : 0;
        const confirmRect = confirmInput === null || confirmInput === void 0 ? void 0 : confirmInput.getBoundingClientRect();
        const centerX1 = confirmRect ? confirmRect.left + confirmRect.width / 2 : 0;
        const centerY1 = confirmRect ? confirmRect.top + confirmRect.height / 2 : 0;
        return { centerX, centerY, centerX1, centerY1 };
    });
    return coords;
};
/**
 * clickcontinuepw - Clicks the "Continue" button in the Phantom onboarding flow.
 *
 * @param page - The Puppeteer page instance.
 */
const clickcontinuepw = async (page) => {
    await page.waitForSelector('[data-testid="onboarding-form-submit-button"]');
    await page.evaluate(() => {
        const sb = document.querySelector('[data-testid="onboarding-form-submit-button"]');
        if (sb)
            sb.click();
    });
};
/**
 * handlephanpopup - Waits for the Phantom pop-up, listens for its creation, clicks a trigger button,
 * and if the new target is the Phantom Wallet, clicks the specified button within it.
 *
 * @param ppage - The Puppeteer page instance from which to trigger the pop-up.
 * @param browser - The Puppeteer browser instance.
 * @param btnname - The button name to click in the Phantom Wallet pop-up.
 * @param triggerBtn - The trigger button text to click in the parent page.
 */
const handlephanpopup = async (ppage, browser, btnname, triggerBtn) => {
    await (0, helpers_1.d)(1000);
    const nupage = await new Promise(async (res) => {
        browser.once("targetcreated", (target) => res(target.page()));
        const clicked = await (0, pagehandlers_1.clickbyinnertxt)(ppage, "button", triggerBtn);
        if (!clicked) {
            browser.removeAllListeners();
            res(null);
        }
    });
    if (nupage === null)
        throw new Error("button not clicked");
    await (0, helpers_1.d)(2000);
    const isphan = await nupage.evaluate(() => {
        return (Array.from(document.getElementsByTagName("title"))
            .map((v) => v.textContent)
            .indexOf("Phantom Wallet") > -1);
    });
    await (0, helpers_1.d)(3000);
    if (isphan) {
        await (0, pagehandlers_1.clickbyinnertxt)(nupage, "button", btnname);
    }
};
exports.handlephanpopup = handlephanpopup;

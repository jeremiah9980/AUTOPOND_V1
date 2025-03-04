"use strict";
/**
 * @file pageHandlers.ts
 * @description Provides utility functions for interacting with page elements
 * using Puppeteer. Functions include clicking elements based on text, retrieving bounding
 * box coordinates, selecting tokens, and setting swap amounts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitforelement = exports.clickbyinnertxt = exports.swapBtn = exports.setMaxTx = exports.setSwapAmount = exports.wadapt = exports.inputTokenSelect = exports.outputTokenSelect = exports.getBoundingBox = exports.clickSelectorWtxt = void 0;
const helpers_1 = require("./helpers"); // Delay function
/**
 * clickSelectorWtxt
 * Finds an element by a CSS selector that contains specific text and clicks it.
 *
 * @param page - The Puppeteer Page instance.
 * @param selector - The CSS selector used to target elements.
 * @param text - The text that the element should contain.
 */
const clickSelectorWtxt = async (page, selector, text) => {
    await page.evaluate((sel, txt) => {
        // Get all elements matching the selector.
        const elements = Array.from(document.querySelectorAll(sel));
        // Find the element whose innerText includes the provided text.
        const element = elements.find((e) => e.innerText.includes(txt));
        if (element)
            element.click();
    }, selector, text);
};
exports.clickSelectorWtxt = clickSelectorWtxt;
/**
 * getBoundingBox
 * Finds an element matching a selector that contains the specified text and returns its center coordinates.
 *
 * @param page - The Puppeteer Page instance.
 * @param selector - The CSS selector to search for elements.
 * @param searchText - The text to match within the element.
 * @returns An object containing the center coordinates { bboxX, bboxY } or null if not found.
 */
const getBoundingBox = async (page, selector, searchText) => {
    // Wait briefly to allow the element to render.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const bbox = await page.evaluate((sel, txt) => {
        const elements = Array.from(document.querySelectorAll(sel));
        const element = elements.find((e) => e.innerText.includes(txt));
        if (!element)
            return null;
        const rect = element.getBoundingClientRect();
        return {
            bboxX: rect.left + rect.width / 2,
            bboxY: rect.top + rect.height / 2,
        };
    }, selector, searchText);
    return bbox;
};
exports.getBoundingBox = getBoundingBox;
/**
 * outputTokenSelect
 * Opens the output token dropdown by clicking the designated button.
 * Assumes that the 6th button (index 5) triggers this dropdown.
 *
 * @param page - The Puppeteer Page instance.
 */
const outputTokenSelect = async (page) => {
    await page.evaluate(() => {
        var _a;
        const buttons = Array.from(document.querySelectorAll("button"));
        (_a = buttons[5]) === null || _a === void 0 ? void 0 : _a.click();
    });
};
exports.outputTokenSelect = outputTokenSelect;
/**
 * inputTokenSelect
 * Opens the input token dropdown by clicking the designated button.
 * Assumes that the 5th button (index 4) triggers this dropdown.
 *
 * @param page - The Puppeteer Page instance.
 */
const inputTokenSelect = async (page) => {
    await page.evaluate(() => {
        var _a;
        const buttons = Array.from(document.querySelectorAll("button"));
        (_a = buttons[4]) === null || _a === void 0 ? void 0 : _a.click();
    });
};
exports.inputTokenSelect = inputTokenSelect;
/**
 * wadapt
 * Clicks the Phantom wallet adapter button to trigger the connection modal.
 *
 * @param page - The Puppeteer Page instance.
 */
const wadapt = async (page) => {
    await page.evaluate(() => {
        const adapterButton = document.querySelector(".wallet-adapter-button.wallet-adapter-button-trigger");
        adapterButton === null || adapterButton === void 0 ? void 0 : adapterButton.click();
    });
};
exports.wadapt = wadapt;
/**
 * setSwapAmount
 * Sets the swap amount in the "You Pay" input field.
 *
 * @param page - The Puppeteer Page instance.
 * @param amount - The amount to set.
 * @returns A Promise that resolves to true if successful, or false otherwise.
 */
const setSwapAmount = async (page, amount) => {
    const SWAP_AMOUNT_SELECTOR = "#jupiter-terminal > form > div > div.w-full.mt-2.rounded-\\[16px\\].flex.flex-col.px-0 > div.flex-col > div.mt-2.border-b.border-transparent.bg-\\[\\#05050580\\].rounded-xl.transition-all > div > div > div > div:nth-child(2) > div > input";
    try {
        await page.waitForSelector(SWAP_AMOUNT_SELECTOR, { timeout: 5000 });
        await page.focus(SWAP_AMOUNT_SELECTOR);
        await page.evaluate((sel, value) => {
            var _a;
            const input = document.querySelector(sel);
            if (input) {
                // Use native setter if available to simulate user input.
                const nativeInputValueSetter = (_a = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")) === null || _a === void 0 ? void 0 : _a.set;
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(input, value);
                }
                else {
                    input.value = value;
                }
                // Dispatch input and change events.
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }, SWAP_AMOUNT_SELECTOR, amount);
        await (0, helpers_1.d)(1000);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.setSwapAmount = setSwapAmount;
/**
 * setMaxTx
 * Sets transaction settings (e.g., slippage) in the UI.
 *
 * @param page - The Puppeteer Page instance.
 */
const setMaxTx = async (page) => {
    await (0, helpers_1.d)(2000);
    const selector = "#jupiter-terminal > div.mt-2.h-7 > div > div > button:nth-child(3) > svg";
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await (0, helpers_1.d)(2000);
    // Retrieve the bounding box of the "SOL" element in the settings area.
    const maybeMaxBbox = await (0, exports.getBoundingBox)(page, '[class="relative mt-1"]', "SOL");
    if (!maybeMaxBbox)
        throw new Error('Could not locate bounding box for "SOL" in the settings area.');
    const { bboxX, bboxY } = maybeMaxBbox;
    // Click on the element and adjust the input value.
    await page.mouse.click(bboxX, bboxY);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("0.0000005");
    await (0, helpers_1.d)(1000);
    await (0, exports.clickSelectorWtxt)(page, "button", "Save Settings");
};
exports.setMaxTx = setMaxTx;
/**
 * swapBtn
 * 1) Waits up to 5 seconds for the swap button (.swapbtn) to appear.
 * 2) Checks the button text in a loop (up to 20 tries, i.e. 20 seconds total).
 * 3) Clicks "Retry" or "Swap Again" if found, and re-checks.
 * 4) Throws immediately if the text is "Insufficient balance".
 * 5) Clicks once if the text is "Swap" and resolves.
 * 6) Throws an error if a valid "Swap" state is never encountered.
 *
 * @param page - The Puppeteer Page instance.
 */
const swapBtn = async (page) => {
    // Wait for the swap button to appear.
    try {
        await page.waitForSelector(".swapbtn", { timeout: 5000 });
    }
    catch (e) {
        throw new Error("Swap button not found on the page within 5s");
    }
    let foundSwap = false;
    let tries = 0;
    const maxTries = 20;
    while (!foundSwap && tries < maxTries) {
        const text = await page.evaluate(() => {
            const button = document.querySelector(".swapbtn");
            return (button === null || button === void 0 ? void 0 : button.innerText.trim()) || "";
        });
        if (text.includes("Insufficient balance")) {
            throw new Error(`Swap button is stuck on "Insufficient balance"`);
        }
        if (text.includes("Retry") || text.includes("Swap Again")) {
            await page.click(".swapbtn");
        }
        else if (text === "Swap") {
            await page.click(".swapbtn");
            foundSwap = true;
        }
        tries++;
        if (!foundSwap) {
            await (0, helpers_1.d)(1000); // wait 1 second before retrying
        }
    }
    if (!foundSwap) {
        throw new Error("Never encountered a valid 'Swap' state within 20 seconds.");
    }
};
exports.swapBtn = swapBtn;
/**
 * clickbyinnertxt
 * Finds an element by the specified selector with an innerText exactly matching one of the provided values,
 * clicks the element, and returns true if successful.
 *
 * @param page - The Puppeteer Page instance.
 * @param selector - The CSS selector to locate elements.
 * @param innertxt - A string or array of strings that must exactly match the innerText.
 * @returns A Promise that resolves to true if an element was found and clicked, otherwise false.
 */
const clickbyinnertxt = async (page, selector, innertxt) => {
    const candidates = Array.isArray(innertxt) ? innertxt : [innertxt];
    const didClick = await page.evaluate((sel, texts) => {
        const elements = Array.from(document.querySelectorAll(sel));
        const target = elements.find((ele) => texts.some((txt) => ele.innerText.trim() === txt));
        if (!target)
            return false;
        target.click();
        return true;
    }, selector, candidates);
    return didClick;
};
exports.clickbyinnertxt = clickbyinnertxt;
/**
 * waitforelement
 * Waits for an element matching the given selector and containing specific innerText to appear,
 * then clicks it.
 *
 * @param page - The Puppeteer Page instance.
 * @param selector - The CSS selector to locate elements.
 * @param innertxt - The text to search for within the element.
 * @param timeout - Maximum time to wait for the element (in ms).
 */
const waitforelement = async (page, selector, innertxt, timeout) => {
    await page.waitForFunction((sel, txt) => {
        const elements = Array.from(document.querySelectorAll(sel));
        for (const el of elements) {
            if (el.innerText.includes(txt)) {
                el.click();
                return true;
            }
        }
        return false;
    }, { timeout }, selector, innertxt);
};
exports.waitforelement = waitforelement;

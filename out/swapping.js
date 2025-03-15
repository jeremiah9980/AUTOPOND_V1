"use strict";
// swapping.ts
// This module handles the swapping logic for the Pond0x platform.
// It includes on‑chain helper functions for interacting with Solana (via @solana/web3.js)
// and automates UI interactions with Puppeteer. Console output is styled with chalk
// via our unified print functions.
Object.defineProperty(exports, "__esModule", { value: true });
exports.signtxloop = exports.swappond = exports.connectwallet = void 0;
const tslib_1 = require("tslib");
const helpers_1 = require("./utils/helpers");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const web3_js_1 = require("@solana/web3.js");
const metrics_1 = require("./metrics/metrics");
const print_1 = require("./ui/print");
const solana_1 = require("./solana");
const swapMetricsDb_1 = require("./db/swapMetricsDb");
const borderboxstyles_1 = require("./ui/styles/borderboxstyles");
const pagehandlers_1 = require("./utils/pagehandlers");
const phantom_1 = require("./phantom");
// Global state for tracking current token configuration.
let currentFromToken;
let currentFromMint;
let currentThreshold;
let currentFromPossibleAmounts;
let currentFromRewardAmounts;
let currentOutputToken;
let currentOutputMint;
let currentOutputPossibleAmounts;
let currentOutputRewardAmounts;
// Global wallet address from the connected Phantom wallet.
let userpublickey;
// Global flags for turboswap mode.
// tokensAlreadySelected: once tokens are selected, skip token selection on subsequent swaps.
// swapAmountEntered: on the first swap, input the swap amount; later, assume it remains in the UI.
let tokensAlreadySelected = false;
let swapAmountEntered = false;
/**
 * connectwallet
 * -------------
 * Initiates connection to the Phantom wallet by triggering a popup and retrieving the wallet's public key.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @returns {Promise<void>}
 */
const connectwallet = async (page, browser) => {
    (0, print_1.printMessageLinesBorderBox)(["💼 Starting wallet connection..."], borderboxstyles_1.phantomStyle);
    await (0, helpers_1.d)(1000);
    await (0, pagehandlers_1.wadapt)(page);
    await (0, helpers_1.d)(3000);
    await (0, phantom_1.handlephanpopup)(page, browser, "Connect", "Phantom\nDetected");
    // Get the connected wallet's public key.
    userpublickey = await (0, solana_1.getPhantomPublicKey)(page);
    (0, print_1.printMessageLinesBorderBox)(["👻 Phantom wallet connected", `${userpublickey}`], borderboxstyles_1.phantomStyle);
};
exports.connectwallet = connectwallet;
/**
 * flipTokenDirection
 * ------------------
 * Helper function to swap the current input and output token configurations.
 * Also resets the tokensAlreadySelected and swapAmountEntered flags so that new token selection and amount entry occur.
 *
 * @param {SwapConfig} config - The swap configuration object.
 * @returns {void}
 */
function flipTokenDirection(config) {
    const tempToken = currentFromToken;
    const tempMint = currentFromMint;
    const tempPossible = currentFromPossibleAmounts;
    const tempReward = currentFromRewardAmounts;
    currentFromToken = currentOutputToken;
    currentFromMint = currentOutputMint;
    currentThreshold =
        currentFromToken === config.tokenA
            ? config.tokenALowThreshold
            : config.tokenBLowThreshold;
    currentFromPossibleAmounts =
        currentFromToken === config.tokenA
            ? config.tokenAPossibleAmounts
            : config.tokenBPossibleAmounts;
    currentFromRewardAmounts =
        currentFromToken === config.tokenA
            ? config.tokenARewardAmounts
            : config.tokenBRewardAmounts;
    currentOutputToken = tempToken;
    currentOutputMint = tempMint;
    currentOutputPossibleAmounts = tempPossible;
    currentOutputRewardAmounts = tempReward;
    // Reset both flags for the new token direction.
    tokensAlreadySelected = false;
    swapAmountEntered = false;
}
/**
 * swappingroutine
 * ---------------
 * Attempts a single swap and returns an object with the result.
 * If turboswap mode is enabled and tokens have already been selected, token selection is skipped.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @param {string} fromToken - The token symbol to swap from.
 * @param {string} toToken - The token symbol to swap to.
 * @param {string} amount - The swap amount as a string.
 * @param {boolean} turboswap - Flag indicating if turboswap mode is active.
 * @returns {Promise<{ success: boolean; errorType?: string; swapDetails?: any }>} Swap result details.
 */
const swappingroutine = async (page, browser, fromToken, toToken, amount, turboswap) => {
    await (0, helpers_1.d)(2000);
    // Perform token selection if required.
    if (!(turboswap && tokensAlreadySelected)) {
        if (fromToken !== "SOL") {
            await (0, pagehandlers_1.inputTokenSelect)(page);
            await (0, helpers_1.d)(2000);
            await (0, pagehandlers_1.clickSelectorWtxt)(page, "li", fromToken);
        }
        await (0, pagehandlers_1.outputTokenSelect)(page);
        await (0, helpers_1.d)(3000);
        await (0, pagehandlers_1.clickSelectorWtxt)(page, "li", toToken);
        if (turboswap)
            tokensAlreadySelected = true;
    }
    let txSuccessObj;
    // Enter swap amount based on mode.
    if (!turboswap || (turboswap && !swapAmountEntered)) {
        txSuccessObj = (await (0, pagehandlers_1.setSwapAmount)(page, amount))
            ? await (0, exports.signtxloop)(page, browser)
            : { success: false, errorType: "other" };
        if (turboswap)
            swapAmountEntered = true;
    }
    else {
        txSuccessObj = await (0, exports.signtxloop)(page, browser);
    }
    const swapDetails = { from: fromToken, to: toToken, amount };
    return {
        success: txSuccessObj.success,
        errorType: txSuccessObj.success ? undefined : txSuccessObj.errorType,
        swapDetails,
    };
};
/**
 * swappond
 * --------
 * Main function to execute multiple swap rounds. For each round, it:
 * - Checks wallet balance,
 * - Chooses a swap amount (using rewards amounts if rewards are active),
 * - Attempts up to 3 swap retries on any failure.
 * Metrics for each round are captured and aggregated.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @param {SwapConfig} config - The swap configuration parameters.
 * @returns {Promise<SwapCycleMetrics>} The aggregated swap cycle metrics.
 */
const swappond = async (page, browser, config) => {
    // Reset global flags at the start of a run.
    tokensAlreadySelected = false;
    swapAmountEntered = false;
    const metrics = {
        totalSwapRounds: 0,
        successfulSwapRounds: 0,
        failedSwapRounds: 0,
        abortedSwapRounds: 0,
        totalSwapAttempts: 0,
        volumeByToken: {},
        swapsByToken: {},
        totalTransactionFeesSOL: 0,
        referralFeesByToken: {},
        preSignFailures: { insufficient: 0, userAbort: 0, other: 0 },
        postSignFailures: { slippageTolerance: 0, transactionReverted: 0, other: 0 },
        extraSwapErrors: {},
    };
    try {
        // Rewards check section: if enabled, check recent WPOND transfer.
        if (config.enableRewardsCheck) {
            const rewardsActive = await (0, solana_1.checkRecentWpondTransfer)();
            config.swapRewardsActive = rewardsActive;
            (0, print_1.printMessageLinesBorderBox)([
                rewardsActive
                    ? "Rewards mode ACTIVE – reward amounts will be used."
                    : "Rewards mode NOT active – normal amounts will be used.",
            ], rewardsActive ? borderboxstyles_1.generalStyle : borderboxstyles_1.warningStyle);
            // Exit early if rewards are not active and skipping is desired.
            if (!rewardsActive && config.skipSwapIfNoRewards) {
                (0, print_1.printMessageLinesBorderBox)(["Rewards are not active. Skipping swap round."], borderboxstyles_1.warningStyle);
                return metrics;
            }
        }
        else {
            config.swapRewardsActive = false;
        }
        // Get the bounding box for the "You Pay" field as a prerequisite.
        const maybeBbox = await (0, pagehandlers_1.getBoundingBox)(page, ".py-5.px-4.flex.flex-col.dark\\:text-white", "You Pay");
        if (!maybeBbox)
            throw new Error('Could not locate bounding box for "You Pay" field.');
        const { bboxX, bboxY } = maybeBbox;
        await (0, pagehandlers_1.setMaxTx)(page, config.maxReferralFee);
        // Initialize token configurations.
        currentFromToken = config.tokenA;
        currentFromMint = config.tokenAMint;
        currentThreshold = config.tokenALowThreshold;
        currentFromPossibleAmounts = config.tokenAPossibleAmounts;
        currentFromRewardAmounts = config.tokenARewardAmounts;
        currentOutputToken = config.tokenB;
        currentOutputMint = config.tokenBMint;
        currentOutputPossibleAmounts = config.tokenBPossibleAmounts;
        currentOutputRewardAmounts = config.tokenBRewardAmounts;
        // Reset token selection flag for this cycle.
        tokensAlreadySelected = false;
        swapAmountEntered = false;
        for (let round = 0; round < config.swapRounds; round++) {
            (0, print_1.printMessageLinesBorderBox)([`=== Starting Swap Round ${round + 1} of ${config.swapRounds} ===`], borderboxstyles_1.swappingStyle);
            const currentBalance = await getRealBalance(page, currentFromToken, currentFromMint);
            const balanceStatus = currentBalance < currentThreshold
                ? `${currentFromToken} balance below threshold`
                : `${currentFromToken} balance is sufficient`;
            // Determine the chosen swap amount.
            let chosenAmount;
            if (config.turboswap) {
                const amountsArray = config.swapRewardsActive
                    ? currentFromRewardAmounts
                    : currentFromPossibleAmounts;
                chosenAmount = amountsArray[0];
            }
            else {
                chosenAmount = (0, helpers_1.pickRandom)(config.swapRewardsActive
                    ? currentFromRewardAmounts
                    : currentFromPossibleAmounts);
            }
            (0, print_1.printMessageLinesBorderBox)([
                `Current ${currentFromToken} balance: ${currentBalance}`,
                balanceStatus,
                `Chosen amount: ${chosenAmount}`,
            ], borderboxstyles_1.swappingStyle);
            // If balance is below threshold, flip the token direction.
            if (currentBalance < currentThreshold) {
                flipTokenDirection(config);
                (0, print_1.printMessageLinesBorderBox)([
                    `Flipped. Now fromToken: ${currentFromToken}, toToken: ${currentOutputToken}`,
                ], borderboxstyles_1.swappingStyle);
                if (!config.turboswap) {
                    chosenAmount = (0, helpers_1.pickRandom)(config.swapRewardsActive
                        ? currentFromRewardAmounts
                        : currentFromPossibleAmounts);
                    (0, print_1.printMessageLinesBorderBox)([`New chosen amount after flip: ${chosenAmount}`], borderboxstyles_1.swappingStyle);
                }
                else {
                    const newAmountsArray = config.swapRewardsActive
                        ? currentFromRewardAmounts
                        : currentFromPossibleAmounts;
                    chosenAmount = newAmountsArray[0];
                    (0, print_1.printMessageLinesBorderBox)([`Reusing chosen amount after flip: ${chosenAmount}`], borderboxstyles_1.swappingStyle);
                }
            }
            let attempts = 0;
            let roundSuccess = false;
            let feeSOL = 0;
            let referralFee = 0;
            let pair = "";
            while (attempts < 3 && !roundSuccess) {
                attempts++;
                metrics.totalSwapAttempts++;
                (0, print_1.printMessageLinesBorderBox)([`🔁 Attempt ${attempts} for round ${round + 1}`], borderboxstyles_1.generalStyle);
                const swapResult = await swappingroutine(page, browser, currentFromToken, currentOutputToken, chosenAmount.toString(), config.turboswap);
                if (!swapResult.success) {
                    const errorKey = swapResult.errorType || "unknown";
                    metrics.extraSwapErrors[errorKey] =
                        (metrics.extraSwapErrors[errorKey] || 0) + 1;
                    if (swapResult.errorType === "insufficient") {
                        metrics.preSignFailures.insufficient++;
                        (0, print_1.printMessageLinesBorderBox)(["Pre-sign failure: insufficient balance"], borderboxstyles_1.warningStyle);
                    }
                    else if (swapResult.errorType &&
                        swapResult.errorType.startsWith("postSign")) {
                        if (swapResult.errorType === "postSignSlippage") {
                            metrics.postSignFailures.slippageTolerance++;
                        }
                        else if (swapResult.errorType === "postSignError") {
                            metrics.postSignFailures.transactionReverted++;
                        }
                        else {
                            metrics.postSignFailures.other++;
                        }
                        (0, print_1.printMessageLinesBorderBox)([`Post-sign failure: ${swapResult.errorType}`], borderboxstyles_1.warningStyle);
                    }
                    else {
                        metrics.preSignFailures.other++;
                        (0, print_1.printMessageLinesBorderBox)([`Pre-sign failure: ${swapResult.errorType || "unknown"}`], borderboxstyles_1.warningStyle);
                    }
                    await (0, helpers_1.d)(1500);
                    continue;
                }
                let solscanUrl = null;
                try {
                    // Wait concurrently for either the Solscan TX link or an error message.
                    const successSelector = "a[href*='solscan.io/tx/']";
                    const errorSelector = "#jupiter-terminal > form > div > div.w-full.px-2 > div.flex.flex-col.h-full.w-full.mt-2 > div > div > p";
                    const successPromise = page.waitForSelector(successSelector, { timeout: 60000 });
                    const errorPromise = page.waitForSelector(errorSelector, { timeout: 60000 });
                    // Proceed with whichever element appears first.
                    const element = await Promise.race([successPromise, errorPromise]);
                    if (!element) {
                        throw new Error("No element found for either selector.");
                    }
                    // Determine if the element matches the error selector.
                    const isErrorElement = await page.evaluate((el, errorSelector) => el ? el.matches(errorSelector) : false, element, errorSelector);
                    if (isErrorElement) {
                        const errorText = await page.evaluate(el => el ? el.innerText : "", element);
                        throw new Error(errorText);
                    }
                    else {
                        solscanUrl = await page.evaluate(el => el.href, element);
                    }
                }
                catch (error) {
                    const swapButtonText = await page.evaluate(() => {
                        const button = document.querySelector(".swapbtn");
                        return button ? button.innerText : "";
                    });
                    if (swapButtonText.toLowerCase().includes("swapping")) {
                        (0, print_1.printMessageLinesBorderBox)(["⏰ Swap still in progress after 1 minute. Reloading page..."], borderboxstyles_1.warningStyle);
                        await page.reload();
                        continue;
                    }
                    else {
                        (0, print_1.printMessageLinesBorderBox)(["❌ Timeout: Solscan TX could not be found (aggregator fail)."], borderboxstyles_1.warningStyle);
                    }
                }
                if (solscanUrl) {
                    roundSuccess = true;
                    metrics.successfulSwapRounds++;
                    metrics.volumeByToken[currentFromToken] =
                        (metrics.volumeByToken[currentFromToken] || 0) + chosenAmount;
                    pair = `${currentFromToken.toUpperCase()}-${currentOutputToken.toUpperCase()}`;
                    metrics.swapsByToken[pair] = (metrics.swapsByToken[pair] || 0) + 1;
                    const clickableLink = (0, print_1.buildOsc8Hyperlink)(solscanUrl, "View Solscan Transaction");
                    (0, print_1.printMessageLinesBorderBox)([clickableLink], borderboxstyles_1.generalStyle);
                    const parts = solscanUrl.split("/tx/");
                    const txNumber = parts.length > 1 ? parts[1] : solscanUrl;
                    try {
                        const connection = new web3_js_1.Connection("https://api.mainnet-beta.solana.com", "confirmed");
                        const parsedTx = await connection.getParsedTransaction(txNumber, {
                            maxSupportedTransactionVersion: 0,
                        });
                        const { feeSOL: txFeeSOL, referralFee: txReferralFee } = await (0, print_1.printSwapSummary)(parsedTx, {
                            from: currentFromToken,
                            to: currentOutputToken,
                            amount: chosenAmount.toString(),
                        }, currentFromMint, currentOutputMint, userpublickey);
                        feeSOL = txFeeSOL;
                        referralFee = txReferralFee;
                        metrics.totalTransactionFeesSOL += feeSOL;
                        metrics.referralFeesByToken[currentFromToken] =
                            (metrics.referralFeesByToken[currentFromToken] || 0) + referralFee;
                    }
                    catch (txError) {
                        console.log(chalk_1.default.red(`Error fetching TX data: ${txError}`));
                    }
                }
            } // End of while attempts loop.
            metrics.totalSwapRounds++;
            if (!roundSuccess) {
                metrics.failedSwapRounds++;
                (0, print_1.printMessageLinesBorderBox)([`❌ Round ${round + 1} failed after 3 attempts.`], borderboxstyles_1.warningStyle);
            }
            // Update persistent cumulative metrics in DB after each round.
            (0, swapMetricsDb_1.updateAggregatedSwapMetrics)({
                totalSwapRounds: 1,
                successfulSwapRounds: roundSuccess ? 1 : 0,
                failedSwapRounds: roundSuccess ? 0 : 1,
                abortedSwapRounds: 0,
                totalSwapAttempts: attempts,
                totalTransactionFeesSOL: feeSOL,
                volumeByToken: roundSuccess ? { [currentFromToken]: chosenAmount } : {},
                swapsByToken: roundSuccess ? { [pair]: 1 } : {},
                referralFeesByToken: roundSuccess ? { [currentFromToken]: referralFee } : {},
                preSignFailures: Object.assign({}, metrics.preSignFailures),
                postSignFailures: Object.assign({}, metrics.postSignFailures),
                extraSwapErrors: Object.assign({}, metrics.extraSwapErrors),
            });
            // Reset round-specific counters.
            metrics.preSignFailures = { insufficient: 0, userAbort: 0, other: 0 };
            metrics.postSignFailures = { slippageTolerance: 0, transactionReverted: 0, other: 0 };
            metrics.extraSwapErrors = {};
            if (roundSuccess)
                await (0, helpers_1.d)(2000);
        } // End of for rounds loop.
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        (0, print_1.printMessageLinesBorderBox)(["Error in swappond setup:", errorMessage], borderboxstyles_1.warningStyle);
        metrics.extraSwapErrors[errorMessage] = 1;
    }
    // Update global in-memory metrics.
    (0, metrics_1.accumulateSwapMetrics)(metrics);
    const summaryReport = {
        "Total Swap Rounds": metrics.totalSwapRounds,
        "Successful Swap Rounds": metrics.successfulSwapRounds,
        "Failed Swap Rounds": metrics.failedSwapRounds,
        "Aborted Swap Rounds": metrics.preSignFailures.insufficient +
            metrics.preSignFailures.userAbort +
            metrics.preSignFailures.other,
        "Total Swap Attempts": metrics.totalSwapAttempts,
        "Volume by Token": metrics.volumeByToken,
        "Total Transaction Fees (SOL)": metrics.totalTransactionFeesSOL.toFixed(6),
        "Referral Fees by Token": metrics.referralFeesByToken,
        "Pre-Sign Failures": metrics.preSignFailures,
        "Post-Sign Failures": metrics.postSignFailures,
        "Extra Swap Errors": metrics.extraSwapErrors,
    };
    (0, print_1.printSessionEndReport)("Swap Cycle Metrics", summaryReport);
    return metrics;
};
exports.swappond = swappond;
/**
 * getRealBalance
 * --------------
 * Retrieves the on‑chain balance for the specified token using the connected wallet's public key.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {string} tokenSymbol - The token symbol (e.g., "SOL" or SPL token).
 * @param {string} [tokenMint] - The mint address for SPL tokens; not needed for SOL.
 * @returns {Promise<number>} The current token balance.
 * @throws Will throw an error if no mint address is provided for an SPL token.
 */
async function getRealBalance(page, tokenSymbol, tokenMint) {
    if (tokenSymbol === "SOL") {
        return await (0, solana_1.getSolBalance)(userpublickey);
    }
    else {
        if (!tokenMint)
            throw new Error(`No mint address provided for SPL token: ${tokenSymbol}`);
        return await (0, solana_1.getSplBalance)(userpublickey, tokenMint);
    }
}
/**
 * signtx
 * ------
 * Inside Phantom popup, either dismiss or approve the transaction.
 *
 * @param {Page} page - The Puppeteer page instance representing the Phantom popup.
 * @returns {Promise<string>} A string message indicating the result of the transaction signing.
 */
const signtx = async (page) => {
    await (0, helpers_1.d)(5000);
    const resultMsg = await page.evaluate(() => {
        var _a;
        const warningContainer = document.querySelector('[data-testid="warning-container"]');
        if (warningContainer) {
            const secondaryButton = document.querySelector('[data-testid="secondary-button"]');
            secondaryButton === null || secondaryButton === void 0 ? void 0 : secondaryButton.click();
            return ((_a = warningContainer.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        }
        else {
            const primaryButton = document.querySelector('[data-testid="primary-button"]');
            if (primaryButton) {
                primaryButton.click();
                return "Transaction approved";
            }
            return "";
        }
    });
    return resultMsg;
};
/**
 * signtxloop
 * ---------
 * Repeatedly attempts to sign the transaction in Phantom until success or max attempts reached.
 * Checks for errors or "approved" message and handles retries.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @param {Browser} browser - The Puppeteer browser instance.
 * @returns {Promise<{ success: boolean; errorType?: string }>} The result of the transaction signing.
 */
const signtxloop = async (page, browser) => {
    const startTime = Date.now();
    let signed = false;
    let attempts = 0;
    const maxAttempts = 5;
    let lastWarning = "";
    (0, print_1.printMessageLinesBorderBox)(["⏳ Waiting for transaction signature..."], borderboxstyles_1.phantomStyle);
    while (!signed && attempts < maxAttempts) {
        if (Date.now() - startTime > 30000) {
            (0, print_1.printMessageLinesBorderBox)(["⏰ Timeout reached. Reloading page..."], borderboxstyles_1.warningStyle);
            await page.reload();
            break;
        }
        attempts++;
        (0, print_1.printMessageLinesBorderBox)([`🔁 Attempt ${attempts} for signature...`], borderboxstyles_1.generalStyle);
        let popup = null;
        try {
            popup = await new Promise(async (resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    browser.off("targetcreated", onTargetCreated);
                    reject(new Error("No popup opened within 10s"));
                }, 10000);
                const onTargetCreated = async (target) => {
                    clearTimeout(timeoutId);
                    browser.off("targetcreated", onTargetCreated);
                    resolve(await target.page());
                };
                browser.on("targetcreated", onTargetCreated);
                (0, pagehandlers_1.swapBtn)(page).catch((err) => {
                    clearTimeout(timeoutId);
                    browser.off("targetcreated", onTargetCreated);
                    reject(err);
                });
            });
        }
        catch (e) {
            (0, print_1.printMessageLinesBorderBox)([`❌ Error creating popup: ${e.message}`], borderboxstyles_1.warningStyle);
            return { success: false, errorType: "other" };
        }
        let resultMsg = "";
        try {
            resultMsg = await signtx(popup);
            (0, print_1.printMessageLinesBorderBox)([`📝 Sign message: ${resultMsg}`], borderboxstyles_1.phantomStyle);
        }
        catch (e) {
            (0, print_1.printMessageLinesBorderBox)(["❌ Error during signing."], borderboxstyles_1.warningStyle);
            return { success: false, errorType: "other" };
        }
        const lowerMsg = resultMsg.toLowerCase();
        if (lowerMsg.includes("insufficient balance") ||
            lowerMsg.includes("does not have enough sol")) {
            (0, print_1.printMessageLinesBorderBox)(["⚠️ Insufficient balance detected."], borderboxstyles_1.warningStyle);
            lastWarning = lowerMsg;
            return { success: false, errorType: "insufficient" };
        }
        if (lowerMsg.includes("transaction approved")) {
            (0, print_1.printMessageLinesBorderBox)(["✅ Transaction approved."], borderboxstyles_1.phantomStyle);
            signed = true;
            break;
        }
        if (lowerMsg.includes("transaction reverted") ||
            lowerMsg.includes("slippage tolerance exceeded") ||
            lowerMsg.includes("retry")) {
            (0, print_1.printMessageLinesBorderBox)([`⚠️ Transient error: ${lowerMsg}. Retrying...`], borderboxstyles_1.warningStyle);
            try {
                await popup.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll("button"));
                    const retryButton = buttons.find((btn) => btn.innerText.toLowerCase().includes("retry"));
                    retryButton === null || retryButton === void 0 ? void 0 : retryButton.click();
                });
            }
            catch (e) {
                (0, print_1.printMessageLinesBorderBox)(["❌ Error during retry."], borderboxstyles_1.warningStyle);
                return { success: false, errorType: "other" };
            }
            lastWarning = lowerMsg;
            await (0, helpers_1.d)(1000);
            continue;
        }
        if (lowerMsg === "") {
            await (0, helpers_1.d)(1000);
            continue;
        }
        lastWarning = lowerMsg;
        await (0, helpers_1.d)(1000);
        browser.removeAllListeners("targetcreated");
    }
    if (!signed) {
        const isInsufficient = lastWarning.includes("insufficient") ||
            lastWarning.includes("not enough sol");
        return {
            success: false,
            errorType: isInsufficient ? "insufficient" : "transient",
        };
    }
    const postSignError = await checkForPostSignError(page);
    if (postSignError) {
        (0, print_1.printMessageLinesBorderBox)([`⚠️ Post-sign error detected: ${postSignError}`], borderboxstyles_1.warningStyle);
        const lowerPostError = postSignError.toLowerCase();
        if (lowerPostError.includes("slippage") ||
            lowerPostError.includes("reverted")) {
            return { success: false, errorType: "postSignSlippage" };
        }
        else if (lowerPostError.includes("fail") ||
            lowerPostError.includes("error")) {
            return { success: false, errorType: "postSignError" };
        }
        else {
            return { success: false, errorType: "other" };
        }
    }
    return { success: true };
};
exports.signtxloop = signtxloop;
/**
 * checkForPostSignError
 * -----------------------
 * Looks for any error messages on the main page after the Phantom transaction has been approved.
 *
 * @param {Page} page - The Puppeteer page instance.
 * @returns {Promise<string | null>} A string with the error message, or null if no error is found.
 */
async function checkForPostSignError(page) {
    await (0, helpers_1.d)(2000);
    return page.evaluate(() => {
        var _a;
        const errorElem = document.querySelector(".swap-error-message");
        if (errorElem) {
            return ((_a = errorElem.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        }
        return null;
    });
}

"use strict";
// solana.ts
// This module handles the swapping logic for the Pond0x platform and provides on‐chain helper functions.
// It interacts with Solana using @solana/web3.js and uses Puppeteer for browser automation.
// Console output is styled using chalk and tables are generated using cli-table3.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhantomPublicKey = getPhantomPublicKey;
exports.getSolBalance = getSolBalance;
exports.getSplBalance = getSplBalance;
exports.getSplTokenDecimals = getSplTokenDecimals;
exports.getNetTokenChange = getNetTokenChange;
exports.parseReferralFeeFromTx = parseReferralFeeFromTx;
exports.checkRecentWpondTransfer = checkRecentWpondTransfer;
const tslib_1 = require("tslib");
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const print_1 = require("./ui/print");
const borderboxstyles_1 = require("./ui/styles/borderboxstyles");
const configloader_1 = require("./utils/configloader");
const printtable_1 = require("./ui/tables/printtable");
const solanaConfig = (0, configloader_1.loadSolanaConfig)();
const RPC_ENDPOINT = solanaConfig.rpcEndpoint;
/**
 * getPhantomPublicKey - Ensures that the Phantom wallet is connected by triggering its connection flow.
 * It then returns the connected wallet's public key as a string.
 *
 * @param page - The Puppeteer Page object representing the browser window.
 * @returns The connected Phantom wallet's public key.
 * @throws An error if the public key is not found.
 */
async function getPhantomPublicKey(page) {
    const pubKey = await page.evaluate(async () => {
        var _a;
        if (window.solana && window.solana.isPhantom) {
            await window.solana.connect();
            return ((_a = window.solana.publicKey) === null || _a === void 0 ? void 0 : _a.toString()) || null;
        }
        return null;
    });
    if (!pubKey) {
        throw new Error("Phantom public key not found. Ensure the wallet is connected.");
    }
    return pubKey;
}
/**
 * getSolBalance - Retrieves the SOL balance for a given public key.
 *
 * @param pubKeyString - The public key as a string.
 * @returns The SOL balance (converted from lamports to SOL).
 */
async function getSolBalance(pubKeyString) {
    const connection = new web3_js_1.Connection(RPC_ENDPOINT);
    const pubKey = new web3_js_1.PublicKey(pubKeyString);
    const lamports = await connection.getBalance(pubKey);
    return lamports / 1e9;
}
/**
 * getSplBalance - Retrieves the balance for a specified SPL token in a given wallet.
 *
 * @param pubKeyString - The wallet's public key as a string.
 * @param tokenMintString - The token mint address as a string.
 * @returns The total balance of the specified SPL token.
 */
async function getSplBalance(pubKeyString, tokenMintString) {
    var _a, _b;
    const connection = new web3_js_1.Connection(RPC_ENDPOINT);
    const walletPubKey = new web3_js_1.PublicKey(pubKeyString);
    const tokenMint = new web3_js_1.PublicKey(tokenMintString);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubKey, { mint: tokenMint });
    let totalBalance = 0;
    for (const tokenAccount of tokenAccounts.value) {
        const tokenAmount = (_b = (_a = tokenAccount.account.data.parsed) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.tokenAmount;
        if (tokenAmount && tokenAmount.uiAmount != null) {
            totalBalance += tokenAmount.uiAmount;
        }
    }
    return totalBalance;
}
async function getSplTokenDecimals(mintAddress, rpcEndpoint = "https://api.mainnet-beta.solana.com", defaultDecimals = 6) {
    const connection = new web3_js_1.Connection(rpcEndpoint, "confirmed");
    try {
        const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
        const accountInfo = await connection.getAccountInfo(mintPublicKey);
        if (!accountInfo || !accountInfo.data || accountInfo.data.length < 45) {
            console.warn(`Invalid or missing mint account data for ${mintAddress}. Falling back to ${defaultDecimals} decimals.`);
            return defaultDecimals;
        }
        return accountInfo.data.readUInt8(44);
    }
    catch (error) {
        console.error(`Failed to fetch decimals for ${mintAddress}:`, error);
        return defaultDecimals;
    }
}
function getNetTokenChange(parsedTx, token, tokenMint, walletAddress) {
    if (token.toUpperCase() === "SOL" || !tokenMint) {
        const pre = parsedTx.meta.preBalances[0] / 1e9;
        const post = parsedTx.meta.postBalances[0] / 1e9;
        return post - pre;
    }
    else {
        const preTokens = parsedTx.meta.preTokenBalances.filter((t) => t.mint.toUpperCase() === tokenMint.toUpperCase() &&
            (!walletAddress ||
                t.owner.toUpperCase() === walletAddress.toUpperCase()));
        const postTokens = parsedTx.meta.postTokenBalances.filter((t) => t.mint.toUpperCase() === tokenMint.toUpperCase() &&
            (!walletAddress ||
                t.owner.toUpperCase() === walletAddress.toUpperCase()));
        const preSum = preTokens.reduce((acc, t) => acc + Number(t.uiTokenAmount.uiAmount), 0);
        const postSum = postTokens.reduce((acc, t) => acc + Number(t.uiTokenAmount.uiAmount), 0);
        return postSum - preSum;
    }
}
async function parseReferralFeeFromTx(parsedTx, tokenAMint, tokenBMint, inputSymbol, outputSymbol, inputDecimals, outputDecimals, rpcEndpoint = "https://api.mainnet-beta.solana.com") {
    var _a;
    const TOKEN_PROGRAM_ID = "TOKENKEGQFEZYINWAJBNBGKPFXCWUBVF9SS623VQ5DA";
    const MIN_REFERRAL_FEE = 1000;
    let candidateTransfers = [];
    if (parsedTx.meta.innerInstructions) {
        for (const inner of parsedTx.meta.innerInstructions) {
            for (const instr of inner.instructions) {
                if (instr.parsed && instr.parsed.type === "transfer") {
                    const pid = instr.programId.toString().toUpperCase();
                    if (pid === TOKEN_PROGRAM_ID) {
                        const amt = parseInt(instr.parsed.info.amount, 10);
                        if (amt >= MIN_REFERRAL_FEE) {
                            candidateTransfers.push({
                                amount: amt,
                                mint: instr.parsed.info.mint,
                            });
                        }
                    }
                }
            }
        }
    }
    if (candidateTransfers.length === 0) {
        return { fee: 0, label: "Referral Fee" };
    }
    const minTransfer = candidateTransfers.reduce((min, curr) => curr.amount < min.amount ? curr : min);
    const feeMint = (_a = minTransfer.mint) === null || _a === void 0 ? void 0 : _a.toUpperCase();
    let referralFee;
    let referralFeeLabel;
    if (feeMint && feeMint === (tokenAMint === null || tokenAMint === void 0 ? void 0 : tokenAMint.toUpperCase())) {
        referralFee = minTransfer.amount / 10 ** inputDecimals;
        referralFeeLabel = `Referral Fee (${inputSymbol})`;
    }
    else if (feeMint && feeMint === (tokenBMint === null || tokenBMint === void 0 ? void 0 : tokenBMint.toUpperCase())) {
        referralFee = minTransfer.amount / 10 ** outputDecimals;
        referralFeeLabel = `Referral Fee (${outputSymbol})`;
    }
    else {
        referralFee = minTransfer.amount / 1e9;
        referralFeeLabel = "Referral Fee (SOL)";
        if (minTransfer.mint) {
            console.log(chalk_1.default.yellow(`Unrecognized referral fee mint ${minTransfer.mint}; assuming SOL.`));
        }
    }
    return { fee: referralFee, label: referralFeeLabel };
}
/**
 * getParsedTransactionWithRetry - Attempts to retrieve a parsed transaction with retry logic.
 *
 * @param connection - The Solana connection object.
 * @param signature - The transaction signature.
 * @param retries - The maximum number of retries (default is 5).
 * @returns The parsed transaction object.
 * @throws An error if the transaction cannot be fetched after the given retries.
 */
async function getParsedTransactionWithRetry(connection, signature, retries = 5) {
    let delayMs = 500;
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await connection.getParsedTransaction(signature);
        }
        catch (err) {
            if (err.message && err.message.includes("429")) {
                (0, print_1.printMessageLinesBorderBox)([`Server responded with 429. Retrying after ${delayMs}ms...`], borderboxstyles_1.generalStyle);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                delayMs *= 2;
            }
            else {
                throw err;
            }
        }
    }
    throw new Error(`Failed to fetch parsed transaction for signature ${signature} after ${retries} retries.`);
}
/**
 * checkRecentWpondTransfer - Checks for a recent WPOND transfer (swap reward activity) from the rewards wallet.
 *
 * It uses the time threshold to filter transactions, then prints a summary table of the activity.
 *
 * @returns True if at least one transaction passed validation; otherwise, false.
 */
async function checkRecentWpondTransfer() {
    const rewardsWalletAddress = solanaConfig.rewardsWalletAddress;
    const wpondTokenMint = solanaConfig.wpondTokenMint;
    const discountWalletAddresses = solanaConfig.discountWalletAddresses;
    const timeThresholdSeconds = solanaConfig.wpondTransferTimeThreshold;
    (0, print_1.printMessageLinesBorderBox)(["=== Checking for recent WPOND transfer ==="], borderboxstyles_1.swappingStyle);
    const details = {
        "Rewards wallet address": rewardsWalletAddress,
        "WPOND token mint": wpondTokenMint,
        "Discount wallet addresses": discountWalletAddresses.join(", "),
        "Time threshold (sec)": timeThresholdSeconds,
    };
    (0, printtable_1.printTable)("Swap Rewards Check Details", details);
    const connection = new web3_js_1.Connection(RPC_ENDPOINT);
    const rewardsWalletPubkey = new web3_js_1.PublicKey(rewardsWalletAddress);
    (0, print_1.printMessageLinesBorderBox)(["Fetching recent signatures for rewards wallet (limit 5)..."], borderboxstyles_1.swappingStyle);
    const signatures = await connection.getSignaturesForAddress(rewardsWalletPubkey, { limit: 5 });
    const currentTime = Math.floor(Date.now() / 1000);
    (0, print_1.printMessageLinesBorderBox)([`Current time (sec): ${currentTime}`], borderboxstyles_1.swappingStyle);
    const rangeStart = currentTime - timeThresholdSeconds;
    (0, print_1.printMessageLinesBorderBox)([`Valid time range (sec): ${rangeStart} - ${currentTime}`], borderboxstyles_1.swappingStyle);
    const txSummaries = [];
    for (const sigInfo of signatures) {
        if (sigInfo.blockTime) {
            const shortSig = (0, print_1.shortenString)(sigInfo.signature);
            const summary = {
                Signature: shortSig,
                BlockTime: sigInfo.blockTime,
                Status: "",
            };
            if (currentTime - sigInfo.blockTime <= timeThresholdSeconds) {
                try {
                    const parsedTx = await getParsedTransactionWithRetry(connection, sigInfo.signature);
                    let valid = false;
                    let amount = "";
                    let src = "";
                    let dest = "";
                    if (parsedTx && parsedTx.meta && parsedTx.transaction.message) {
                        for (const instruction of parsedTx.transaction.message
                            .instructions) {
                            if ("parsed" in instruction) {
                                const parsedInstruction = instruction.parsed;
                                if ((parsedInstruction.type === "transfer" ||
                                    parsedInstruction.type === "transferChecked") &&
                                    parsedInstruction.info.mint) {
                                    const info = parsedInstruction.info;
                                    if (info.mint === wpondTokenMint &&
                                        !discountWalletAddresses.includes(info.destination)) {
                                        valid = true;
                                        amount = info.amount;
                                        src = info.source;
                                        dest = info.destination;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    summary.Status = valid
                        ? chalk_1.default.bgGreen.bold("Pass")
                        : chalk_1.default.bgRed.bold("Fail");
                    if (valid) {
                        summary.Amount = amount;
                        summary.Source = (0, print_1.shortenString)(src);
                        summary.Destination = (0, print_1.shortenString)(dest);
                        summary["WPOND Present"] = "Yes";
                        // Print the full transaction signature and Solscan link in magenta.
                        const solscanUrl = `https://solscan.io/tx/${sigInfo.signature}`;
                        (0, print_1.printMessageLinesBorderBox)([
                            `Swap TX Number: ${sigInfo.signature}`,
                            `Swap TX Link: ${solscanUrl}`,
                        ], borderboxstyles_1.swappingStyle);
                    }
                    else {
                        summary["WPOND Present"] = "No";
                    }
                }
                catch (e) {
                    summary.Status = chalk_1.default.bgRed.bold("Error");
                }
            }
            else {
                summary.Status = chalk_1.default.bgRed.bold("Outdated");
            }
            txSummaries.push(summary);
        }
    }
    if (txSummaries.length > 0) {
        console.log(chalk_1.default.magenta.yellow("\n=== Recent Swap Reward Activity ==="));
        const summaryTable = new cli_table3_1.default({
            head: [
                chalk_1.default.bold("Signature"),
                chalk_1.default.bold("BlockTime"),
                chalk_1.default.bold("Amount"),
                chalk_1.default.bold("Source"),
                chalk_1.default.bold("Destination"),
                chalk_1.default.bold("WPOND Present"),
                chalk_1.default.bold("Status"),
            ],
            style: { head: ["cyan"], border: ["green"] },
            colWidths: [15, 12, 10, 15, 15, 12, 10],
        });
        txSummaries.forEach((tx) => {
            summaryTable.push([
                tx.Signature,
                String(tx.BlockTime),
                tx.Amount ? tx.Amount : "N/A",
                tx.Source ? tx.Source : "N/A",
                tx.Destination ? tx.Destination : "N/A",
                tx["WPOND Present"] ? tx["WPOND Present"] : "N/A",
                tx.Status,
            ]);
        });
        console.log(summaryTable.toString());
        return txSummaries.some((tx) => tx.Status.toString().includes("Pass"));
    }
    (0, print_1.printMessageLinesBorderBox)(["No recent valid WPOND transfer detected. ❌"], borderboxstyles_1.swappingStyle);
    return false;
}

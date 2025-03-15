"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatObject = formatObject;
exports.printMessageLinesBorderBox = printMessageLinesBorderBox;
exports.printSessionEndReport = printSessionEndReport;
exports.printSwapSummary = printSwapSummary;
exports.buildOsc8Hyperlink = buildOsc8Hyperlink;
exports.wrapText = wrapText;
exports.shortenString = shortenString;
exports.centerText = centerText;
exports.centerTextFull = centerTextFull;
exports.boxLineCentered = boxLineCentered;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const borderboxstyles_1 = require("./styles/borderboxstyles");
const solana_1 = require("../solana");
const printtable_1 = require("./tables/printtable");
const tableStyles_1 = require("./styles/tableStyles");
/**
 * Helper function to format an object as a multi-line string.
 */
function formatObject(obj) {
    return Object.entries(obj)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
}
function printMessageLinesBorderBox(lines, style) {
    const { borderColor, textColor, bgColor, borderBgColor, width = 58, withBorder = false, } = style;
    const tableWidth = width - 2;
    const innerWidth = tableWidth - 2;
    const textColorFn = chalk_1.default[textColor] || chalk_1.default.white;
    const bgColorFn = chalk_1.default[`bg${capitalize(bgColor)}`] || ((s) => s);
    const borderBgFn = chalk_1.default[`bg${capitalize(borderBgColor)}`] || ((s) => s);
    // Define your custom border characters.
    const customChars = {
        top: borderBgFn("═"),
        "top-mid": borderBgFn("╤"),
        "top-left": borderBgFn("╔"),
        "top-right": borderBgFn("╗"),
        bottom: borderBgFn("═"),
        "bottom-mid": borderBgFn("╧"),
        "bottom-left": borderBgFn("╚"),
        "bottom-right": borderBgFn("╝"),
        left: borderBgFn("║"),
        "left-mid": borderBgFn("╟"),
        mid: borderBgFn("─"),
        "mid-mid": borderBgFn("┼"),
        right: borderBgFn("║"),
        "right-mid": borderBgFn("╢"),
        middle: borderBgFn("│"),
    };
    // Define "empty" characters for a borderless look.
    const emptyChars = {
        top: "",
        "top-mid": "",
        "top-left": "",
        "top-right": "",
        bottom: "",
        "bottom-mid": "",
        "bottom-left": "",
        "bottom-right": "",
        left: "",
        "left-mid": "",
        mid: "",
        "mid-mid": "",
        right: "",
        "right-mid": "",
        middle: "",
    };
    const table = new cli_table3_1.default({
        head: [],
        colWidths: [tableWidth],
        style: { border: [borderColor], head: [borderColor] },
        // Use customChars only if withBorder is true; otherwise, use emptyChars.
        chars: withBorder ? customChars : emptyChars,
        truncate: "",
        wordWrap: false,
    });
    let finalLines = [];
    for (const rawLine of lines) {
        // Wrap the text while ignoring ANSI codes
        const wrapped = wrapText(rawLine, innerWidth);
        finalLines.push(...wrapped);
    }
    // For each line, center it (ignoring ANSI codes) and apply the specified colors
    finalLines.forEach((rawLine) => {
        const visibleLen = stripAnsiCodes(rawLine).length;
        const padLength = Math.max(0, innerWidth - visibleLen);
        const leftPad = Math.floor(padLength / 2);
        const rightPad = padLength - leftPad;
        const colored = bgColorFn(textColorFn(" ".repeat(leftPad) + rawLine + " ".repeat(rightPad)));
        table.push([colored]);
    });
    // Conditionally print extra border lines
    if (withBorder) {
        console.log(" ".repeat(width));
    }
    console.log(table.toString());
    if (withBorder) {
        console.log(" ".repeat(width));
    }
}
/**
 * Prints a session end report as a two-column table.
 */
function printSessionEndReport(title, report) {
    printMessageLinesBorderBox([`=== ${title} ===`], borderboxstyles_1.generalStyle);
    const table = new cli_table3_1.default({
        head: [chalk_1.default.bold("Metric"), chalk_1.default.bold("Value")],
        style: { head: ["cyan"], border: ["green"] },
        colWidths: [30, 30],
    });
    Object.keys(report).forEach((metric) => {
        let value;
        if (typeof report[metric] === "object") {
            value = formatObject(report[metric]);
        }
        else {
            value = String(report[metric]);
        }
        table.push([chalk_1.default.cyan(metric), chalk_1.default.green(value)]);
    });
    console.log(table.toString());
}
/**
 * Prints a swap summary using helper functions and printTable, returning fee details.
 * @param parsedTx Parsed Solana transaction object.
 * @param swapDetails Details of the swap (from, to, amount).
 * @param tokenAMint Input token mint address (optional).
 * @param tokenBMint Output token mint address (optional).
 * @param walletAddress Wallet address (optional).
 * @param rpcEndpoint Solana RPC endpoint URL (defaults to mainnet-beta).
 * @returns Promise resolving to { feeSOL, referralFee }.
 */
async function printSwapSummary(parsedTx, swapDetails, tokenAMint, tokenBMint, walletAddress, rpcEndpoint = "https://api.mainnet-beta.solana.com") {
    // Validate transaction data
    if (!parsedTx || !parsedTx.meta || typeof parsedTx.meta.fee !== "number") {
        printMessageLinesBorderBox(["Invalid or missing transaction data."], {
            borderColor: "red",
            textColor: "white",
            bgColor: "red",
            borderBgColor: "red",
        });
        return { feeSOL: 0, referralFee: 0 };
    }
    // Calculate transaction fee
    const feeSOL = parsedTx.meta.fee / 1e9;
    // Calculate net changes with error handling
    const inputNetChange = (0, solana_1.getNetTokenChange)(parsedTx, swapDetails.from, tokenAMint, walletAddress) ||
        0;
    const outputNetChange = (0, solana_1.getNetTokenChange)(parsedTx, swapDetails.to, tokenBMint, walletAddress) || 0;
    // Fetch decimals with fallback
    const isSolInput = swapDetails.from.toUpperCase() === "SOL";
    const isSolOutput = swapDetails.to.toUpperCase() === "SOL";
    const inputDecimals = isSolInput
        ? 9
        : tokenAMint
            ? await (0, solana_1.getSplTokenDecimals)(tokenAMint, rpcEndpoint)
            : 6;
    const outputDecimals = isSolOutput
        ? 9
        : tokenBMint
            ? await (0, solana_1.getSplTokenDecimals)(tokenBMint, rpcEndpoint)
            : 6;
    // Parse referral fee
    const { fee: referralFee, label: referralFeeLabel } = await (0, solana_1.parseReferralFeeFromTx)(parsedTx, tokenAMint, tokenBMint, swapDetails.from, swapDetails.to, inputDecimals, outputDecimals, rpcEndpoint);
    // Calculate referral fee percentage
    const inputAmountNum = parseFloat(swapDetails.amount) || 0;
    const referralFeePct = referralFeeLabel.includes(swapDetails.from) && inputAmountNum > 0
        ? (referralFee / inputAmountNum) * 100
        : NaN;
    // Prepare table data
    const tableData = [
        ["Input Token", swapDetails.from],
        ["Input Amount", `${swapDetails.amount} ${swapDetails.from}`],
        ["Net Change in Input", `${inputNetChange.toFixed(6)} ${swapDetails.from}`],
        ["Output Token", swapDetails.to],
        ["Net Change in Output", `${outputNetChange.toFixed(6)} ${swapDetails.to}`],
        ["Transaction Fee (SOL)", feeSOL.toFixed(6)],
        [referralFeeLabel, referralFee.toFixed(6)],
        [
            "Referral Fee (%)",
            isNaN(referralFeePct) ? "N/A" : `${referralFeePct.toFixed(2)}%`,
        ],
    ];
    // Print header and table
    printMessageLinesBorderBox(["🤝 Swap Summary"], borderboxstyles_1.swappingStyle);
    (0, printtable_1.printTable)(tableData, tableStyles_1.swappingTableOptions);
    return { feeSOL, referralFee };
}
/**
 * Builds an OSC 8 hyperlink for terminals that support it.
 */
function buildOsc8Hyperlink(url, linkText) {
    const OSC = "\u001B]8;;"; // Start of OSC 8
    const BEL = "\u0007"; // Bell character
    const OSC_CLOSE = "\u001B]8;;\u0007"; // Close link
    return `${OSC}${url}${BEL}${linkText}${OSC_CLOSE}`;
}
/**
 * Strips ANSI/OSC 8 escape sequences so we can measure only visible characters.
 */
function stripAnsiCodes(str) {
    return str.replace(/\x1B\]8;.*?\x07|\x1B\[[0-9;]*[A-Za-z]|[\x1B\u001B][^a-zA-Z0-9]/g, "");
}
/**
 * Wraps text (which may contain ANSI codes) into multiple lines up to the specified width.
 */
function wrapText(text, width) {
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = "";
    let currentVisibleLen = 0;
    for (const word of words) {
        const visibleWordLen = stripAnsiCodes(word).length;
        const visibleCurrent = stripAnsiCodes(currentLine);
        const tryLen = (visibleCurrent ? visibleCurrent.length + 1 : 0) + visibleWordLen;
        if (tryLen > width) {
            if (currentLine) {
                lines.push(currentLine.trim());
            }
            currentLine = word;
            currentVisibleLen = visibleWordLen;
        }
        else {
            currentLine += (currentLine ? " " : "") + word;
            currentVisibleLen = stripAnsiCodes(currentLine).length;
        }
    }
    if (currentLine) {
        lines.push(currentLine.trim());
    }
    return lines;
}
/**
 * Shortens a string by preserving the first and last few characters, replacing the middle with ellipsis.
 */
function shortenString(str, maxLen = 12, prefixLen = 4, suffixLen = 4) {
    if (str.length <= maxLen)
        return str;
    return str.slice(0, prefixLen) + "..." + str.slice(-suffixLen);
}
/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str) {
    if (!str)
        return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * Centers text within the specified width.
 */
function centerText(text, width) {
    const padSize = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padSize) + text;
}
/**
 * Centers text fully within the specified width.
 */
function centerTextFull(text, width) {
    if (text.length >= width)
        return text.slice(0, width);
    const totalPadding = width - text.length;
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return " ".repeat(leftPadding) + text + " ".repeat(rightPadding);
}
/**
 * Returns a centered line for a box.
 */
function boxLineCentered(text, totalWidth) {
    const innerWidth = totalWidth - 2;
    const centered = centerTextFull(text, innerWidth);
    return chalk_1.default.yellow("|" + centered + "|");
}

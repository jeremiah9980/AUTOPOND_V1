"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.d = d;
exports.tryParseJSON = tryParseJSON;
exports.formatKMB = formatKMB;
exports.parseFormattedNumber = parseFormattedNumber;
exports.pickRandom = pickRandom;
exports.parseString = parseString;
exports.accumulateNumericField = accumulateNumericField;
exports.accumulateDictionary = accumulateDictionary;
exports.storeTxId = storeTxId;
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = tslib_1.__importDefault(require("fs"));
async function d(t) {
    return new Promise((res) => setTimeout(res, t));
}
function tryParseJSON(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    }
    catch (error) {
        console.error("Error parsing JSON:", error);
        return { jsonStr }; // Return the raw string if parsing fails
    }
}
// Format number utility (unchanged)
function formatKMB(value) {
    if (value < 1000)
        return value.toString();
    if (value < 1e6)
        return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    if (value < 1e9)
        return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
    return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "b";
}
/**
 * parseFormattedNumber:
 * Converts a formatted number string (e.g., "1.6k", "2.3m", "1b") into its full numeric value.
 */
function parseFormattedNumber(value) {
    const lower = value.toLowerCase().trim();
    if (lower.endsWith("k")) {
        return parseFloat(lower) * 1e3;
    }
    else if (lower.endsWith("m")) {
        return parseFloat(lower) * 1e6;
    }
    else if (lower.endsWith("b")) {
        return parseFloat(lower) * 1e9;
    }
    else {
        return parseFloat(lower) || 0; // Default to 0 if NaN
    }
}
/**
 * pickRandom:
 * Returns a random element from an array.
 */
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
/**
 * parseString - Safely converts a possibly-null string to a trimmed string.
 *
 * @param value - A string, or null/undefined.
 * @returns A trimmed string; if input is falsy, returns an empty string.
 */
function parseString(value) {
    return value ? value.trim() : "";
}
// A helper to accumulate numeric fields from source into target for specified keys.
function accumulateNumericField(target, source, keys) {
    keys.forEach((key) => {
        // Since we assume these keys are numbers, we use 'as any' to bypass TypeScript’s type check.
        target[key] =
            (target[key] || 0) + (source[key] || 0);
    });
}
// A helper to accumulate dictionary-like objects where all values are numbers.
function accumulateDictionary(target, source) {
    for (const key in source) {
        target[key] = (target[key] || 0) + source[key];
    }
}
const TX_FILE_PATH = path_1.default.join(__dirname, "tx_ids.txt");
/**
 * Appends a transaction ID to the local file.
 * @param txId Transaction ID to store.
 */
function storeTxId(txId) {
    if (!txId) {
        console.error("No transaction ID provided.");
        return;
    }
    fs_1.default.appendFileSync(TX_FILE_PATH, `${txId}\n`, "utf8");
    console.log(`Transaction ID ${txId} saved.`);
}

/**
 * @file helpers.ts
 * @description Utility functions for delays, JSON parsing, number formatting,
 * random selection, string parsing, and numeric accumulation.
 * Also provides a helper to store transaction IDs in a local file.
 */

import path from "path";
import fs from "fs";

/**
 * d - Delays execution for a specified duration.
 *
 * @param t - Time in milliseconds to delay.
 * @returns A promise that resolves after t milliseconds.
 */
export async function d(t: number): Promise<void> {
  return new Promise((res) => setTimeout(res, t));
}

/**
 * tryParseJSON - Attempts to parse a JSON string.
 *
 * @param jsonStr - The JSON string to parse.
 * @returns The parsed object if successful; otherwise, logs an error and returns an object containing the raw string.
 */
export function tryParseJSON(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { jsonStr }; // Return the raw string if parsing fails.
  }
}

/**
 * formatKMB - Formats a number into a compact string using k, m, or b suffixes.
 *
 * @param value - The numeric value to format.
 * @returns A formatted string representing the value in thousands (k), millions (m), or billions (b).
 */
export function formatKMB(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 1e6) return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  if (value < 1e9) return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
  return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "b";
}

/**
 * parseFormattedNumber - Converts a formatted number string (e.g., "1.6k", "2.3m", "1b")
 * into its full numeric value.
 *
 * @param value - The formatted number string.
 * @returns The numeric value.
 */
export function parseFormattedNumber(value: string): number {
  const lower = value.toLowerCase().trim();
  if (lower.endsWith("k")) {
    return parseFloat(lower) * 1e3;
  } else if (lower.endsWith("m")) {
    return parseFloat(lower) * 1e6;
  } else if (lower.endsWith("b")) {
    return parseFloat(lower) * 1e9;
  } else {
    return parseFloat(lower) || 0; // Default to 0 if parsing fails.
  }
}

/**
 * pickRandom - Returns a random element from an array.
 *
 * @param arr - The array to pick from.
 * @returns A randomly selected element from the array.
 */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * parseString - Safely converts a possibly-null or undefined string to a trimmed string.
 *
 * @param value - The input string.
 * @returns A trimmed string, or an empty string if the input is falsy.
 */
export function parseString(value: string | null | undefined): string {
  return value ? value.trim() : "";
}

/**
 * accumulateNumericField - Accumulates numeric fields from a source object into a target object for specified keys.
 *
 * @param target - The target object to accumulate values into.
 * @param source - The source object to accumulate values from.
 * @param keys - The keys to accumulate.
 */
export function accumulateNumericField<T, K extends keyof T>(
  target: T,
  source: T,
  keys: K[]
): void {
  keys.forEach((key) => {
    // Use 'as any' to bypass TypeScript's type check, assuming keys hold numeric values.
    (target as any)[key] =
      ((target[key] as any) || 0) + ((source[key] as any) || 0);
  });
}

/**
 * accumulateDictionary - Accumulates numeric values from a source dictionary into a target dictionary.
 *
 * @param target - The target dictionary.
 * @param source - The source dictionary.
 */
export function accumulateDictionary(
  target: { [key: string]: number },
  source: { [key: string]: number }
): void {
  for (const key in source) {
    target[key] = (target[key] || 0) + source[key];
  }
}

const TX_FILE_PATH = path.join(__dirname, "tx_ids.txt");

/**
 * storeTxId - Appends a transaction ID to a local file for logging or tracking.
 *
 * @param txId - The transaction ID to store.
 */
export function storeTxId(txId: string): void {
  if (!txId) {
    console.error("No transaction ID provided.");
    return;
  }

  fs.appendFileSync(TX_FILE_PATH, `${txId}\n`, "utf8");
  console.log(`Transaction ID ${txId} saved.`);
}

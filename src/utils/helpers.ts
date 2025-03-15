import path from "path";
import fs from "fs";

export async function d(t: number) {
  return new Promise((res) => setTimeout(res, t));
}

export function tryParseJSON(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { jsonStr }; // Return the raw string if parsing fails
  }
}

// Format number utility (unchanged)
export function formatKMB(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 1e6) return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  if (value < 1e9) return (value / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
  return (value / 1e9).toFixed(1).replace(/\.0$/, "") + "b";
}

/**
 * parseFormattedNumber:
 * Converts a formatted number string (e.g., "1.6k", "2.3m", "1b") into its full numeric value.
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
    return parseFloat(lower) || 0; // Default to 0 if NaN
  }
}

/**
 * pickRandom:
 * Returns a random element from an array.
 */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * parseString - Safely converts a possibly-null string to a trimmed string.
 *
 * @param value - A string, or null/undefined.
 * @returns A trimmed string; if input is falsy, returns an empty string.
 */
export function parseString(value: string | null | undefined): string {
  return value ? value.trim() : "";
}

// A helper to accumulate numeric fields from source into target for specified keys.
export function accumulateNumericField<T, K extends keyof T>(
  target: T,
  source: T,
  keys: K[]
): void {
  keys.forEach((key) => {
    // Since we assume these keys are numbers, we use 'as any' to bypass TypeScript’s type check.
    (target as any)[key] =
      ((target[key] as any) || 0) + ((source[key] as any) || 0);
  });
}

// A helper to accumulate dictionary-like objects where all values are numbers.
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
 * Appends a transaction ID to the local file.
 * @param txId Transaction ID to store.
 */
export function storeTxId(txId: string): void {
  if (!txId) {
    console.error("No transaction ID provided.");
    return;
  }

  fs.appendFileSync(TX_FILE_PATH, `${txId}\n`, "utf8");
  console.log(`Transaction ID ${txId} saved.`);
}

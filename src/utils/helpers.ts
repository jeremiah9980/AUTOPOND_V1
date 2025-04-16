import path from "path";
import fs from "fs"; // for synchronous file operations (e.g., appendFileSync)
import { promises as fsPromises } from "fs"; // for promise-based operations (e.g., readFile)

/**
 * d - Delay function.
 *
 * If two arguments are provided, the function generates a random delay between min and max.
 * If one argument is provided, it behaves as a fixed delay.
 *
 * @param {number} min - The minimum delay time in ms.
 * @param {number} [max] - (Optional) The maximum delay time in ms.
 * @returns {Promise<void>} A promise that resolves after the chosen delay.
 */
export async function d(min: number, max?: number): Promise<void> {
  const delayTime = max !== undefined ? getRandomDelay(min, max) : min;
  return new Promise((resolve) => setTimeout(resolve, delayTime));
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
 * getRandomAmount:
 * Generates a random number between min and max (inclusive)
 * and rounds it to 3 significant figures.
 *
 * @param {number} min - The minimum amount.
 * @param {number} max - The maximum amount.
 * @returns {number} A random value between min and max rounded to 3 sig figs.
 */
export function getRandomAmount(min: number, max: number): number {
  const raw = Math.random() * (max - min) + min;
  return Number(raw.toPrecision(3));
}

/**
 * getRandomDelay:
 * Generates a random delay time between min and max milliseconds.
 *
 * @param {number} min - The minimum delay time in ms.
 * @param {number} max - The maximum delay time in ms.
 * @returns {number} A random delay time in milliseconds.
 */
export function getRandomDelay(min: number, max: number): number {
  const raw = Math.random() * (max - min) + min;
  return Math.floor(raw);
}


// Define the default CSV file path (absolute path based on the current working directory)
const DEFAULT_REFERRAL_FILE_PATH = path.join(process.cwd(), "src", "referral", "referral_links_master.csv");

/**
 * getRandomReferralUrl
 * ---------------------
 * Reads a CSV file of referral URLs (one per line), filters out any empty lines,
 * then randomly selects and returns one of the URLs.
 *
 * @param {string} [filePath=DEFAULT_REFERRAL_FILE_PATH] - The path to the CSV file containing the referral URLs.
 * @returns {Promise<string>} A promise that resolves to a randomly selected URL.
 */
export async function getRandomReferralUrl(
  filePath: string = DEFAULT_REFERRAL_FILE_PATH
): Promise<string> {
  try {
    // Read the file contents using UTF-8 encoding.
    const data = await fsPromises.readFile(filePath, "utf8");
    
    // Split the file into lines, trim any extra whitespace, and filter out empty lines.
    const urls = data
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // If no URLs are found, throw an error.
    if (urls.length === 0) {
      throw new Error("No referral URLs found in CSV");
    }
    
    // Select a random index from the array of URLs.
    const randomIndex = Math.floor(Math.random() * urls.length);
    return urls[randomIndex];
    
  } catch (error) {
    // Log the error and rethrow it so the caller can handle it.
    console.error("Error reading CSV file for referral URLs:", error);
    throw error;
  }
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

/**
 * @file printUtils.ts
 * @description Provides helper functions for formatting output in border boxes,
 * printing session end reports and swap summaries, as well as general text formatting utilities.
 */

import chalk from "chalk";
import Table from "cli-table3";
import { generalStyle, swappingStyle } from "./styles/borderboxstyles";
import {
  getNetTokenChange,
  getSplTokenDecimals,
  parseReferralFeeFromTx,
} from "../solana";
import { printTable } from "./tables/printtable";
import { swappingTableOptions } from "./styles/tableStyles";

/**
 * Interface describing the style properties for a border box.
 */
export interface BorderBoxStyle {
  borderColor: string;
  textColor: string;
  bgColor: string;
  borderBgColor: string;
  width?: number;
  withBorder?: boolean;
}

/**
 * Formats an object into a multi-line string with each key/value pair on its own line.
 *
 * @param obj - The object to format.
 * @returns A formatted string.
 */
export function formatObject(obj: any): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

/**
 * Prints an array of strings inside a border box with custom styles.
 *
 * @param lines - The lines of text to display.
 * @param style - The styling options for the border box.
 */
export function printMessageLinesBorderBox(
  lines: string[],
  style: BorderBoxStyle
): void {
  const {
    borderColor,
    textColor,
    bgColor,
    borderBgColor,
    width = 58,
    withBorder = false,
  } = style;

  const tableWidth = width - 2;
  const innerWidth = tableWidth - 2;

  const textColorFn = (chalk as any)[textColor] || chalk.white;
  const bgColorFn =
    (chalk as any)[`bg${capitalize(bgColor)}`] || ((s: string) => s);
  const borderBgFn =
    (chalk as any)[`bg${capitalize(borderBgColor)}`] || ((s: string) => s);

  // Define custom border characters.
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

  // Define empty characters for a borderless look.
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

  const table = new Table({
    head: [],
    colWidths: [tableWidth],
    style: { border: [borderColor], head: [borderColor] },
    chars: withBorder ? customChars : emptyChars,
    truncate: "",
    wordWrap: false,
  });

  let finalLines: string[] = [];
  for (const rawLine of lines) {
    // Wrap the text while ignoring ANSI codes.
    const wrapped = wrapText(rawLine, innerWidth);
    finalLines.push(...wrapped);
  }

  // For each line, center it (ignoring ANSI codes) and apply the specified colors.
  finalLines.forEach((rawLine) => {
    const visibleLen = stripAnsiCodes(rawLine).length;
    const padLength = Math.max(0, innerWidth - visibleLen);
    const leftPad = Math.floor(padLength / 2);
    const rightPad = padLength - leftPad;

    const colored = bgColorFn(
      textColorFn(" ".repeat(leftPad) + rawLine + " ".repeat(rightPad))
    );
    table.push([colored]);
  });

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
 *
 * @param title - The title of the report.
 * @param report - An object containing metrics to display.
 */
export function printSessionEndReport(
  title: string,
  report: { [key: string]: any }
): void {
  printMessageLinesBorderBox([`=== ${title} ===`], generalStyle);
  const table = new Table({
    head: [chalk.bold("Metric"), chalk.bold("Value")],
    style: { head: ["cyan"], border: ["green"] },
    colWidths: [30, 30],
  });
  Object.keys(report).forEach((metric) => {
    let value: string;
    if (typeof report[metric] === "object") {
      value = formatObject(report[metric]);
    } else {
      value = String(report[metric]);
    }
    table.push([chalk.cyan(metric), chalk.green(value)]);
  });
  console.log(table.toString());
}

/**
 * Prints a swap summary using helper functions and a table, then returns fee details.
 *
 * @param parsedTx - Parsed Solana transaction object.
 * @param swapDetails - Details of the swap (from, to, amount).
 * @param tokenAMint - Input token mint address (optional).
 * @param tokenBMint - Output token mint address (optional).
 * @param walletAddress - Wallet address (optional).
 * @param rpcEndpoint - Solana RPC endpoint URL (defaults to mainnet-beta).
 * @returns A promise that resolves to an object containing feeSOL and referralFee.
 */
export async function printSwapSummary(
  parsedTx: any,
  swapDetails: { from: string; to: string; amount: string },
  tokenAMint?: string,
  tokenBMint?: string,
  walletAddress?: string,
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com"
): Promise<{ feeSOL: number; referralFee: number }> {
  if (!parsedTx || !parsedTx.meta || typeof parsedTx.meta.fee !== "number") {
    printMessageLinesBorderBox(["Invalid or missing transaction data."], {
      borderColor: "red",
      textColor: "white",
      bgColor: "red",
      borderBgColor: "red",
    });
    return { feeSOL: 0, referralFee: 0 };
  }

  const feeSOL = parsedTx.meta.fee / 1e9;

  const inputNetChange =
    getNetTokenChange(parsedTx, swapDetails.from, tokenAMint, walletAddress) ||
    0;
  const outputNetChange =
    getNetTokenChange(parsedTx, swapDetails.to, tokenBMint, walletAddress) || 0;

  const isSolInput = swapDetails.from.toUpperCase() === "SOL";
  const isSolOutput = swapDetails.to.toUpperCase() === "SOL";
  const inputDecimals = isSolInput
    ? 9
    : tokenAMint
    ? await getSplTokenDecimals(tokenAMint, rpcEndpoint)
    : 6;
  const outputDecimals = isSolOutput
    ? 9
    : tokenBMint
    ? await getSplTokenDecimals(tokenBMint, rpcEndpoint)
    : 6;

  const { fee: referralFee, label: referralFeeLabel } =
    await parseReferralFeeFromTx(
      parsedTx,
      tokenAMint,
      tokenBMint,
      swapDetails.from,
      swapDetails.to,
      inputDecimals,
      outputDecimals,
      rpcEndpoint
    );

  const inputAmountNum = parseFloat(swapDetails.amount) || 0;
  const referralFeePct =
    referralFeeLabel.includes(swapDetails.from) && inputAmountNum > 0
      ? (referralFee / inputAmountNum) * 100
      : NaN;

  const tableData: [string, string][] = [
    ["Input Token", swapDetails.from],
    ["Input Amount", `${swapDetails.amount} ${swapDetails.from}`],
    [
      "Net Change in Input",
      `${inputNetChange.toFixed(6)} ${swapDetails.from}`,
    ],
    ["Output Token", swapDetails.to],
    [
      "Net Change in Output",
      `${outputNetChange.toFixed(6)} ${swapDetails.to}`,
    ],
    ["Transaction Fee (SOL)", feeSOL.toFixed(6)],
    [referralFeeLabel, referralFee.toFixed(6)],
    [
      "Referral Fee (%)",
      isNaN(referralFeePct) ? "N/A" : `${referralFeePct.toFixed(2)}%`,
    ],
  ];

  printMessageLinesBorderBox(["🤝 Swap Summary"], swappingStyle);
  printTable(tableData, swappingTableOptions);

  return { feeSOL, referralFee };
}

/**
 * Builds an OSC 8 hyperlink for terminals that support it.
 *
 * @param url - The URL for the hyperlink.
 * @param linkText - The text to display as the link.
 * @returns The formatted OSC 8 hyperlink string.
 */
export function buildOsc8Hyperlink(url: string, linkText: string): string {
  const OSC = "\u001B]8;;"; // Start of OSC 8
  const BEL = "\u0007"; // Bell character
  const OSC_CLOSE = "\u001B]8;;\u0007"; // Close link
  return `${OSC}${url}${BEL}${linkText}${OSC_CLOSE}`;
}

/**
 * Strips ANSI/OSC 8 escape sequences so only visible characters remain.
 *
 * @param str - The string from which to strip ANSI codes.
 * @returns The string with ANSI codes removed.
 */
function stripAnsiCodes(str: string): string {
  return str.replace(
    /\x1B\]8;.*?\x07|\x1B\[[0-9;]*[A-Za-z]|[\x1B\u001B][^a-zA-Z0-9]/g,
    ""
  );
}

/**
 * Wraps text (which may include ANSI codes) into multiple lines up to a specified width.
 *
 * @param text - The text to wrap.
 * @param width - The maximum width for each line.
 * @returns An array of wrapped lines.
 */
export function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];

  let currentLine = "";
  let currentVisibleLen = 0;

  for (const word of words) {
    const visibleWordLen = stripAnsiCodes(word).length;
    const visibleCurrent = stripAnsiCodes(currentLine);
    const tryLen =
      (visibleCurrent ? visibleCurrent.length + 1 : 0) + visibleWordLen;

    if (tryLen > width) {
      if (currentLine) {
        lines.push(currentLine.trim());
      }
      currentLine = word;
      currentVisibleLen = visibleWordLen;
    } else {
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
 * Shortens a string by preserving the first and last few characters and replacing the middle with ellipsis.
 *
 * @param str - The string to shorten.
 * @param maxLen - The maximum allowed length of the string (default 12).
 * @param prefixLen - The number of characters to preserve at the start (default 4).
 * @param suffixLen - The number of characters to preserve at the end (default 4).
 * @returns The shortened string.
 */
export function shortenString(
  str: string,
  maxLen: number = 12,
  prefixLen: number = 4,
  suffixLen: number = 4
): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, prefixLen) + "..." + str.slice(-suffixLen);
}

/**
 * Capitalizes the first letter of the provided string.
 *
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Centers text within a specified width.
 *
 * @param text - The text to center.
 * @param width - The width of the space in which to center the text.
 * @returns The centered text.
 */
export function centerText(text: string, width: number): string {
  const padSize = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padSize) + text;
}

/**
 * Fully centers text within a specified width by adding padding to both sides.
 *
 * @param text - The text to fully center.
 * @param width - The total width for centering.
 * @returns The fully centered text.
 */
export function centerTextFull(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const totalPadding = width - text.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return " ".repeat(leftPadding) + text + " ".repeat(rightPadding);
}

/**
 * Returns a centered line enclosed in vertical bars for use in a box.
 *
 * @param text - The text to center within the line.
 * @param totalWidth - The total width of the line including the borders.
 * @returns The formatted centered line.
 */
export function boxLineCentered(text: string, totalWidth: number): string {
  const innerWidth = totalWidth - 2;
  const centered = centerTextFull(text, innerWidth);
  return chalk.yellow("|" + centered + "|");
}

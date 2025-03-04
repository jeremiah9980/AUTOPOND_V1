// src/ui/banner.ts
// Banner module: Displays an ASCII art banner with centered text and decorative styling.

import chalk from "chalk";
import { boxLineCentered, centerText } from "./print";

/**
 * printBanner:
 * Prints a banner with the following structure:
 *   - Top centered line: "W E L C O M E   T O   T H E"
 *   - A border line.
 *   - The ASCII art logo.
 *   - A centered "More Swaps More Drops 🤝" line.
 *   - A bottom box with:
 *         (blank line)
 *         "Automation tools for the Pond0x decentralised exchange"
 *         (blank line)
 *         "Helping degens touch grass everywhere"z
 *         (blank line)
 */
export function printBanner(): void {
  const bannerWidth = 62;
  const welcomeLine = centerText("W E L C O M E   T O   T H E", bannerWidth);
  const topPart =
    chalk.yellow("=".repeat(bannerWidth)) +
    "\n" +
    welcomeLine +
    "\n" +
    chalk.yellow("=".repeat(bannerWidth)) +
    "\n";
  const artPart =
    "     " +
    chalk.green("  ___  _   _ _____ _____  ______ _____ _   _______") +
    "\n" +
    "     " +
    chalk.green(" / _ \\| | | |_   _|  _  | | ___ \\  _  | \\ | |  _  \\") +
    "\n" +
    "     " +
    chalk.green("/ /_\\ \\ | | | | | | | | | | |_/ / | | |  \\| | | | |") +
    "\n" +
    "     " +
    chalk.green("|  _  | | | | | | | | | | |  __/| | | | . \\`| | | |") +
    "\n" +
    "     " +
    chalk.green("| | | | |_| | | | \\ \\_/ / | |   \\ \\_/ / |\\  | |/ /") +
    "\n" +
    "     " +
    chalk.green("\\_| |_/\\___/  \\_/  \\___/  \\_|    \\___/\\_| \\_/___/") +
    "\n";
  const midLine =
    chalk.yellow(centerText("More Swaps More Drops 🤝", bannerWidth)) + "\n";
  const bottomBox =
    chalk.yellow("=".repeat(bannerWidth)) +
    "\n" +
    boxLineCentered("", bannerWidth) +
    "\n" +
    boxLineCentered(
      "Automation tools for the Pond0x decentralised exchange",
      bannerWidth
    ) +
    "\n" +
    boxLineCentered("", bannerWidth) +
    "\n" +
    chalk.yellow(
      "|          Clicking harder so you dont have to 🫵            |"
    ) +
    "\n" +
    boxLineCentered("", bannerWidth) +
    "\n" +
    chalk.yellow("=".repeat(bannerWidth));
  chalk.yellow("\n");

  console.log(topPart + artPart + midLine + bottomBox + "\n");
}

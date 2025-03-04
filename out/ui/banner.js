"use strict";
// src/ui/banner.ts
// Banner module: Displays an ASCII art banner with centered text and decorative styling.
Object.defineProperty(exports, "__esModule", { value: true });
exports.printBanner = printBanner;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const print_1 = require("./print");
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
function printBanner() {
    const bannerWidth = 62;
    const welcomeLine = (0, print_1.centerText)("W E L C O M E   T O   T H E", bannerWidth);
    const topPart = chalk_1.default.yellow("=".repeat(bannerWidth)) +
        "\n" +
        welcomeLine +
        "\n" +
        chalk_1.default.yellow("=".repeat(bannerWidth)) +
        "\n";
    const artPart = "     " +
        chalk_1.default.green("  ___  _   _ _____ _____  ______ _____ _   _______") +
        "\n" +
        "     " +
        chalk_1.default.green(" / _ \\| | | |_   _|  _  | | ___ \\  _  | \\ | |  _  \\") +
        "\n" +
        "     " +
        chalk_1.default.green("/ /_\\ \\ | | | | | | | | | | |_/ / | | |  \\| | | | |") +
        "\n" +
        "     " +
        chalk_1.default.green("|  _  | | | | | | | | | | |  __/| | | | . \\`| | | |") +
        "\n" +
        "     " +
        chalk_1.default.green("| | | | |_| | | | \\ \\_/ / | |   \\ \\_/ / |\\  | |/ /") +
        "\n" +
        "     " +
        chalk_1.default.green("\\_| |_/\\___/  \\_/  \\___/  \\_|    \\___/\\_| \\_/___/") +
        "\n";
    const midLine = chalk_1.default.yellow((0, print_1.centerText)("More Swaps More Drops 🤝", bannerWidth)) + "\n";
    const bottomBox = chalk_1.default.yellow("=".repeat(bannerWidth)) +
        "\n" +
        (0, print_1.boxLineCentered)("", bannerWidth) +
        "\n" +
        (0, print_1.boxLineCentered)("Automation tools for the Pond0x decentralised exchange", bannerWidth) +
        "\n" +
        (0, print_1.boxLineCentered)("", bannerWidth) +
        "\n" +
        chalk_1.default.yellow("|          Clicking harder so you dont have to 🫵            |") +
        "\n" +
        (0, print_1.boxLineCentered)("", bannerWidth) +
        "\n" +
        chalk_1.default.yellow("=".repeat(bannerWidth));
    chalk_1.default.yellow("\n");
    console.log(topPart + artPart + midLine + bottomBox + "\n");
}

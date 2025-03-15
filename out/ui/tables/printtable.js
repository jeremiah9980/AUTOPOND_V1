"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printTable = printTable;
const tslib_1 = require("tslib");
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const print_1 = require("../print");
const tableStyles_1 = require("../styles/tableStyles");
// Implementation of printTable overloads.
function printTable(...args) {
    if (typeof args[0] === "string") {
        // Called as printTable(title: string, config: any)
        const title = args[0];
        const config = args[1] || {};
        // Convert the config object into an array of key-value pair objects.
        const data = Object.keys(config).map((key) => {
            const value = typeof config[key] === "object"
                ? (0, print_1.formatObject)(config[key])
                : String(config[key]);
            return {
                Key: chalk_1.default.cyan(key),
                Value: chalk_1.default.green(value),
            };
        });
        // Merge the default table options with dynamic values.
        const optionsObj = Object.assign(Object.assign({}, tableStyles_1.configTableOptions), { // Defaults from your configTableOptions object.
            data, header: tableStyles_1.configTableOptions.header && tableStyles_1.configTableOptions.header.length > 0
                ? tableStyles_1.configTableOptions.header
                : ["Key", "Value"], colWidths: tableStyles_1.configTableOptions.colWidths && tableStyles_1.configTableOptions.colWidths.length > 0
                ? tableStyles_1.configTableOptions.colWidths
                : [30, 30], title, headColor: tableStyles_1.configTableOptions.headColor || ["cyan"], borderColor: tableStyles_1.configTableOptions.borderColor || ["green"], extraOptions: tableStyles_1.configTableOptions.extraOptions || {} });
        printTableImpl(optionsObj);
    }
    else if (Array.isArray(args[0])) {
        // Called as printTable(data: any[], options?: Omit<PrintTableOptions, "data">)
        const data = args[0];
        const opts = args[1] ? Object.assign(Object.assign({}, args[1]), { data }) : { data };
        // Merge default options if not explicitly provided.
        if (!opts.header && tableStyles_1.configTableOptions.header) {
            opts.header = tableStyles_1.configTableOptions.header;
        }
        if (!opts.colWidths && tableStyles_1.configTableOptions.colWidths) {
            opts.colWidths = tableStyles_1.configTableOptions.colWidths;
        }
        if (!opts.headColor) {
            opts.headColor = tableStyles_1.configTableOptions.headColor || ["cyan"];
        }
        if (!opts.borderColor) {
            opts.borderColor = tableStyles_1.configTableOptions.borderColor || ["green"];
        }
        if (!opts.extraOptions) {
            opts.extraOptions = tableStyles_1.configTableOptions.extraOptions || {};
        }
        printTableImpl(opts);
    }
    else {
        // Called as printTable(options: PrintTableOptions)
        printTableImpl(args[0]);
    }
}
/**
 * printTableImpl
 * --------------
 * Implements the table printing functionality using cli-table3.
 * It builds the table headers, sets up the table options, and outputs the table to the console.
 *
 * @param {PrintTableOptions} options - The options for configuring the table display.
 * @returns {void}
 */
function printTableImpl({ data, header, colWidths, title, headColor, borderColor, extraOptions, }) {
    if (!data || data.length === 0) {
        console.log("No data to display.");
        return;
    }
    // Determine headers: use provided header, or compute from the first row if available.
    let computedHeader = [];
    if (header && header.length > 0) {
        computedHeader = header;
    }
    else if (typeof data[0] === "object" && !Array.isArray(data[0])) {
        computedHeader = Object.keys(data[0]);
    }
    // Define table style with header and border colors.
    const tableStyle = {
        head: headColor || ["cyan"],
        border: borderColor || ["grey"],
    };
    // Construct the full options object for cli-table3.
    const tableOptions = Object.assign({ head: computedHeader.length ? computedHeader : undefined, colWidths: colWidths, style: tableStyle }, extraOptions);
    // Create an instance of cli-table3 with the constructed options.
    const table = new cli_table3_1.default(tableOptions);
    // Add rows to the table.
    data.forEach((row) => {
        if (Array.isArray(row)) {
            table.push(row);
        }
        else if (typeof row === "object") {
            // Map each header key to its corresponding value.
            const rowArray = computedHeader.map((key) => {
                const cellValue = row[key];
                return typeof cellValue === "object" && cellValue !== null
                    ? (0, print_1.formatObject)(cellValue)
                    : cellValue;
            });
            table.push(rowArray);
        }
        else {
            table.push([row]);
        }
    });
    // If a title is provided, print it with a decorative border.
    if (title) {
        console.log(chalk_1.default.yellow("=".repeat(62)));
        console.log(chalk_1.default.yellow(title));
        console.log(chalk_1.default.yellow("=".repeat(62)));
    }
    // Output the table to the console.
    console.log(table.toString());
}

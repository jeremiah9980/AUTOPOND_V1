"use strict";
/**
 * @file printTable.ts
 * @description Provides an overloaded `printTable` function that renders data in a table format
 * using cli-table3. It supports multiple invocation patterns and allows for custom styling via options.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.printTable = printTable;
const tslib_1 = require("tslib");
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const print_1 = require("../print");
const tableStyles_1 = require("../styles/tableStyles");
/**
 * Main overloaded printTable implementation. This function supports multiple signatures:
 * 1. printTable(title: string, config: any)
 * 2. printTable(options: PrintTableOptions)
 * 3. printTable(data: any[], options?: Omit<PrintTableOptions, "data">)
 *
 * @param args - Arguments based on the overload signature.
 */
function printTable(...args) {
    if (typeof args[0] === "string") {
        // Called as printTable(title: string, config: any)
        const title = args[0];
        const config = args[1] || {};
        const data = Object.keys(config).map((key) => {
            const value = typeof config[key] === "object"
                ? (0, print_1.formatObject)(config[key])
                : String(config[key]);
            return {
                Key: chalk_1.default.cyan(key),
                Value: chalk_1.default.green(value),
            };
        });
        // Merge the dedicated configuration table options with the dynamic values.
        const optionsObj = Object.assign(Object.assign({}, tableStyles_1.configTableOptions), { // defaults from your configTableOptions object
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
        // Merge defaults if not provided.
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
 * Internal implementation of printTable that creates a cli-table3 instance and renders the table.
 *
 * @param options - The configuration options for the table.
 */
function printTableImpl({ data, header, colWidths, title, headColor, borderColor, extraOptions, }) {
    if (!data || data.length === 0) {
        console.log("No data to display.");
        return;
    }
    // Determine headers if not explicitly provided.
    let computedHeader = [];
    if (header && header.length > 0) {
        computedHeader = header;
    }
    else if (typeof data[0] === "object" && !Array.isArray(data[0])) {
        computedHeader = Object.keys(data[0]);
    }
    // Build the table style object.
    const tableStyle = {
        head: headColor || ["cyan"],
        border: borderColor || ["grey"],
    };
    // Build the full options object for cli-table3, spreading any additional options provided.
    const tableOptions = Object.assign({ head: computedHeader.length ? computedHeader : undefined, colWidths: colWidths, style: tableStyle }, extraOptions);
    // Create the cli-table3 instance.
    const table = new cli_table3_1.default(tableOptions);
    // Add rows to the table.
    data.forEach((row) => {
        if (Array.isArray(row)) {
            table.push(row);
        }
        else if (typeof row === "object") {
            const rowArray = computedHeader.map((key) => row[key]);
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
    console.log(table.toString());
}

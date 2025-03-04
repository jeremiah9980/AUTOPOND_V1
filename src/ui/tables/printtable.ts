/**
 * @file printTable.ts
 * @description Provides an overloaded `printTable` function that renders data in a table format
 * using cli-table3. It supports multiple invocation patterns and allows for custom styling via options.
 */

import Table, { TableConstructorOptions } from "cli-table3";
import chalk from "chalk";
import { formatObject } from "../print";
import { configTableOptions } from "../styles/tableStyles";

/**
 * Options for configuring the printed table.
 */
export interface PrintTableOptions {
  /**
   * Array of table rows.
   */
  data?: any[];
  /**
   * Optional header row.
   */
  header?: string[];
  /**
   * Optional column widths.
   */
  colWidths?: number[];
  /**
   * Optional title displayed above the table.
   */
  title?: string;
  /**
   * Header text color(s).
   */
  headColor?: string[];
  /**
   * Border color(s).
   */
  borderColor?: string[];
  /**
   * Additional options to be passed directly to cli-table3.
   * For example, custom characters, column alignments, wordWrap, etc.
   */
  extraOptions?: Partial<TableConstructorOptions>;
}

// Overload signatures
export function printTable(title: string, config: any): void;
export function printTable(options: PrintTableOptions): void;
export function printTable(
  data: any[],
  options?: Omit<PrintTableOptions, "data">
): void;

/**
 * Main overloaded printTable implementation. This function supports multiple signatures:
 * 1. printTable(title: string, config: any)
 * 2. printTable(options: PrintTableOptions)
 * 3. printTable(data: any[], options?: Omit<PrintTableOptions, "data">)
 *
 * @param args - Arguments based on the overload signature.
 */
export function printTable(...args: any[]): void {
  if (typeof args[0] === "string") {
    // Called as printTable(title: string, config: any)
    const title: string = args[0];
    const config: any = args[1] || {};

    const data = Object.keys(config).map((key) => {
      const value =
        typeof config[key] === "object"
          ? formatObject(config[key])
          : String(config[key]);
      return {
        Key: chalk.cyan(key),
        Value: chalk.green(value),
      };
    });

    // Merge the dedicated configuration table options with the dynamic values.
    const optionsObj: PrintTableOptions = {
      ...configTableOptions, // defaults from your configTableOptions object
      data,
      header:
        configTableOptions.header && configTableOptions.header.length > 0
          ? configTableOptions.header
          : ["Key", "Value"],
      colWidths:
        configTableOptions.colWidths && configTableOptions.colWidths.length > 0
          ? configTableOptions.colWidths
          : [30, 30],
      title, // override title with the passed title
      headColor: configTableOptions.headColor || ["cyan"],
      borderColor: configTableOptions.borderColor || ["green"],
      extraOptions: configTableOptions.extraOptions || {},
    };

    printTableImpl(optionsObj);
  } else if (Array.isArray(args[0])) {
    // Called as printTable(data: any[], options?: Omit<PrintTableOptions, "data">)
    const data: any[] = args[0];
    const opts: PrintTableOptions = args[1] ? { ...args[1], data } : { data };

    // Merge defaults if not provided.
    if (!opts.header && configTableOptions.header) {
      opts.header = configTableOptions.header;
    }
    if (!opts.colWidths && configTableOptions.colWidths) {
      opts.colWidths = configTableOptions.colWidths;
    }
    if (!opts.headColor) {
      opts.headColor = configTableOptions.headColor || ["cyan"];
    }
    if (!opts.borderColor) {
      opts.borderColor = configTableOptions.borderColor || ["green"];
    }
    if (!opts.extraOptions) {
      opts.extraOptions = configTableOptions.extraOptions || {};
    }

    printTableImpl(opts);
  } else {
    // Called as printTable(options: PrintTableOptions)
    printTableImpl(args[0]);
  }
}

/**
 * Internal implementation of printTable that creates a cli-table3 instance and renders the table.
 *
 * @param options - The configuration options for the table.
 */
function printTableImpl({
  data,
  header,
  colWidths,
  title,
  headColor,
  borderColor,
  extraOptions,
}: PrintTableOptions): void {
  if (!data || data.length === 0) {
    console.log("No data to display.");
    return;
  }

  // Determine headers if not explicitly provided.
  let computedHeader: string[] = [];
  if (header && header.length > 0) {
    computedHeader = header;
  } else if (typeof data[0] === "object" && !Array.isArray(data[0])) {
    computedHeader = Object.keys(data[0]);
  }

  // Build the table style object.
  const tableStyle = {
    head: headColor || ["cyan"],
    border: borderColor || ["grey"],
  };

  // Build the full options object for cli-table3, spreading any additional options provided.
  const tableOptions: TableConstructorOptions = {
    head: computedHeader.length ? computedHeader : undefined,
    colWidths: colWidths,
    style: tableStyle,
    ...extraOptions,
  };

  // Create the cli-table3 instance.
  const table = new Table(tableOptions);

  // Add rows to the table.
  data.forEach((row) => {
    if (Array.isArray(row)) {
      table.push(row);
    } else if (typeof row === "object") {
      const rowArray = computedHeader.map((key) => row[key]);
      table.push(rowArray);
    } else {
      table.push([row]);
    }
  });

  // If a title is provided, print it with a decorative border.
  if (title) {
    console.log(chalk.yellow("=".repeat(62)));
    console.log(chalk.yellow(title));
    console.log(chalk.yellow("=".repeat(62)));
  }

  console.log(table.toString());
}

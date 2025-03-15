import Table, { TableConstructorOptions } from "cli-table3";
import chalk from "chalk";
import { formatObject } from "../print";
import { configTableOptions } from "../styles/tableStyles";

/**
 * PrintTableOptions - Options for printing a table using cli-table3.
 *
 * @interface PrintTableOptions
 * @property {any[]} [data] - Array of table rows.
 * @property {string[]} [header] - Optional header row.
 * @property {number[]} [colWidths] - Optional column widths.
 * @property {string} [title] - Optional title above the table.
 * @property {string[]} [headColor] - Header text color(s).
 * @property {string[]} [borderColor] - Border color(s).
 * @property {Partial<TableConstructorOptions>} [extraOptions] - Additional options to be passed directly to cli-table3.
 */
export interface PrintTableOptions {
  data?: any[];
  header?: string[];
  colWidths?: number[];
  title?: string;
  headColor?: string[];
  borderColor?: string[];
  extraOptions?: Partial<TableConstructorOptions>;
}

// Overload signatures for printTable.

/**
 * Overload: Print table using a title and a configuration object.
 * @param {string} title - Title to display above the table.
 * @param {any} config - Configuration object to be printed as key-value pairs.
 */
export function printTable(title: string, config: any): void;

/**
 * Overload: Print table using a complete PrintTableOptions object.
 * @param {PrintTableOptions} options - Options for configuring the table display.
 */
export function printTable(options: PrintTableOptions): void;

/**
 * Overload: Print table by passing an array of rows and an options object.
 * @param {any[]} data - Array of table rows.
 * @param {Omit<PrintTableOptions, "data">} [options] - Additional options for the table (excluding data).
 */
export function printTable(
  data: any[],
  options?: Omit<PrintTableOptions, "data">
): void;

// Implementation of printTable overloads.
export function printTable(...args: any[]): void {
  if (typeof args[0] === "string") {
    // Called as printTable(title: string, config: any)
    const title: string = args[0];
    const config: any = args[1] || {};

    // Convert the config object into an array of key-value pair objects.
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

    // Merge the default table options with dynamic values.
    const optionsObj: PrintTableOptions = {
      ...configTableOptions, // Defaults from your configTableOptions object.
      data,
      header:
        configTableOptions.header && configTableOptions.header.length > 0
          ? configTableOptions.header
          : ["Key", "Value"],
      colWidths:
        configTableOptions.colWidths && configTableOptions.colWidths.length > 0
          ? configTableOptions.colWidths
          : [30, 30],
      title, // Use the passed title.
      headColor: configTableOptions.headColor || ["cyan"],
      borderColor: configTableOptions.borderColor || ["green"],
      extraOptions: configTableOptions.extraOptions || {},
    };

    printTableImpl(optionsObj);
  } else if (Array.isArray(args[0])) {
    // Called as printTable(data: any[], options?: Omit<PrintTableOptions, "data">)
    const data: any[] = args[0];
    const opts: PrintTableOptions = args[1] ? { ...args[1], data } : { data };

    // Merge default options if not explicitly provided.
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
 * printTableImpl
 * --------------
 * Implements the table printing functionality using cli-table3.
 * It builds the table headers, sets up the table options, and outputs the table to the console.
 *
 * @param {PrintTableOptions} options - The options for configuring the table display.
 * @returns {void}
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

  // Determine headers: use provided header, or compute from the first row if available.
  let computedHeader: string[] = [];
  if (header && header.length > 0) {
    computedHeader = header;
  } else if (typeof data[0] === "object" && !Array.isArray(data[0])) {
    computedHeader = Object.keys(data[0]);
  }

  // Define table style with header and border colors.
  const tableStyle = {
    head: headColor || ["cyan"],
    border: borderColor || ["grey"],
  };

  // Construct the full options object for cli-table3.
  const tableOptions: TableConstructorOptions = {
    head: computedHeader.length ? computedHeader : undefined,
    colWidths: colWidths,
    style: tableStyle,
    ...extraOptions,
  };

  // Create an instance of cli-table3 with the constructed options.
  const table = new Table(tableOptions);

  // Add rows to the table.
  data.forEach((row) => {
    if (Array.isArray(row)) {
      table.push(row);
    } else if (typeof row === "object") {
      // Map each header key to its corresponding value.
      const rowArray = computedHeader.map((key) => {
        const cellValue = row[key];
        return typeof cellValue === "object" && cellValue !== null
          ? formatObject(cellValue)
          : cellValue;
      });
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

  // Output the table to the console.
  console.log(table.toString());
}

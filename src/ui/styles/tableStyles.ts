// ui/styles/tablestyles

import { PrintTableOptions } from "../tables/printtable";

// Each object assumes a total table width of 62 characters (2 columns),
// so we use colWidths of [30, 30]. Adjust these as needed.

export const configTableOptions: PrintTableOptions = {
  data: [], // Placeholder for table rows (will be merged with dynamic data)
  header: [], // Placeholder for headers (will be overridden when needed)
  colWidths: [30, 30],
  title: "", // Title can be overridden per usage
  headColor: ["white"],
  borderColor: ["grey"], // Use green for border lines
  extraOptions: {
    wordWrap: true,
    colAligns: ["left", "center"],
  },
};

export const miningTableOptions: PrintTableOptions = {
  data: [],
  header: [],
  colWidths: [30, 30],
  title: "Mining Table",
  headColor: ["blue"],
  borderColor: ["blue"],
  extraOptions: {
    wordWrap: true,
    colAligns: ["center", "center"],
  },
};

export const swappingTableOptions: PrintTableOptions = {
  data: [],
  header: [],
  colWidths: [30, 30],
  title: "Swapping Table",
  headColor: ["yellow"],
  borderColor: ["yellow"],
  extraOptions: {
    wordWrap: false,
    colAligns: ["left", "right"],
  },
};

export const generalTableOptions: PrintTableOptions = {
  data: [],
  header: [],
  colWidths: [30, 30],
  title: "General Table",
  headColor: ["cyan"],
  borderColor: ["green"],
  extraOptions: {
    wordWrap: true,
    colAligns: ["left", "left"],
  },
};

export const phantomTableOptions: PrintTableOptions = {
  data: [],
  header: [],
  colWidths: [30, 30],
  title: "Phantom Table",
  headColor: ["white"],
  borderColor: ["purple"],
  extraOptions: {
    wordWrap: false,
    colAligns: ["right", "right"],
  },
};

export const warningTableOptions: PrintTableOptions = {
  data: [],
  header: [],
  colWidths: [30, 30],
  title: "Warning Table",
  headColor: ["red"],
  borderColor: ["yellow"],
  extraOptions: {
    wordWrap: true,
    colAligns: ["center", "center"],
  },
};

export const magmaTableOptions: PrintTableOptions = {
  data: [],
  header: [],
  colWidths: [30, 30],
  title: "Magma Table",
  headColor: ["yellow"],
  borderColor: ["yellow"],
  extraOptions: {
    wordWrap: false,
    colAligns: ["center", "center"],
  },
};

export const metricTableOptions: PrintTableOptions = {
  header: ["Metric", "Value"],
  colWidths: [30, 30],
  title: "",
  headColor: ["yellow"],
  borderColor: ["white"],
  extraOptions: {
    wordWrap: false,
    colAligns: ["center", "center"],
  },
};

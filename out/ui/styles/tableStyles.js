"use strict";
// ui/styles/tablestyles
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricTableOptions = exports.magmaTableOptions = exports.warningTableOptions = exports.phantomTableOptions = exports.generalTableOptions = exports.swappingTableOptions = exports.miningTableOptions = exports.configTableOptions = void 0;
// Each object assumes a total table width of 62 characters (2 columns),
// so we use colWidths of [30, 30]. Adjust these as needed.
exports.configTableOptions = {
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
exports.miningTableOptions = {
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
exports.swappingTableOptions = {
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
exports.generalTableOptions = {
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
exports.phantomTableOptions = {
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
exports.warningTableOptions = {
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
exports.magmaTableOptions = {
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
exports.metricTableOptions = {
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

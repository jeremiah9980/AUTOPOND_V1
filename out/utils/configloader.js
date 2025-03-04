"use strict";
/**
 * @file configLoader.ts
 * @description Provides functions to load configuration files for the application.
 * It defines individual loaders for each configuration type (AppConfig, MiningConfig, SolanaConfig, SwapConfig)
 * and a full loader that aggregates them into a single FullConfig object.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAppConfig = loadAppConfig;
exports.loadMiningConfig = loadMiningConfig;
exports.loadSolanaConfig = loadSolanaConfig;
exports.loadSwapConfig = loadSwapConfig;
exports.loadFullConfig = loadFullConfig;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
/**
 * loadFile
 * A generic helper function that loads a JSON file from the given path.
 * If reading or parsing fails, it returns the provided default value.
 *
 * @param path - Path to the JSON file.
 * @param defaultValue - Default value to return if file loading fails.
 * @returns The parsed JSON data or the default value.
 */
function loadFile(path, defaultValue) {
    try {
        const data = fs.readFileSync(path, "utf8");
        return JSON.parse(data);
    }
    catch (error) {
        console.warn(`${path} not found or could not be parsed. Using default values.`);
        return defaultValue;
    }
}
// ───────────────────────────────────────────
// 1) Individual loaders for each config type
// ───────────────────────────────────────────
/**
 * loadAppConfig
 * Loads the application-level configuration from "./config/appconfig.json".
 *
 * @returns An AppConfig object.
 */
function loadAppConfig() {
    return loadFile("./config/appconfig.json", {
        wizardMode: false,
        defaultMode: "Mine",
        defaultCycleCount: 0,
        loggingEnabled: false,
        manualaccountcreation: true,
        myRigAddresses: [
            "5q6gVQuZJvMnqpxoS3yAgipyUJ69kYZWuCmTY4i6nA2X",
            "3jRksPvB4EXwo737Jww5Ncd35tqw6VP3HBr31MMep9di",
        ],
        watchRigAddresses: [],
    });
}
/**
 * loadMiningConfig
 * Loads mining configuration from "./config/miningconfig.json".
 *
 * @returns A MiningConfig object.
 */
function loadMiningConfig() {
    return loadFile("./config/miningconfig.json", {
        cycleDelayMs: 600000,
        activeMiningRetryDelayMs: 6000,
        miningLoopFailRetryDelayMs: 60000,
        miningSuccessDelayMs: 1000,
        initialDelayMs: 3000,
        popupDelayMs: 3000,
        maxIterations: 25,
        claimTimeThreshold: 120,
        loopIterationDelayMs: 30000,
        miningCompleteHashRate: 0,
        miningCompleteUnclaimedThreshold: 100,
        claimMaxThreshold: 500,
        mineButtonTrigger: "MINE",
        confirmButtonText: "Confirm",
        stopClaimButtonText: "STOP & CLAIM",
        stopAnywayButtonText: "STOP ANYWAY",
        wss: "wss://your-websocket-url",
        apiKey: "your-api-key",
        requiredActiveMiners: 10,
        skipMiningOnFailure: true,
        skipMiningIfInactive: false,
    });
}
/**
 * loadSolanaConfig
 * Loads Solana blockchain configuration from "./config/solanaconfig.json".
 *
 * @returns A SolanaConfig object.
 */
function loadSolanaConfig() {
    return loadFile("./config/solanaconfig.json", {
        rpcEndpoint: "https://api.mainnet-beta.solana.com",
        wpondTransferTimeThreshold: 900,
        rewardsWalletAddress: "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL",
        wpondTokenMint: "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq",
        discountWalletAddresses: [],
    });
}
/**
 * loadSwapConfig
 * Loads token swap configuration from "./config/swapconfig.json".
 *
 * @returns A SwapConfig object.
 */
function loadSwapConfig() {
    return loadFile("./config/swapconfig.json", {
        tokenA: "SOL",
        tokenB: "USDT",
        tokenAMint: "",
        tokenBMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        tokenALowThreshold: 0.01,
        tokenBLowThreshold: 2,
        tokenAPossibleAmounts: [0.0052, 0.0054, 0.0058],
        tokenBPossibleAmounts: [1.1, 1.2, 1.15],
        tokenARewardAmounts: [0.052, 0.054, 0.053],
        tokenBRewardAmounts: [10, 11, 11.5],
        swapRounds: 30,
        swapRewardsActive: false,
        enableRewardsCheck: false,
        skipSwapIfNoRewards: false,
        turboswap: true,
    });
}
// ──────────────────────────────────────────────────────────────────
// 2) Full configuration loader: Aggregates all individual configs into one FullConfig object.
// ──────────────────────────────────────────────────────────────────
/**
 * loadFullConfig
 * Loads and aggregates AppConfig, MiningConfig, SolanaConfig, and SwapConfig into a single FullConfig object.
 *
 * @returns A FullConfig object containing all configuration sections.
 */
function loadFullConfig() {
    return {
        app: loadAppConfig(),
        mining: loadMiningConfig(),
        solana: loadSolanaConfig(),
        swap: loadSwapConfig(),
    };
}

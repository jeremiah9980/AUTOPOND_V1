"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAppConfig = loadAppConfig;
exports.loadMiningConfig = loadMiningConfig;
exports.loadSolanaConfig = loadSolanaConfig;
exports.loadSwapConfig = loadSwapConfig;
exports.loadFullConfig = loadFullConfig;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
// A helper to load a file or return a default value if it fails
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
        claimBoostThreshold: 30,
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
function loadSolanaConfig() {
    return loadFile("./config/solanaconfig.json", {
        rpcEndpoint: "https://api.mainnet-beta.solana.com",
        wpondTransferTimeThreshold: 900,
        rewardsWalletAddress: "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL",
        wpondTokenMint: "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq",
        discountWalletAddresses: [],
    });
}
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
        maxReferralFee: "0.000005",
        swapRounds: 30,
        swapRewardsActive: false,
        enableRewardsCheck: false,
        skipSwapIfNoRewards: false,
        turboswap: true,
    });
}
// ──────────────────────────────────────────────────────────────────
// 2) A "full" loader that loads all four into one `FullConfig` object
// ──────────────────────────────────────────────────────────────────
function loadFullConfig() {
    return {
        app: loadAppConfig(),
        mining: loadMiningConfig(),
        solana: loadSolanaConfig(),
        swap: loadSwapConfig(),
    };
}

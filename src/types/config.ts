/**
 * @file config.ts
 * @description Contains application configuration interfaces for the Pond0x platform.
 * These interfaces define settings for the interactive wizard, mining operations,
 * Solana blockchain connectivity, and token swap operations. The FullConfig interface
 * aggregates all configuration sections.
 */

/**
 * AppConfig - Application-level settings.
 *
 * @property {boolean} wizardMode - Enables the interactive configuration wizard.
 * @property {"Mine" | "Swap" | "Mine and Swap"} defaultMode - Default operating mode.
 * @property {number} [defaultCycleCount] - (Optional) Default number of cycles; if not set, runs indefinitely.
 * @property {boolean} [loggingEnabled] - (Optional) Flag to enable or disable logging.
 * @property {number} [liveDecodedDisplayLimit] - (Optional) Maximum number of live decoded events to display (default: 20).
 * @property {boolean} manualaccountcreation - Flag for manual account creation.
 * @property {string[]} myRigAddresses - List of rig addresses owned by the user.
 * @property {string[]} watchRigAddresses - List of rig addresses to monitor.
 */
export interface AppConfig {
  wizardMode: boolean;
  defaultMode: "Mine" | "Swap" | "Mine and Swap";
  defaultCycleCount?: number;
  loggingEnabled?: boolean;
  liveDecodedDisplayLimit?: number;
  manualaccountcreation: boolean;
  myRigAddresses: string[];
  watchRigAddresses: string[];
}

/**
 * MiningConfig - Configuration parameters for mining operations.
 *
 * @property {number} cycleDelayMs - Delay between mining cycles.
 * @property {number} activeMiningRetryDelayMs - Delay before retrying an active mining check.
 * @property {number} miningLoopFailRetryDelayMs - Delay before retrying a failed mining loop.
 * @property {number} miningSuccessDelayMs - Delay after a successful mining operation.
 * @property {number} initialDelayMs - Delay before starting mining.
 * @property {number} popupDelayMs - Delay before handling popups.
 * @property {number} maxIterations - Maximum iterations allowed per session.
 * @property {number} loopIterationDelayMs - Delay between iterations within a session.
 * @property {number} miningCompleteHashRate - Minimum hashrate for a session to be considered complete.
 * @property {number} miningCompleteUnclaimedThreshold - Threshold for unclaimed rewards to mark completion.
 * @property {number} claimMaxThreshold - Maximum threshold for claiming rewards.
 * @property {number} claimTimeThreshold - Time threshold for claiming rewards.
 * @property {string} mineButtonTrigger - Text to trigger the mining button.
 * @property {string} confirmButtonText - Text used to confirm actions.
 * @property {string} stopClaimButtonText - Text used to stop a claim.
 * @property {string} stopAnywayButtonText - Text used to force-stop operations.
 * @property {string} wss - WebSocket URL for mining data.
 * @property {string} apiKey - API key for accessing mining data.
 * @property {number} requiredActiveMiners - Minimum number of active miners required.
 * @property {boolean} skipMiningOnFailure - Flag to skip mining on failure.
 * @property {boolean} skipMiningIfInactive - Flag to skip mining if inactive.
 */
export interface MiningConfig {
  cycleDelayMs: number;
  activeMiningRetryDelayMs: number;
  miningLoopFailRetryDelayMs: number;
  miningSuccessDelayMs: number;
  initialDelayMs: number;
  popupDelayMs: number;
  maxIterations: number;
  loopIterationDelayMs: number;
  miningCompleteHashRate: number;
  miningCompleteUnclaimedThreshold: number;
  claimMaxThreshold: number;
  claimTimeThreshold: number;
  mineButtonTrigger: string;
  confirmButtonText: string;
  stopClaimButtonText: string;
  stopAnywayButtonText: string;
  wss: string;
  apiKey: string;
  requiredActiveMiners: number;
  skipMiningOnFailure: boolean;
  skipMiningIfInactive: boolean;
}

/**
 * SolanaConfig - Settings for connecting to the Solana blockchain.
 *
 * @property {string} rpcEndpoint - The RPC endpoint URL.
 * @property {number} wpondTransferTimeThreshold - Time threshold (in seconds) for WPOND transfers.
 * @property {string} rewardsWalletAddress - Wallet address for rewards.
 * @property {string} wpondTokenMint - Mint address for the WPOND token.
 * @property {string[]} discountWalletAddresses - List of wallet addresses that get discounts.
 */
export interface SolanaConfig {
  rpcEndpoint: string;
  wpondTransferTimeThreshold: number;
  rewardsWalletAddress: string;
  wpondTokenMint: string;
  discountWalletAddresses: string[];
}

/**
 * SwapConfig - Parameters for token swap operations.
 *
 * @property {string} tokenA - Symbol for the first token (e.g., "SOL").
 * @property {string} tokenB - Symbol for the second token (e.g., "USDT").
 * @property {string} [tokenAMint] - Mint address for tokenA (for SPL tokens; leave empty if SOL).
 * @property {string} [tokenBMint] - Mint address for tokenB (for SPL tokens; leave empty if SOL).
 * @property {number} tokenALowThreshold - Minimum balance threshold for tokenA.
 * @property {number} tokenBLowThreshold - Minimum balance threshold for tokenB.
 * @property {number[]} tokenAPossibleAmounts - Array of possible swap amounts for tokenA.
 * @property {number[]} tokenBPossibleAmounts - Array of possible swap amounts for tokenB.
 * @property {number[]} tokenARewardAmounts - Array of reward amounts for swaps involving tokenA.
 * @property {number[]} tokenBRewardAmounts - Array of reward amounts for swaps involving tokenB.
 * @property {number} swapRounds - Number of swap rounds to execute.
 * @property {boolean} swapRewardsActive - Flag indicating if reward amounts are active.
 * @property {boolean} enableRewardsCheck - Flag to enable checking for rewards.
 * @property {boolean} skipSwapIfNoRewards - Flag to skip swap rounds if no rewards are active.
 * @property {boolean} turboswap - If true, enables turboswap mode.
 */
export interface SwapConfig {
  tokenA: string;
  tokenB: string;
  tokenAMint?: string;
  tokenBMint?: string;
  tokenALowThreshold: number;
  tokenBLowThreshold: number;
  tokenAPossibleAmounts: number[];
  tokenBPossibleAmounts: number[];
  tokenARewardAmounts: number[];
  tokenBRewardAmounts: number[];
  swapRounds: number;
  swapRewardsActive: boolean;
  enableRewardsCheck: boolean;
  skipSwapIfNoRewards: boolean;
  turboswap: boolean;
}

/**
 * FullConfig - Aggregated configuration for the application.
 *
 * @property {AppConfig} app - Application-level settings.
 * @property {MiningConfig} mining - Mining operation configurations.
 * @property {SolanaConfig} solana - Solana blockchain connection settings.
 * @property {SwapConfig} swap - Token swap operation parameters.
 */
export interface FullConfig {
  app: AppConfig;
  mining: MiningConfig;
  solana: SolanaConfig;
  swap: SwapConfig;
}

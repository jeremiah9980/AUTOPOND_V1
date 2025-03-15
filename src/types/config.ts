/**
 * AppConfig - Application-level settings.
 * @interface AppConfig
 *
 * @property {boolean} wizardMode - Enables interactive configuration wizard.
 * @property {"Mine" | "Swap" | "Mine and Swap"} defaultMode - Default operating mode ("Mine", "Swap", or "Mine and Swap").
 * @property {number} [defaultCycleCount] - (Optional) Default number of cycles; if not set, runs indefinitely.
 * @property {boolean} [loggingEnabled] - (Optional) Flag to enable or disable logging.
 * @property {number} [liveDecodedDisplayLimit] - (Optional) Maximum number of live decoded events to display (default: 20).
 * @property {boolean} manualaccountcreation - Flag to enable manual account creation.
 * @property {string[]} myRigAddresses - Array of rig addresses for the user's rigs.
 * @property {string[]} watchRigAddresses - Array of rig addresses to be watched.
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
 * @interface MiningConfig
 *
 * @property {number} cycleDelayMs - Delay between mining cycles.
 * @property {number} activeMiningRetryDelayMs - Delay before retrying an active mining check.
 * @property {number} miningLoopFailRetryDelayMs - Delay before retrying a failed mining loop.
 * @property {number} miningSuccessDelayMs - Delay after a successful mining operation.
 * @property {number} initialDelayMs - Delay before starting mining.
 * @property {number} popupDelayMs - Delay before handling popups.
 * @property {number} maxIterations - Maximum iterations allowed per session.
 * @property {number} loopIterationDelayMs - Delay between iterations in the mining loop.
 * @property {number} miningCompleteHashRate - Minimum hash rate for a session to be considered complete.
 * @property {number} miningCompleteUnclaimedThreshold - Threshold for unclaimed rewards to mark completion.
 * @property {number} claimMaxThreshold - Maximum threshold for claiming rewards.
 * @property {number} claimTimeThreshold - Time threshold for triggering a claim.
 * @property {number} claimBoostThreshold - Boost threshold for triggering a claim.
 * @property {string} mineButtonTrigger - Text to trigger the mining button.
 * @property {string} confirmButtonText - Text used to confirm actions.
 * @property {string} stopClaimButtonText - Text used to stop a claim.
 * @property {string} stopAnywayButtonText - Text used to force-stop operations.
 * @property {string} wss - WebSocket URL for mining data.
 * @property {string} apiKey - API key for accessing mining data.
 * @property {number} requiredActiveMiners - Minimum number of active miners required.
 * @property {boolean} skipMiningOnFailure - Flag to skip mining if a failure occurs.
 * @property {boolean} skipMiningIfInactive - Flag to skip mining if no active mining is detected.
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
  claimBoostThreshold: number;
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
 * @interface SolanaConfig
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
 * @interface SwapConfig
 *
 * @property {string} tokenA - Symbol for token A (e.g., "SOL").
 * @property {string} tokenB - Symbol for token B (e.g., "USDT").
 * @property {string} [tokenAMint] - Mint address for token A (for SPL tokens; leave empty if SOL).
 * @property {string} [tokenBMint] - Mint address for token B (for SPL tokens; leave empty if SOL).
 * @property {number} tokenALowThreshold - Minimum balance threshold for token A.
 * @property {number} tokenBLowThreshold - Minimum balance threshold for token B.
 * @property {number[]} tokenAPossibleAmounts - Array of possible swap amounts for token A.
 * @property {number[]} tokenBPossibleAmounts - Array of possible swap amounts for token B.
 * @property {number[]} tokenARewardAmounts - Array of reward amounts for token A swaps.
 * @property {number[]} tokenBRewardAmounts - Array of reward amounts for token B swaps.
 * @property {string} maxReferralFee - Maximum referral fee.
 * @property {number} swapRounds - Number of swap rounds to execute.
 * @property {boolean} swapRewardsActive - Flag indicating if reward amounts are active.
 * @property {boolean} enableRewardsCheck - Flag to enable rewards check.
 * @property {boolean} skipSwapIfNoRewards - Flag to skip swap if no rewards are available.
 * @property {boolean} turboswap - Flag to enable TurboSwap mode.
 */
export interface SwapConfig {
  tokenA: string; // e.g., "SOL"
  tokenB: string; // e.g., "USDT"
  tokenAMint?: string; // For SPL tokens; leave empty if SOL
  tokenBMint?: string; // For SPL tokens; leave empty if SOL
  tokenALowThreshold: number;
  tokenBLowThreshold: number;
  tokenAPossibleAmounts: number[];
  tokenBPossibleAmounts: number[];
  tokenARewardAmounts: number[];
  tokenBRewardAmounts: number[];
  maxReferralFee: string;
  swapRounds: number;
  swapRewardsActive: boolean;
  enableRewardsCheck: boolean;
  skipSwapIfNoRewards: boolean;
  turboswap: boolean;
}

/**
 * FullConfig - Aggregated configuration for the application.
 * @interface FullConfig
 *
 * @property {AppConfig} app - Application-level settings.
 * @property {MiningConfig} mining - Configuration parameters for mining operations.
 * @property {SolanaConfig} solana - Settings for connecting to the Solana blockchain.
 * @property {SwapConfig} swap - Parameters for token swap operations.
 */
export interface FullConfig {
  app: AppConfig;
  mining: MiningConfig;
  solana: SolanaConfig;
  swap: SwapConfig;
}

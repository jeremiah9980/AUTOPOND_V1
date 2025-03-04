# AutoPond

AutoPond is a powerful automation tool designed to streamline interactions with the [Pond0x](https://pond0x.com) decentralized exchange. It automates mining and token swapping on the Solana blockchain, integrating seamlessly with the Phantom wallet. Using browser automation via Puppeteer and real-time WebSocket monitoring, AutoPond offers both an interactive wizard for hands-on control and a set-and-forget mode for continuous operation.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
  - [Initialization & Setup](#initialization--setup)
  - [Mode Selection](#mode-selection)
  - [Operation Execution](#operation-execution)
  - [Cycle Management & Logging](#cycle-management--logging)
- [Modes](#modes)
  - [Wizard Mode](#wizard-mode)
  - [Default Mode](#default-mode)
  - [Ze Bot Stays On Mode](#ze-bot-stays-on-mode)
- [Configuration](#configuration)
  - [appconfig.json](#appconfigjson)
  - [miningconfig.json](#miningconfigjson)
  - [swapconfig.json](#swapconfigjson)
  - [solanaconfig.json](#solanaconfigjson)
- [Global Statistics and Session Logging](#global-statistics-and-session-logging)
- [Application Flow and Logic](#application-flow-and-logic)
- [Installation and Setup](#installation-and-setup)
- [Phantom Wallet Setup](#phantom-wallet-setup)
- [Dependencies](#dependencies)
- [Tips](#tips)
- [License](#license)
- [Contributing](#contributing)

## Features

- **Automated Mining:**  
  Detects active mining conditions and claims tokens when thresholds are hit (e.g., 10.8B unclaimed).

- **Automated Token Swapping:**  
  Executes SOL/USDT swaps with customizable amounts and robust retry handling.

- **Interactive Wizard Mode:**  
  Guides you through mode selection, cycle counts, or continuous operation with ease.

- **Default Mode Automation:**  
  Runs predefined mining or swapping tasks continuously or for a set number of cycles.

- **Real-Time Monitoring:**  
  Tracks mining activity via WebSocket and provides live miner stats.

## How It Works

AutoPond orchestrates mining and swapping on Pond0x through a clear, efficient process:

### Initialization & Setup
- Launches a browser with the Phantom wallet extension loaded.
- Connects to Pond0x and establishes a WebSocket link for real-time monitoring.

### Mode Selection
- **Wizard Mode:** Prompts you to pick an operation—Mine, Swap, Mine and Swap, or Ze Bot Stays On—and set cycle counts if needed.
- **Default Mode:** Automatically runs the mode and cycle count from `appconfig.json` when wizard mode is off.

### Operation Execution
- **Mining:** Monitors mining activity via WebSocket, tracks on-screen metrics (e.g., hash rate, unclaimed tokens), and claims rewards when conditions are met.
- **Swapping:** Navigates to the swap page, checks token balances, selects amounts, and executes swaps with Phantom wallet confirmations.

### Cycle Management & Logging
- Applies configurable delays between cycles (e.g., 10 seconds from `miningconfig.json`).
- Logs session details and updates global stats for performance tracking.

See [Application Flow and Logic](#application-flow-and-logic) for deeper insights.

## Modes

### Wizard Mode
Enabled when `wizardMode` is `true` in `appconfig.json`. Options include:
- **Mine:** Runs a single mining cycle.
- **Swap:** Performs a single token swap.
- **Mine and Swap:** Asks for cycle count, then runs mining followed by swapping for each cycle.
- **Ze Bot Stays On:** Operates continuously using default settings.

### Default Mode
Activated when `wizardMode` is `false`. Uses:
- **`defaultMode`:** Sets "Mine", "Swap", or "Mine and Swap".
- **`defaultCycleCount`:** Runs for this many cycles if > 0; otherwise, runs indefinitely.
- **Cycle Delay:** Controlled by `cycleDelayMs` from `miningconfig.json`.

### Ze Bot Stays On Mode
Forces continuous operation:
- Executes the `defaultMode` repeatedly.
- Pauses between cycles using `cycleDelayMs`.
- Stops only when manually interrupted.

## Configuration

AutoPond relies on four JSON files in `./config/` for customization. Here’s what’s currently set:

### appconfig.json
Controls overall behavior:
```json
{
  "wizardMode": true,
  "defaultMode": "Mine and Swap",
  "loggingEnabled": true,
  "cycleDelayMs": 3000,
  "defaultCycleCount": 10,
  "liveDecodedDisplayLimit": 20,
  "myRigAddresses": [
    "5q6gVQuZJvMnqpxoS3yAgipyUJ69kYZWuCmTY4i6nA2X",
    "3jRksPvB4EXwo737Jww5Ncd35tqw6VP3HBr31MMep9di"
  ],
  "watchRigAddresses": []
}
```

| Key                                 | Type      | Description                                                                                     |
|-------------------------------------|-----------|-------------------------------------------------------------------------------------------------|
| `wizardMode`                        | Boolean   | Enables interactive wizard if `true`; uses default settings if `false`.                         |
| `defaultMode`                       | String    | Sets the operation mode when wizard is off: `"Mine"`, `"Swap"`, or `"Mine and Swap"`.           |
| `loggingEnabled`                    | Boolean   | Turns on detailed logging and stats display if `true`.                                          |
| `cycleDelayMs`                      | Number    | Delay (ms) between cycles when not overridden by `miningconfig.json` (3000 ms = 3s).            |
| `defaultCycleCount`                 | Number    | Number of cycles to run in default mode; 0 for continuous operation (10 cycles).                |
| `liveDecodedDisplayLimit`           | Number    | Maximum number of miner stats shown in Magma Viewer (20).                                       |
| `myRigAddresses`                    | String[]  | Array of your miner addresses to monitor (2 addresses listed).                                  |
| `watchRigAddresses`                 | String[]  | Array of additional addresses to monitor (currently empty).                                     |


### miningconfig.json
Configures mining operations:
```json
{
  "initialDelayMs": 4000,
  "popupDelayMs": 3000,
  "activeMiningRetryDelayMs": 30000,
  "miningLoopFailRetryDelayMs": 60000,
  "miningSuccessDelayMs": 1000,
  "maxIterations": 20,
  "loopIterationDelayMs": 30000,
  "miningCompleteHashRate": 0,
  "miningCompleteUnclaimedThreshold": 100000000,
  "claimMaxThreshold": 10800000000,
  "claimTimeThreshold": 120,
  "mineButtonTrigger": "MINE",
  "confirmButtonText": "Confirm",
  "stopClaimButtonText": "STOP & CLAIM",
  "stopAnywayButtonText": "STOP ANYWAY",
  "wss": "wss://vkqjvwxzsxilnsmpngmc.supabase.co/realtime/v1/websocket?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWp2d3h6c3hpbG5zbXBuZ21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYwODExMjMsImV4cCI6MjA0MTY1NzEyM30.u9gf6lU2fBmf0aiC7SYH4vVeWMRnGRu4ZZ7xOGl-XuI&eventsPerSecond=5&vsn=1.0.0",
  "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWp2d3h6c3hpbG5zbXBuZ21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYwODExMjMsImV4cCI6MjA0MTY1NzEyM30.u9gf6lU2fBmf0aiC7SYH4vVeWMRnGRu4ZZ7xOGl-XuI",
  "requiredActiveMiners": 10,
  "skipMiningIfInactive": true,
  "skipMiningOnFailure": true,
  "cycleDelayMs": 10000
}
```

| Key                                 | Type      | Description                                                                                     |
|-------------------------------------|-----------|-------------------------------------------------------------------------------------------------|
| `initialDelayMs`                    | Number    | Delay (ms) before starting mining after page load (4000 ms = 4s).                               |
| `popupDelayMs`                      | Number    | Delay (ms) after triggering Phantom popup (3000 ms = 3s).                                       |
| `activeMiningRetryDelayMs`          | Number    | Delay (ms) before retrying mining activity check (30000 ms = 30s).                              |
| `miningLoopFailRetryDelayMs`        | Number    | Delay (ms) before retrying after a mining loop failure (60000 ms = 60s).                        |
| `miningSuccessDelayMs`              | Number    | Delay (ms) after a successful claim (1000 ms = 1s).                                             |
| `maxIterations`                     | Number    | Max loops before forcing a claim or stop (20).                                                  |
| `loopIterationDelayMs`              | Number    | Delay (ms) between mining loop checks (30000 ms = 30s).                                         |
| `miningCompleteHashRate`            | Number    | Hash rate threshold to trigger a claim (0 = claim when stopped).                                |
| `miningCompleteUnclaimedThreshold`  | Number    | Min unclaimed tokens to claim when hash rate is met (100000000 = 100M).                         |
| `claimMaxThreshold`                 | Number    | Max unclaimed tokens to force a claim (10800000000 = 10.8B).                                    |
| `claimTimeThreshold`                | Number    | Time (seconds) to force a claim if unclaimed meets min (120s).                                  |
| `mineButtonTrigger`                 | String    | Button text to start mining ("MINE").                                                           |
| `confirmButtonText`                 | String    | Phantom confirmation button text ("Confirm").                                                   |
| `stopClaimButtonText`               | String    | Button to claim tokens ("STOP & CLAIM").                                                        |
| `stopAnywayButtonText`              | String    | Button to stop without claiming ("STOP ANYWAY").                                                |
| `wss`                               | String    | WebSocket URL for mining detection (Supabase URL).                                              |
| `apiKey`                            | String    | API key for WebSocket authentication.                                                           |
| `requiredActiveMiners`              | Number    | Min active miners for mining to proceed (10).                                                   |
| `skipMiningIfInactive`              | Boolean   | Skips mining if no activity detected (`true`).                                                  |
| `skipMiningOnFailure`               | Boolean   | Skips mining on failure (`true`).                                                               |
| `cycleDelayMs`                      | Number    | Delay (ms) between cycles (10000 ms = 10s).                                                     |


### swapconfig.json
Configures swapping operation:
```json
{
  "tokenA": "SOL",
  "tokenB": "USDT",
  "tokenAMint": "",
  "tokenBMint": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "tokenALowThreshold": 0.01,
  "tokenBLowThreshold": 3,
  "tokenAPossibleAmounts": [0.000052, 0.000054, 0.000058],
  "tokenBPossibleAmounts": [0.01, 0.02, 0.015],
  "tokenARewardAmounts": [0.000052, 0.000054, 0.000053],
  "tokenBRewardAmounts": [0.01, 0.01, 0.03],
  "swapRounds": 20,
  "swapRewardsActive": false,
  "enableRewardsCheck": false,
  "skipSwapIfNoRewards": false,
  "turboswap": true
}
```

| Key                                 | Type      | Description                                                                                     |
|-------------------------------------|-----------|-------------------------------------------------------------------------------------------------|
| `tokenA`                            | String    | First token ("SOL").                                                                            |
| `tokenB`                            | String    | Second token ("USDT").                                                                          |
| `tokenAMint`                        | String    | Mint address for token A (blank for SOL).                                                       |
| `tokenBMint`                        | String    | Mint address for token B (USDT mint).                                                           |
| `tokenALowThreshold`                | Number    | Min SOL balance before flipping (0.01 SOL).                                                     |
| `tokenBLowThreshold`                | Number    | Min USDT balance before flipping (3 USDT).                                                      |
| `tokenAPossibleAmounts`             | Number[]  | Possible SOL swap amounts (e.g., 0.000054).                                                     |
| `tokenBPossibleAmounts`             | Number[]  | Possible USDT swap amounts (e.g., 0.015).                                                       |
| `tokenARewardAmounts`               | Number[]  | SOL amounts for reward mode (e.g., 0.000053; disabled).                                         |
| `tokenBRewardAmounts`               | Number[]  | USDT amounts for reward mode (e.g., 0.03; disabled).                                            |
| `swapRounds`                        | Number    | Number of swap cycles (20).                                                                     |
| `swapRewardsActive`                 | Boolean   | Uses reward amounts if `true` (currently `false`).                                              |
| `enableRewardsCheck`                | Boolean   | Checks for WPOND transfers if `true` (`false`).                                                 |
| `skipSwapIfNoRewards`               | Boolean   | Skips swaps if no rewards (`false`).                                                            |
| `turboswap`                         | Boolean   | Speeds up swaps by reusing settings (`true`).                                                   |


### solanaconfig.json
Sets Solana options:
```json
{
  "rpcEndpoint": "https://api.mainnet-beta.solana.com",
  "wpondTransferTimeThreshold": 900,
  "rewardsWalletAddress": "1orFCnFfgwPzSgUaoK6Wr3MjgXZ7mtk8NGz9Hh4iWWL",
  "wpondTokenMint": "3JgFwoYV74f6LwWjQWnr3YDPFnmBdwQfNyubv99jqUoq",
  "discountWalletAddresses": ["AYg4dKoZJudVkD7Eu3ZaJjkzfoaATUqfiv8w8pS53opT"]
}
```

| Key                                 | Type      | Description                                                                                     |
|-------------------------------------|-----------|-------------------------------------------------------------------------------------------------|
| `rpcEndpoint`                       | String    | Solana RPC URL (mainnet).                                                                       |
| `wpondTransferTimeThreshold`        | Number    | Time (seconds) for recent WPOND transfers (900s).                                               |
| `rewardsWalletAddress`              | String    | Wallet monitored for rewards.                                                                   |
| `wpondTokenMint`                    | String    | WPOND token mint address.                                                                       |
| `discountWalletAddresses`           | String[]  | Addresses excluded from reward detection.                                                       |

## Global Statistics and Session Logging

AutoPond tracks your mining and swapping performance:

- **Session Logs:** Each cycle’s details—such as mining duration, unclaimed tokens claimed, or swap amounts—are logged to the console. Detailed storage in a `session_logs` directory is possible with future updates.
- **Global Statistics:** Cumulative metrics like total cycles, claimed tokens, and swap volumes are displayed via the "View Pond Statistics" mode. These are tracked in memory, with potential saving to `globalStats.json` if configured.

This lets you monitor progress, spot trends, or troubleshoot issues easily.

## Application Flow and Logic

Here’s how AutoPond operates behind the scenes:

### Mining Flow Logic
1. **Activity Detection:** Uses WebSocket (`wss` and `apiKey`) to check for active miners. If fewer than `requiredActiveMiners` (10) and `skipMiningIfInactive` is `true`, skips; otherwise, retries after `activeMiningRetryDelayMs` (30s).
2. **Start Mining:** Waits `initialDelayMs` (4s), loads `pond0x.com/mining`, and clicks "MINE".
3. **Monitoring Loop:** Every `loopIterationDelayMs` (30s):
   - Checks hash rate vs. `miningCompleteHashRate` (0) and unclaimed tokens vs. `miningCompleteUnclaimedThreshold` (100M) to claim.
   - Forces a claim if unclaimed hits `claimMaxThreshold` (10.8B) or time exceeds `claimTimeThreshold` (120s) with sufficient unclaimed.
   - Ends after `maxIterations` (20) if no claim triggers.
4. **Claim or Stop:** Clicks "STOP & CLAIM" or "STOP ANYWAY", waits `miningSuccessDelayMs` (1s), then pauses for `cycleDelayMs` (10s).

### Swap Flow Logic
1. **Setup:** Loads `pond0x.com/swap/solana`, connects Phantom, and fetches SOL/USDT balances.
2. **Token Check:** Uses `tokenA` (SOL) and `tokenB` (USDT); flips direction if below `tokenALowThreshold` (0.01 SOL) or `tokenBLowThreshold` (3 USDT).
3. **Amount Selection:** Randomly picks from `tokenAPossibleAmounts` (e.g., 0.000054 SOL) or `tokenBPossibleAmounts` (e.g., 0.015 USDT); reward amounts unused since `enableRewardsCheck` is `false`.
4. **Swap Execution:** Inputs amount, clicks "Swap", confirms via Phantom, retries up to 3 times on errors (e.g., insufficient funds), and logs TX IDs to `tx_ids.txt`.
5. **Cycle Repeat:** Runs for `swapRounds` (20), with `turboswap` (`true`) speeding up repeats.

### Rewards Detector Logic
Currently off (`enableRewardsCheck: false`). When enabled:
1. Queries Solana (`rpcEndpoint`) for recent WPOND transfers to `rewardsWalletAddress` within `wpondTransferTimeThreshold` (900s).
2. Verifies transfers match `wpondTokenMint` and exclude `discountWalletAddresses`.
3. Activates `swapRewardsActive` to use `tokenARewardAmounts` and `tokenBRewardAmounts`.

## Installation and Setup

Get AutoPond running with these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/autopond.git
   cd autopond
   ```

2. **Install Node.js:** Download and install Node.js (v22.13.1) 

3. **Install Dependencies:**
   ```bash 
   npm install
   ```

4. **Set Up Environment:** Create .env in the root directory:

   ```bash
   MINER1_PK="your-phantom-private-key"
   MINER1_ADDRESS="your-miner-address"
   EXTNS="path/to/phantom/extension"
   ```

```MINER1_PK:``` Private key from your Phantom wallet.

5. **Configure Settings#:** Modify ```./config/``` to adjust any of Configure Settings:
- `appconfig.json`
- `miningconfig.json`
- `swapconfig.json`
- `solanaconfig.json`


## Phantom Wallet Setup

AutoPond needs a Phantom wallet for secure operations:

1. **Install the Extension:**
   Add [Phantom](https://phantom.app) to Chrome or your browser.

2. **Create a Burner Wallet:**
   - Open Phantom, select "Create New Wallet," and follow the prompts.
   - Save your recovery phrase securely—use this wallet only for AutoPond.
   - Export the private key (Settings > Export Private Key) for `.env`.

3. **Security Warning:**
   - **Use a Burner Wallet:** Avoid your main wallet to protect funds.
   - **Keep Secrets Safe:** Never share `MINER1_PK` or commit `.env` to git. See [Phantom Security Guide](https://support.phantom.app/hc/en-us/articles/360020005092).


## Dependencies

AutoPond relies on these key libraries:
- **Puppeteer:** Drives browser automation with Phantom.
- **@solana/web3.js:** Connects to the Solana blockchain.
- **ws:** Enables WebSocket for real-time mining checks.
- **Inquirer:** Powers the interactive wizard.
- **Chalk:** Styles console output.
- **cli-table3:** Formats stats tables.
- **dotenv:** Loads `.env` variables.
- **fs & path:** Manages file operations.

Install them with:
```bash
npm install
```

## Tips

- **Stay Safe:** Always use a burner wallet to minimize risks.
- **Monitor Transactions:** Check `tx_ids.txt` for swap records.
- **Tune Performance:** Adjust `cycleDelayMs` or thresholds in configs for faster or slower runs.
- **Support the Project:** Send SOL to `your-wallet-address` if AutoPond saves you time!


## License

AutoPond is released under the **ISC License**, offering flexibility for use and modification. See [LICENSE](LICENSE) for full terms.

## Contributing

We’d love your help to improve AutoPond!

- **Report Issues:** Found a bug or have an idea? Open an issue at [GitHub Issues](https://github.com/your-username/autopond/issues).
- **Submit Changes:**
  1. Fork the repository.
  2. Create a branch (`feature/your-feature`).
  3. Commit your changes with clear messages.
  4. Push and open a pull request with a detailed description.


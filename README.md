# AutoPond

![Alt text](./screenshots/banner.png)


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

### Cycle Management & Metrics
- Applies configurable delays between cycles (e.g., 10 seconds from `miningconfig.json`).
- Track session metrics and updates a database

See [Application Flow and Logic](#application-flow-and-logic) for deeper insights.

## Modes of Operation

AutoPond offers several modes to suit your operational needs, configured via `appconfig.json`. The wizard guides you through mode selection and cycle execution, prompting you for the number of cycles you wish to run.

![Alt text](./screenshots/wizard.png)

### Wizard Mode
When `wizardMode` is set to `true`, you can choose from these options:

- **⛏️ Mine:**  
  Runs the specified number of mining cycles. You'll be prompted to enter how many mining cycles you want to execute.

- **🤝 Swap:**  
  Executes the specified number of swap cycles. You'll be prompted to enter the number of swap cycles to run. A swap cycle consists of x numebr of swap rounds (set in config)

- **⛏️🤝 Mine and Swap:**  
  Runs a mining cycle followed by a swap cycle for each round. You'll be asked for the number of rounds you want to perform. Again each swap cycle will perorm x amount of swaps....maybe set to 18 to replenish boost?

- **💻 Ze Bot Stays On:**  
  Continuously runs the default cycle without prompting for a cycle count until you manually stop the process.

- **🔍 Magma Engine Viewer:**  
  Launches a viewer process for inspecting additional operational details.

- **📊 View Pond Statistics:**  
  Displays real-time aggregated metrics directly from the database.

Before execution, you’ll also be prompted to confirm wallet readiness and choose an account import method, ensuring a secure launch of the browser and proper navigation to the platform.

## Phantom Wallet Integration

AutoPond streamlines the Phantom Wallet onboarding process to simplify account setup and ensure secure access. Key features include:

- **Account Import Options:**  
  Choose between manual import or automated import using private keys stored in your environment variables.
  - **Manual Import:**  
    Follow the on-screen instructions in the Phantom pop-up to create or import your wallet.
  - **Auto-Import (🔮):**  
    Retrieve your private key from `.env` and automatically fill in the wallet setup fields.

- **Seamless UI Automation:**  
  AutoPond simulates smooth mouse movements and clicks to:
  - Populate the wallet "Name" and "Private key" fields.
  - Enter and confirm your wallet password.
  - Accept Terms-of-Service and complete the import process with minimal manual intervention.

- **Phantom Pop-Up Handling:**  
  The system detects the Phantom Wallet pop-up and automatically clicks the required buttons (such as "Import" or "Continue") to advance the onboarding flow.

**Warning:** Storing private keys in your `.env` file can expose sensitive information if the file is not properly secured. **Always use a burner wallet for testing purposes** and ensure your environment files are protected and excluded from version control. DON NOT EVER DELETE .gitignore and commit your /env as this will expose your PRIVATE KEY!!

This integrated process ensures that your Phantom Wallet is quickly and securely set up, allowing you to focus on mining and swapping operations without manual hassle.


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
    "<MINER 1 ADDRES HERE>",
    "<ADD MORE MINERS>"
    
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

## Real-Time Metrics and Data Persistence

AutoPond now delivers up-to-date performance tracking by moving away from traditional log-based methods. All key metrics for mining and swapping are dynamically aggregated in memory and committed immediately to the database.

- **Immediate Data Capture:**  
  Each mining and swap cycle's performance—such as mining duration, tokens claimed, and swap volumes—is computed on the fly and held in memory.

- **Direct Database Integration:**  
  The system employs functions like `updateAggregatedSwapMetrics()` and `updateAggregatedMiningMetrics()` to instantly update cumulative metrics in the database. This approach ensures that all performance data remains current and reliable without the overhead of session logs or static files.

- **Dynamic Reporting:**  
  The `viewPondStatistics()` function retrieves the latest metrics from the database, parsing and displaying them in well-organized tables for instant insights into system performance.

## Application Flow and Logic

AutoPond is built around a configuration-driven workflow that automates mining and swapping operations while updating performance metrics in real time. The system uses Puppeteer to automate UI interactions, integrates with Solana for blockchain data, and commits metric updates directly to the database.

### Mining Flow

1. **Configuration and Initialization:**  
   The mining process begins by loading parameters (via `loadMiningConfig()`) that define delays, thresholds, and UI trigger texts. These settings determine how long the system waits before starting, how frequently it checks the mining dashboard, and the conditions that trigger a token claim.

2. **Session Start and LCD Metrics Reading:**  
   After an initial delay, the mining session is launched. The system interacts with the mining UI—initiating the session by clicking the designated "MINE" button—and then continuously reads on-screen metrics (from elements with class `lcdbox`) such as connection status, unclaimed tokens, elapsed time, hash rate, and boost.

3. **In-Memory Metrics Monitoring:**  
   The mining loop periodically updates in-memory metrics:
   - **Total Rounds:** Counts the number of mining iterations.
   - **Token Metrics:** Tracks unclaimed tokens and computes incremental increases.
   - **Performance Averages:** Calculates the average hash rate and tracks elapsed mining time.
   - **Boost Monitoring:** Captures any increases in boost levels.
   
   These metrics are continually compared against configured thresholds (e.g., `claimMaxThreshold`, `claimTimeThreshold`, and a target hash rate) to determine if a claim action should be triggered.

4. **Token Claiming and Final Update:**  
   When claim conditions are met—whether due to reaching maximum unclaimed tokens, time limits, or specific hash rate criteria—the system initiates a claim action via UI automation (using functions like `clickbyinnertxt()`). The final metrics of the session are then committed to the database through `updateAggregatedMiningMetrics()`, marking the end of the mining cycle.

### Swap Flow

1. **Wallet Connection and Setup:**  
   The swap process starts with connecting to the Phantom wallet. The system retrieves the wallet’s public key and checks on-chain balances for the tokens involved (e.g., SOL and USDT).

2. **Token Selection and Dynamic Amount Calculation:**  
   Based on a swap configuration file, AutoPond defines which tokens to swap and sets minimum balance thresholds. It determines the swap amount by choosing from predefined arrays (which may include reward-specific amounts if rewards mode is active) and dynamically flips the token direction if the balance for the primary token falls below a set threshold.

3. **Executing the Swap:**  
   The system automates the swap operation by:
   - Selecting the correct tokens through UI interactions.
   - Inputting the determined swap amount.
   - Confirming the swap transaction through Phantom.
   
   It includes a retry mechanism (up to three attempts) to handle transient errors such as insufficient funds or network delays.

4. **Transaction Confirmation and Metrics Update:**  
   After a successful swap, the transaction details (e.g., via Solscan) are retrieved. The in-memory swap metrics are updated to record successful rounds, volume by token, transaction fees, and any errors encountered during the process. These metrics are then aggregated and persisted to the database using `updateAggregatedSwapMetrics()`.

5. **Cycle Completion and Summary:**  
   The swap flow runs for a set number of rounds as defined in the configuration. Once complete, a summary report is generated that details overall performance—such as counts of successful versus failed rounds, token volumes, and fee totals.

### Rewards Detector (Optional)

- **Activation and Operation:**  
  When enabled (`enableRewardsCheck`), the system queries Solana for recent WPOND token transfers to the configured rewards wallet. If eligible transfers are detected, the rewards mode is activated, and the swap parameters adjust to use reward-specific amounts.

### Configuration Files

- **Mining Configuration:**  
  Loaded via `loadMiningConfig()`, this file includes settings for initial delays, iteration intervals, claim thresholds, and UI button texts critical for mining operations.

- **Swap Configuration:**  
  Defines the tokens to swap, minimum balance thresholds, possible swap amounts, and optional rewards settings. These configurations drive the token selection logic and the overall behavior of the swap rounds.

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
```MINER1_ADDRESS:``` Address from your Phantom wallet.
```EXTNS:``` File path to phantom extension installer.

5. **Configure Settings#:** Modify ```./config/``` to adjust any of Configure Settings defaults:
- `appconfig.json`
- `miningconfig.json`
- `swapconfig.json`
- `solanaconfig.json`

6. **Run Autopond**
  ```bash
  npm start
  ```


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


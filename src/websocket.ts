/**
 * @file websocket.ts
 * @description Handles WebSocket connections for the Pond0x platform.
 * This module builds and sends messages to a Phoenix-based WebSocket endpoint,
 * tracks miner statistics in real time, and provides viewer mode functions for
 * displaying miner summaries and live statistics. Console output is styled using chalk
 * and tables are generated with cli-table3.
 */

import WebSocket from "ws";
import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { printMessageLinesBorderBox, shortenString } from "./ui/print";
import { magmaStyle, miningStyle } from "./ui/styles/borderboxstyles";
import { formatKMB } from "./utils/helpers";
import { loadMiningConfig } from "./utils/configloader";

// Load configuration for WebSocket and mining.
let config: {
  wss: string;
  apiKey: string;
  heartbeatInterval?: number;
  maxReconnectDelay?: number;
  activeMiningTimeout?: number;
  requiredActiveMiners?: number;
  activityThresholdSeconds?: number;
} = loadMiningConfig();

export const WS_URL: string = config.wss;
export const API_KEY: string = config.apiKey;
export const HEARTBEAT_INTERVAL: number = config.heartbeatInterval || 30000;
export const MAX_RECONNECT_DELAY: number = config.maxReconnectDelay || 10000;
export const TIMEOUT_MS: number = config.activeMiningTimeout || 30000;
export const REQUIRED_ACTIVE_MINERS: number = config.requiredActiveMiners || 5;
export const ACTIVITY_THRESHOLD_SECONDS: number = config.activityThresholdSeconds || 60;

/**
 * MinerStats interface for tracking individual miner data.
 */
export interface MinerStats {
  key: string | null;
  sig: string | null;
  rewards: number;
  unclaimedRewards: number;
  hashes: number;
  lastBoost: number;
  lastActive: Date;
  status: string;
}

/**
 * MessageBuilder class builds messages to send via WebSocket.
 */
export class MessageBuilder {
  apiKey: string;
  sentIdx: number;
  refs: { [key: string]: number | undefined };
  sentMsgs: any[];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.sentIdx = 1;
    this.refs = { "realtime:blockengine": undefined, "realtime:peersx": undefined };
    this.sentMsgs = [];
  }

  joinPayload() {
    return {
      config: {
        broadcast: { ack: true },
        presence: { key: "" },
        postgres_changes: [],
        private: false,
      },
      access_token: this.apiKey,
    };
  }

  buildMessage(topic: string, event: string, payload: any, ref: number, joinRef?: number) {
    const message: any = { topic, event, payload, ref };
    if (joinRef !== undefined) message.join_ref = joinRef;
    return message;
  }

  realtimeTopicMessages(topic: string, ref: number, joinRef?: number) {
    return {
      phx_join: this.buildMessage(topic, "phx_join", this.joinPayload(), ref, joinRef),
      access_token: this.buildMessage(topic, "access_token", { access_token: this.apiKey }, ref, joinRef),
    };
  }

  phoenixHeartbeat(ref: number) {
    return this.buildMessage("phoenix", "heartbeat", {}, ref);
  }

  joinMessages() {
    // Store join references for topics.
    this.refs["realtime:blockengine"] = this.sentIdx;
    const blockengineJoin = this.realtimeTopicMessages("realtime:blockengine", this.sentIdx++, this.refs["realtime:blockengine"]).phx_join;
    const blockengineAccess = this.realtimeTopicMessages("realtime:blockengine", this.sentIdx++, this.refs["realtime:blockengine"]).access_token;
    this.refs["realtime:peersx"] = this.sentIdx;
    const peersxJoin = this.realtimeTopicMessages("realtime:peersx", this.sentIdx++, this.refs["realtime:peersx"]).phx_join;
    const peersxAccess = this.realtimeTopicMessages("realtime:peersx", this.sentIdx++, this.refs["realtime:peersx"]).access_token;
    const phoenixHeartbeat = this.phoenixHeartbeat(this.sentIdx++);
    return [blockengineJoin, blockengineAccess, peersxJoin, peersxAccess, phoenixHeartbeat];
  }

  rejoinMessages() {
    return [
      this.realtimeTopicMessages("realtime:blockengine", this.sentIdx++, this.refs["realtime:blockengine"]).access_token,
      this.realtimeTopicMessages("realtime:peersx", this.sentIdx++, this.refs["realtime:peersx"]).access_token,
      this.phoenixHeartbeat(this.sentIdx++),
    ];
  }

  sendMessages(ws: WebSocket, messages: any[]) {
    messages.forEach((message) => {
      const jsonMsg = JSON.stringify(message);
      ws.send(jsonMsg);
      this.sentMsgs.push(message);
    });
  }
}

/**
 * ResponseMessage class parses incoming WebSocket messages and extracts relevant fields.
 */
export class ResponseMessage {
  msg: any;
  topic: string;
  event: string;
  sig: string | undefined;
  key: string | undefined;
  reward: number;
  boost: number;
  hashValue: number;

  constructor(msg: any) {
    this.msg = msg;
    this.topic = msg.topic || "topic";
    this.event = msg.event;
    this.sig = msg.payload?.payload?.sig;
    this.key = msg.payload?.payload?.payload?.key || msg.payload?.payload?.key;
    this.reward = Number(msg.payload?.payload?.reward) || 0;
    this.boost = Number(msg.payload?.payload?.boost) || 0;
    this.hashValue = Number(msg.payload?.payload?.payload?.hash) || 0;
  }

  hash() {
    const hashComponents = [
      this.event,
      this.msg.payload?.event,
      this.msg.payload?.status,
      this.msg.payload?.payload?.message,
      this.msg.payload?.payload?.status,
      Array.isArray(this.msg.payload?.payload) ? this.msg.payload.payload[0]?.status : undefined,
    ];
    return hashComponents.filter(Boolean).join("|");
  }
}

/**
 * checkActiveMining:
 * Checks for active mining by connecting to the WebSocket endpoint, receiving messages,
 * and aggregating miner stats over a specified timeout.
 *
 * @param timeoutMs - The time (in ms) to wait for messages.
 * @param requiredActiveMiners - The minimum number of active miners required.
 * @param activityThresholdSeconds - The time window in seconds for recent activity.
 * @returns A promise that resolves to true if active mining is detected.
 */
export async function checkActiveMining(
  timeoutMs: number = 10000,
  requiredActiveMiners: number = REQUIRED_ACTIVE_MINERS,
  activityThresholdSeconds: number = ACTIVITY_THRESHOLD_SECONDS
): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    const messageBuilder = new MessageBuilder(API_KEY);
    const miners = new Map<string, MinerStats>();
    let hasRecentClaim = false;

    ws.on("open", () => {
      messageBuilder.sendMessages(ws, messageBuilder.joinMessages());
    });

    ws.on("message", (data: WebSocket.Data) => {
      let messageStr: string;
      if (typeof data === "string") messageStr = data;
      else if (Buffer.isBuffer(data)) messageStr = data.toString("utf8");
      else if (data instanceof ArrayBuffer) messageStr = Buffer.from(data).toString("utf8");
      else if (Array.isArray(data)) messageStr = Buffer.concat(data as Buffer[]).toString("utf8");
      else return;

      try {
        const msg = JSON.parse(messageStr);
        msg._timestamp = new Date();
        const responseMessage = new ResponseMessage(msg);
        responseMessage.msg._hash = responseMessage.hash();
        if (responseMessage.sig || responseMessage.key) {
          const minerId = responseMessage.sig || responseMessage.key || "unknown";
          if (!miners.has(minerId)) {
            miners.set(minerId, {
              key: responseMessage.key || null,
              sig: responseMessage.sig || null,
              rewards: 0,
              unclaimedRewards: 0,
              hashes: 0,
              lastBoost: 0,
              lastActive: new Date(),
              status: "ACTIVE",
            });
          }
          const miner = miners.get(minerId)!;
          switch (responseMessage.msg._hash) {
            case "broadcast|valid|RUNNING":
              miner.unclaimedRewards = Math.max(miner.unclaimedRewards, responseMessage.reward);
              miner.status = "RUNNING";
              break;
            case "broadcast|valid|MINING":
              miner.unclaimedRewards = responseMessage.reward;
              miner.status = "MINING";
              break;
            case "broadcast|work|peer_hash_validation":
              miner.hashes += 1;
              miner.status = "MINING";
              break;
            case "broadcast|valid|CLAIMING":
              miner.rewards += responseMessage.reward;
              miner.unclaimedRewards = 0;
              miner.status = "CLAIMING";
              hasRecentClaim = true;
              break;
            case "broadcast|valid|EXPIRED":
              miner.status = "EXPIRED";
              break;
            case "broadcast|valid|SLASHING":
              miner.status = "SLASHED";
              break;
          }
          miner.lastActive = new Date();
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      ws.close();
    });

    // After timeout, close the connection and evaluate miner activity.
    setTimeout(() => {
      ws.close();
      const now = Date.now();
      let activeCount = 0;
      for (const [, miner] of miners) {
        const timeSinceLastActive = (now - miner.lastActive.getTime()) / 1000;
        const isRecent = timeSinceLastActive <= activityThresholdSeconds;
        const hasActivity = miner.hashes > 0 || miner.unclaimedRewards > 0;
        if (isRecent && hasActivity) {
          activeCount++;
        }
      }
      const isActive = activeCount >= requiredActiveMiners && hasRecentClaim;
      printMessageLinesBorderBox(
        [
          `👥 Detected ${activeCount} active miners (Hashes > 0 or Unclaimed > 0 within ${activityThresholdSeconds}s), Recent Claim: ${hasRecentClaim ? "Yes" : "No"}`,
        ],
        miningStyle
      );
      resolve(isActive);
    }, timeoutMs);
  });
}

/**
 * viewMinerSummary:
 * Connects to the WebSocket, receives miner stats, displays a summary table,
 * and then prompts the user for further actions (update view or quit).
 */
export async function viewMinerSummary(): Promise<void> {
  const ws = new WebSocket(WS_URL);
  const messageBuilder = new MessageBuilder(API_KEY);
  const miners = new Map<string, MinerStats>();

  ws.on("open", () => {
    printMessageLinesBorderBox(["Connected to WebSocket endpoint"], magmaStyle);
    messageBuilder.sendMessages(ws, messageBuilder.joinMessages());
  });

  ws.on("message", (data: WebSocket.Data) => {
    let messageStr: string;
    if (typeof data === "string") messageStr = data;
    else if (Buffer.isBuffer(data)) messageStr = data.toString("utf8");
    else if (data instanceof ArrayBuffer) messageStr = Buffer.from(data).toString("utf8");
    else if (Array.isArray(data)) messageStr = Buffer.concat(data as Buffer[]).toString("utf8");
    else return;

    try {
      const msg = JSON.parse(messageStr);
      msg._timestamp = new Date();
      const responseMessage = new ResponseMessage(msg);
      responseMessage.msg._hash = responseMessage.hash();
      if (responseMessage.sig || responseMessage.key) {
        const minerId = (responseMessage.sig || responseMessage.key || "unknown").toLowerCase();
        if (!miners.has(minerId)) {
          miners.set(minerId, {
            key: responseMessage.key || null,
            sig: responseMessage.sig || null,
            rewards: 0,
            unclaimedRewards: 0,
            hashes: 0,
            lastBoost: 0,
            lastActive: new Date(),
            status: "ACTIVE",
          });
        }
        const miner = miners.get(minerId)!;
        switch (responseMessage.msg._hash) {
          case "broadcast|valid|RUNNING":
            miner.unclaimedRewards = Math.max(miner.unclaimedRewards, responseMessage.reward);
            miner.status = "RUNNING";
            break;
          case "broadcast|valid|MINING":
            miner.unclaimedRewards = responseMessage.reward;
            miner.status = "MINING";
            break;
          case "broadcast|work|peer_hash_validation":
            miner.hashes += 1;
            miner.status = "MINING";
            break;
          case "broadcast|valid|CLAIMING":
            miner.rewards += responseMessage.reward;
            miner.unclaimedRewards = 0;
            miner.status = "CLAIMING";
            break;
          case "broadcast|valid|EXPIRED":
            miner.status = "EXPIRED";
            break;
          case "broadcast|valid|SLASHING":
            miner.status = "SLASHED";
            break;
        }
        // Update highest boost and last active timestamp.
        miner.lastBoost = Math.max(miner.lastBoost, responseMessage.boost);
        miner.lastActive = new Date();
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  // Local function to display the miner summary table.
  async function displaySummary() {
    const TOP_MINERS_COUNT = 20;
    const sortedMiners = Array.from(miners.entries())
      .sort((a, b) => {
        const aMax = Math.max(a[1].rewards, a[1].unclaimedRewards);
        const bMax = Math.max(b[1].rewards, b[1].unclaimedRewards);
        return bMax - aMax;
      })
      .slice(0, TOP_MINERS_COUNT);

    const totalRewards = Array.from(miners.values()).reduce((sum, miner) => sum + miner.rewards, 0);
    const totalUnclaimed = Array.from(miners.values()).reduce((sum, miner) => sum + miner.unclaimedRewards, 0);
    const totalHashes = Array.from(miners.values()).reduce((sum, miner) => sum + miner.hashes, 0);
    const trackedMiners = miners.size;

    const table = new Table({
      head: [
        chalk.yellow("Rank"),
        chalk.yellow("Miner ID"),
        chalk.yellow("Claimed"),
        chalk.yellow("Unclaimed"),
        chalk.yellow("Hashes"),
        chalk.yellow("Boost"),
        chalk.yellow("Status"),
        chalk.yellow("Last Active")
      ],
      style: { head: ["yellow"], border: ["red"] },
      colWidths: [6, 20, 12, 12, 10, 10, 12, 15]
    });

    sortedMiners.forEach(([minerId, data], index) => {
      const timeSinceLast = Math.floor((Date.now() - data.lastActive.getTime()) / 1000);
      table.push([
        chalk.yellow(index + 1),
        chalk.yellow(shortenString(minerId, 18)),
        chalk.yellow(formatKMB(data.rewards)),
        chalk.yellow(formatKMB(data.unclaimedRewards)),
        chalk.yellow(data.hashes.toString()),
        chalk.yellow(data.lastBoost.toFixed(1)),
        chalk.yellow(data.status),
        chalk.yellow(`${timeSinceLast}s ago`)
      ]);
    });

    printMessageLinesBorderBox(
      [
        `Top ${TOP_MINERS_COUNT} Miners by Highest Claimed/Unclaimed - Updated ${new Date().toLocaleTimeString()}`,
        `Total Claimed Rewards: ${formatKMB(totalRewards)}`,
        `Total Unclaimed Rewards: ${formatKMB(totalUnclaimed)}`,
        `Total Hashes: ${totalHashes}`,
        `Tracked Miners: ${trackedMiners}`
      ],
      magmaStyle
    );
    console.log(table.toString());
    console.log("\n");
  }

  // Wait a bit for data accumulation then display summary.
  await new Promise((res) => setTimeout(res, 5000));
  await displaySummary();

  // Prompt the user for an action (update view or quit).
  async function promptExitOrUpdate() {
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Select an action:",
          choices: ["Update view", "Quit"],
        },
      ]);
      if (action === "Quit") {
        ws.close();
        await new Promise<void>((resolve) => ws.on("close", resolve));
        printMessageLinesBorderBox([`WebSocket Closed`], magmaStyle);
        break;
      } else if (action === "Update view") {
        await displaySummary();
      }
    }
  }
  await promptExitOrUpdate();
}

/**
 * viewLiveMiner:
 * Displays live miner statistics for a specific miner.
 * If an address is not provided, prompts the user to input one.
 *
 * @param passedAddress - Optional miner address to monitor.
 */
export async function viewLiveMiner(passedAddress?: string): Promise<void> {
  // Prompt user for miner address if not passed.
  let chosenAddress: string;
  if (!passedAddress) {
    const { manualAddress } = await inquirer.prompt([
      {
        type: "input",
        name: "manualAddress",
        message: chalk.bold.green("Enter the miner address (key or sig) to view live stats:"),
        validate: (value) => value.trim().length > 0 || "Please enter a valid address",
      },
    ]);
    chosenAddress = manualAddress;
  } else {
    chosenAddress = passedAddress;
  }

  const searchAddress = chosenAddress.toLowerCase();
  const messageBuilder = new MessageBuilder(API_KEY);
  const miners = new Map<string, MinerStats>();

  let lastDisplayedState = "";
  let shouldReconnect = true;
  let heartbeatIntervalId: NodeJS.Timeout;
  let reconnectTimeoutId: NodeJS.Timeout;
  let ws: WebSocket;

  // Establish and manage the WebSocket connection.
  function connectWs() {
    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      printMessageLinesBorderBox(["Connected to WebSocket endpoint"], magmaStyle);
      messageBuilder.sendMessages(ws, messageBuilder.joinMessages());
      heartbeatIntervalId = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(messageBuilder.phoenixHeartbeat(0)));
        }
      }, HEARTBEAT_INTERVAL);
    });

    ws.on("message", (data: WebSocket.Data) => {
      let messageStr: string;
      if (typeof data === "string") {
        messageStr = data;
      } else if (Buffer.isBuffer(data)) {
        messageStr = data.toString("utf8");
      } else if (data instanceof ArrayBuffer) {
        messageStr = Buffer.from(data).toString("utf8");
      } else if (Array.isArray(data)) {
        messageStr = Buffer.concat(data as Buffer[]).toString("utf8");
      } else {
        return;
      }

      try {
        const msg = JSON.parse(messageStr);
        msg._timestamp = new Date();
        const responseMessage = new ResponseMessage(msg);
        responseMessage.msg._hash = responseMessage.hash();

        // Check if the message belongs to the miner we're interested in.
        if (responseMessage.sig || responseMessage.key) {
          const minerId = (responseMessage.sig || responseMessage.key || "unknown").toLowerCase();
          if (
            minerId === searchAddress ||
            responseMessage.key?.toLowerCase() === searchAddress ||
            responseMessage.sig?.toLowerCase() === searchAddress
          ) {
            // Add miner to the map if not present.
            if (!miners.has(minerId)) {
              miners.set(minerId, {
                key: responseMessage.key || null,
                sig: responseMessage.sig || null,
                rewards: 0,
                unclaimedRewards: 0,
                hashes: 0,
                lastBoost: 0,
                lastActive: new Date(),
                status: "ACTIVE",
              });
            }

            const miner = miners.get(minerId)!;
            // Update miner stats based on the message hash.
            switch (responseMessage.msg._hash) {
              case "broadcast|valid|RUNNING":
                miner.unclaimedRewards = Math.max(miner.unclaimedRewards, responseMessage.reward);
                miner.status = "RUNNING";
                break;
              case "broadcast|valid|MINING":
                miner.unclaimedRewards = responseMessage.reward;
                miner.status = "MINING";
                break;
              case "broadcast|work|peer_hash_validation":
                miner.hashes += 1;
                miner.status = "MINING";
                break;
              case "broadcast|valid|CLAIMING":
                miner.rewards += responseMessage.reward;
                miner.unclaimedRewards = 0;
                miner.status = "CLAIMING";
                break;
              case "broadcast|valid|EXPIRED":
                miner.status = "EXPIRED";
                break;
              case "broadcast|valid|SLASHING":
                miner.status = "SLASHED";
                break;
            }
            miner.lastBoost = Math.max(miner.lastBoost, responseMessage.boost);
            miner.lastActive = new Date();
          }
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    ws.on("close", () => {
      console.log(chalk.red("WebSocket connection closed."));
      clearInterval(heartbeatIntervalId);
      if (shouldReconnect) {
        console.log(chalk.yellow("Attempting to reconnect in 5 seconds..."));
        reconnectTimeoutId = setTimeout(() => {
          connectWs();
        }, 5000);
      }
    });

    ws.on("error", (err) => {
      console.error(chalk.red("WebSocket error:"), err);
      ws.close();
    });
  }

  // Initialize the WebSocket connection.
  connectWs();

  // Wait 5 seconds to gather data, then start showing live updates.
  await new Promise((res) => setTimeout(res, 5000));

  const updateInterval = 10000; // update every 10 seconds
  const intervalId = setInterval(() => {
    if (miners.size === 0) {
      // No miner data yet.
      return;
    }
    // We only track one miner ID in this approach.
    const [minerId, miner] = Array.from(miners.entries())[0];
    const displayState = {
      rewards: miner.rewards,
      unclaimedRewards: miner.unclaimedRewards,
      hashes: miner.hashes,
      lastBoost: miner.lastBoost,
      status: miner.status,
    };
    const newStateString = JSON.stringify(displayState);
    if (newStateString === lastDisplayedState) return;
    lastDisplayedState = newStateString;

    // Build and display a summary table.
    const table = new Table({
      head: [chalk.yellow("Field"), chalk.yellow("Value")],
      style: { head: ["yellow"], border: ["red"] },
      colWidths: [20, 42],
    });
    table.push(
      ["Miner ID", chalk.yellow(shortenString(minerId, 18))],
      ["Key", chalk.yellow(shortenString(miner.key || "N/A", 18))],
      ["Signature", chalk.yellow(shortenString(miner.sig || "N/A", 18))],
      ["Claimed Rewards", chalk.yellow(formatKMB(miner.rewards))],
      ["Unclaimed Rewards", chalk.yellow(formatKMB(miner.unclaimedRewards))],
      ["Hashes", chalk.yellow(miner.hashes.toString())],
      ["Last Boost", chalk.yellow(miner.lastBoost.toFixed(1))],
      ["Status", chalk.yellow(miner.status)]
    );

    printMessageLinesBorderBox(
      [
        `🔍 Live Stats for Miner: ${shortenString(chosenAddress, 18)} - ${new Date().toLocaleTimeString()}`
      ],
      magmaStyle
    );
    console.log(table.toString());
  }, updateInterval);

  // Listen for user input to quit the live view.
  printMessageLinesBorderBox(["Press 'Q' to quit live view."], magmaStyle);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", (chunk) => {
    const key = chunk.toString().toLowerCase();
    if (key === "q") {
      shouldReconnect = false;
      process.stdin.setRawMode(false);
      process.stdin.pause();
      clearInterval(intervalId);
      clearInterval(heartbeatIntervalId);
      clearTimeout(reconnectTimeoutId);
      ws.close();
      printMessageLinesBorderBox([`WebSocket Closed`], magmaStyle);
      process.exit(0);
    }
  });

  // Keep the function running indefinitely.
  await new Promise(() => {});
}

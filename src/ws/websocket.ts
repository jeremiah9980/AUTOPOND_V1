// websocket.ts

import WebSocket, { Data } from "ws";
import { API_KEY, WS_URL } from "./wsconfig";
import { MinerStore, defaultFilter, MessageFilterFn } from "./msghandler";
import { MinerViewUi } from "../ui/magmaviewer";
import chalk from "chalk";
import inquirer from "inquirer";

import { logConvertedMessage } from "./logger";
import { printTable } from "../ui/tables/printtable";

// Miner data structure
export interface MinerStats {
  key: string | null | undefined;
  sig: string | null;
  rewards: number;
  unclaimedRewards: number;
  hashes: number;
  lastBoost: number;
  lastActive: Date;
  status: string;
  hasRecentClaim: boolean;
}

interface MinerOptions {
  timeoutMs?: number;
  requiredActiveMiners?: number;
  activityThresholdSeconds?: number;
  chosenAddress?: string;
}

export type MinerContext =
  | "📋 View Miner Summary"
  | "👁️ View Live Miner"
  | "👁️ View Live Events" // New mode added
  | "Check Active Mining";

// Each viewer now includes a filter property.
interface MinerViewer {
  wsmanager: WebSocketManager;
  filter: MessageFilterFn;
  start: () => Promise<void | boolean>;
}

// ====================================================================
// MessageBuilder class
// ====================================================================

export class MessageBuilder {
  apiKey: string;
  sentIdx: number;
  refs: { [key: string]: number | undefined };
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.sentIdx = 1;
    this.refs = {
      "realtime:blockengine": undefined,
      "realtime:peersx": undefined,
    };
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
  buildMessage(
    topic: string,
    event: string,
    payload: any,
    ref: number,
    joinRef?: number
  ) {
    const message: any = { topic, event, payload, ref };
    if (joinRef !== undefined) message.join_ref = joinRef;
    return message;
  }
  realtimeTopicMessages(topic: string, ref: number, joinRef?: number) {
    return {
      phx_join: this.buildMessage(
        topic,
        "phx_join",
        this.joinPayload(),
        ref,
        joinRef
      ),
      access_token: this.buildMessage(
        topic,
        "access_token",
        { access_token: this.apiKey },
        ref,
        joinRef
      ),
    };
  }
  phoenixHeartbeat(ref: number) {
    return this.buildMessage("phoenix", "heartbeat", {}, ref);
  }
  joinMessages() {
    this.refs["realtime:blockengine"] = this.sentIdx;
    const blockengineJoin = this.realtimeTopicMessages(
      "realtime:blockengine",
      this.sentIdx++,
      this.refs["realtime:blockengine"]
    ).phx_join;
    const blockengineAccess = this.realtimeTopicMessages(
      "realtime:blockengine",
      this.sentIdx++,
      this.refs["realtime:blockengine"]
    ).access_token;
    this.refs["realtime:peersx"] = this.sentIdx;
    const peersxJoin = this.realtimeTopicMessages(
      "realtime:peersx",
      this.sentIdx++,
      this.refs["realtime:peersx"]
    ).phx_join;
    const peersxAccess = this.realtimeTopicMessages(
      "realtime:peersx",
      this.sentIdx++,
      this.refs["realtime:peersx"]
    ).access_token;
    const phoenixHeartbeat = this.phoenixHeartbeat(this.sentIdx++);
    return [
      blockengineJoin,
      blockengineAccess,
      peersxJoin,
      peersxAccess,
      phoenixHeartbeat,
    ];
  }
  rejoinMessages() {
    return [
      this.realtimeTopicMessages(
        "realtime:blockengine",
        this.sentIdx++,
        this.refs["realtime:blockengine"]
      ).access_token,
      this.realtimeTopicMessages(
        "realtime:peersx",
        this.sentIdx++,
        this.refs["realtime:peersx"]
      ).access_token,
      this.phoenixHeartbeat(this.sentIdx++),
    ];
  }
  sendMessages(ws: WebSocket, messages: any[]) {
    messages.forEach((message) => {
      const jsonMsg = JSON.stringify(message);
      ws.send(jsonMsg);
    });
  }
}

// New ResponseMessage class that supports many variations of messages.
export class ResponseMessage {
  msg: any; // Explicitly declare msg
  topic: string;
  event: string;
  messageName: string;
  key: string | undefined;
  sig: string | undefined;
  reward: number;
  boost: number;
  hashValue: number;
  status: string;

  constructor(msg: any) {
    this.msg = msg;
    this.topic = msg.topic || "unknown_topic";
    this.event = msg.event || "unknown_event";

    const payload = msg.payload || {};
    const innerPayload = payload.payload || payload;
    const deepestPayload =
      innerPayload.payload || innerPayload["0"] || innerPayload;

    // Use inner event if present
    this.event = payload.event || this.event;
    this.messageName = innerPayload.message || payload.message || this.event;

    this.key = deepestPayload.key || innerPayload.key || payload.key || msg.key;
    this.sig = deepestPayload.sig || innerPayload.sig || payload.sig || msg.sig;
    this.reward = Number(
      deepestPayload.reward || innerPayload.reward || payload.reward || 0
    );
    this.boost = Number(
      deepestPayload.boost || innerPayload.boost || payload.boost || 0
    );
    this.hashValue = Number(
      deepestPayload.hash ||
        deepestPayload.lastHash ||
        innerPayload.lastHash ||
        0
    );
    this.status =
      deepestPayload.status ||
      innerPayload.status ||
      payload.status ||
      "unknown";
  }

  classify(): string {
    return [this.event, this.status, this.messageName]
      .filter(Boolean)
      .join("|")
      .toLowerCase();
  }
}

// ====================================================================
// WebSocketManager class
// ====================================================================
class WebSocketManager extends MinerViewUi {
  private ws: WebSocket | null = null;
  private mbuild = new MessageBuilder(API_KEY);
  context: MinerContext | null = null;
  heartbeatIntervalId?: NodeJS.Timeout;
  reconnectTimeoutId?: NodeJS.Timeout;
  minerstore = new MinerStore();
  shouldReconnect: boolean = false;
  messageQueue: Data[] = [];
  isProcessing: boolean = false;
  private messageListeners: ((data: any, state?: MinerStats) => void)[] = [];
  private shouldProcess: boolean = true;
  private searchAddress?: string; // Store address from wsConnect

  constructor() {
    super();
    this.startQueueProcessing();
  }

  updateCallback: (data: Data) => void = (data) => {
    this.messageQueue.push(data);
  };

  getActiveFilter(): MessageFilterFn {
    return defaultFilter;
  }

  public onMessage(callback: (data: any, state?: MinerStats) => void) {
    if (this.ws) {
      this.messageListeners.push(callback);
    }
  }

  wsConnect(heartbeat: boolean, searchAddress?: string) {
    this.searchAddress = searchAddress?.toLowerCase(); // Store the address
    this.ws = new WebSocket(WS_URL);

    this.ws?.on("open", () => {
      this.triggerOpen(heartbeat);
    });

    this.ws?.on("message", (data) => {
      const messageStr = typeof data === "string" ? data : data.toString();
      // logConvertedMessage(messageStr).catch((err) =>
      //   console.error("Failed to log converted message:", err)
      // );
      this.updateCallback(data);
    });

    this.ws?.on("close", () => {
      if (this.context === "👁️ View Live Miner" && this.shouldReconnect) {
        this.printReconnect();
        this.reconnectTimeoutId = setTimeout(() => {
          this.ws?.removeAllListeners();
          this.wsConnect(heartbeat, searchAddress);
        }, 5000);
      }
    });

    this.ws?.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.ws?.close();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const rawData = this.messageQueue.shift()!;

      try {
        this.minerstore.updateMiners(rawData, this.getActiveFilter());

        this.messageListeners.forEach((callback) => {
          try {
            callback(rawData);
          } catch (err) {
            console.error("Error in onMessage callback:", err);
          }
        });
      } catch (err) {
        console.error(
          "Error processing queued message:",
          err,
          rawData.toString()
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.isProcessing = false;
  }

  private async startQueueProcessing() {
    while (this.shouldProcess) {
      await this.processQueue();
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  private stopQueueProcessing() {
    this.shouldProcess = false;
  }

  send(message: any | any[]) {
    if (this.ws?.readyState === this.ws?.OPEN) {
      const msgs = Array.isArray(message) ? message : [message];
      msgs.forEach((msg: any) => this.ws?.send(JSON.stringify(msg)));
    }
  }

  close() {
    this.ws?.close();
    this.stopQueueProcessing();
    this.printWsClosed();
  }

  private triggerOpen(heartbeat: boolean) {
    this.printWsConnected();
    this.send(this.mbuild.joinMessages());
    if (
      this.context === "👁️ View Live Miner" &&
      heartbeat &&
      !this.heartbeatIntervalId
    ) {
      this.startHeartbeat();
    }
  }

  private startHeartbeat() {
    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(this.mbuild.phoenixHeartbeat(0));
      }
    }, 5000);
  }

  registerContext(name: MinerContext) {
    this.context = name;
  }

  unregisterContext() {
    this.context = null;
  }

  private stopHeartBeat() {
    clearInterval(this.heartbeatIntervalId);
  }

  setReconnect(state: boolean) {
    this.shouldReconnect = state;
  }
}

// ====================================================================
// Viewer Classes
// ====================================================================

// ActiveMining: Uses default filter
class ActiveMining implements MinerViewer {
  wsmanager: WebSocketManager;
  options: MinerOptions;
  context: MinerContext;
  filter: MessageFilterFn;
  constructor(
    options: MinerOptions,
    wsmanager: WebSocketManager,
    context: MinerContext
  ) {
    this.wsmanager = wsmanager;
    this.options = options;
    this.context = context;
    this.filter = defaultFilter;
  }
  start() {
    return new Promise<boolean>((resolve) => {
      this.wsmanager.registerContext(this.context);
      this.wsmanager.getActiveFilter = () => this.filter;
      this.wsmanager.wsConnect(false);
      setTimeout(() => {
        this.wsmanager.close();
        const now = Date.now();
        let activeCount = 0;
        for (const [, miner] of this.wsmanager.minerstore.miners) {
          const timeSinceLastActive = (now - miner.lastActive.getTime()) / 1000;
          const isRecent =
            timeSinceLastActive <= this.options.activityThresholdSeconds!;
          const hasActivity = miner.hashes > 0 || miner.unclaimedRewards > 0;
          if (isRecent && hasActivity) {
            activeCount++;
          }
        }
        const isActive = activeCount >= this.options.requiredActiveMiners!;
        this.wsmanager.printCheckActiveMining(
          activeCount,
          this.options.activityThresholdSeconds!,
          false
        );
        resolve(isActive);
      }, this.options.timeoutMs);
    });
  }
}

// MinerSummary: Uses default filter to display a summary.
class MinerSummary implements MinerViewer {
  wsmanager: WebSocketManager;
  options: MinerOptions;
  context: MinerContext;
  filter: MessageFilterFn;
  constructor(
    options: MinerOptions,
    wsmanager: WebSocketManager,
    context: MinerContext
  ) {
    this.wsmanager = wsmanager;
    this.options = options;
    this.context = context;
    this.filter = defaultFilter;
  }
  async start() {
    this.wsmanager.registerContext(this.context);
    this.wsmanager.getActiveFilter = () => this.filter;
    this.wsmanager.wsConnect(false);
    this.wsmanager.printMinerSummary(this.wsmanager.minerstore.miners);
    while (true) {
      const action = await this.wsmanager.promptUpdateOrQuit();
      if (action === "Quit") {
        this.wsmanager.close();
        break;
      } else if (action === "Update view") {
        await this.wsmanager.printMinerSummary(
          this.wsmanager.minerstore.miners
        );
      }
    }
  }
}

// LiveMiner: Filters messages by a chosen miner address.
class LiveMiner implements MinerViewer {
  wsmanager: WebSocketManager;
  options: MinerOptions;
  context: MinerContext;
  filter: MessageFilterFn;
  printQueue: { msg: ResponseMessage; state?: MinerStats; timestamp: Date }[] =
    [];
  isPrinting: boolean = false;
  address: string = "";

  constructor(
    options: MinerOptions,
    wsmanager: WebSocketManager,
    context: MinerContext
  ) {
    this.wsmanager = wsmanager;
    this.options = options;
    this.context = context;
    this.filter = defaultFilter;
    this.startPrintQueue();
  }

  async start() {
    this.wsmanager.registerContext(this.context);
    this.wsmanager.setReconnect(true);

    this.address = (
      await this.wsmanager.promptMinerAddress(this.options.chosenAddress)
    ).toLowerCase();

    this.filter = (msg: ResponseMessage) => {
      const search = this.address;
      const keyMatch = msg.key && msg.key.toLowerCase() === search;
      const sigMatch = msg.sig && msg.sig.toLowerCase() === search;
      const sigToKeyMatch =
        !msg.key &&
        msg.sig &&
        this.wsmanager.minerstore.getMiner(msg.sig)?.key?.toLowerCase() ===
          search;
      const keyToSigMatch =
        msg.key &&
        this.wsmanager.minerstore.getMiner(msg.key)?.sig?.toLowerCase() ===
          search;

      if (keyMatch || sigMatch || sigToKeyMatch || keyToSigMatch) {
        return true;
      }
      return false;
    };

    this.wsmanager.getActiveFilter = () => this.filter;
    this.wsmanager.wsConnect(true, this.address);

    this.wsmanager.onMessage((data: any, state?: MinerStats) => {
      try {
        const msg = JSON.parse(data.toString());
        const responseMessage = new ResponseMessage(msg);
        if (this.filter(responseMessage)) {
          let queuedState = state ? { ...state } : undefined;
          this.printQueue.push({
            msg: responseMessage,
            state: queuedState,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error("Error processing live miner message:", err);
      }
    });

    await this.wsmanager.promptQtoQuit();
    this.wsmanager.setReconnect(false);
    clearInterval(this.wsmanager.heartbeatIntervalId);
    clearTimeout(this.wsmanager.reconnectTimeoutId);
    this.wsmanager.close();
    process.exit(0);
  }

  private async startPrintQueue() {
    while (true) {
      if (this.printQueue.length > 0 && !this.isPrinting) {
        this.isPrinting = true;
        const { state } = this.printQueue.shift()!;
        // Call printMinerState from MinerViewUi
        this.wsmanager.printLiveMiner(
          state || this.wsmanager.minerstore.miners.get(this.address)!
        );
        this.isPrinting = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

// LiveEventsViewer: New viewer that displays *all* incoming messages that pass a status filter.
class LiveEvents implements MinerViewer {
  wsmanager: WebSocketManager;
  options: MinerOptions;
  context: MinerContext;
  filter: MessageFilterFn;
  constructor(
    options: MinerOptions,
    wsmanager: WebSocketManager,
    context: MinerContext
  ) {
    this.wsmanager = wsmanager;
    this.options = options;
    this.context = context;
    // Initially, set a default filter for statuses RUNNING, JOINING, and CLAIMING.
    this.filter = (msg: ResponseMessage) => {
      const status = msg.msg.payload?.payload?.status;
      return ["RUNNING", "JOINING", "CLAIMING"].includes(status);
    };
  }
  async start() {
    // Prompt the user for which statuses to view.
    const { statuses } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "statuses",
        message: chalk.bold.green("Select which status messages to display:"),
        choices: [
          "RUNNING",
          "JOINING",
          "MINING",
          "CLAIMING",
          "EXPIRED",
          "SLASHED",
          "NO FILTER (all messages)",
        ],
        default: ["RUNNING", "JOINING", "CLAIMING"],
      },
    ]);
    // Update our filter based on the user selection.
    if (statuses.includes("NO FILTER (all messages)")) {
      this.filter = () => true;
    } else {
      this.filter = (msg: ResponseMessage) => {
        const status = msg.msg.payload?.payload?.status;
        return statuses.includes(status);
      };
    }

    // Register our context and set our custom filter.
    this.wsmanager.registerContext(this.context);
    this.wsmanager.getActiveFilter = () => this.filter;
    // Open the WebSocket connection with heartbeat enabled.
    this.wsmanager.wsConnect(true);

    // Use the onMessage method to log events that pass our filter.
    this.wsmanager.onMessage((data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        const responseMessage = new ResponseMessage(msg);
        if (this.filter(responseMessage)) {
          // Build an array of objects containing key fields for display.
          const displayData = [
            { Field: "Topic", Value: msg.topic || "N/A" },
            { Field: "Event", Value: msg.event || "N/A" },
            { Field: "Status", Value: msg.payload?.payload?.status || "N/A" },
            {
              Field: "Key",
              Value:
                msg.payload?.payload?.payload?.key ||
                msg.payload?.payload?.key ||
                "N/A",
            },
            { Field: "Signature", Value: msg.payload?.payload?.sig || "N/A" },
            { Field: "Reward", Value: msg.payload?.payload?.reward || "N/A" },
            { Field: "Boost", Value: msg.payload?.payload?.boost || "N/A" },
          ];
          printTable(displayData, { title: "Live Event" });
        }
      } catch (err) {
        console.error("Error processing live event:", err);
      }
    });

    // Wait until the user presses Q to quit.
    await this.wsmanager.promptQtoQuit();
    this.wsmanager.close();
    process.exit(0);
  }
}

// ====================================================================
// MinerView factory that selects the appropriate viewer.
// ====================================================================

class MinerView {
  private minerContext: MinerContext;
  constructor(minerContext: MinerContext) {
    this.minerContext = minerContext;
  }
  selectMinerView(options: any = {}): MinerViewer {
    const wsmanager: WebSocketManager = new WebSocketManager();
    switch (this.minerContext) {
      case "Check Active Mining":
        options.timeoutMs ||= 10000;
        options.requiredActiveMiners ||= 1;
        options.activityThresholdSeconds ||= 300;
        return new ActiveMining(options, wsmanager, this.minerContext);
      case "👁️ View Live Miner":
        return new LiveMiner(options, wsmanager, this.minerContext);
      case "📋 View Miner Summary":
        return new MinerSummary(options, wsmanager, this.minerContext);
      case "👁️ View Live Events":
        return new LiveEvents(options, wsmanager, this.minerContext);
      default:
        throw new Error(`Unknown miner context: ${this.minerContext}`);
    }
  }
}

function seeMiningActivity(
  miningContext: MinerContext,
  options?: MinerOptions
) {
  return new MinerView(miningContext).selectMinerView(options).start();
}

export { seeMiningActivity };

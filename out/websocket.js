"use strict";
/**
 * @file websocket.ts
 * @description Handles WebSocket connections for the Pond0x platform.
 * This module builds and sends messages to a Phoenix-based WebSocket endpoint,
 * tracks miner statistics in real time, and provides viewer mode functions for
 * displaying miner summaries and live statistics. Console output is styled using chalk
 * and tables are generated with cli-table3.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseMessage = exports.MessageBuilder = exports.ACTIVITY_THRESHOLD_SECONDS = exports.REQUIRED_ACTIVE_MINERS = exports.TIMEOUT_MS = exports.MAX_RECONNECT_DELAY = exports.HEARTBEAT_INTERVAL = exports.API_KEY = exports.WS_URL = void 0;
exports.checkActiveMining = checkActiveMining;
exports.viewMinerSummary = viewMinerSummary;
exports.viewLiveMiner = viewLiveMiner;
const tslib_1 = require("tslib");
const ws_1 = tslib_1.__importDefault(require("ws"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const cli_table3_1 = tslib_1.__importDefault(require("cli-table3"));
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const print_1 = require("./ui/print");
const borderboxstyles_1 = require("./ui/styles/borderboxstyles");
const helpers_1 = require("./utils/helpers");
const configloader_1 = require("./utils/configloader");
// Load configuration for WebSocket and mining.
let config = (0, configloader_1.loadMiningConfig)();
exports.WS_URL = config.wss;
exports.API_KEY = config.apiKey;
exports.HEARTBEAT_INTERVAL = config.heartbeatInterval || 30000;
exports.MAX_RECONNECT_DELAY = config.maxReconnectDelay || 10000;
exports.TIMEOUT_MS = config.activeMiningTimeout || 30000;
exports.REQUIRED_ACTIVE_MINERS = config.requiredActiveMiners || 5;
exports.ACTIVITY_THRESHOLD_SECONDS = config.activityThresholdSeconds || 60;
/**
 * MessageBuilder class builds messages to send via WebSocket.
 */
class MessageBuilder {
    constructor(apiKey) {
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
    buildMessage(topic, event, payload, ref, joinRef) {
        const message = { topic, event, payload, ref };
        if (joinRef !== undefined)
            message.join_ref = joinRef;
        return message;
    }
    realtimeTopicMessages(topic, ref, joinRef) {
        return {
            phx_join: this.buildMessage(topic, "phx_join", this.joinPayload(), ref, joinRef),
            access_token: this.buildMessage(topic, "access_token", { access_token: this.apiKey }, ref, joinRef),
        };
    }
    phoenixHeartbeat(ref) {
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
    sendMessages(ws, messages) {
        messages.forEach((message) => {
            const jsonMsg = JSON.stringify(message);
            ws.send(jsonMsg);
            this.sentMsgs.push(message);
        });
    }
}
exports.MessageBuilder = MessageBuilder;
/**
 * ResponseMessage class parses incoming WebSocket messages and extracts relevant fields.
 */
class ResponseMessage {
    constructor(msg) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        this.msg = msg;
        this.topic = msg.topic || "topic";
        this.event = msg.event;
        this.sig = (_b = (_a = msg.payload) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.sig;
        this.key = ((_e = (_d = (_c = msg.payload) === null || _c === void 0 ? void 0 : _c.payload) === null || _d === void 0 ? void 0 : _d.payload) === null || _e === void 0 ? void 0 : _e.key) || ((_g = (_f = msg.payload) === null || _f === void 0 ? void 0 : _f.payload) === null || _g === void 0 ? void 0 : _g.key);
        this.reward = Number((_j = (_h = msg.payload) === null || _h === void 0 ? void 0 : _h.payload) === null || _j === void 0 ? void 0 : _j.reward) || 0;
        this.boost = Number((_l = (_k = msg.payload) === null || _k === void 0 ? void 0 : _k.payload) === null || _l === void 0 ? void 0 : _l.boost) || 0;
        this.hashValue = Number((_p = (_o = (_m = msg.payload) === null || _m === void 0 ? void 0 : _m.payload) === null || _o === void 0 ? void 0 : _o.payload) === null || _p === void 0 ? void 0 : _p.hash) || 0;
    }
    hash() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const hashComponents = [
            this.event,
            (_a = this.msg.payload) === null || _a === void 0 ? void 0 : _a.event,
            (_b = this.msg.payload) === null || _b === void 0 ? void 0 : _b.status,
            (_d = (_c = this.msg.payload) === null || _c === void 0 ? void 0 : _c.payload) === null || _d === void 0 ? void 0 : _d.message,
            (_f = (_e = this.msg.payload) === null || _e === void 0 ? void 0 : _e.payload) === null || _f === void 0 ? void 0 : _f.status,
            Array.isArray((_g = this.msg.payload) === null || _g === void 0 ? void 0 : _g.payload) ? (_h = this.msg.payload.payload[0]) === null || _h === void 0 ? void 0 : _h.status : undefined,
        ];
        return hashComponents.filter(Boolean).join("|");
    }
}
exports.ResponseMessage = ResponseMessage;
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
async function checkActiveMining(timeoutMs = 10000, requiredActiveMiners = exports.REQUIRED_ACTIVE_MINERS, activityThresholdSeconds = exports.ACTIVITY_THRESHOLD_SECONDS) {
    return new Promise((resolve) => {
        const ws = new ws_1.default(exports.WS_URL);
        const messageBuilder = new MessageBuilder(exports.API_KEY);
        const miners = new Map();
        let hasRecentClaim = false;
        ws.on("open", () => {
            messageBuilder.sendMessages(ws, messageBuilder.joinMessages());
        });
        ws.on("message", (data) => {
            let messageStr;
            if (typeof data === "string")
                messageStr = data;
            else if (Buffer.isBuffer(data))
                messageStr = data.toString("utf8");
            else if (data instanceof ArrayBuffer)
                messageStr = Buffer.from(data).toString("utf8");
            else if (Array.isArray(data))
                messageStr = Buffer.concat(data).toString("utf8");
            else
                return;
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
                    const miner = miners.get(minerId);
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
            }
            catch (error) {
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
            (0, print_1.printMessageLinesBorderBox)([
                `👥 Detected ${activeCount} active miners (Hashes > 0 or Unclaimed > 0 within ${activityThresholdSeconds}s), Recent Claim: ${hasRecentClaim ? "Yes" : "No"}`,
            ], borderboxstyles_1.miningStyle);
            resolve(isActive);
        }, timeoutMs);
    });
}
/**
 * viewMinerSummary:
 * Connects to the WebSocket, receives miner stats, displays a summary table,
 * and then prompts the user for further actions (update view or quit).
 */
async function viewMinerSummary() {
    const ws = new ws_1.default(exports.WS_URL);
    const messageBuilder = new MessageBuilder(exports.API_KEY);
    const miners = new Map();
    ws.on("open", () => {
        (0, print_1.printMessageLinesBorderBox)(["Connected to WebSocket endpoint"], borderboxstyles_1.magmaStyle);
        messageBuilder.sendMessages(ws, messageBuilder.joinMessages());
    });
    ws.on("message", (data) => {
        let messageStr;
        if (typeof data === "string")
            messageStr = data;
        else if (Buffer.isBuffer(data))
            messageStr = data.toString("utf8");
        else if (data instanceof ArrayBuffer)
            messageStr = Buffer.from(data).toString("utf8");
        else if (Array.isArray(data))
            messageStr = Buffer.concat(data).toString("utf8");
        else
            return;
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
                const miner = miners.get(minerId);
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
        }
        catch (error) {
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
        const table = new cli_table3_1.default({
            head: [
                chalk_1.default.yellow("Rank"),
                chalk_1.default.yellow("Miner ID"),
                chalk_1.default.yellow("Claimed"),
                chalk_1.default.yellow("Unclaimed"),
                chalk_1.default.yellow("Hashes"),
                chalk_1.default.yellow("Boost"),
                chalk_1.default.yellow("Status"),
                chalk_1.default.yellow("Last Active")
            ],
            style: { head: ["yellow"], border: ["red"] },
            colWidths: [6, 20, 12, 12, 10, 10, 12, 15]
        });
        sortedMiners.forEach(([minerId, data], index) => {
            const timeSinceLast = Math.floor((Date.now() - data.lastActive.getTime()) / 1000);
            table.push([
                chalk_1.default.yellow(index + 1),
                chalk_1.default.yellow((0, print_1.shortenString)(minerId, 18)),
                chalk_1.default.yellow((0, helpers_1.formatKMB)(data.rewards)),
                chalk_1.default.yellow((0, helpers_1.formatKMB)(data.unclaimedRewards)),
                chalk_1.default.yellow(data.hashes.toString()),
                chalk_1.default.yellow(data.lastBoost.toFixed(1)),
                chalk_1.default.yellow(data.status),
                chalk_1.default.yellow(`${timeSinceLast}s ago`)
            ]);
        });
        (0, print_1.printMessageLinesBorderBox)([
            `Top ${TOP_MINERS_COUNT} Miners by Highest Claimed/Unclaimed - Updated ${new Date().toLocaleTimeString()}`,
            `Total Claimed Rewards: ${(0, helpers_1.formatKMB)(totalRewards)}`,
            `Total Unclaimed Rewards: ${(0, helpers_1.formatKMB)(totalUnclaimed)}`,
            `Total Hashes: ${totalHashes}`,
            `Tracked Miners: ${trackedMiners}`
        ], borderboxstyles_1.magmaStyle);
        console.log(table.toString());
        console.log("\n");
    }
    // Wait a bit for data accumulation then display summary.
    await new Promise((res) => setTimeout(res, 5000));
    await displaySummary();
    // Prompt the user for an action (update view or quit).
    async function promptExitOrUpdate() {
        while (true) {
            const { action } = await inquirer_1.default.prompt([
                {
                    type: "list",
                    name: "action",
                    message: "Select an action:",
                    choices: ["Update view", "Quit"],
                },
            ]);
            if (action === "Quit") {
                ws.close();
                await new Promise((resolve) => ws.on("close", resolve));
                (0, print_1.printMessageLinesBorderBox)([`WebSocket Closed`], borderboxstyles_1.magmaStyle);
                break;
            }
            else if (action === "Update view") {
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
async function viewLiveMiner(passedAddress) {
    // Prompt user for miner address if not passed.
    let chosenAddress;
    if (!passedAddress) {
        const { manualAddress } = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "manualAddress",
                message: chalk_1.default.bold.green("Enter the miner address (key or sig) to view live stats:"),
                validate: (value) => value.trim().length > 0 || "Please enter a valid address",
            },
        ]);
        chosenAddress = manualAddress;
    }
    else {
        chosenAddress = passedAddress;
    }
    const searchAddress = chosenAddress.toLowerCase();
    const messageBuilder = new MessageBuilder(exports.API_KEY);
    const miners = new Map();
    let lastDisplayedState = "";
    let shouldReconnect = true;
    let heartbeatIntervalId;
    let reconnectTimeoutId;
    let ws;
    // Establish and manage the WebSocket connection.
    function connectWs() {
        ws = new ws_1.default(exports.WS_URL);
        ws.on("open", () => {
            (0, print_1.printMessageLinesBorderBox)(["Connected to WebSocket endpoint"], borderboxstyles_1.magmaStyle);
            messageBuilder.sendMessages(ws, messageBuilder.joinMessages());
            heartbeatIntervalId = setInterval(() => {
                if (ws.readyState === ws_1.default.OPEN) {
                    ws.send(JSON.stringify(messageBuilder.phoenixHeartbeat(0)));
                }
            }, exports.HEARTBEAT_INTERVAL);
        });
        ws.on("message", (data) => {
            var _a, _b;
            let messageStr;
            if (typeof data === "string") {
                messageStr = data;
            }
            else if (Buffer.isBuffer(data)) {
                messageStr = data.toString("utf8");
            }
            else if (data instanceof ArrayBuffer) {
                messageStr = Buffer.from(data).toString("utf8");
            }
            else if (Array.isArray(data)) {
                messageStr = Buffer.concat(data).toString("utf8");
            }
            else {
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
                    if (minerId === searchAddress ||
                        ((_a = responseMessage.key) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === searchAddress ||
                        ((_b = responseMessage.sig) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === searchAddress) {
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
                        const miner = miners.get(minerId);
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
            }
            catch (error) {
                console.error("Error parsing message:", error);
            }
        });
        ws.on("close", () => {
            console.log(chalk_1.default.red("WebSocket connection closed."));
            clearInterval(heartbeatIntervalId);
            if (shouldReconnect) {
                console.log(chalk_1.default.yellow("Attempting to reconnect in 5 seconds..."));
                reconnectTimeoutId = setTimeout(() => {
                    connectWs();
                }, 5000);
            }
        });
        ws.on("error", (err) => {
            console.error(chalk_1.default.red("WebSocket error:"), err);
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
        if (newStateString === lastDisplayedState)
            return;
        lastDisplayedState = newStateString;
        // Build and display a summary table.
        const table = new cli_table3_1.default({
            head: [chalk_1.default.yellow("Field"), chalk_1.default.yellow("Value")],
            style: { head: ["yellow"], border: ["red"] },
            colWidths: [20, 42],
        });
        table.push(["Miner ID", chalk_1.default.yellow((0, print_1.shortenString)(minerId, 18))], ["Key", chalk_1.default.yellow((0, print_1.shortenString)(miner.key || "N/A", 18))], ["Signature", chalk_1.default.yellow((0, print_1.shortenString)(miner.sig || "N/A", 18))], ["Claimed Rewards", chalk_1.default.yellow((0, helpers_1.formatKMB)(miner.rewards))], ["Unclaimed Rewards", chalk_1.default.yellow((0, helpers_1.formatKMB)(miner.unclaimedRewards))], ["Hashes", chalk_1.default.yellow(miner.hashes.toString())], ["Last Boost", chalk_1.default.yellow(miner.lastBoost.toFixed(1))], ["Status", chalk_1.default.yellow(miner.status)]);
        (0, print_1.printMessageLinesBorderBox)([
            `🔍 Live Stats for Miner: ${(0, print_1.shortenString)(chosenAddress, 18)} - ${new Date().toLocaleTimeString()}`
        ], borderboxstyles_1.magmaStyle);
        console.log(table.toString());
    }, updateInterval);
    // Listen for user input to quit the live view.
    (0, print_1.printMessageLinesBorderBox)(["Press 'Q' to quit live view."], borderboxstyles_1.magmaStyle);
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
            (0, print_1.printMessageLinesBorderBox)([`WebSocket Closed`], borderboxstyles_1.magmaStyle);
            process.exit(0);
        }
    });
    // Keep the function running indefinitely.
    await new Promise(() => { });
}

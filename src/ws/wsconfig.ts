import * as fs from "fs";
import * as path from "path";


// Load configuration
const configPath = path.join(__dirname, "../../config/miningconfig.json");
const config: {
  wss: string;
  apiKey: string;
  heartbeatInterval?: number;
  maxReconnectDelay?: number;
  activeMiningTimeout?: number;
  requiredActiveMiners?: number;
  activityThresholdSeconds?: number;
} = JSON.parse(fs.readFileSync(configPath, "utf8"));

export const WS_URL: string = config.wss;
export const API_KEY: string = config.apiKey;
export const HEARTBEAT_INTERVAL: number = config.heartbeatInterval || 30000;
export const MAX_RECONNECT_DELAY: number = config.maxReconnectDelay || 10000;
export const TIMEOUT_MS: number = config.activeMiningTimeout || 30000;
export const REQUIRED_ACTIVE_MINERS: number = config.requiredActiveMiners || 5;
export const ACTIVITY_THRESHOLD_SECONDS: number = config.activityThresholdSeconds || 60;
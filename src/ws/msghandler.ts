// msghandler.ts

import { Data } from "ws";
import { ResponseMessage, MinerStats } from "./websocket";

export type MessageFilterFn = (responseMessage: ResponseMessage) => boolean;
export const defaultFilter: MessageFilterFn = () => true;

export class MinerStore {
  miners = new Map<string, MinerStats>();
  sigIndex = new Map<string, string>();
  pendingSigMessages = new Map<string, ResponseMessage[]>();

  getMiner(identifier: string) {
    const lowerId = identifier.toLowerCase();
    if (this.miners.has(lowerId)) {
      return this.miners.get(lowerId);
    }
    const sig = this.sigIndex.get(lowerId);
    return sig ? this.miners.get(sig) : undefined;
  }

  clearMiners() {
    this.miners.clear();
    this.sigIndex.clear();
    this.pendingSigMessages.clear();
  }

  updateMiners = (data: Data, filterFn: MessageFilterFn = defaultFilter) => {
    const messageStr = data.toString();
    if (!messageStr) return;
    try {
      const msg = JSON.parse(messageStr);
      msg._timestamp = new Date();
      const responseMessage = new ResponseMessage(msg);
      responseMessage.msg._hash = responseMessage.classify();

      if (!responseMessage.key && !responseMessage.sig) return;

      let primaryId: string | undefined;
      let miner: MinerStats | undefined;

      if (responseMessage.sig) {
        const sigLower = responseMessage.sig.toLowerCase();
        primaryId =
          responseMessage.key?.toLowerCase() || this.sigIndex.get(sigLower);

        if (primaryId) {
          miner = this.miners.get(primaryId);
          if (!miner) {
            miner = {
              key: primaryId,
              sig: responseMessage.sig,
              rewards: 0,
              unclaimedRewards: 0,
              hashes: 0,
              lastBoost: 0,
              lastActive: new Date(),
              status: "ACTIVE",
              hasRecentClaim: false,
            };
            this.miners.set(primaryId, miner);
          } else if (!miner.sig) {
            miner.sig = responseMessage.sig;
          }
        } else if (!responseMessage.key) {
          // Queue if no key and no known primaryId
          if (!this.pendingSigMessages.has(sigLower)) {
            this.pendingSigMessages.set(sigLower, []);
          }
          this.pendingSigMessages.get(sigLower)!.push(responseMessage);
          return;
        }
      }

      if (!primaryId && responseMessage.key) {
        primaryId = responseMessage.key.toLowerCase();
        miner = this.miners.get(primaryId);
        if (!miner) {
          miner = {
            key: responseMessage.key?.toLowerCase() || null,
            sig: responseMessage.sig?.toLowerCase() || null,
            rewards: 0,
            unclaimedRewards: 0,
            hashes: 0,
            lastBoost: 0,
            lastActive: new Date(),
            status: "ACTIVE",
            hasRecentClaim: false,
          };
          this.miners.set(primaryId, miner);
        }
      }

      if (responseMessage.sig && primaryId) {
        const sigLower = responseMessage.sig.toLowerCase();
        this.sigIndex.set(sigLower, primaryId);
        if (this.pendingSigMessages.has(sigLower)) {
          const pendingMsgs = this.pendingSigMessages.get(sigLower)!;
          pendingMsgs.forEach((pendingMsg) => {
            if (filterFn(pendingMsg)) {
              this.processMessage(pendingMsg, miner!);
            }
          });
          this.pendingSigMessages.delete(sigLower);
        }
      }

      if (filterFn(responseMessage) && miner) {
        this.processMessage(responseMessage, miner);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };

  processMessage(responseMessage: ResponseMessage, miner: MinerStats) {
    const classification = responseMessage.classify();

    switch (classification) {
      case "valid|joining|state":
        miner.unclaimedRewards = responseMessage.reward;
        miner.status = "JOINING";
        break;
      case "valid|running|valid":
        miner.unclaimedRewards = Math.max(
          miner.unclaimedRewards,
          responseMessage.reward
        );
        miner.status = "RUNNING";
        break;
      case "valid|mining|valid":
        miner.unclaimedRewards = Math.max(
          miner.unclaimedRewards,
          responseMessage.reward
        );
        miner.status = "MINING";
        break;
      case "work|unknown|peer_hash_validation":
        miner.hashes += 1;
        miner.status = "WORKING";
        break;
      case "work|unknown|peerjoin":
        miner.hashes += 1;
        miner.status = "JOINING";
        break;
      case "claim|unknown|claim":
        miner.status = "CLAIMING";
        break;
      case "valid|claiming|valid":
        miner.rewards += responseMessage.reward || 0 || miner.unclaimedRewards;
        miner.unclaimedRewards = 0;
        miner.status = "CLAIMED";
        miner.hasRecentClaim = true;
        break;
      case "valid|expired|valid":
        miner.status = "EXPIRED";
        miner.unclaimedRewards = 0;
        break;
      case "valid|slashing|valid":
        miner.status = "SLASHED";
        miner.unclaimedRewards = 0;
        break;
      default:
        console.warn(
          `Unhandled message classification: ${classification} for key: ${
            miner.key || "unknown"
          }`
        );
        break;
    }
  }
}

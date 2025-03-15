// magmaviewer.ts 

import chalk from "chalk";
import Table from "cli-table3";
import inquirer from "inquirer";
import { printMessageLinesBorderBox, shortenString } from "./print";
import { magmaStyle, miningStyle } from "./styles/borderboxstyles";
import { formatKMB } from "../utils/helpers";
import { MinerStats } from "../ws/websocket"; // Import MinerStats
import { printTable } from "./tables/printtable";

export class MinerViewUi {
  printWsConnected() {
    printMessageLinesBorderBox(["Connected to WebSocket endpoint"], magmaStyle);
  }

  printWsClosed() {
    printMessageLinesBorderBox([`WebSocket Closed`], magmaStyle);
  }

  printReconnect() {
    console.log(chalk.yellow("Attempting to reconnect in 5 seconds..."));
  }

  printCheckActiveMining(
    activeCount: number,
    activityThresholdSeconds: number,
    hasRecentClaim: boolean
  ) {
    printMessageLinesBorderBox(
      [
        `👥 Detected ${activeCount} active miners (Hashes > 0 or Unclaimed > 0 within ${activityThresholdSeconds}s), Recent Claim: ${
          hasRecentClaim ? "Yes" : "No"
        }`,
      ],
      miningStyle
    );
  }

  printMinerSummary(miners: Map<string, MinerStats>) {
    const TOP_MINERS_COUNT = 20;
    const sortedMiners = Array.from(miners.entries())
      .sort((a, b) => {
        const aMax = Math.max(a[1].rewards, a[1].unclaimedRewards);
        const bMax = Math.max(b[1].rewards, b[1].unclaimedRewards);
        return bMax - aMax;
      })
      .slice(0, TOP_MINERS_COUNT);

    const totalRewards = Array.from(miners.values()).reduce(
      (sum, miner) => sum + miner.rewards,
      0
    );
    const totalUnclaimed = Array.from(miners.values()).reduce(
      (sum, miner) => sum + miner.unclaimedRewards,
      0
    );
    const totalHashes = Array.from(miners.values()).reduce(
      (sum, miner) => sum + miner.hashes,
      0
    );
    const trackedMiners = miners.size;

    const data = sortedMiners.map(([_, data], index) => {
      const timeSinceLast = Math.floor(
        (Date.now() - data.lastActive.getTime()) / 1000
      );
      return [
        (index + 1).toString(),
        shortenString(data.sig || "N/A", 18),
        shortenString(data.key || "N/A", 18),
        formatKMB(data.rewards),
        formatKMB(data.unclaimedRewards),
        data.hashes.toString(),
        data.lastBoost.toFixed(1),
        data.status,
        `${timeSinceLast}s ago`,
      ];
    });

    printMessageLinesBorderBox(
      [
        `Top ${TOP_MINERS_COUNT} Miners by Highest Claimed or Unclaimed - Updated ${new Date().toLocaleTimeString()}`,
        `Total Claimed Rewards: ${formatKMB(totalRewards)}`,
        `Total Unclaimed Rewards: ${formatKMB(totalUnclaimed)}`,
        `Total Hashes: ${totalHashes}`,
        `Tracked Miners: ${trackedMiners}`,
      ],
      magmaStyle
    );
    printTable(data, {
      header: [
        "Rank",
        "Signature",
        "Key",
        "Claimed",
        "Unclaimed",
        "#",
        "Boost",
        "Status",
        "Active",
      ],
      colWidths: [6, 15, 15, 12, 12, 6, 10, 12, 10],
      headColor: ["yellow"],
      borderColor: ["red"],
    });
    console.log("\n");
  }

  printLiveMiner(miner: MinerStats) {
    const tableData = [
      { Field: "Miner ID", Value: shortenString(miner.key || "N/A", 4, 4) },
      { Field: "Key", Value: miner.key || "N/A" },
      { Field: "Signature", Value: shortenString(miner.sig || "N/A", 4, 4) },
      { Field: "Claimed Amount", Value: miner.rewards.toString() },
      { Field: "Unclaimed Amount", Value: formatKMB(miner.unclaimedRewards) },
      { Field: "Hashes", Value: miner.hashes.toString() },
      { Field: "Last Boost", Value: miner.lastBoost.toFixed(1) },
      { Field: "Status", Value: miner.status },
      { Field: "Last Active", Value: miner.lastActive.toLocaleTimeString() },
    ];
    printTable(tableData, {
      title: `🔍 Live Stats for Miner: ${shortenString(
        miner.key || "N/A",
        4,
        4
      )} - ${new Date().toLocaleTimeString()}`,
    });
  }

  async promptUpdateOrQuit() {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Select an action:",
        choices: ["Update view", "Quit"],
      },
    ]);
    return action;
  }

  async promptMinerAddress(passedAddress?: string) {
    let chosenAddress: string;
    if (!passedAddress) {
      const { manualAddress } = await inquirer.prompt([
        {
          type: "input",
          name: "manualAddress",
          message: chalk.bold.green(
            "Enter the miner address (key or sig) to view live stats:"
          ),
          validate: (value) =>
            value.trim().length > 0 || "Please enter a valid address",
        },
      ]);
      chosenAddress = manualAddress;
    } else {
      chosenAddress = passedAddress;
    }
    return chosenAddress;
  }

  async promptQtoQuit() {
    return new Promise<void>((resolve) => {
      printMessageLinesBorderBox(["Press 'Q' to quit live view."], magmaStyle);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", (chunk) => {
        const key = chunk.toString().toLowerCase();
        if (key === "q") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          printMessageLinesBorderBox([`WebSocket Closed`], magmaStyle);
          resolve();
        }
      });
    });
  }
}

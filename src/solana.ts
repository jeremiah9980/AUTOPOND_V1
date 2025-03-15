// solana.ts
// This module handles the swapping logic for the Pond0x platform and provides on‐chain helper functions.
// It interacts with Solana using @solana/web3.js and uses Puppeteer for browser automation.
// Console output is styled using chalk and tables are generated using cli-table3.

import { Page } from "puppeteer";
import { Connection, PublicKey } from "@solana/web3.js";
import chalk from "chalk";
import Table from "cli-table3";
import { printMessageLinesBorderBox, shortenString } from "./ui/print";
import { generalStyle, swappingStyle } from "./ui/styles/borderboxstyles";
import { loadSolanaConfig } from "./utils/configloader";
import { printTable } from "./ui/tables/printtable";

const solanaConfig = loadSolanaConfig();
const RPC_ENDPOINT = solanaConfig.rpcEndpoint;

/**
 * getPhantomPublicKey - Ensures that the Phantom wallet is connected by triggering its connection flow.
 * It then returns the connected wallet's public key as a string.
 *
 * @param page - The Puppeteer Page object representing the browser window.
 * @returns The connected Phantom wallet's public key.
 * @throws An error if the public key is not found.
 */
export async function getPhantomPublicKey(page: Page): Promise<string> {
  const pubKey = await page.evaluate(async () => {
    if (window.solana && window.solana.isPhantom) {
      await window.solana.connect();
      return window.solana.publicKey?.toString() || null;
    }
    return null;
  });
  if (!pubKey) {
    throw new Error(
      "Phantom public key not found. Ensure the wallet is connected."
    );
  }
  return pubKey;
}

/**
 * getSolBalance - Retrieves the SOL balance for a given public key.
 *
 * @param pubKeyString - The public key as a string.
 * @returns The SOL balance (converted from lamports to SOL).
 */
export async function getSolBalance(pubKeyString: string): Promise<number> {
  const connection = new Connection(RPC_ENDPOINT);
  const pubKey = new PublicKey(pubKeyString);
  const lamports = await connection.getBalance(pubKey);
  return lamports / 1e9;
}

/**
 * getSplBalance - Retrieves the balance for a specified SPL token in a given wallet.
 *
 * @param pubKeyString - The wallet's public key as a string.
 * @param tokenMintString - The token mint address as a string.
 * @returns The total balance of the specified SPL token.
 */
export async function getSplBalance(
  pubKeyString: string,
  tokenMintString: string
): Promise<number> {
  const connection = new Connection(RPC_ENDPOINT);
  const walletPubKey = new PublicKey(pubKeyString);
  const tokenMint = new PublicKey(tokenMintString);
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletPubKey,
    { mint: tokenMint }
  );
  let totalBalance = 0;
  for (const tokenAccount of tokenAccounts.value) {
    const tokenAmount = tokenAccount.account.data.parsed?.info?.tokenAmount;
    if (tokenAmount && tokenAmount.uiAmount != null) {
      totalBalance += tokenAmount.uiAmount;
    }
  }
  return totalBalance;
}

export async function getSplTokenDecimals(
  mintAddress: string,
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com",
  defaultDecimals: number = 6
): Promise<number> {
  const connection = new Connection(rpcEndpoint, "confirmed");
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const accountInfo = await connection.getAccountInfo(mintPublicKey);
    if (!accountInfo || !accountInfo.data || accountInfo.data.length < 45) {
      console.warn(
        `Invalid or missing mint account data for ${mintAddress}. Falling back to ${defaultDecimals} decimals.`
      );
      return defaultDecimals;
    }
    return accountInfo.data.readUInt8(44);
  } catch (error) {
    console.error(`Failed to fetch decimals for ${mintAddress}:`, error);
    return defaultDecimals;
  }
}

export function getNetTokenChange(
  parsedTx: any,
  token: string,
  tokenMint?: string,
  walletAddress?: string
): number {
  if (token.toUpperCase() === "SOL" || !tokenMint) {
    const pre = parsedTx.meta.preBalances[0] / 1e9;
    const post = parsedTx.meta.postBalances[0] / 1e9;
    return post - pre;
  } else {
    const preTokens = parsedTx.meta.preTokenBalances.filter(
      (t: any) =>
        t.mint.toUpperCase() === tokenMint.toUpperCase() &&
        (!walletAddress ||
          t.owner.toUpperCase() === walletAddress.toUpperCase())
    );
    const postTokens = parsedTx.meta.postTokenBalances.filter(
      (t: any) =>
        t.mint.toUpperCase() === tokenMint.toUpperCase() &&
        (!walletAddress ||
          t.owner.toUpperCase() === walletAddress.toUpperCase())
    );
    const preSum = preTokens.reduce(
      (acc: number, t: any) => acc + Number(t.uiTokenAmount.uiAmount),
      0
    );
    const postSum = postTokens.reduce(
      (acc: number, t: any) => acc + Number(t.uiTokenAmount.uiAmount),
      0
    );
    return postSum - preSum;
  }
}

export async function parseReferralFeeFromTx(
  parsedTx: any,
  tokenAMint: string | undefined,
  tokenBMint: string | undefined,
  inputSymbol: string,
  outputSymbol: string,
  inputDecimals: number,
  outputDecimals: number,
  rpcEndpoint: string = "https://api.mainnet-beta.solana.com"
): Promise<{ fee: number; label: string }> {
  const TOKEN_PROGRAM_ID = "TOKENKEGQFEZYINWAJBNBGKPFXCWUBVF9SS623VQ5DA";
  const MIN_REFERRAL_FEE = 1000;
  let candidateTransfers: { amount: number; mint?: string }[] = [];

  if (parsedTx.meta.innerInstructions) {
    for (const inner of parsedTx.meta.innerInstructions) {
      for (const instr of inner.instructions) {
        if (instr.parsed && instr.parsed.type === "transfer") {
          const pid = instr.programId.toString().toUpperCase();
          if (pid === TOKEN_PROGRAM_ID) {
            const amt = parseInt(instr.parsed.info.amount, 10);
            if (amt >= MIN_REFERRAL_FEE) {
              candidateTransfers.push({
                amount: amt,
                mint: instr.parsed.info.mint,
              });
            }
          }
        }
      }
    }
  }

  if (candidateTransfers.length === 0) {
    return { fee: 0, label: "Referral Fee" };
  }

  const minTransfer = candidateTransfers.reduce((min, curr) =>
    curr.amount < min.amount ? curr : min
  );
  const feeMint = minTransfer.mint?.toUpperCase();

  let referralFee: number;
  let referralFeeLabel: string;

  if (feeMint && feeMint === tokenAMint?.toUpperCase()) {
    referralFee = minTransfer.amount / 10 ** inputDecimals;
    referralFeeLabel = `Referral Fee (${inputSymbol})`;
  } else if (feeMint && feeMint === tokenBMint?.toUpperCase()) {
    referralFee = minTransfer.amount / 10 ** outputDecimals;
    referralFeeLabel = `Referral Fee (${outputSymbol})`;
  } else {
    referralFee = minTransfer.amount / 1e9;
    referralFeeLabel = "Referral Fee (SOL)";
    if (minTransfer.mint) {
      console.log(
        chalk.yellow(
          `Unrecognized referral fee mint ${minTransfer.mint}; assuming SOL.`
        )
      );
    }
  }

  return { fee: referralFee, label: referralFeeLabel };
}

/**
 * getParsedTransactionWithRetry - Attempts to retrieve a parsed transaction with retry logic.
 *
 * @param connection - The Solana connection object.
 * @param signature - The transaction signature.
 * @param retries - The maximum number of retries (default is 5).
 * @returns The parsed transaction object.
 * @throws An error if the transaction cannot be fetched after the given retries.
 */
async function getParsedTransactionWithRetry(
  connection: Connection,
  signature: string,
  retries: number = 5
): Promise<any> {
  let delayMs = 500;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await connection.getParsedTransaction(signature);
    } catch (err: any) {
      if (err.message && err.message.includes("429")) {
        printMessageLinesBorderBox(
          [`Server responded with 429. Retrying after ${delayMs}ms...`],
          generalStyle
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
      } else {
        throw err;
      }
    }
  }
  throw new Error(
    `Failed to fetch parsed transaction for signature ${signature} after ${retries} retries.`
  );
}

/**
 * checkRecentWpondTransfer - Checks for a recent WPOND transfer (swap reward activity) from the rewards wallet.
 *
 * It uses the time threshold to filter transactions, then prints a summary table of the activity.
 *
 * @returns True if at least one transaction passed validation; otherwise, false.
 */
export async function checkRecentWpondTransfer(): Promise<boolean> {
  const rewardsWalletAddress = solanaConfig.rewardsWalletAddress;
  const wpondTokenMint = solanaConfig.wpondTokenMint;
  const discountWalletAddresses = solanaConfig.discountWalletAddresses;
  const timeThresholdSeconds = solanaConfig.wpondTransferTimeThreshold;

  printMessageLinesBorderBox(
    ["=== Checking for recent WPOND transfer ==="],
    swappingStyle
  );

  const details = {
    "Rewards wallet address": rewardsWalletAddress,
    "WPOND token mint": wpondTokenMint,
    "Discount wallet addresses": discountWalletAddresses.join(", "),
    "Time threshold (sec)": timeThresholdSeconds,
  };
  printTable("Swap Rewards Check Details", details);

  const connection = new Connection(RPC_ENDPOINT);
  const rewardsWalletPubkey = new PublicKey(rewardsWalletAddress);

  printMessageLinesBorderBox(
    ["Fetching recent signatures for rewards wallet (limit 5)..."],
    swappingStyle
  );
  const signatures = await connection.getSignaturesForAddress(
    rewardsWalletPubkey,
    { limit: 5 }
  );
  const currentTime = Math.floor(Date.now() / 1000);
  printMessageLinesBorderBox(
    [`Current time (sec): ${currentTime}`],
    swappingStyle
  );
  const rangeStart = currentTime - timeThresholdSeconds;
  printMessageLinesBorderBox(
    [`Valid time range (sec): ${rangeStart} - ${currentTime}`],
    swappingStyle
  );

  const txSummaries: Array<{
    Signature: string;
    BlockTime: number;
    Amount?: string;
    Source?: string;
    Destination?: string;
    "WPOND Present"?: string;
    Status: string;
  }> = [];

  for (const sigInfo of signatures) {
    if (sigInfo.blockTime) {
      const shortSig = shortenString(sigInfo.signature);
      const summary: {
        Signature: string;
        BlockTime: number;
        Amount?: string;
        Source?: string;
        Destination?: string;
        "WPOND Present"?: string;
        Status: string;
      } = {
        Signature: shortSig,
        BlockTime: sigInfo.blockTime,
        Status: "",
      };
      if (currentTime - sigInfo.blockTime <= timeThresholdSeconds) {
        try {
          const parsedTx = await getParsedTransactionWithRetry(
            connection,
            sigInfo.signature
          );
          let valid = false;
          let amount = "";
          let src = "";
          let dest = "";
          if (parsedTx && parsedTx.meta && parsedTx.transaction.message) {
            for (const instruction of parsedTx.transaction.message
              .instructions) {
              if ("parsed" in instruction) {
                const parsedInstruction = instruction.parsed;
                if (
                  (parsedInstruction.type === "transfer" ||
                    parsedInstruction.type === "transferChecked") &&
                  parsedInstruction.info.mint
                ) {
                  const info = parsedInstruction.info;
                  if (
                    info.mint === wpondTokenMint &&
                    !discountWalletAddresses.includes(info.destination)
                  ) {
                    valid = true;
                    amount = info.amount;
                    src = info.source;
                    dest = info.destination;
                    break;
                  }
                }
              }
            }
          }
          summary.Status = valid
            ? chalk.bgGreen.bold("Pass")
            : chalk.bgRed.bold("Fail");
          if (valid) {
            summary.Amount = amount;
            summary.Source = shortenString(src);
            summary.Destination = shortenString(dest);
            summary["WPOND Present"] = "Yes";

            // Print the full transaction signature and Solscan link in magenta.
            const solscanUrl = `https://solscan.io/tx/${sigInfo.signature}`;
            printMessageLinesBorderBox(
              [
                `Swap TX Number: ${sigInfo.signature}`,
                `Swap TX Link: ${solscanUrl}`,
              ],
              swappingStyle
            );
          } else {
            summary["WPOND Present"] = "No";
          }
        } catch (e) {
          summary.Status = chalk.bgRed.bold("Error");
        }
      } else {
        summary.Status = chalk.bgRed.bold("Outdated");
      }
      txSummaries.push(summary);
    }
  }

  if (txSummaries.length > 0) {
    console.log(chalk.magenta.yellow("\n=== Recent Swap Reward Activity ==="));
    const summaryTable = new Table({
      head: [
        chalk.bold("Signature"),
        chalk.bold("BlockTime"),
        chalk.bold("Amount"),
        chalk.bold("Source"),
        chalk.bold("Destination"),
        chalk.bold("WPOND Present"),
        chalk.bold("Status"),
      ],
      style: { head: ["cyan"], border: ["green"] },
      colWidths: [15, 12, 10, 15, 15, 12, 10],
    });
    txSummaries.forEach((tx) => {
      summaryTable.push([
        tx.Signature,
        String(tx.BlockTime),
        tx.Amount ? tx.Amount : "N/A",
        tx.Source ? tx.Source : "N/A",
        tx.Destination ? tx.Destination : "N/A",
        tx["WPOND Present"] ? tx["WPOND Present"] : "N/A",
        tx.Status,
      ]);
    });
    console.log(summaryTable.toString());
    return txSummaries.some((tx) => tx.Status.toString().includes("Pass"));
  }

  printMessageLinesBorderBox(
    ["No recent valid WPOND transfer detected. ❌"],
    swappingStyle
  );
  return false;
}

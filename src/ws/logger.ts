// logger.ts
import { appendFile } from "fs/promises";

export async function logRawDataWithFormat(data: unknown): Promise<void> {
  let rawStr: string;
  let format: string;

  if (Buffer.isBuffer(data)) {
    format = "Buffer";
    rawStr = data.toString("hex"); // or choose 'base64'
  } else if (typeof data === "string") {
    format = "string";
    rawStr = data;
  } else if (data instanceof ArrayBuffer) {
    format = "ArrayBuffer";
    rawStr = Buffer.from(data).toString("hex");
  } else if (Array.isArray(data)) {
    // Check if it's an array of Buffers
    if (data.every((item) => Buffer.isBuffer(item))) {
      format = "Array of Buffers";
      rawStr = Buffer.concat(data as Buffer[]).toString("hex");
    } else {
      format = "Array (mixed types)";
      rawStr = JSON.stringify(data);
    }
  } else {
    format = "unknown";
    rawStr = JSON.stringify(data);
  }

  const logEntry = `Format: ${format} | Raw Data: ${rawStr}\n`;
  try {
    await appendFile("rawMessages.log", logEntry);
  } catch (err) {
    console.error("Failed to log raw data:", err);
  }
}

export async function logConvertedMessage(message: string): Promise<void> {
  const logEntry = `Format: string | Converted Data: ${message}\n`;
  await appendFile("rawMessages.log", logEntry);
}

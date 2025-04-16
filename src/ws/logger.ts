// logger.ts
import { appendFile } from "fs/promises";

export async function logData(
  label: string,
  data: unknown,
  logFile: string = "rawMessages.log"
): Promise<void> {
  let rawStr: string;
  let format: string;

  if (Buffer.isBuffer(data)) {
    format = "Buffer";
    rawStr = data.toString("hex");
  } else if (typeof data === "string") {
    format = "string";
    rawStr = data;
  } else if (data instanceof ArrayBuffer) {
    format = "ArrayBuffer";
    rawStr = Buffer.from(data).toString("hex");
  } else if (Array.isArray(data)) {
    format = "Array (mixed)";
    rawStr = JSON.stringify(data);
  } else {
    format = typeof data;
    rawStr = JSON.stringify(data);
  }

  const logEntry = `[${new Date().toISOString()}] Label: ${label} | Format: ${format} | Data: ${rawStr}\n`;

  try {
    await appendFile(logFile, logEntry);
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}

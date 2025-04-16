// launch.ts
import puppeteer, { Page } from "puppeteer";
import path from "path";
import * as dotenv from "dotenv";
import { evalPhan } from "./phantom";
import { printMessageLinesBorderBox } from "./ui/print"; // Using our unified print function
import { phantomStyle } from "./ui/styles/borderboxstyles";
import { AppConfig } from "./types/config";
import { d } from "./utils/helpers";
dotenv.config();

const pathToExtension = path.join(process.cwd(), process.env.EXTNS!);

/**
 * Repositions the browser window to the specified bounds.
 */
async function repositionWindow(
  page: Page,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  const client = await page.target().createCDPSession();
  const { windowId } = await client.send("Browser.getWindowForTarget");
  await client.send("Browser.setWindowBounds", {
    windowId,
    bounds: { left: x, top: y, width, height, windowState: "normal" },
  });
}

/**
 * launchBrowser:
 *  - Launches the browser with the Phantom extension.
 *  - Waits for the onboarding page.
 *  - Retrieves screen dimensions from the page.
 *  - Repositions the window to the right half of the screen (50% width, full height).
 *  - Initializes the Phantom wallet.
 */
export async function launchBrowser(config: AppConfig, method: any) {
  // Print a magenta-themed launch message.
  printMessageLinesBorderBox(
    ["🚀 Launching browser with Phantom extension..."],
    phantomStyle
  );

  const options = {
    headless: false,
    defaultViewport: null,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      "--start-minimized", // Start minimized so we can reposition later.
    ],
  };

  const browser = await puppeteer.launch(options);

  // Wait for the extension’s service worker.
  const workerTarget = await browser.waitForTarget(
    (target) => target.type() === "service_worker"
  );
  await workerTarget.worker();

  // Wait for the Phantom onboarding page.
  const popupTarget = await browser.waitForTarget(
    (target) =>
      target.type() === "page" && target.url().endsWith("onboarding.html")
  );
  const popupPage = await popupTarget.asPage();

  d(250);

  // Retrieve screen dimensions from within the page.
  const screenSize = await popupPage.evaluate(() => ({
    width: window.screen.width,
    height: window.screen.height,
  }));

  d(290);

  // Calculate dimensions for the right half (50% width, full height).
  const rightPanelWidth = Math.floor(screenSize.width / 2);
  const xPosition = screenSize.width - rightPanelWidth; // Position on the right side

  d(200);

  // Reposition the browser window.
  await repositionWindow(
    popupPage,
    xPosition,
    0,
    rightPanelWidth,
    screenSize.height
  );

  // Initialize Phantom (which may close the onboarding page)
  await evalPhan(popupPage, config, method);

  // Print a status message for loading extensions.
  printMessageLinesBorderBox(["🌎 Browser configured"], phantomStyle);

  return { browser, popupPage };
}

/**
 * @file launch.ts
 * @description Launches the browser with the Phantom extension.
 * It waits for the onboarding page, retrieves screen dimensions, repositions the browser window
 * to the right half of the screen, and initializes the Phantom wallet.
 */

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
 *
 * @param page - The Puppeteer page instance.
 * @param x - The x-coordinate for the window's top-left corner.
 * @param y - The y-coordinate for the window's top-left corner.
 * @param width - The desired window width.
 * @param height - The desired window height.
 */
async function repositionWindow(
  page: Page,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  // Create a Chrome DevTools Protocol session for the page.
  const client = await page.target().createCDPSession();
  // Retrieve the windowId for the current target.
  const { windowId } = await client.send("Browser.getWindowForTarget");
  // Set the new window bounds.
  await client.send("Browser.setWindowBounds", {
    windowId,
    bounds: { left: x, top: y, width, height, windowState: "normal" },
  });
}

/**
 * Launches the browser with the Phantom extension and initializes Phantom.
 *
 * @param config - The application configuration.
 * @param method - The method to use for Phantom initialization.
 * @returns A promise resolving to an object containing the browser and the onboarding page.
 */
export async function launchBrowser(config: AppConfig, method: any) {
  // Print a launch message using a Phantom-themed style.
  printMessageLinesBorderBox(
    ["🚀 Launching browser with Phantom extension..."],
    phantomStyle
  );

  // Puppeteer launch options with the Phantom extension loaded.
  const options = {
    headless: false,
    defaultViewport: null,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      "--start-minimized", // Start minimized so that we can reposition later.
    ],
  };

  const browser = await puppeteer.launch(options);

  // Wait for the extension's service worker to be active.
  const workerTarget = await browser.waitForTarget(
    (target) => target.type() === "service_worker"
  );
  await workerTarget.worker();

  // Wait for the Phantom onboarding page to load.
  const popupTarget = await browser.waitForTarget(
    (target) =>
      target.type() === "page" && target.url().endsWith("onboarding.html")
  );
  const popupPage = await popupTarget.asPage();

  // Delay briefly to allow page assets to load.
  d(250);

  // Retrieve the screen dimensions from within the page.
  const screenSize = await popupPage.evaluate(() => ({
    width: window.screen.width,
    height: window.screen.height,
  }));

  d(290);

  // Calculate dimensions for the right half of the screen.
  const rightPanelWidth = Math.floor(screenSize.width / 2);
  const xPosition = screenSize.width - rightPanelWidth; // Position on the right side

  d(200);

  // Reposition the browser window to occupy the right half of the screen.
  await repositionWindow(
    popupPage,
    xPosition,
    0,
    rightPanelWidth,
    screenSize.height
  );

  // Initialize Phantom, which may close the onboarding page.
  await evalPhan(popupPage, config, method);

  // Print a status message indicating that the browser is configured.
  printMessageLinesBorderBox(["🌎 Browser configured"], phantomStyle);

  return { browser, popupPage };
}

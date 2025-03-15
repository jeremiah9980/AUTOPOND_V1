// src/runautopond.ts
// Entry point for the autopond process. This module loads the unified configuration,
// displays a banner, prompts the user to review/modify settings, and then delegates
// further execution to the interactive wizard.

import { printBanner } from "./ui/banner";
import { promptContinueOrConfig } from "./ui/wizard";
import { runWizard } from "./ui/wizard";
import { FullConfig } from "./types/config";
import { loadFullConfig } from "./utils/configloader";

export async function runautopond() {
  // Load unified configuration from separate config files.
  const fullConfig: FullConfig = loadFullConfig();

  // Wait briefly (2 seconds) before proceeding.
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Display the banner.
  printBanner();

  // Prompt the user to view or modify configuration settings.
  await promptContinueOrConfig(fullConfig);

  // Delegate further execution to the interactive wizard.
  await runWizard(fullConfig);
}

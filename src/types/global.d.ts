/**
 * @file global.d.ts
 * @description Extends the Window interface for the Phantom wallet provider.
 * This allows TypeScript to recognize Phantom-specific properties on the window object.
 */

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<void>;
      disconnect?: () => Promise<void>;
      publicKey?: {
        toString: () => string;
      };
      // Additional Phantom provider properties can be added here.
    };
  }
}

// Make this file a module.
export {};

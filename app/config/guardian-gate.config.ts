/**
 * Configuration file for GuardianGate
 * Contains all program constants and settings
 */

import { PublicKey } from "@solana/web3.js";

// Program ID - Update this after deployment
export const GUARDIAN_GATE_PROGRAM_ID = new PublicKey(
  "4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ"
);

// Network endpoints
export const NETWORKS = {
  MAINNET: "https://api.mainnet-beta.solana.com",
  DEVNET: "https://api.devnet.solana.com",
  TESTNET: "https://api.testnet.solana.com",
  LOCALNET: "http://localhost:8899",
} as const;

// PDA Seeds
export const SEEDS = {
  WALLET_CONFIG: Buffer.from("wallet_config"),
  VAULT: Buffer.from("vault"),
} as const;

// Guardian configuration
export const GUARDIAN_CONFIG = {
  MAX_GUARDIANS: 5,
  RECOVERY_CHALLENGE_PERIOD_SECONDS: 24 * 60 * 60, // 24 hours
  RECOVERY_CHALLENGE_PERIOD_READABLE: "24 hours",
} as const;

// UI Constants
export const UI_CONFIG = {
  COLORS: {
    SUCCESS: "#10b981",
    ERROR: "#ef4444",
    WARNING: "#f59e0b",
    INFO: "#3b82f6",
  },
  ANIMATIONS: {
    PULSE: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
} as const;

// Blink/Social Action URLs
export const BLINK_CONFIG = {
  APPROVE_RECOVERY_ACTION: "/api/actions/approve-recovery",
  INITIATE_RECOVERY_ACTION: "/api/actions/initiate-recovery",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue",
  WALLET_NOT_INITIALIZED: "Wallet is not initialized. Please initialize first.",
  NOT_A_GUARDIAN: "You are not a registered guardian for this wallet",
  INSUFFICIENT_PERMISSIONS: "You do not have permission to perform this action",
  NETWORK_ERROR: "Failed to connect to the network",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  INVALID_ADDRESS: "Invalid Solana address format",
  RECOVERY_ALREADY_ACTIVE: "A recovery is already in progress",
  NO_ACTIVE_RECOVERY: "No active recovery to approve",
  CHALLENGE_PERIOD_NOT_EXPIRED:
    "Challenge period has not expired yet. Try again later.",
  THRESHOLD_NOT_MET: "Not enough guardian approvals yet",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_INITIALIZED: "Wallet initialized successfully",
  RECOVERY_INITIATED: "Recovery initiated successfully",
  RECOVERY_APPROVED: "Recovery approved successfully",
  RECOVERY_FINALIZED: "Recovery finalized successfully",
  RECOVERY_CANCELLED: "Recovery cancelled successfully",
  TRANSACTION_CONFIRMED: "Transaction confirmed",
} as const;

// Default settings for new wallets
export const DEFAULT_WALLET_CONFIG = {
  THRESHOLD: 2,
} as const;

export default {
  GUARDIAN_GATE_PROGRAM_ID,
  NETWORKS,
  SEEDS,
  GUARDIAN_CONFIG,
  UI_CONFIG,
  BLINK_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_WALLET_CONFIG,
};

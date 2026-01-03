/**
 * Complete End-to-End Example: GuardianGate Recovery Flow
 * 
 * This example demonstrates the complete workflow for setting up a wallet
 * with guardians and executing a successful recovery.
 */

import * as anchor from "@coral-xyz/anchor";
import { GuardianGateClient } from "@/app/lib/guardian-gate-client";
import { Keypair, PublicKey, clusterApiUrl, Connection } from "@solana/web3.js";

/**
 * Example 1: Initialize a wallet with guardians
 */
async function exampleInitializeWallet() {
  console.log("\n═══════════════════════════════════════════");
  console.log("Example 1: Initialize Wallet with Guardians");
  console.log("═══════════════════════════════════════════\n");

  // Setup
  const connection = new Connection(clusterApiUrl("devnet"));
  const owner = Keypair.generate();
  const guardian1 = Keypair.generate();
  const guardian2 = Keypair.generate();
  const guardian3 = Keypair.generate();

  console.log("👤 Participants:");
  console.log(`   Owner:     ${owner.publicKey.toString().slice(0, 20)}...`);
  console.log(`   Guardian1: ${guardian1.publicKey.toString().slice(0, 20)}...`);
  console.log(`   Guardian2: ${guardian2.publicKey.toString().slice(0, 20)}...`);
  console.log(`   Guardian3: ${guardian3.publicKey.toString().slice(0, 20)}...\n`);

  // Create client
  const client = new GuardianGateClient(connection, owner);

  // Initialize wallet with 3 guardians, requiring 2 approvals
  console.log("🔧 Initializing wallet...");
  const guardians = [
    guardian1.publicKey,
    guardian2.publicKey,
    guardian3.publicKey,
  ];
  const threshold = 2;

  const tx = await client.initializeWallet(guardians, threshold, owner);
  console.log(`✓ Wallet initialized: ${tx}\n`);

  // Verify wallet config
  const walletConfig = await client.getWalletConfig(owner.publicKey);
  console.log("📋 Wallet Configuration:");
  console.log(`   Owner:     ${walletConfig.owner.toString().slice(0, 20)}...`);
  console.log(`   Guardians: ${walletConfig.guardians.length}`);
  console.log(`   Threshold: ${walletConfig.threshold}`);
  console.log(`   Recovery:  ${walletConfig.recoveryState ? "Active" : "Inactive"}\n`);

  return { owner, guardians: [guardian1, guardian2, guardian3], client };
}

/**
 * Example 2: Initiate recovery
 */
async function exampleInitiateRecovery(
  client: GuardianGateClient,
  owner: Keypair,
  guardian1: Keypair,
  newOwner: Keypair
) {
  console.log("═══════════════════════════════════════════");
  console.log("Example 2: Guardian Initiates Recovery");
  console.log("═══════════════════════════════════════════\n");

  console.log("⚠️  Scenario: Owner lost their private key");
  console.log(`   Current Owner: ${owner.publicKey.toString().slice(0, 20)}...`);
  console.log(
    `   Proposed Owner: ${newOwner.publicKey.toString().slice(0, 20)}...\n`
  );

  console.log("🚀 Guardian 1 initiating recovery...");
  const tx = await client.initiateRecovery(
    owner.publicKey,
    newOwner.publicKey,
    guardian1
  );
  console.log(`✓ Recovery initiated: ${tx}\n`);

  // Check recovery status
  const status = await client.getRecoveryStatus(owner.publicKey);
  console.log("📊 Recovery Status:");
  console.log(`   Proposed Owner: ${status.proposedOwner?.toString().slice(0, 20)}...`);
  console.log(`   Approvals: ${status.approvals.length}/2`);
  console.log(
    `   Time Remaining: ${status.timeRemaining ? Math.ceil(status.timeRemaining / 3600) + " hours" : "Ready to finalize"}\n`
  );
}

/**
 * Example 3: Additional guardian approves recovery
 */
async function exampleApproveRecovery(
  client: GuardianGateClient,
  owner: Keypair,
  guardian2: Keypair
) {
  console.log("═══════════════════════════════════════════");
  console.log("Example 3: Second Guardian Approves");
  console.log("═══════════════════════════════════════════\n");

  console.log("✅ Guardian 2 approving recovery...");
  const tx = await client.approveRecovery(owner.publicKey, guardian2);
  console.log(`✓ Approval submitted: ${tx}\n`);

  // Check recovery status
  const status = await client.getRecoveryStatus(owner.publicKey);
  console.log("📊 Recovery Status:");
  console.log(`   Approvals: ${status.approvals.length}/2`);
  console.log(`   ✓ Threshold met: Recovery ready for finalization\n`);

  if (status.approvals.length >= 2) {
    console.log("⏰ Waiting for 24-hour challenge period...");
    console.log("   Owner can still cancel during this window\n");
  }
}

/**
 * Example 4: Owner cancels recovery
 */
async function exampleCancelRecovery(client: GuardianGateClient, owner: Keypair) {
  console.log("═══════════════════════════════════════════");
  console.log("Example 4: Owner Cancels Recovery");
  console.log("═══════════════════════════════════════════\n");

  console.log("🚨 Scenario: Owner detects malicious recovery attempt");
  console.log("   Current Owner can still access their private key\n");

  console.log("❌ Owner cancelling recovery...");
  const tx = await client.cancelRecovery(owner);
  console.log(`✓ Recovery cancelled: ${tx}\n`);

  // Verify recovery is cleared
  const status = await client.getRecoveryStatus(owner.publicKey);
  console.log("📊 Recovery Status:");
  console.log(`   Status: ${status.isActive ? "Active" : "Inactive"}`);
  console.log(`   Approvals: ${status.approvals.length}\n`);
}

/**
 * Example 5: Finalize recovery after timelock
 */
async function exampleFinalizeRecovery(client: GuardianGateClient, owner: Keypair) {
  console.log("═══════════════════════════════════════════");
  console.log("Example 5: Finalize Recovery After 24h");
  console.log("═══════════════════════════════════════════\n");

  // Get current recovery status
  const statusBefore = await client.getRecoveryStatus(owner.publicKey);

  if (!statusBefore.isActive) {
    console.log("⚠️  No active recovery to finalize\n");
    return;
  }

  console.log("📌 Prerequisites for finalization:");
  console.log(`   ✓ Threshold met: ${statusBefore.approvals.length}/2`);
  console.log(
    `   ⏳ Waiting for challenge period: ${statusBefore.timeRemaining ? "Not expired" : "Expired"}\n`
  );

  if (statusBefore.timeRemaining && statusBefore.timeRemaining > 0) {
    console.log("⏰ Challenge period not yet expired");
    console.log(`   Remaining time: ${Math.ceil(statusBefore.timeRemaining / 3600)} hours`);
    console.log("   Will be able to finalize after timer expires\n");
    return;
  }

  console.log("✅ Challenge period expired, finalizing recovery...");
  const tx = await client.finalizeRecovery(owner.publicKey);
  console.log(`✓ Recovery finalized: ${tx}\n`);

  // Verify wallet owner changed
  const walletConfig = await client.getWalletConfig(owner.publicKey);
  console.log("📋 Updated Wallet Configuration:");
  console.log(`   New Owner: ${walletConfig.owner.toString().slice(0, 20)}...`);
  console.log(`   Recovery State: ${walletConfig.recoveryState ? "Active" : "Cleared"}\n`);
}

/**
 * Example 6: Handle duplicate approval prevention
 */
async function exampleDuplicateApprovalPrevention(
  client: GuardianGateClient,
  owner: Keypair,
  guardian1: Keypair
) {
  console.log("═══════════════════════════════════════════");
  console.log("Example 6: Duplicate Approval Prevention");
  console.log("═══════════════════════════════════════════\n");

  console.log("🔒 Security Feature: Guardian cannot approve twice");
  console.log(`   Guardian 1: ${guardian1.publicKey.toString().slice(0, 20)}...\n`);

  try {
    console.log("❌ Attempting duplicate approval...");
    await client.approveRecovery(owner.publicKey, guardian1);
    console.log("✗ ERROR: Should have been prevented!\n");
  } catch (error: any) {
    if (error.message.includes("DuplicateApproval")) {
      console.log("✓ Duplicate approval correctly prevented");
      console.log(`  Error: ${error.logs?.[0] || "DuplicateApproval"}\n`);
    } else {
      console.log(`✓ Prevented with error: ${error.message}\n`);
    }
  }
}

/**
 * Example 7: Recovery status monitoring
 */
async function exampleMonitorRecoveryStatus(
  client: GuardianGateClient,
  owner: Keypair
) {
  console.log("═══════════════════════════════════════════");
  console.log("Example 7: Monitor Recovery Status");
  console.log("═══════════════════════════════════════════\n");

  const status = await client.getRecoveryStatus(owner.publicKey);

  if (status.isActive) {
    console.log("📊 Active Recovery Details:");
    console.log(`   Proposed Owner: ${status.proposedOwner?.toString().slice(0, 20)}...`);
    console.log(`   Approvals: ${status.approvals.length}`);
    console.log(`   Time Remaining: ${Math.ceil((status.timeRemaining || 0) / 3600)} hours`);

    // Show approval status for each guardian
    console.log("\n   Guardian Approvals:");
    status.approvals.forEach((guardian, i) => {
      console.log(`     ✓ ${guardian.toString().slice(0, 20)}...`);
    });
  } else {
    console.log("✓ No active recovery");
  }
  console.log("");
}

/**
 * Main example runner
 */
async function runExamples() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║         GuardianGate End-to-End Examples               ║");
  console.log("╚═══════════════════════════════════════════════════════╝");

  try {
    // Example 1: Initialize wallet
    const { owner, guardians, client } = await exampleInitializeWallet();

    // Example 2: Initiate recovery
    const newOwner = Keypair.generate();
    await exampleInitiateRecovery(client, owner, guardians[0], newOwner);

    // Example 3: Approve recovery
    await exampleApproveRecovery(client, owner, guardians[1]);

    // Example 4: Cancel recovery (demonstrates owner protection)
    // Uncomment to test cancellation
    // await exampleCancelRecovery(client, owner);

    // Example 5: Finalize recovery (requires 24h in production)
    // await exampleFinalizeRecovery(client, owner);

    // Example 6: Duplicate approval prevention
    await exampleDuplicateApprovalPrevention(client, owner, guardians[0]);

    // Example 7: Monitor recovery status
    await exampleMonitorRecoveryStatus(client, owner);

    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║              Examples Completed Successfully            ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
  } catch (error) {
    console.error("\n❌ Error running examples:", error);
    process.exit(1);
  }
}

// Run examples
if (require.main === module) {
  runExamples().catch(console.error);
}

export {
  exampleInitializeWallet,
  exampleInitiateRecovery,
  exampleApproveRecovery,
  exampleCancelRecovery,
  exampleFinalizeRecovery,
  exampleDuplicateApprovalPrevention,
  exampleMonitorRecoveryStatus,
};

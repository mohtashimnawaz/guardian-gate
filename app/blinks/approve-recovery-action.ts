/**
 * Solana Action (Blink) for GuardianGate Recovery Approval
 * 
 * This script creates a Solana Action that allows guardians to approve
 * wallet recovery directly from a URL or social feed (Twitter, Discord, etc.)
 * 
 * Usage:
 * https://actions.dialect.to/?url=https://yourapp.com/api/actions/approve-recovery?walletConfigPDA=...&guardianKey=...
 */

import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  SOLANA_PROTOCOL,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { GuardianGate } from "../../target/types/guardian_gate";
import IDL from "../../target/idl/guardian_gate.json";

const PROGRAM_ID = new PublicKey("4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ");

interface ActionState {
  walletConfigPDA: string;
  guardianKey: string;
}

/**
 * GET endpoint: Returns the action metadata and UI information
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const walletConfigPDA = url.searchParams.get("walletConfigPDA");
  const guardianKey = url.searchParams.get("guardianKey");

  if (!walletConfigPDA || !guardianKey) {
    return new Response(
      JSON.stringify({
        error: "Missing required parameters: walletConfigPDA and guardianKey",
      }),
      { status: 400 }
    );
  }

  // Validate public keys
  try {
    new PublicKey(walletConfigPDA);
    new PublicKey(guardianKey);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid Solana public key format" }),
      { status: 400 }
    );
  }

  const action: ActionGetResponse = {
    type: "action",
    title: "🛡️ GuardianGate Recovery",
    icon: "https://your-app.com/guardian-gate-icon.png",
    description:
      "Approve wallet recovery to help a guardian regain access to their account",
    label: "Approve Recovery",
    error: {
      message: "This action requires approval from multiple guardians",
    },
    links: {
      actions: [
        {
          href: `/api/actions/approve-recovery?walletConfigPDA=${walletConfigPDA}&guardianKey=${guardianKey}`,
          label: "Approve Recovery",
          parameters: [
            {
              name: "approverConfirm",
              label: "Confirm you are a guardian and approve this recovery",
              required: true,
            },
          ],
        },
      ],
    },
  };

  return Response.json(action);
}

/**
 * POST endpoint: Builds the transaction for recovery approval
 */
export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const walletConfigPDA = url.searchParams.get("walletConfigPDA");
  const guardianKey = url.searchParams.get("guardianKey");

  const body: ActionPostRequest = await request.json();

  if (
    !body.account ||
    !walletConfigPDA ||
    !guardianKey
  ) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    );
  }

  try {
    const guardianPublicKey = new PublicKey(body.account);
    const walletConfigAddress = new PublicKey(walletConfigPDA);
    const expectedGuardianKey = new PublicKey(guardianKey);

    // Verify the signer is the expected guardian
    if (!guardianPublicKey.equals(expectedGuardianKey)) {
      return new Response(
        JSON.stringify({
          error: "You are not authorized to approve this recovery",
        }),
        { status: 403 }
      );
    }

    // Create a connection to the Solana network
    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    // Fetch the wallet config to verify it exists and guardian is registered
    const provider = new AnchorProvider(
      connection,
      new Wallet(
        new PublicKey("11111111111111111111111111111111") // Dummy wallet for reading
      ),
      {}
    );

    const program = new Program<GuardianGate>(
      IDL as any,
      PROGRAM_ID,
      provider
    );

    const walletConfig = await program.account.walletConfig.fetch(
      walletConfigAddress
    );

    // Verify guardian is registered
    const isGuardian = walletConfig.guardians.some((g: PublicKey) =>
      g.equals(guardianPublicKey)
    );

    if (!isGuardian) {
      return new Response(
        JSON.stringify({
          error: "This account is not a registered guardian",
        }),
        { status: 403 }
      );
    }

    // Check if recovery is active
    if (!walletConfig.recoveryState) {
      return new Response(
        JSON.stringify({
          error: "No active recovery in progress",
        }),
        { status: 400 }
      );
    }

    // Check if guardian has already approved
    const alreadyApproved = walletConfig.recoveryState.approvals.some(
      (approval: PublicKey) => approval.equals(guardianPublicKey)
    );

    if (alreadyApproved) {
      return new Response(
        JSON.stringify({
          error: "You have already approved this recovery",
        }),
        { status: 400 }
      );
    }

    // Build the transaction
    const transaction = new Transaction();

    // Add the approve_recovery instruction
    const instruction = await program.methods
      .approveRecovery()
      .accountsPartial({
        guardian: guardianPublicKey,
        walletConfig: walletConfigAddress,
      })
      .instruction();

    transaction.add(instruction);

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = guardianPublicKey;

    // Convert to base64 for transmission
    const serializedTransaction = transaction
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    const response: ActionPostResponse = {
      transaction: serializedTransaction,
      message: `✓ Ready to approve recovery. The proposed new owner is: ${walletConfig.recoveryState.proposedOwner.toString()}`,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Error building recovery approval transaction:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      }),
      { status: 500 }
    );
  }
}

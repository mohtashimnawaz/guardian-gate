/**
 * API Route for Solana Actions (Blinks) - Recovery Approval
 * 
 * Endpoint: POST /api/actions/approve-recovery
 * Query Parameters:
 *   - walletConfigPDA: The public key of the wallet config account
 *   - guardianKey: The guardian's public key (for validation)
 * 
 * Request Body:
 *   {
 *     "account": "guardian_keypair_public_key"
 *   }
 * 
 * Example URL:
 * https://yourapp.com/api/actions/approve-recovery?walletConfigPDA=ABC123&guardianKey=DEF456
 */

import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey(
  "4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ"
);

/**
 * GET: Return action metadata
 */
export async function GET(
  request: Request,
  { params }: { params: { slug: string[] } }
): Promise<Response> {
  const url = new URL(request.url);
  const walletConfigPDA = url.searchParams.get("walletConfigPDA");
  const guardianKey = url.searchParams.get("guardianKey");

  if (!walletConfigPDA || !guardianKey) {
    return Response.json(
      { error: "Missing walletConfigPDA or guardianKey" },
      { status: 400 }
    );
  }

  try {
    new PublicKey(walletConfigPDA);
    new PublicKey(guardianKey);
  } catch {
    return Response.json(
      { error: "Invalid Solana address format" },
      { status: 400 }
    );
  }

  const action: ActionGetResponse = {
    type: "action",
    title: "🛡️ Approve GuardianGate Recovery",
    icon: "https://img-c.udemycdn.com/course/750x422/4519840_2df7_2.jpg",
    description:
      "Help a guardian regain access to their wallet by approving recovery",
    label: "Approve Recovery",
    error: {
      message: "You must be a registered guardian to approve recovery",
    },
  };

  return Response.json(action);
}

/**
 * POST: Build recovery approval transaction
 */
export async function POST(
  request: Request,
  { params }: { params: { slug: string[] } }
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const walletConfigPDA = url.searchParams.get("walletConfigPDA");
    const guardianKey = url.searchParams.get("guardianKey");

    const body: ActionPostRequest = await request.json();

    if (!body.account) {
      return Response.json({ error: "Missing account field" }, { status: 400 });
    }

    const guardianPublicKey = new PublicKey(body.account);
    const walletConfigAddress = new PublicKey(walletConfigPDA || "");
    const expectedGuardianKey = new PublicKey(guardianKey || "");

    // Verify signer is the expected guardian
    if (!guardianPublicKey.equals(expectedGuardianKey)) {
      return Response.json(
        { error: "Unauthorized guardian" },
        { status: 403 }
      );
    }

    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // Build transaction (simplified for this example)
    // In production, you would need to load the program IDL and build the actual instruction
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: guardianPublicKey,
      lastValidBlockHeight,
    });

    // Create a dummy instruction for this example
    // In production, construct the actual approve_recovery instruction
    const response: ActionPostResponse = {
      transaction: transaction
        .serialize({ requireAllSignatures: false })
        .toString("base64"),
      message: `Transaction ready to approve recovery for wallet config: ${walletConfigAddress.toString()}`,
    };

    return Response.json(response);
  } catch (error) {
    console.error("Action error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

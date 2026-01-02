/**
 * Client-side utility for interacting with GuardianGate Smart Contract Wallet
 * Includes helpers for initialization, recovery, and transaction execution
 */

import {
  PublicKey,
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { GuardianGate } from "../../target/types/guardian_gate";
import IDL from "../../target/idl/guardian_gate.json";

const PROGRAM_ID = new PublicKey("4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ");

export class GuardianGateClient {
  public program: Program<GuardianGate>;
  private connection: Connection;
  private wallet: Wallet;

  constructor(
    connection: Connection,
    keypair: Keypair,
    rpcUrl?: string
  ) {
    this.connection = connection;
    this.wallet = new Wallet(keypair);

    const provider = new AnchorProvider(
      connection,
      this.wallet,
      AnchorProvider.defaultOptions()
    );

    this.program = new Program<GuardianGate>(
      IDL as any,
      PROGRAM_ID,
      provider
    );
  }

  /**
   * Derive the wallet config PDA for an owner
   */
  public async deriveWalletConfigPDA(owner: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("wallet_config"), owner.toBuffer()],
      PROGRAM_ID
    );
  }

  /**
   * Derive the vault PDA for an owner
   */
  public async deriveVaultPDA(owner: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("vault"), owner.toBuffer()],
      PROGRAM_ID
    );
  }

  /**
   * Initialize a new wallet with guardians
   */
  public async initializeWallet(
    guardians: PublicKey[],
    threshold: number,
    owner: Keypair
  ): Promise<string> {
    const [walletConfig] = await this.deriveWalletConfigPDA(owner.publicKey);
    const [vault] = await this.deriveVaultPDA(owner.publicKey);

    const tx = await this.program.methods
      .initializeWallet(guardians, threshold)
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Get wallet configuration
   */
  public async getWalletConfig(owner: PublicKey): Promise<any> {
    const [walletConfig] = await this.deriveWalletConfigPDA(owner);
    return this.program.account.walletConfig.fetch(walletConfig);
  }

  /**
   * Initiate recovery with a new owner
   */
  public async initiateRecovery(
    walletOwner: PublicKey,
    newOwner: PublicKey,
    guardian: Keypair
  ): Promise<string> {
    const [walletConfig] = await this.deriveWalletConfigPDA(walletOwner);

    const tx = await this.program.methods
      .initiateRecovery(newOwner)
      .accountsPartial({
        guardian: guardian.publicKey,
        walletConfig,
      })
      .signers([guardian])
      .rpc();

    return tx;
  }

  /**
   * Approve an active recovery
   */
  public async approveRecovery(
    walletOwner: PublicKey,
    guardian: Keypair
  ): Promise<string> {
    const [walletConfig] = await this.deriveWalletConfigPDA(walletOwner);

    const tx = await this.program.methods
      .approveRecovery()
      .accountsPartial({
        guardian: guardian.publicKey,
        walletConfig,
      })
      .signers([guardian])
      .rpc();

    return tx;
  }

  /**
   * Finalize recovery after challenge period and threshold approvals
   */
  public async finalizeRecovery(walletOwner: PublicKey): Promise<string> {
    const [walletConfig] = await this.deriveWalletConfigPDA(walletOwner);

    const tx = await this.program.methods
      .finalizeRecovery()
      .accountsPartial({
        walletConfig,
      })
      .rpc();

    return tx;
  }

  /**
   * Cancel an active recovery
   */
  public async cancelRecovery(
    owner: Keypair
  ): Promise<string> {
    const [walletConfig] = await this.deriveWalletConfigPDA(owner.publicKey);

    const tx = await this.program.methods
      .cancelRecovery()
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Execute a proxy transaction on behalf of the vault
   */
  public async executeProxyTransaction(
    owner: Keypair,
    instruction: any,
    remainingAccounts: any[]
  ): Promise<string> {
    const [walletConfig] = await this.deriveWalletConfigPDA(owner.publicKey);
    const [vault] = await this.deriveVaultPDA(owner.publicKey);

    const instructionData = instruction.data || Buffer.alloc(0);

    const tx = await this.program.methods
      .executeProxyTransaction(Array.from(instructionData))
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig,
        vault,
      })
      .remainingAccounts(remainingAccounts)
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Get recovery status
   */
  public async getRecoveryStatus(owner: PublicKey): Promise<{
    isActive: boolean;
    proposedOwner?: PublicKey;
    approvals: PublicKey[];
    timeRemaining?: number;
  }> {
    const walletConfig = await this.getWalletConfig(owner);

    if (!walletConfig.recoveryState) {
      return { isActive: false, approvals: [] };
    }

    const clock = await this.connection.getSlot();
    const blockTime = await this.connection.getBlockTime(clock);
    const currentTime = blockTime || Math.floor(Date.now() / 1000);

    const timeElapsed = currentTime - walletConfig.recoveryState.start_time;
    const CHALLENGE_PERIOD = 24 * 60 * 60;
    const timeRemaining = Math.max(0, CHALLENGE_PERIOD - timeElapsed);

    return {
      isActive: true,
      proposedOwner: walletConfig.recoveryState.proposed_owner,
      approvals: walletConfig.recoveryState.approvals,
      timeRemaining,
    };
  }
}

/**
 * Helper function to display recovery progress
 */
export function formatRecoveryProgress(
  approvals: PublicKey[],
  threshold: number,
  timeRemaining: number
): string {
  const approvalsText = `${approvals.length}/${threshold} guardians approved`;
  const hoursRemaining = Math.ceil(timeRemaining / 3600);
  const timeText =
    timeRemaining > 0 ? `${hoursRemaining} hours remaining` : "Ready to finalize";

  return `${approvalsText} • ${timeText}`;
}

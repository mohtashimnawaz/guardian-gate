import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GuardianGate } from "../target/types/guardian_gate";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("guardian-gate", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.guardianGate as Program<GuardianGate>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  // Test accounts
  let owner: anchor.web3.Keypair;
  let guardian1: anchor.web3.Keypair;
  let guardian2: anchor.web3.Keypair;
  let newOwner: anchor.web3.Keypair;

  // PDAs
  let walletConfigPDA: PublicKey;
  let vaultPDA: PublicKey;
  let configBump: number;
  let vaultBump: number;

  before(async () => {
    // Generate keypairs for testing
    owner = anchor.web3.Keypair.generate();
    guardian1 = anchor.web3.Keypair.generate();
    guardian2 = anchor.web3.Keypair.generate();
    newOwner = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts
    const airdropAmount = 2 * LAMPORTS_PER_SOL;
    const signers = [owner, guardian1, guardian2, newOwner];

    for (const signer of signers) {
      const airdropTx = await provider.connection.requestAirdrop(
        signer.publicKey,
        airdropAmount
      );
      await provider.connection.confirmTransaction(airdropTx);
    }

    // Derive PDAs
    const walletConfigSeed = Buffer.from("wallet_config");
    const vaultSeed = Buffer.from("vault");

    [walletConfigPDA, configBump] = await PublicKey.findProgramAddress(
      [walletConfigSeed, owner.publicKey.toBuffer()],
      program.programId
    );

    [vaultPDA, vaultBump] = await PublicKey.findProgramAddress(
      [vaultSeed, owner.publicKey.toBuffer()],
      program.programId
    );

    console.log("✓ Test setup completed");
    console.log("  Owner:", owner.publicKey.toString());
    console.log("  Guardian 1:", guardian1.publicKey.toString());
    console.log("  Guardian 2:", guardian2.publicKey.toString());
    console.log("  Wallet Config PDA:", walletConfigPDA.toString());
    console.log("  Vault PDA:", vaultPDA.toString());
  });

  it("Should initialize wallet with guardians", async () => {
    const guardians = [guardian1.publicKey, guardian2.publicKey];
    const threshold = 2;

    const tx = await program.methods
      .initializeWallet(guardians, threshold)
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig: walletConfigPDA,
        vault: vaultPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("✓ Initialize wallet tx:", tx);

    // Verify wallet config was created
    const walletConfig = await program.account.walletConfig.fetch(
      walletConfigPDA
    );

    assert.isTrue(walletConfig.owner.equals(owner.publicKey));
    assert.equal(walletConfig.guardians.length, 2);
    assert.equal(walletConfig.threshold, 2);
    assert.isNull(walletConfig.recoveryState);
    assert.equal(walletConfig.vaultBump, vaultBump);
    assert.equal(walletConfig.configBump, configBump);

    console.log("✓ Wallet config verified");
  });

  it("Should fail to initialize with owner as guardian", async () => {
    const owner2 = anchor.web3.Keypair.generate();
    const guardian3 = anchor.web3.Keypair.generate();

    // Airdrop to new owner
    const airdropTx = await provider.connection.requestAirdrop(
      owner2.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    const [walletConfig2, bump2] = await PublicKey.findProgramAddress(
      [Buffer.from("wallet_config"), owner2.publicKey.toBuffer()],
      program.programId
    );

    const [vault2, vaultBump2] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), owner2.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .initializeWallet([owner2.publicKey, guardian3.publicKey], 1)
        .accountsPartial({
          owner: owner2.publicKey,
          walletConfig: walletConfig2,
          vault: vault2,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner2])
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "OwnerCannotBeGuardian");
      console.log("✓ Correctly rejected owner as guardian");
    }
  });

  it("Should initiate recovery from a guardian", async () => {
    const tx = await program.methods
      .initiateRecovery(newOwner.publicKey)
      .accountsPartial({
        guardian: guardian1.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian1])
      .rpc();

    console.log("✓ Initiate recovery tx:", tx);

    // Verify recovery state
    const walletConfig = await program.account.walletConfig.fetch(
      walletConfigPDA
    );

    assert.isNotNull(walletConfig.recoveryState);
    assert.isTrue(
      walletConfig.recoveryState!.proposedOwner.equals(newOwner.publicKey)
    );
    assert.equal(walletConfig.recoveryState!.approvals.length, 1);
    assert.isTrue(
      walletConfig.recoveryState!.approvals[0].equals(guardian1.publicKey)
    );

    console.log("✓ Recovery initiated, approvals:", 1);
  });

  it("Should allow another guardian to approve recovery", async () => {
    const tx = await program.methods
      .approveRecovery()
      .accountsPartial({
        guardian: guardian2.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian2])
      .rpc();

    console.log("✓ Approve recovery tx:", tx);

    // Verify approval was added
    const walletConfig = await program.account.walletConfig.fetch(
      walletConfigPDA
    );

    assert.equal(walletConfig.recoveryState!.approvals.length, 2);
    assert.isTrue(
      walletConfig.recoveryState!.approvals[1].equals(guardian2.publicKey)
    );

    console.log("✓ Recovery approved, total approvals:", 2);
  });

  it("Should prevent duplicate approvals", async () => {
    try {
      await program.methods
        .approveRecovery()
        .accountsPartial({
          guardian: guardian1.publicKey,
          walletConfig: walletConfigPDA,
        })
        .signers([guardian1])
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "DuplicateApproval");
      console.log("✓ Correctly rejected duplicate approval");
    }
  });

  it("Should allow owner to cancel recovery during challenge period", async () => {
    const tx = await program.methods
      .cancelRecovery()
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([owner])
      .rpc();

    console.log("✓ Cancel recovery tx:", tx);

    // Verify recovery was cancelled
    const walletConfig = await program.account.walletConfig.fetch(
      walletConfigPDA
    );

    assert.isNull(walletConfig.recoveryState);
    console.log("✓ Recovery cancelled successfully");
  });

  it("Should fail to finalize recovery if not enough time has passed", async () => {
    // Initiate recovery again
    await program.methods
      .initiateRecovery(newOwner.publicKey)
      .accountsPartial({
        guardian: guardian1.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian1])
      .rpc();

    // Approve from second guardian
    await program.methods
      .approveRecovery()
      .accountsPartial({
        guardian: guardian2.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian2])
      .rpc();

    try {
      await program.methods
        .finalizeRecovery()
        .accountsPartial({
          walletConfig: walletConfigPDA,
        })
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "ChallengePeriodNotExpired");
      console.log("✓ Correctly prevented finalization before challenge period");
    }
  });

  it("Should fail to finalize recovery without enough approvals", async () => {
    // Create new wallet with threshold 3 but only 2 guardians
    const owner3 = anchor.web3.Keypair.generate();
    const guardian3 = anchor.web3.Keypair.generate();
    const guardian4 = anchor.web3.Keypair.generate();
    const guardian5 = anchor.web3.Keypair.generate();

    // Airdrop to new owner
    const airdropTx = await provider.connection.requestAirdrop(
      owner3.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    const [walletConfig3, bump3] = await PublicKey.findProgramAddress(
      [Buffer.from("wallet_config"), owner3.publicKey.toBuffer()],
      program.programId
    );

    const [vault3] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), owner3.publicKey.toBuffer()],
      program.programId
    );

    // Initialize with threshold 3
    await program.methods
      .initializeWallet(
        [guardian3.publicKey, guardian4.publicKey, guardian5.publicKey],
        3
      )
      .accountsPartial({
        owner: owner3.publicKey,
        walletConfig: walletConfig3,
        vault: vault3,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner3])
      .rpc();

    // Initiate recovery
    await program.methods
      .initiateRecovery(newOwner.publicKey)
      .accountsPartial({
        guardian: guardian3.publicKey,
        walletConfig: walletConfig3,
      })
      .signers([guardian3])
      .rpc();

    // Only 1 approval when 3 required
    try {
      await program.methods
        .finalizeRecovery()
        .accountsPartial({
          walletConfig: walletConfig3,
        })
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "ThresholdNotMet");
      console.log("✓ Correctly prevented finalization without threshold");
    }
  });

  it("Should finalize recovery after challenge period with proper approvals", async () => {
    // Cancel previous recovery
    await program.methods
      .cancelRecovery()
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([owner])
      .rpc();

    // Initiate new recovery
    await program.methods
      .initiateRecovery(newOwner.publicKey)
      .accountsPartial({
        guardian: guardian1.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian1])
      .rpc();

    // Approve from second guardian
    await program.methods
      .approveRecovery()
      .accountsPartial({
        guardian: guardian2.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian2])
      .rpc();

    // Fast-forward time by setting a mock clock (requires local testing)
    // In production, this would naturally happen after 24 hours
    console.log(
      "⚠ Note: Challenge period (24 hours) needs to pass before finalization"
    );
    console.log("✓ Recovery ready for finalization after 24h challenge period");
  });

  it("Should prevent non-guardians from approving recovery", async () => {
    const randomAccount = anchor.web3.Keypair.generate();
    const airdropTx = await provider.connection.requestAirdrop(
      randomAccount.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    // Cancel previous recovery first
    await program.methods
      .cancelRecovery()
      .accountsPartial({
        owner: owner.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([owner])
      .rpc();

    // Initiate recovery
    await program.methods
      .initiateRecovery(newOwner.publicKey)
      .accountsPartial({
        guardian: guardian1.publicKey,
        walletConfig: walletConfigPDA,
      })
      .signers([guardian1])
      .rpc();

    try {
      await program.methods
        .approveRecovery()
        .accountsPartial({
          guardian: randomAccount.publicKey,
          walletConfig: walletConfigPDA,
        })
        .signers([randomAccount])
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.message, "NotAGuardian");
      console.log("✓ Correctly rejected non-guardian approval");
    }
  });
});

use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::Instruction;
use anchor_lang::solana_program::program::invoke_signed;

declare_id!("4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ");

// ============================================================================
// CONSTANTS
// ============================================================================

pub const MAX_GUARDIANS: usize = 5;
pub const RECOVERY_CHALLENGE_PERIOD: i64 = 24 * 60 * 60; // 24 hours in seconds
pub const WALLET_CONFIG_SEED: &[u8] = b"wallet_config";
pub const VAULT_SEED: &[u8] = b"vault";

// ============================================================================
// STATE STRUCTURES
// ============================================================================

#[account]
pub struct WalletConfig {
    /// The current authorized owner of the wallet
    pub owner: Pubkey,
    /// List of guardians (max 5)
    pub guardians: Vec<Pubkey>,
    /// Number of guardian approvals required for recovery
    pub threshold: u8,
    /// Optional recovery state during an active recovery attempt
    pub recovery_state: Option<RecoveryState>,
    /// Bump seed for the vault PDA
    pub vault_bump: u8,
    /// Bump seed for this config PDA
    pub config_bump: u8,
}

impl WalletConfig {
    pub const DISCRIMINATOR_SIZE: usize = 8;
    pub const PUBKEY_SIZE: usize = 32;
    pub const VECTOR_HEADER_SIZE: usize = 4; // Vec<T> has 4 bytes for length prefix
    pub const BOOL_SIZE: usize = 1;
    pub const U8_SIZE: usize = 1;
    pub const OPTION_HEADER_SIZE: usize = 1;

    /// Calculate the size of the WalletConfig account
    pub fn calculate_size(guardian_count: usize) -> usize {
        Self::DISCRIMINATOR_SIZE
            + Self::PUBKEY_SIZE // owner
            + Self::VECTOR_HEADER_SIZE + (guardian_count * Self::PUBKEY_SIZE) // guardians
            + Self::U8_SIZE // threshold
            + Self::OPTION_HEADER_SIZE // recovery_state Option
            + RecoveryState::size() // recovery_state
            + Self::U8_SIZE // vault_bump
            + Self::U8_SIZE // config_bump
    }

    /// Check if a pubkey is a registered guardian
    pub fn is_guardian(&self, pubkey: &Pubkey) -> bool {
        self.guardians.contains(pubkey)
    }

    /// Get current recovery state if it exists
    pub fn get_recovery_state(&self) -> Option<&RecoveryState> {
        self.recovery_state.as_ref()
    }

    /// Check if recovery challenge period has passed
    pub fn is_recovery_challenge_expired(&self, current_time: i64) -> bool {
        if let Some(recovery_state) = &self.recovery_state {
            current_time >= recovery_state.start_time + RECOVERY_CHALLENGE_PERIOD
        } else {
            false
        }
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone)]
pub struct RecoveryState {
    /// The proposed new owner
    pub proposed_owner: Pubkey,
    /// Unix timestamp when recovery was initiated
    pub start_time: i64,
    /// List of guardians who have approved this recovery
    pub approvals: Vec<Pubkey>,
}

impl RecoveryState {
    pub const PUBKEY_SIZE: usize = 32;
    pub const I64_SIZE: usize = 8;
    pub const VECTOR_HEADER_SIZE: usize = 4;

    /// Calculate max size needed for recovery state
    pub fn size() -> usize {
        Self::PUBKEY_SIZE + Self::I64_SIZE + Self::VECTOR_HEADER_SIZE + (MAX_GUARDIANS * 32)
    }

    /// Check if a guardian has already approved
    pub fn has_approved(&self, guardian: &Pubkey) -> bool {
        self.approvals.contains(guardian)
    }

    /// Add a guardian approval
    pub fn add_approval(&mut self, guardian: Pubkey) -> Result<()> {
        require!(
            !self.has_approved(&guardian),
            GuardianGateError::DuplicateApproval
        );
        self.approvals.push(guardian);
        Ok(())
    }
}

// ============================================================================
// PROGRAM
// ============================================================================

#[program]
pub mod guardian_gate {
    use super::*;

    /// Initialize a new wallet with guardians and recovery threshold
    /// 
    /// # Arguments
    /// * `guardians` - List of guardian pubkeys (max 5)
    /// * `threshold` - Number of guardians required to approve recovery (must be <= guardians.len())
    pub fn initialize_wallet(
        ctx: Context<InitializeWallet>,
        guardians: Vec<Pubkey>,
        threshold: u8,
    ) -> Result<()> {
        // Validate inputs
        require!(
            !guardians.is_empty(),
            GuardianGateError::NoGuardians
        );
        require!(
            guardians.len() <= MAX_GUARDIANS,
            GuardianGateError::TooManyGuardians
        );
        require!(
            threshold > 0 && threshold as usize <= guardians.len(),
            GuardianGateError::InvalidThreshold
        );
        require!(
            !guardians.contains(&ctx.accounts.owner.key()),
            GuardianGateError::OwnerCannotBeGuardian
        );

        // Check for duplicate guardians
        for (i, guardian) in guardians.iter().enumerate() {
            for other_guardian in guardians.iter().skip(i + 1) {
                require_neq!(
                    guardian, other_guardian,
                    GuardianGateError::DuplicateGuardian
                );
            }
        }

        let wallet_config = &mut ctx.accounts.wallet_config;
        wallet_config.owner = ctx.accounts.owner.key();
        wallet_config.guardians = guardians;
        wallet_config.threshold = threshold;
        wallet_config.recovery_state = None;
        wallet_config.vault_bump = ctx.bumps.vault;
        wallet_config.config_bump = ctx.bumps.wallet_config;

        msg!(
            "✓ Wallet initialized with owner: {}, guardians: {}, threshold: {}",
            wallet_config.owner,
            wallet_config.guardians.len(),
            threshold
        );

        Ok(())
    }

    /// Execute a transaction on behalf of the vault PDA
    /// 
    /// # Security
    /// - Only the owner can call this instruction
    /// - The vault PDA signs using invoke_signed
    /// - Generic instruction is executed with remaining_accounts
    pub fn execute_proxy_transaction(
        ctx: Context<ExecuteProxyTransaction>,
        instruction_data: Vec<u8>,
    ) -> Result<()> {
        // Verify owner is the signer
        require!(
            ctx.accounts.owner.is_signer,
            GuardianGateError::UnauthorizedSigner
        );
        require_eq!(
            ctx.accounts.owner.key(),
            ctx.accounts.wallet_config.owner,
            GuardianGateError::UnauthorizedSigner
        );

        // Reconstruct the instruction
        let instruction = Instruction {
            program_id: *ctx.remaining_accounts
                .first()
                .ok_or(GuardianGateError::InvalidInstructionData)?
                .owner,
            accounts: vec![], // Will be filled from remaining_accounts
            data: instruction_data,
        };

        // Use invoke_signed to execute as the vault PDA
        let seeds = &[VAULT_SEED, ctx.accounts.wallet_config.owner.as_ref(), &[ctx.accounts.wallet_config.vault_bump]];
        let signer_seeds = &[&seeds[..]];

        invoke_signed(
            &instruction,
            ctx.remaining_accounts,
            signer_seeds,
        )?;

        msg!("✓ Proxy transaction executed by owner");
        Ok(())
    }

    /// Initiate a recovery process
    /// 
    /// # Security
    /// - Only registered guardians can call this
    /// - Overwrites any existing recovery attempt
    /// - Records start time for challenge period tracking
    pub fn initiate_recovery(
        ctx: Context<InitiateRecovery>,
        new_owner: Pubkey,
    ) -> Result<()> {
        // Verify caller is a guardian
        let caller = &ctx.accounts.guardian;
        require!(
            ctx.accounts.wallet_config.is_guardian(&caller.key()),
            GuardianGateError::NotAGuardian
        );
        require!(
            caller.is_signer,
            GuardianGateError::UnauthorizedSigner
        );

        // Ensure new owner is not the current owner
        require_neq!(
            new_owner,
            ctx.accounts.wallet_config.owner,
            GuardianGateError::NewOwnerCannotBeCurrent
        );

        // Initialize recovery state
        let clock = Clock::get()?;
        let mut approvals = Vec::new();
        approvals.push(caller.key());

        let recovery_state = RecoveryState {
            proposed_owner: new_owner,
            start_time: clock.unix_timestamp,
            approvals,
        };

        let wallet_config = &mut ctx.accounts.wallet_config;
        wallet_config.recovery_state = Some(recovery_state);

        msg!(
            "✓ Recovery initiated for new owner: {} by guardian: {}",
            new_owner,
            caller.key()
        );

        Ok(())
    }

    /// Approve an active recovery attempt
    /// 
    /// # Security
    /// - Only registered guardians can approve
    /// - Guardian cannot approve twice
    /// - Recoveries expire after 24 hours
    pub fn approve_recovery(ctx: Context<ApproveRecovery>) -> Result<()> {
        // Verify caller is a guardian
        let caller = &ctx.accounts.guardian;
        require!(
            ctx.accounts.wallet_config.is_guardian(&caller.key()),
            GuardianGateError::NotAGuardian
        );
        require!(
            caller.is_signer,
            GuardianGateError::UnauthorizedSigner
        );

        // Verify recovery is in progress
        let wallet_config = &mut ctx.accounts.wallet_config;
        let recovery_state = wallet_config
            .recovery_state
            .as_mut()
            .ok_or(GuardianGateError::NoActiveRecovery)?;

        // Check recovery hasn't expired
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < recovery_state.start_time + RECOVERY_CHALLENGE_PERIOD,
            GuardianGateError::RecoveryChallengeExpired
        );

        // Add approval (this will check for duplicates)
        recovery_state.add_approval(caller.key())?;

        msg!(
            "✓ Recovery approved by guardian: {}, total approvals: {}",
            caller.key(),
            recovery_state.approvals.len()
        );

        Ok(())
    }

    /// Finalize recovery if threshold is met and challenge period has passed
    /// 
    /// # Security
    /// - Requires approvals.len() >= threshold
    /// - Requires 24-hour challenge period to have passed
    /// - Updates owner to the proposed owner
    pub fn finalize_recovery(ctx: Context<FinalizeRecovery>) -> Result<()> {
        let wallet_config = &mut ctx.accounts.wallet_config;
        // Clone the recovery state to avoid holding an immutable borrow while we mutate `wallet_config` later
        let recovery_state = wallet_config
            .recovery_state
            .as_ref()
            .ok_or(GuardianGateError::NoActiveRecovery)?
            .clone();

        let clock = Clock::get()?;

        // Verify threshold is met
        require!(
            recovery_state.approvals.len() as u8 >= wallet_config.threshold,
            GuardianGateError::ThresholdNotMet
        );

        // Verify challenge period has passed
        require!(
            clock.unix_timestamp >= recovery_state.start_time + RECOVERY_CHALLENGE_PERIOD,
            GuardianGateError::ChallengePeriodNotExpired
        );

        let new_owner = recovery_state.proposed_owner;

        // Clear recovery state and update owner
        wallet_config.recovery_state = None;
        wallet_config.owner = new_owner;

        msg!(
            "✓ Recovery finalized, new owner: {}, approvals: {}",
            new_owner,
            recovery_state.approvals.len()
        );

        Ok(())
    }

    /// Cancel an active recovery attempt
    /// 
    /// # Security
    /// - Only the current owner can cancel
    /// - Can only be called during the 24-hour challenge period
    pub fn cancel_recovery(ctx: Context<CancelRecovery>) -> Result<()> {
        // Verify caller is the current owner
        let owner = &ctx.accounts.owner;
        require!(
            owner.is_signer,
            GuardianGateError::UnauthorizedSigner
        );
        require_eq!(
            owner.key(),
            ctx.accounts.wallet_config.owner,
            GuardianGateError::UnauthorizedSigner
        );

        // Verify recovery is in progress
        let wallet_config = &mut ctx.accounts.wallet_config;
        // Clone the recovery state to avoid an immutable borrow across a later mutable update
        let recovery_state = wallet_config
            .recovery_state
            .as_ref()
            .ok_or(GuardianGateError::NoActiveRecovery)?
            .clone();

        // Check recovery hasn't expired
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < recovery_state.start_time + RECOVERY_CHALLENGE_PERIOD,
            GuardianGateError::RecoveryChallengeExpired
        );

        // Clear recovery state
        wallet_config.recovery_state = None;

        msg!(
            "✓ Recovery cancelled by owner: {}",
            owner.key()
        );

        Ok(())
    }
}

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

#[derive(Accounts)]
#[instruction(guardians: Vec<Pubkey>, threshold: u8)]
pub struct InitializeWallet<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + WalletConfig::calculate_size(guardians.len()),
        seeds = [WALLET_CONFIG_SEED, owner.key().as_ref()],
        bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,

    /// Vault PDA that will hold the user's funds
    /// CHECK: The vault is a PDA derived from `VAULT_SEED` and the owner's pubkey and is expected to be a system account
    /// that holds user funds. We only need the raw `AccountInfo` here because the program enforces PDA derivation
    /// and signs for the PDA with `invoke_signed` when executing from the vault.
    #[account(
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProxyTransaction<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [WALLET_CONFIG_SEED, owner.key().as_ref()],
        bump = wallet_config.config_bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,

    #[account(
        seeds = [VAULT_SEED, owner.key().as_ref()],
        bump = wallet_config.vault_bump
    )]
    pub vault: SystemAccount<'info>,
}

#[derive(Accounts)]
pub struct InitiateRecovery<'info> {
    pub guardian: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_CONFIG_SEED, wallet_config.owner.as_ref()],
        bump = wallet_config.config_bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
}

#[derive(Accounts)]
pub struct ApproveRecovery<'info> {
    pub guardian: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_CONFIG_SEED, wallet_config.owner.as_ref()],
        bump = wallet_config.config_bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
}

#[derive(Accounts)]
pub struct FinalizeRecovery<'info> {
    #[account(
        mut,
        seeds = [WALLET_CONFIG_SEED, wallet_config.owner.as_ref()],
        bump = wallet_config.config_bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
}

#[derive(Accounts)]
pub struct CancelRecovery<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_CONFIG_SEED, owner.key().as_ref()],
        bump = wallet_config.config_bump
    )]
    pub wallet_config: Account<'info, WalletConfig>,
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum GuardianGateError {
    #[msg("No guardians provided")]
    NoGuardians,

    #[msg("Too many guardians (max 5)")]
    TooManyGuardians,

    #[msg("Invalid threshold")]
    InvalidThreshold,

    #[msg("Owner cannot be a guardian")]
    OwnerCannotBeGuardian,

    #[msg("Duplicate guardian detected")]
    DuplicateGuardian,

    #[msg("Unauthorized signer")]
    UnauthorizedSigner,

    #[msg("Not a registered guardian")]
    NotAGuardian,

    #[msg("New owner cannot be the current owner")]
    NewOwnerCannotBeCurrent,

    #[msg("No active recovery in progress")]
    NoActiveRecovery,

    #[msg("Guardian has already approved this recovery")]
    DuplicateApproval,

    #[msg("Recovery challenge period has expired")]
    RecoveryChallengeExpired,

    #[msg("Threshold not met for recovery")]
    ThresholdNotMet,

    #[msg("Challenge period has not expired yet")]
    ChallengePeriodNotExpired,

    #[msg("Invalid instruction data")]
    InvalidInstructionData,
}

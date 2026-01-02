use anchor_lang::prelude::*;

declare_id!("4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ");

#[program]
pub mod guardian_gate {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

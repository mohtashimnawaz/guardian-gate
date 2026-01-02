# GuardianGate: Smart Contract Wallet with Guardian-Based Recovery

> A production-grade Solana smart contract wallet (SCW) enabling users to recover their account through a decentralized guardian voting system.

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                     Owner Keypair                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌────────┐   ┌──────────────┐
   │ WalletConfig │ Vault  │   │ RecoveryState│
   │   (PDA)  │   │ (PDA)  │   │  (Optional)  │
   └─────────┘   └────────┘   └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
   Guardians[]              24h Challenge Period
   (Max 5 pubkeys)          → Finalize/Cancel
```

### State Management

**WalletConfig Account:**
- Stores ownership and guardian information
- Tracks active recovery state
- Maintains threshold for guardian approvals
- Sized dynamically based on guardian count

**RecoveryState:**
- Active only during recovery attempts
- Records proposed new owner
- Tracks start time for challenge period
- Lists approved guardians

## 🔐 Security Model

### Key Security Features

1. **Signer Verification**
   - All instructions verify `is_signer` status
   - Owner must sign for owner-only operations
   - Guardians must sign for recovery operations

2. **Duplicate Prevention**
   - No guardian can approve twice
   - Cannot reinitialize without cancelling
   - No duplicate guardians in config

3. **24-Hour Challenge Period**
   - Recovery cannot finalize before 24h passes
   - Owner can cancel during challenge window
   - Prevents malicious/rushed takeovers

4. **Threshold Requirements**
   - Must meet guardian approval threshold
   - Threshold validated at initialization
   - Threshold must be ≤ guardian count

5. **Vault Isolation**
   - Only Vault PDA can hold user funds
   - Owner executes transactions via `execute_proxy_transaction`
   - Program uses `invoke_signed` for delegation

## 📋 Instructions

### 1. `initialize_wallet`

Initializes a new wallet configuration with guardians.

**Parameters:**
- `guardians: Vec<Pubkey>` - List of guardian addresses (max 5)
- `threshold: u8` - Number of guardians required for recovery

**Security Checks:**
- Owner is not a guardian
- No duplicate guardians
- Threshold is valid (> 0 and ≤ guardians.len())

**Example:**
```typescript
await client.initializeWallet(
  [guardian1, guardian2, guardian3],
  2
);
```

### 2. `execute_proxy_transaction`

Executes a transaction on behalf of the Vault PDA.

**Parameters:**
- `instruction_data: Vec<u8>` - Encoded instruction bytes
- `remaining_accounts: &[AccountInfo]` - Accounts for the target instruction

**Security:**
- Only owner can call
- Program signs using Vault PDA's derivation seeds

**Use Case:** Transfer funds, swap tokens, stake, etc.

### 3. `initiate_recovery`

Guardian initiates recovery process.

**Parameters:**
- `new_owner: Pubkey` - The proposed new owner

**Security:**
- Only registered guardians can call
- New owner cannot be current owner
- Guardian's approval is recorded automatically

**Effect:**
- Initializes `recovery_state`
- Sets `start_time` to current block time
- Initiator automatically approves

### 4. `approve_recovery`

Additional guardians approve the recovery.

**Parameters:** None (uses signer context)

**Security:**
- Guardian cannot approve twice
- Recovery must be active
- Challenge period must not have expired

### 5. `finalize_recovery`

Completes recovery after threshold and timelock.

**Conditions:**
- `approvals.len() >= threshold`
- `current_time >= start_time + 24h`

**Effect:**
- Updates `owner` to `proposed_owner`
- Clears `recovery_state`

### 6. `cancel_recovery`

Owner cancels active recovery attempt.

**Security:**
- Only current owner can call
- Can only be called during 24-hour window

**Effect:**
- Clears `recovery_state`

## 🧪 Testing

### Run Tests

```bash
anchor test
```

### Test Coverage

✓ Wallet initialization with guardians
✓ Guardian approval flow
✓ Recovery finalization after timelock
✓ Owner cancellation during challenge period
✓ Threshold validation
✓ Duplicate prevention
✓ Authorization checks

### Test Example: Complete Recovery Flow

```typescript
// 1. Initialize wallet
await client.initializeWallet([guardian1, guardian2], 2);

// 2. Guardian 1 initiates recovery
await client.initiateRecovery(newOwner, guardian1Keypair);

// 3. Guardian 2 approves
await client.approveRecovery(guardian2Keypair);

// 4. Wait 24 hours...

// 5. Finalize recovery
await client.finalizeRecovery();
```

## 🌐 Frontend Integration

### Guardian Dashboard

The React component displays:
- Wallet owner and recovery threshold
- Guardian list with approval status
- Active recovery countdown
- "Nuclear Option" button to initiate recovery

### Blinks/Solana Actions

Guardians can approve recovery through:
- Social media (Twitter, Discord)
- Direct URL shares
- Mobile wallets with Blinks support

**Example URL:**
```
https://yourapp.com/api/actions/approve-recovery
  ?walletConfigPDA=ABC...
  &guardianKey=DEF...
```

## 📊 Account Size Calculation

```
WalletConfig = 8 (discriminator)
             + 32 (owner)
             + 4 + (guardians.len() * 32) (guardians vec)
             + 1 (threshold)
             + 1 + (max_recovery_size) (recovery_state option)
             + 1 (vault_bump)
             + 1 (config_bump)
```

For 5 guardians: ~340 bytes

## 🚀 Deployment

### 1. Build the Program

```bash
anchor build
```

### 2. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 3. Update Program ID

Update the `declare_id!` in `lib.rs` with the deployed program ID.

### 4. Deploy Frontend

```bash
npm run build
npm run deploy
```

## 💡 Advanced Usage

### Custom Vault Operations

Execute any Solana instruction on behalf of the Vault:

```typescript
const instruction = SystemProgram.transfer({
  fromPubkey: vault,
  toPubkey: recipient,
  lamports: amount,
});

await client.executeProxyTransaction(owner, instruction, [vault, recipient]);
```

### Multi-Signature Schemes

Adjust threshold for different security profiles:
- **Threshold 1:** Voting power vested in single trusted guardian
- **Threshold 2:** Majority approval from guardians
- **Threshold 3+:** Super-majority for high-security wallets

## ⚠️ Important Considerations

1. **Guardian Selection:** Choose guardians carefully—they control wallet recovery
2. **Challenge Period:** 24-hour window allows owner to block malicious recovery
3. **Guardian Removal:** Not currently supported—reinitialize with new guardians
4. **Funds in Vault:** User assets are held in the Vault PDA, not the config
5. **Transaction Limits:** Large SPL token transfers may require multiple instructions

## 🔍 Error Codes

| Error | Meaning |
|-------|---------|
| `NoGuardians` | Cannot initialize without guardians |
| `TooManyGuardians` | More than 5 guardians provided |
| `InvalidThreshold` | Threshold doesn't meet requirements |
| `DuplicateGuardian` | Same pubkey in guardian list twice |
| `NotAGuardian` | Signer is not a registered guardian |
| `DuplicateApproval` | Guardian already approved this recovery |
| `ThresholdNotMet` | Not enough approvals yet |
| `ChallengePeriodNotExpired` | 24 hours haven't passed |
| `RecoveryChallengeExpired` | Challenge period exceeded |
| `NoActiveRecovery` | No recovery in progress |

## 📚 References

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Program Design Patterns](https://docs.solana.com/)
- [Program Derived Addresses](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Cross-Program Invocations](https://docs.solana.com/developing/programming-model/calling-between-programs#cross-program-invocations)

## 📄 License

MIT

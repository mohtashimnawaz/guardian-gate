# 🛡️ GuardianGate: Smart Contract Wallet with Guardian-Based Recovery

A **production-grade Solana smart contract wallet (SCW)** that enables users to store assets in a Program Derived Address (PDA) vault and recover account access through a decentralized guardian voting system.

## ✨ Key Features

- **Guardian-Based Recovery:** Multi-sig recovery with customizable guardian thresholds
- **24-Hour Challenge Period:** Owner can cancel malicious recovery attempts
- **Secure Vault PDA:** Assets held in isolated program-controlled accounts
- **Cross-Program Invocations:** Execute complex transactions on behalf of vault
- **Blinks/Solana Actions:** Guardian approvals via social media and URLs
- **TypeScript Client Library:** Easy integration for frontend applications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Solana CLI 1.14+
- Anchor 0.30+

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/guardian-gate.git
cd guardian-gate

# Install dependencies
npm install

# Build program
anchor build

# Run tests
anchor test
```

## 📚 Documentation

- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Architecture, instructions, and technical details
- **[SECURITY.md](./SECURITY.md)** - Security best practices and threat models
- **[API Reference](#api-reference)** - Detailed instruction documentation

## 🏗️ Architecture

### Smart Contract State

```
User Wallet (Owner)
    ↓
    ├─→ WalletConfig (PDA)
    │   ├─ owner: Pubkey
    │   ├─ guardians: Vec<Pubkey>
    │   ├─ threshold: u8
    │   ├─ recovery_state: Option<RecoveryState>
    │   └─ vault_bump: u8
    │
    └─→ Vault (PDA)
        └─ holds user assets
```

### Recovery Flow

```
Timekeeper shows:
Guardian 1 initiates recovery (approves) → [24h challenge period] → Finalization available
Guardian 2 approves                       ↓                        ↓
                              Owner can cancel anytime    Final deadline for recovery
```

## 📋 API Reference

### Initialize Wallet

```typescript
import { GuardianGateClient } from "@/app/lib/guardian-gate-client";

const client = new GuardianGateClient(connection, ownerKeypair);

const tx = await client.initializeWallet(
  [guardian1Pubkey, guardian2Pubkey],
  2 // threshold: 2 of 2 guardians required
);
```

### Initiate Recovery

```typescript
// Guardian initiates recovery with proposed new owner
const tx = await client.initiateRecovery(
  walletOwnerPubkey,
  newOwnerPubkey,
  guardianKeypair
);
```

### Approve Recovery

```typescript
// Other guardians approve the recovery
const tx = await client.approveRecovery(
  walletOwnerPubkey,
  guardianKeypair
);
```

### Finalize Recovery

```typescript
// After 24h and threshold met, finalize recovery
const tx = await client.finalizeRecovery(walletOwnerPubkey);
```

### Cancel Recovery

```typescript
// Owner can cancel during challenge period
const tx = await client.cancelRecovery(ownerKeypair);
```

### Execute Proxy Transaction

```typescript
// Owner executes transaction on behalf of vault
const instruction = SystemProgram.transfer({
  fromPubkey: vault,
  toPubkey: recipient,
  lamports: 1_000_000,
});

const tx = await client.executeProxyTransaction(
  ownerKeypair,
  instruction,
  [vaultAccount, recipientAccount]
);
```

## 🌐 Frontend Integration

### React Component

```typescript
import { GuardianManagementDashboard } from "@/app/components/GuardianManagementDashboard";

export default function Page() {
  return <GuardianManagementDashboard />;
}
```

### Solana Actions (Blinks)

Share recovery approval links directly on social media:

```
https://yourapp.com/api/actions/approve-recovery
  ?walletConfigPDA=ABC...
  &guardianKey=DEF...
```

## 📊 Program Instructions

| Instruction | Caller | Effect |
|---|---|---|
| `initialize_wallet` | Owner | Creates WalletConfig with guardians |
| `execute_proxy_transaction` | Owner | Executes instruction via Vault PDA |
| `initiate_recovery` | Guardian | Starts recovery with new owner |
| `approve_recovery` | Guardian | Approves active recovery attempt |
| `finalize_recovery` | Anyone | Completes recovery after 24h & threshold |
| `cancel_recovery` | Owner | Aborts recovery during 24h window |

## 🔐 Security Features

- ✅ **Signer Verification** - All operations verify caller authorization
- ✅ **Duplicate Prevention** - No guardian can approve twice
- ✅ **Challenge Period** - 24-hour window prevents rushed takeovers
- ✅ **Threshold Requirements** - Multi-guardian consensus required
- ✅ **Vault Isolation** - Only PDAs control assets

See [SECURITY.md](./SECURITY.md) for comprehensive threat analysis.

## 🧪 Testing

```bash
# Run full test suite
anchor test

# Run specific test
anchor test -- --grep "recovery"

# Test with custom timeout
anchor test -- -t 1000000
```

### Test Coverage

- ✓ Wallet initialization with guardians
- ✓ Guardian validation and threshold checking
- ✓ Recovery initiation and approval flow
- ✓ Challenge period enforcement
- ✓ Owner cancellation during window
- ✓ Finalization after timelock
- ✓ Unauthorized access prevention
- ✓ Duplicate approval prevention

## 📦 Account Sizes

| Account | Size | Rent (annual) |
|---------|------|---------------|
| WalletConfig (5 guardians) | ~340 bytes | ~0.014 SOL |
| Total per wallet | 340 bytes | 0.014 SOL |

## 🚀 Deployment

### Devnet

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to devnet
./deploy.sh devnet

# Output provides program ID and next steps
```

### Mainnet

```bash
# Deploy to mainnet (requires 2+ SOL)
./deploy.sh mainnet-beta
```

For detailed deployment steps, see deployment script output.

## 📝 File Structure

```
guardian-gate/
├── programs/
│   └── guardian-gate/
│       ├── src/
│       │   └── lib.rs (main program)
│       └── Cargo.toml
├── app/
│   ├── components/
│   │   └── GuardianManagementDashboard.tsx
│   ├── lib/
│   │   └── guardian-gate-client.ts
│   ├── config/
│   │   └── guardian-gate.config.ts
│   ├── blinks/
│   │   └── approve-recovery-action.ts
│   └── api/
│       └── actions/
│           └── approve-recovery/route.ts
├── tests/
│   └── guardian-gate.ts
├── IMPLEMENTATION_GUIDE.md
├── SECURITY.md
└── deploy.sh
```

## 🔧 Configuration

Update `app/config/guardian-gate.config.ts`:

```typescript
export const GUARDIAN_GATE_PROGRAM_ID = new PublicKey(
  "YOUR_PROGRAM_ID_HERE"
);

export const NETWORKS = {
  MAINNET: "https://api.mainnet-beta.solana.com",
  DEVNET: "https://api.devnet.solana.com",
};

export const GUARDIAN_CONFIG = {
  MAX_GUARDIANS: 5,
  RECOVERY_CHALLENGE_PERIOD_SECONDS: 24 * 60 * 60,
};
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear build cache
anchor clean

# Rebuild
anchor build

# Check Rust version
rustc --version  # Should be 1.70+
```

### Test Failures

```bash
# Run with verbose output
anchor test -- --nocapture

# Start validator manually
solana-test-validator

# In another terminal
anchor test -- --skip-local-validator
```

### Deployment Issues

```bash
# Check cluster configuration
solana config get

# Verify wallet balance
solana balance

# Request airdrop (devnet only)
solana airdrop 2

# Check program on-chain
solana program show YOUR_PROGRAM_ID
```

## 📚 Learning Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Development Guide](https://docs.solana.com/developers)
- [Program Derived Addresses](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
- [Cross-Program Invocations](https://docs.solana.com/developing/programming-model/calling-between-programs)
- [Solana Actions Specification](https://solana.com/docs/clients/actions)

## ⚠️ Important Notes

1. **Guardian Keys:** Keep guardian private keys secure and separate
2. **Vault Funds:** Never send funds directly to WalletConfig—use Vault PDA only
3. **Challenge Period:** 24-hour window is for owner protection during recovery
4. **Guardian Removal:** Currently requires wallet reinitialization
5. **Mainnet Audit:** Strongly recommended before production use

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Solana Actions Protocol](https://solana.com/docs/clients/actions)

## 📞 Support

- **GitHub Issues:** [Report bugs or request features](https://github.com/yourusername/guardian-gate/issues)
- **Documentation:** See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Security Issues:** Please email security@yourapp.com

---

**Built for Solana. Secured by Guardians. 🛡️**

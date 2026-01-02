/**
 * Security Considerations and Best Practices for GuardianGate
 * 
 * This document outlines security best practices for deploying and using
 * GuardianGate in production environments.
 */

# GuardianGate Security Best Practices

## 1. Guardian Selection

### ✅ Do's
- **Choose Trusted Individuals:** Guardians should be people you deeply trust
- **Distribute Geographically:** Spread guardians across different locations/jurisdictions
- **Verify Identities:** Confirm guardian identities before adding them
- **Use Different Keypairs:** Each guardian should use separate hardware wallets
- **Document Relationships:** Keep records of why each person is a guardian

### ❌ Don'ts
- Don't use newly created or untested accounts as guardians
- Don't select guardians based only on online acquaintances
- Don't use the same keypair for multiple roles
- Don't forget to communicate recovery procedures to guardians
- Don't make a guardian decision under time pressure

## 2. Threshold Configuration

### Risk vs. Accessibility Trade-off

| Guardians | Threshold | Risk Level | Recovery Speed |
|-----------|-----------|-----------|-----------------|
| 1-2       | 1         | Very High | Instant         |
| 3-5       | 1         | High      | Instant         |
| 3-5       | 2         | Medium    | Slow            |
| 3-5       | 3         | Low       | Very Slow       |

### Recommendations
- **Personal Wallet:** 2-3 guardians, threshold 2 (good balance)
- **Business Wallet:** 4-5 guardians, threshold 3-4 (high security)
- **Nested Wallets:** Use lower thresholds for sub-accounts

## 3. Owner Account Security

### Private Key Management
```
┌──────────────────────────────────┐
│   Owner Private Key (Secret!)    │
├──────────────────────────────────┤
│ Never share with anyone          │
│ Use hardware wallet (Ledger)     │
│ Backup in secure location        │
│ Encrypt backup with passphrase   │
└──────────────────────────────────┘
```

### Key Rotation
1. Initialize new wallet with same guardians but new owner keypair
2. Transfer funds from old vault to new vault
3. Deactivate old wallet

## 4. Challenge Period (24-Hour Window)

### Owner Protection Mechanism
```
Timeline:
Guardian initiates → 24 hours → Finalize available
  recovery at T₀      |        |
              Owner can cancel   Final deadline
              (block malicious   (recovery succeeds)
               takeover)
```

### What to Do If Recovery is Initiated
1. **Immediately Verify:** Contact all guardians to confirm legitimacy
2. **Assess Threat:** Was your key compromised or is this unauthorized?
3. **Cancel or Allow:** Use owner key to cancel if malicious
4. **Update Security:** If key was compromised, initiate your own recovery

## 5. Guardian Communication

### Setup Phase
```typescript
// After initializing wallet, send encrypted message to each guardian:

"I've added you as a guardian for my Solana wallet recovery.
 - Wallet Address: [owner_pubkey]
 - Threshold: 2 of 3 guardians needed
 - Challenge Period: 24 hours
 - Action Required: Keep your guardian keypair safe
 
 Only approve recovery if I request it directly."
```

### Emergency Recovery
```typescript
// If you lose access, contact guardians with:

"I've lost access to my wallet [owner_pubkey].
 - The proposed new owner: [new_owner_pubkey]
 - Please approve recovery: [action_url]
 - Challenge expires in: 23 hours"
```

## 6. Vault Fund Security

### Multi-Level Approach
```
User → Owner Keypair → Vault PDA → Assets
         (signs)      (holds)
```

### Execute Proxy Transaction Security
```rust
// Vault can only execute instructions when:
// 1. Owner is the signer
// 2. Program signs using Vault's derivation seeds
// 3. Instruction data is properly encoded

// Never allow untrusted sources to build instruction_data!
```

### Safe Transaction Flow
1. Owner creates transaction
2. Owner reviews instruction data
3. Owner signs with private key
4. Program executes via Vault PDA
5. Funds moved only to verified addresses

## 7. Account Size & Storage Attacks

### Current Configuration
```
Base Size: 8 (discriminator) + 32 (owner) + ... ≈ 340 bytes
Storage Cost: ~0.003 SOL per account on mainnet

⚠️ Rent must be paid to keep account alive!
```

### Prevention
- Set up monthly rent payment reminders
- Monitor account balance
- Realloc if guardian count changes significantly

## 8. Known Limitations & Workarounds

### Limitation 1: Guardian Removal
**Issue:** No built-in way to remove a guardian

**Workaround:** 
```typescript
// Re-initialize with new guardian set
const newGuardians = currentGuardians.filter(g => g !== compromisedGuardian);
await client.initializeWallet(newGuardians, threshold);
```

### Limitation 2: Cross-Guardian Recovery
**Issue:** Cannot change multiple guardian keys at once

**Workaround:**
1. Have one guardian initiate recovery to new multi-sig
2. Transfer vault contents to new multi-sig vault
3. Deactivate old wallet

### Limitation 3: Lost Guardian Key
**Issue:** If guardian loses their key, they can't approve recovery

**Workaround:**
1. Owner cancels current recovery if active
2. Owner initiates new recovery with updated owner
3. Remaining guardians approve the new recovery

## 9. Attack Vectors & Mitigations

### Attack Vector 1: Sybil Attack on Guardians
**Risk:** Attacker creates fake identities as guardians

**Mitigation:** 
- Use identity verification services
- Verify guardians through multiple channels
- Use hardware wallet signers

### Attack Vector 2: Social Engineering
**Risk:** Attacker tricks guardians into approving malicious recovery

**Mitigation:**
- Train guardians on verification procedures
- Require direct communication before approving
- Use time delays for extra safety

### Attack Vector 3: Private Key Compromise
**Risk:** Attacker gains access to owner's private key

**Mitigation:**
- Owner can cancel recovery anytime during 24h window
- Keep backup private key encrypted and offline
- Use hardware wallet with secure storage

### Attack Vector 4: Guardian Key Leak
**Risk:** Multiple guardian keys are compromised

**Mitigation:**
- Use high threshold (≥3 of 5) to require majority
- Monitor approval activity for unusual patterns
- Rotate guardian keys regularly

## 10. Audit Recommendations

### Before Production Deployment
- [ ] Security audit by specialized Solana firm
- [ ] Formal verification of CPI safety
- [ ] Fuzz testing of all instructions
- [ ] Gas optimization review
- [ ] PDA collision analysis

### Regular Maintenance
- [ ] Monthly security reviews
- [ ] Quarterly disaster recovery drills
- [ ] Annual guardian rotation
- [ ] Continuous monitoring for suspicious activity

## 11. Incident Response Plan

### If Owner Key is Compromised
```
STEP 1: Detect (24h challenge period detection)
        - Notice unauthorized recovery attempt
        - Check wallet for unusual activity
        
STEP 2: Respond Immediately
        - Cancel recovery if within 24h window
        - Contact all guardians immediately
        - Begin guardian recovery process
        
STEP 3: Long-term
        - Rotate owner keypair
        - Update all guardian contacts
        - Review security practices
```

### If Guardian Key is Compromised
```
STEP 1: Owner initiates recovery
STEP 2: Remaining guardians approve
STEP 3: After 24h, finalize recovery
STEP 4: Rotate out compromised guardian
```

## 12. Compliance & Legal

### Documentation to Keep
- Guardian agreements and acknowledgments
- Recovery procedure documentation
- Audit logs and transaction history
- Emergency contact information
- Insurance policies covering digital assets

### Regulatory Considerations
- Check local regulations for digital asset custody
- Ensure compliance with financial regulations if applicable
- Document governance procedures for audits
- Consider liability insurance

## 13. Testing & Drills

### Monthly Guardian Drill
```bash
# Test that all guardians can still approve recovery
# 1. Initiate recovery with guardian 1
# 2. Each guardian confirms they can approve
# 3. Owner cancels after confirmation
# Keep records of who participated
```

### Quarterly Full Recovery
```bash
# On testnet: perform complete recovery flow
# 1. Initialize new wallet
# 2. Initiate recovery
# 3. All guardians approve
# 4. Wait 24h and finalize
# Verify process works end-to-end
```

## References & Further Reading

- [Solana Program Security Best Practices](https://docs.solana.com/developing/programming-model/transactions)
- [Anchor Security Patterns](https://www.anchor-lang.com/docs/security)
- [Multi-Sig Wallet Design](https://github.com/solana-labs/solana-program-library)

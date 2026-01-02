#!/usr/bin/env bash
# 🛡️ GuardianGate Quick Reference
# A handy reference for common commands and workflows

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  🛡️  GuardianGate Quick Reference                     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to display command with description
show_command() {
    local category=$1
    local command=$2
    local description=$3
    
    if [ "$LAST_CATEGORY" != "$category" ]; then
        echo -e "\n${GREEN}$category${NC}"
        LAST_CATEGORY=$category
    fi
    
    echo -e "  ${YELLOW}$command${NC}"
    echo -e "    → $description"
}

# Development
show_command "🔧 DEVELOPMENT" "anchor build" "Build the program"
show_command "🔧 DEVELOPMENT" "anchor clean" "Clear build artifacts"
show_command "🔧 DEVELOPMENT" "anchor expand" "Expand macros for debugging"

# Testing
show_command "🧪 TESTING" "anchor test" "Run full test suite"
show_command "🧪 TESTING" "anchor test -- --nocapture" "Run tests with output"
show_command "🧪 TESTING" "anchor test -- --grep recovery" "Run specific tests"
show_command "🧪 TESTING" "solana-test-validator" "Start local validator"

# Deployment
show_command "🚀 DEPLOYMENT" "./deploy.sh devnet" "Deploy to devnet"
show_command "🚀 DEPLOYMENT" "./deploy.sh mainnet-beta" "Deploy to mainnet"
show_command "🚀 DEPLOYMENT" "anchor deploy --provider.cluster testnet" "Deploy to testnet"

# Configuration
show_command "⚙️  CONFIGURATION" "solana config get" "View current config"
show_command "⚙️  CONFIGURATION" "solana config set --url devnet" "Set network to devnet"
show_command "⚙️  CONFIGURATION" "solana config set --keypair ~/id.json" "Set keypair"

# Wallet
show_command "💰 WALLET" "solana balance" "Check wallet balance"
show_command "💰 WALLET" "solana airdrop 2" "Request SOL on devnet"
show_command "💰 WALLET" "solana address" "Show wallet address"
show_command "💰 WALLET" "solana-keygen new" "Create new keypair"

# Program Inspection
show_command "🔍 PROGRAM INFO" "solana program show \$PROGRAM_ID" "Get program details"
show_command "🔍 PROGRAM INFO" "solana program dump \$PROGRAM_ID program.so" "Download program binary"
show_command "🔍 PROGRAM INFO" "solana account \$PROGRAM_ID" "Get account info"

# IDL Operations
show_command "📋 IDL" "anchor idl init \$PROGRAM_ID" "Initialize IDL"
show_command "📋 IDL" "anchor idl upgrade \$PROGRAM_ID --filepath target/idl/guardian_gate.json" "Update IDL"
show_command "📋 IDL" "anchor idl fetch \$PROGRAM_ID" "Fetch IDL"

# Frontend
show_command "🌐 FRONTEND" "npm install" "Install dependencies"
show_command "🌐 FRONTEND" "npm run dev" "Start dev server"
show_command "🌐 FRONTEND" "npm run build" "Build for production"
show_command "🌐 FRONTEND" "npm run deploy" "Deploy frontend"

# Useful Environment Variables
echo -e "\n${YELLOW}📌 USEFUL ENVIRONMENT VARIABLES${NC}"
cat << 'EOF'
  export PROGRAM_ID="4siqjXoP8nDQstGbDT2FNHLWTYpJtBwMnKb7gqaEwgNJ"
  export CLUSTER="devnet"
  export RPC_URL="https://api.devnet.solana.com"
  
  # Devnet Faucet
  export FAUCET_URL="https://faucet.solana.com"
EOF

# Quick Workflows
echo -e "\n${GREEN}⚡ QUICK WORKFLOWS${NC}"

cat << 'EOF'

  ┌─ LOCAL DEVELOPMENT
  │  1. solana-test-validator                        # Terminal 1: Start validator
  │  2. anchor test                                  # Terminal 2: Run tests
  │
  ├─ DEPLOY & TEST
  │  1. solana config set --url devnet
  │  2. ./deploy.sh devnet
  │  3. anchor test --skip-local-validator
  │
  ├─ COMPLETE RECOVERY FLOW
  │  1. Initialize wallet with guardians
  │  2. Guardian initiates recovery
  │  3. Other guardians approve
  │  4. Wait 24 hours (in production)
  │  5. Finalize recovery
  │
  ├─ OWNER CANCELLATION
  │  1. Current owner detects malicious recovery
  │  2. Cancel within 24-hour window
  │  3. Recovery state is cleared
  │
  └─ FRONTEND INTEGRATION
     1. npm install @coral-xyz/anchor
     2. Import GuardianGateClient
     3. Initialize with connection + keypair
     4. Call methods: initializeWallet, approveRecovery, etc.

EOF

# Key Files
echo -e "${GREEN}📁 KEY FILES${NC}"
cat << 'EOF'
  Smart Contract:
    programs/guardian-gate/src/lib.rs          Main program (543 lines)
    tests/guardian-gate.ts                     Test suite (414 lines)
  
  Frontend:
    app/lib/guardian-gate-client.ts            TypeScript client (251 lines)
    app/components/GuardianManagementDashboard.tsx   React component
    app/config/guardian-gate.config.ts         Configuration
  
  Documentation:
    README.md                                  Project overview
    IMPLEMENTATION_GUIDE.md                    Technical details
    SECURITY.md                                Security best practices
    DELIVERY_SUMMARY.md                        Project summary

EOF

# Troubleshooting
echo -e "${YELLOW}🔧 QUICK TROUBLESHOOTING${NC}"
cat << 'EOF'
  Issue: "Insufficient balance"
  → solana airdrop 2  (devnet only)
  
  Issue: "Program not deployed"
  → Check Program ID in declare_id!() matches deployed program
  → Verify network: solana config get
  
  Issue: Tests fail with "No validator running"
  → Run: solana-test-validator in separate terminal
  → Or use: anchor test --skip-local-validator
  
  Issue: Account not found
  → Ensure PDA derivation uses correct seeds
  → Verify owner/wallet_config PDA generation
  
  Issue: Permission denied (guardian)
  → Verify signer matches registered guardian
  → Check guardian in walletConfig.guardians array

EOF

# Documentation
echo -e "${GREEN}📚 DOCUMENTATION${NC}"
cat << 'EOF'
  Official Docs:
    • https://www.anchor-lang.com/ - Anchor Framework
    • https://docs.solana.com/ - Solana Development
    • https://solana.com/docs/clients/actions - Solana Actions
  
  This Project:
    • IMPLEMENTATION_GUIDE.md for architecture
    • SECURITY.md for security considerations
    • app/examples/complete-recovery-flow.ts for usage

EOF

# Support
echo -e "${BLUE}💡 NEED HELP?${NC}"
cat << 'EOF'
  1. Check IMPLEMENTATION_GUIDE.md for detailed instructions
  2. Review SECURITY.md for security-related questions
  3. Look at tests/ directory for working examples
  4. Examine app/examples/complete-recovery-flow.ts for workflows
  5. Check program documentation in lib.rs

EOF

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

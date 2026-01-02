#!/bin/bash

# GuardianGate Deployment Script
# Automates the deployment of the GuardianGate program to Solana networks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROGRAM_NAME="guardian_gate"
NETWORK="${1:-devnet}"
UPGRADE_AUTHORITY="${2:-}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         GuardianGate Deployment Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Validate network
if [[ "$NETWORK" != "localnet" && "$NETWORK" != "devnet" && "$NETWORK" != "testnet" && "$NETWORK" != "mainnet-beta" ]]; then
    echo -e "${RED}✗ Invalid network: $NETWORK${NC}"
    echo "  Supported networks: localnet, devnet, testnet, mainnet-beta"
    exit 1
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Network: $NETWORK"
echo "  Program: $PROGRAM_NAME"
if [ ! -z "$UPGRADE_AUTHORITY" ]; then
    echo "  Upgrade Authority: $UPGRADE_AUTHORITY"
fi
echo ""

# Step 1: Check dependencies
echo -e "${YELLOW}Step 1: Checking dependencies...${NC}"
command -v anchor >/dev/null 2>&1 || { echo -e "${RED}✗ Anchor CLI not installed${NC}"; exit 1; }
command -v solana >/dev/null 2>&1 || { echo -e "${RED}✗ Solana CLI not installed${NC}"; exit 1; }
echo -e "${GREEN}✓ Dependencies found${NC}\n"

# Step 2: Build the program
echo -e "${YELLOW}Step 2: Building program...${NC}"
anchor build

if [ -f "./target/idl/$PROGRAM_NAME.json" ]; then
    echo -e "${GREEN}✓ Program built successfully${NC}\n"
else
    echo -e "${RED}✗ Build failed - IDL not found${NC}"
    exit 1
fi

# Step 3: Set the cluster
echo -e "${YELLOW}Step 3: Setting cluster to $NETWORK...${NC}"
solana config set --url https://api."$NETWORK".solana.com

# Step 4: Check wallet
echo -e "${YELLOW}Step 4: Checking wallet...${NC}"
WALLET_PUBKEY=$(solana config get | grep "Keypair Path" -A 1 | tail -1)
if [ -z "$WALLET_PUBKEY" ]; then
    echo -e "${RED}✗ No wallet configured${NC}"
    echo "  Run: solana config set --keypair ~/.config/solana/id.json"
    exit 1
fi
echo -e "${GREEN}✓ Wallet: $WALLET_PUBKEY${NC}\n"

# Step 5: Check SOL balance
echo -e "${YELLOW}Step 5: Checking wallet balance...${NC}"
BALANCE=$(solana balance | awk '{print $1}')
echo "  Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${YELLOW}⚠ Warning: Low balance (< 2 SOL)${NC}"
    if [ "$NETWORK" != "mainnet-beta" ]; then
        echo "  Requesting airdrop..."
        solana airdrop 2
    else
        echo -e "${RED}✗ Insufficient balance for mainnet deployment${NC}"
        exit 1
    fi
fi
echo ""

# Step 6: Deploy the program
echo -e "${YELLOW}Step 6: Deploying program to $NETWORK...${NC}"
DEPLOY_OUTPUT=$(anchor deploy --provider.cluster "$NETWORK" 2>&1)

if echo "$DEPLOY_OUTPUT" | grep -q "Program Id:"; then
    PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep "Program Id:" | awk '{print $3}')
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo "  Program ID: $PROGRAM_ID\n"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

# Step 7: Verify deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"
sleep 2

PROGRAM_INFO=$(solana program show "$PROGRAM_ID" 2>/dev/null || echo "")
if echo "$PROGRAM_INFO" | grep -q "Program Id"; then
    echo -e "${GREEN}✓ Program verified on-chain${NC}\n"
else
    echo -e "${YELLOW}⚠ Warning: Could not verify program immediately${NC}"
    echo "  This may take a moment. Check manually:\n"
    echo "  solana program show $PROGRAM_ID --url https://api.$NETWORK.solana.com\n"
fi

# Step 8: Update configuration
echo -e "${YELLOW}Step 8: Generating configuration...${NC}"

# Create config file
CONFIG_FILE="./app/config/deployment.config.ts"
mkdir -p ./app/config

cat > "$CONFIG_FILE" << EOF
/**
 * Auto-generated deployment configuration
 * Generated: $(date)
 * Network: $NETWORK
 */

export const DEPLOYMENT_CONFIG = {
  network: "$NETWORK",
  programId: "$PROGRAM_ID",
  deployedAt: new Date("$(date -u +'%Y-%m-%dT%H:%M:%SZ')"),
  chain: "solana",
  idlPath: "../target/idl/${PROGRAM_NAME}.json",
} as const;

export default DEPLOYMENT_CONFIG;
EOF

echo -e "${GREEN}✓ Configuration generated: $CONFIG_FILE${NC}\n"

# Step 9: Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Update Anchor.toml with the new Program ID:"
echo "   [programs.$NETWORK]"
echo "   guardian_gate = \"$PROGRAM_ID\""
echo ""
echo "2. Update lib.rs declare_id!:"
echo "   declare_id!(\"$PROGRAM_ID\");"
echo ""
echo "3. Update frontend config:"
echo "   GUARDIAN_GATE_PROGRAM_ID = new PublicKey(\"$PROGRAM_ID\")"
echo ""
echo "4. Run tests to verify:"
echo "   anchor test --skip-local-validator"
echo ""
echo "5. Deploy frontend:"
echo "   npm run build && npm run deploy"
echo ""

echo -e "${YELLOW}📡 Explorer Links:${NC}"
if [ "$NETWORK" = "mainnet-beta" ]; then
    echo "   https://explorer.solana.com/address/$PROGRAM_ID"
elif [ "$NETWORK" = "devnet" ]; then
    echo "   https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
else
    echo "   https://explorer.solana.com/address/$PROGRAM_ID?cluster=$NETWORK"
fi
echo ""

echo -e "${YELLOW}ℹ️  Useful Commands:${NC}"
echo "   # View program details"
echo "   solana program show $PROGRAM_ID --url https://api.$NETWORK.solana.com"
echo ""
echo "   # View program account"
echo "   solana account $PROGRAM_ID --url https://api.$NETWORK.solana.com"
echo ""
echo "   # Get program data"
echo "   solana program dump $PROGRAM_ID program.so --url https://api.$NETWORK.solana.com"
echo ""

if [ "$NETWORK" = "mainnet-beta" ]; then
    echo -e "${RED}⚠️  WARNING: MAINNET DEPLOYMENT${NC}"
    echo "   - This is a production deployment"
    echo "   - Ensure thorough testing before production use"
    echo "   - Consider getting security audit done"
    echo ""
fi

echo -e "${GREEN}Deployment ready for use!${NC}\n"

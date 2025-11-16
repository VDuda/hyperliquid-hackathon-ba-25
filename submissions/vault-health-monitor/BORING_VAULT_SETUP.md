# BoringVault Setup Guide

## Option 1: Use Existing BoringVault (Quickest for Demo)

### Find Deployed Vaults on Hyperliquid

1. **Check Hyperliquid Explorer**:
   ```bash
   # Visit Hyperliquid block explorer
   https://explorer.hyperliquid.xyz
   
   # Search for "BoringVault" or "ERC4626" contracts
   # Look for vault contracts with these characteristics:
   # - Has totalAssets() function
   # - Has totalSupply() function
   # - Has manage() or rebalance() functions
   ```

2. **Common BoringVault Addresses** (check if deployed):
   ```
   # Hyperliquid Testnet (example addresses - verify on explorer)
   0x1234567890123456789012345678901234567890  # Example USDC Vault
   0xabcdefabcdefabcdefabcdefabcdefabcdefabcd  # Example Multi-Asset Vault
   
   # Hyperliquid Mainnet
   # Check with Hyperliquid team or community
   ```

3. **Ask in Hyperliquid Discord**:
   - Join: https://discord.gg/hyperliquid
   - Ask in #dev-support: "Are there any deployed BoringVault contracts on testnet?"

---

## Option 2: Deploy Your Own BoringVault (Full Control)

### Prerequisites
- Foundry installed: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- Private key with testnet ETH/HYPE for gas
- GlueX vault whitelist ready

### Step 1: Clone BoringVault Template

```bash
# Create deployment directory
mkdir -p contracts/boring-vault
cd contracts/boring-vault

# Initialize Foundry project
forge init

# Install dependencies
forge install Solmate/solmate
forge install OpenZeppelin/openzeppelin-contracts
```

### Step 2: Create BoringVault Contract

Create `src/BoringVault.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "solmate/tokens/ERC20.sol";
import "solmate/auth/Auth.sol";

/// @title BoringVault
/// @notice Minimal vault for asset custody with restricted management
contract BoringVault is ERC20, Auth {
    ERC20 public immutable asset;
    
    // Whitelist via Merkle root (set by owner)
    bytes32 public whitelistRoot;
    
    event Deposit(address indexed from, uint256 assets, uint256 shares);
    event Withdraw(address indexed to, uint256 assets, uint256 shares);
    event Managed(address indexed target, bytes data);
    
    constructor(
        ERC20 _asset,
        string memory _name,
        string memory _symbol,
        bytes32 _whitelistRoot,
        Authority _authority
    ) ERC20(_name, _symbol, _asset.decimals()) Auth(msg.sender, _authority) {
        asset = _asset;
        whitelistRoot = _whitelistRoot;
    }
    
    /// @notice Deposit assets for shares
    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        shares = convertToShares(assets);
        
        asset.transferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);
        
        emit Deposit(msg.sender, assets, shares);
    }
    
    /// @notice Redeem shares for assets
    function redeem(uint256 shares, address receiver) external returns (uint256 assets) {
        assets = convertToAssets(shares);
        
        _burn(msg.sender, shares);
        asset.transfer(receiver, assets);
        
        emit Withdraw(receiver, assets, shares);
    }
    
    /// @notice Restricted management function for rebalancing
    /// @dev Only callable by authorized manager (e.g., your backend keeper)
    /// @param target Must be in whitelist (verified via Merkle proof off-chain)
    /// @param data Calldata for interaction (e.g., deposit to GlueX vault)
    function manage(address target, bytes calldata data) external requiresAuth {
        // In production: verify target against whitelistRoot via Merkle proof
        // For MVP: trust authorized caller to only use whitelisted targets
        
        (bool success, ) = target.call(data);
        require(success, "Manage call failed");
        
        emit Managed(target, data);
    }
    
    /// @notice Total assets under management
    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }
    
    /// @notice Convert assets to shares (1:1 for simplicity; add fee logic if needed)
    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply;
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }
    
    /// @notice Convert shares to assets
    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply;
        return supply == 0 ? shares : (shares * totalAssets()) / supply;
    }
    
    /// @notice Update whitelist root (owner only)
    function setWhitelistRoot(bytes32 newRoot) external requiresAuth {
        whitelistRoot = newRoot;
    }
}
```

### Step 3: Create Deploy Script

Create `script/Deploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BoringVault.sol";
import "solmate/auth/authorities/RolesAuthority.sol";

contract DeployBoringVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Hyperliquid USDC address (replace with actual)
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        // Whitelist root (generate from your whitelist.ts)
        bytes32 whitelistRoot = vm.envBytes32("WHITELIST_ROOT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy authority (simple role-based)
        RolesAuthority authority = new RolesAuthority(deployer, Authority(address(0)));
        
        // Deploy vault
        BoringVault vault = new BoringVault(
            ERC20(usdcAddress),
            "Boring USDC Vault",
            "bUSDC",
            whitelistRoot,
            authority
        );
        
        // Grant manager role to deployer (for testing)
        authority.setRoleCapability(0, address(vault), BoringVault.manage.selector, true);
        authority.setUserRole(deployer, 0, true);
        
        vm.stopBroadcast();
        
        console.log("BoringVault deployed at:", address(vault));
        console.log("Authority deployed at:", address(authority));
    }
}
```

### Step 4: Configure Deployment

Create `.env` in contracts folder:

```env
# Hyperliquid RPC
RPC_URL=https://rpc.hyperliquid.xyz

# Your deployer private key (NEVER commit this!)
PRIVATE_KEY=0xYourPrivateKeyHere

# USDC on Hyperliquid (get from explorer)
USDC_ADDRESS=0xUSDCAddressOnHyperliquid

# Whitelist root (generate from whitelist.ts - see below)
WHITELIST_ROOT=0x0000000000000000000000000000000000000000000000000000000000000000
```

### Step 5: Generate Whitelist Merkle Root

In your Next.js app, create `scripts/generate-merkle.ts`:

```typescript
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { WHITELISTED_GLUE_X_VAULTS } from "../lib/whitelist";

// Generate Merkle tree from whitelist
const tree = StandardMerkleTree.of(
  WHITELISTED_GLUE_X_VAULTS.map(addr => [addr]),
  ["address"]
);

console.log("Merkle Root:", tree.root);
console.log("\nProofs:");
for (const [i, v] of tree.entries()) {
  console.log(`${v[0]}: ${tree.getProof(i)}`);
}
```

Run: `bun run scripts/generate-merkle.ts`

### Step 6: Deploy to Hyperliquid

```bash
cd contracts/boring-vault

# Compile
forge build

# Deploy to testnet
forge script script/Deploy.s.sol:DeployBoringVault \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify

# Copy deployed address to your .env.local
# BORING_VAULT_ADDRESS=0x... (from console output)
```

---

## Option 3: Mock BoringVault for Demo (Fastest)

If you just need to demo the UI/UX without on-chain interaction:

### Update `.env.local`:

```env
# Use a placeholder address
BORING_VAULT_ADDRESS=0x1234567890123456789012345678901234567890

# Enable mock mode
MOCK_MODE=true
```

### Update `lib/boring.ts` to detect mock mode:

```typescript
const MOCK_MODE = process.env.MOCK_MODE === 'true';

export async function getCurrentState() {
  if (MOCK_MODE) {
    // Return realistic mock data
    return {
      tvlUsd: 1_250_000,
      sharePrice: 1.05,
      collateralRatio: 1.85,
      timestamp: Date.now(),
      block: 12345678,
      apy: 8.5,
    };
  }
  
  // Real implementation...
}
```

This lets you demo the full UI flow without deploying contracts.

---

## Recommended Approach for Hackathon

**For fastest demo**: Use **Option 3 (Mock Mode)** to show UI/UX, then mention in your presentation:

> "In production, this would connect to a deployed BoringVault at address 0x... 
> For this demo, we're using mock data to showcase the monitoring and optimization flow."

**For full implementation**: Use **Option 1** (find existing vault) or **Option 2** (deploy your own) if you have time.

---

## Quick Start Commands

```bash
# Option 3 (Mock Mode - Recommended for Demo)
cd /Users/vlad/hackathon/hyperliquid-hackathon-ba-25/submissions/vault-health-monitor
echo "MOCK_MODE=true" >> .env.local
bun dev

# Option 2 (Deploy Your Own)
mkdir -p contracts/boring-vault
cd contracts/boring-vault
forge init
# ... follow steps above

# Option 1 (Find Existing)
# Check Hyperliquid explorer or Discord
```

---

## Next Steps

1. **Choose your option** (recommend Option 3 for quick demo)
2. **Update `.env.local`** with vault address or enable mock mode
3. **I'll implement the full GlueX integration** with:
   - Yields API integration
   - Router API for rebalancing
   - Whitelist enforcement
   - OptimizeModal with WalletConnect
   - YieldRanking table

Ready to proceed with the GlueX integration implementation?

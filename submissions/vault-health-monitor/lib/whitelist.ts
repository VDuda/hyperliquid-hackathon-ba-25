/**
 * GlueX Vault Whitelist
 * 
 * Hardcoded list of approved GlueX-integrated vaults for BoringVault rebalancing.
 * These addresses are enforced via Merkle root in the BoringVault's manage() function.
 */

export const WHITELISTED_GLUE_X_VAULTS: `0x${string}`[] = [
  // Example GlueX-integrated vaults on Hyperliquid
  // Replace with actual deployed addresses from GlueX ecosystem
  
  '0xBeef0000000000000000000000000000DeaDBeef' as `0x${string}`, // Beefy USDC Vault
  '0xYearn000000000000000000000000000DeaDBeef' as `0x${string}`, // Yearn Strategy Vault
  '0xGlueX000000000000000000000000000DeaDBeef' as `0x${string}`, // GlueX Native Vault
  '0xStake000000000000000000000000000DeaDBeef' as `0x${string}`, // Staking Vault
  '0xFarm0000000000000000000000000000DeaDBeef' as `0x${string}`, // Farming Vault
];

/**
 * Check if a vault address is in the whitelist
 */
export function isWhitelisted(vaultAddr: string): boolean {
  const normalized = vaultAddr.toLowerCase();
  return WHITELISTED_GLUE_X_VAULTS.some(
    addr => addr.toLowerCase() === normalized
  );
}

/**
 * Get whitelist for environment variable parsing
 */
export function getWhitelistFromEnv(): `0x${string}`[] {
  const envVaults = process.env.WHITELISTED_VAULTS;
  if (!envVaults) return WHITELISTED_GLUE_X_VAULTS;
  
  return envVaults.split(',').map(addr => addr.trim() as `0x${string}`);
}

/**
 * Generate Merkle root for BoringVault deployment
 * Note: In production, use @openzeppelin/merkle-tree to generate this
 */
export function getMerkleRoot(): `0x${string}` {
  // Placeholder - generate using scripts/generate-merkle.ts
  return '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
}

/**
 * Validate vault address format
 */
export function isValidAddress(addr: string): addr is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

/**
 * Get whitelisted vaults with metadata (for UI display)
 */
export interface WhitelistedVault {
  address: `0x${string}`;
  name: string;
  protocol: string;
  description: string;
}

export const WHITELISTED_VAULTS_METADATA: WhitelistedVault[] = [
  {
    address: '0xBeef0000000000000000000000000000DeaDBeef' as `0x${string}`,
    name: 'Beefy USDC Vault',
    protocol: 'Beefy Finance',
    description: 'Auto-compounding USDC yield farming',
  },
  {
    address: '0xYearn000000000000000000000000000DeaDBeef' as `0x${string}`,
    name: 'Yearn Strategy Vault',
    protocol: 'Yearn Finance',
    description: 'Multi-strategy yield optimization',
  },
  {
    address: '0xGlueX000000000000000000000000000DeaDBeef' as `0x${string}`,
    name: 'GlueX Native Vault',
    protocol: 'GlueX',
    description: 'GlueX-native yield aggregation',
  },
  {
    address: '0xStake000000000000000000000000000DeaDBeef' as `0x${string}`,
    name: 'Staking Vault',
    protocol: 'Hyperliquid',
    description: 'Native token staking rewards',
  },
  {
    address: '0xFarm0000000000000000000000000000DeaDBeef' as `0x${string}`,
    name: 'Farming Vault',
    protocol: 'GlueX',
    description: 'LP token farming strategies',
  },
];

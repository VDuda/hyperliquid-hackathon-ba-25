// BoringVault integration for state monitoring and event parsing

import { createPublicClient, createWalletClient, http, parseAbiItem, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hyperliquid } from './lava';
import { boringVaultABI } from './abi';
import { isWhitelisted } from './whitelist';

const VAULT_ADDRESS = (process.env.BORING_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// Create public client for reading
const publicClient = createPublicClient({
  chain: hyperliquid,
  transport: http(process.env.LAVA_RPC_HTTPS),
});

export interface VaultState {
  tvlUsd: number;
  sharePrice: number;
  collateralRatio: number;
  timestamp: number;
  block: number;
}

export interface VaultEvent {
  type: 'Deposit' | 'Withdraw' | 'Rebalance';
  user?: string;
  amount?: number;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

// Get current vault state
export async function getCurrentState(): Promise<VaultState> {
  if (MOCK_MODE) {
    return {
      tvlUsd: 1_250_000 + Math.random() * 100000,
      sharePrice: 1.05 + Math.random() * 0.05,
      collateralRatio: 1.75 + Math.random() * 0.2,
      timestamp: Date.now(),
      block: 12345678 + Math.floor(Math.random() * 1000),
    };
  }

  try {
    const [totalAssets, totalSupply, latestBlock] = await Promise.all([
      publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: boringVaultABI,
        functionName: 'totalAssets',
      }),
      publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: boringVaultABI,
        functionName: 'totalSupply',
      }),
      publicClient.getBlock({ blockTag: 'latest' }),
    ]);

    const tvlUsd = Number(totalAssets) / 1e6; // assuming USDC with 6 decimals
    const sharePrice = Number(totalSupply) > 0 ? Number(totalAssets) / Number(totalSupply) : 1;
    const collateralRatio = await getCollateralRatio(tvlUsd);

    return {
      tvlUsd,
      sharePrice,
      collateralRatio,
      timestamp: Number(latestBlock.timestamp) * 1000,
      block: Number(latestBlock.number),
    };
  } catch (error) {
    console.error('Error fetching vault state:', error);
    throw error;
  }
}

// Calculate collateral ratio (mock implementation)
async function getCollateralRatio(tvlUsd: number): Promise<number> {
  // In production, this would calculate actual collateral ratio
  // based on vault's asset composition and liabilities
  // For demo, return a value between 1.5 and 2.5
  return 1.5 + Math.random();
}

// Get historical vault events
export async function getHistory(days: number = 7): Promise<VaultEvent[]> {
  try {
    const latest = await publicClient.getBlock({ blockTag: 'latest' });
    const blocksPerDay = Math.floor(86400 / 3); // ~3s block time
    const fromBlock = latest.number - BigInt(blocksPerDay * days);

    // Fetch Deposit events
    const depositLogs = await publicClient.getLogs({
      address: VAULT_ADDRESS,
      event: parseAbiItem('event Deposit(address indexed user, uint256 amount)'),
      fromBlock,
      toBlock: 'latest',
    });

    // Fetch Withdraw events
    const withdrawLogs = await publicClient.getLogs({
      address: VAULT_ADDRESS,
      event: parseAbiItem('event Withdraw(address indexed user, uint256 amount)'),
      fromBlock,
      toBlock: 'latest',
    });

    // Fetch Rebalance events
    const rebalanceLogs = await publicClient.getLogs({
      address: VAULT_ADDRESS,
      event: parseAbiItem('event Rebalance(uint256 oldRatio, uint256 newRatio)'),
      fromBlock,
      toBlock: 'latest',
    });

    // Parse and combine all events
    const events: VaultEvent[] = [];

    for (const log of depositLogs) {
      events.push({
        type: 'Deposit',
        user: log.args.user,
        amount: Number(log.args.amount) / 1e6,
        timestamp: Number(log.blockNumber) * 3000, // approximate timestamp
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash || '',
      });
    }

    for (const log of withdrawLogs) {
      events.push({
        type: 'Withdraw',
        user: log.args.user,
        amount: Number(log.args.amount) / 1e6,
        timestamp: Number(log.blockNumber) * 3000,
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash || '',
      });
    }

    for (const log of rebalanceLogs) {
      events.push({
        type: 'Rebalance',
        timestamp: Number(log.blockNumber) * 3000,
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash || '',
      });
    }

    // Sort by timestamp descending
    return events.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    // Return mock data for demo
    return generateMockHistory(days);
  }
}

// Generate mock historical data for demo
function generateMockHistory(days: number): VaultEvent[] {
  const events: VaultEvent[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  for (let i = 0; i < days * 3; i++) {
    const timestamp = now - Math.random() * days * dayMs;
    const types: ('Deposit' | 'Withdraw' | 'Rebalance')[] = ['Deposit', 'Withdraw', 'Rebalance'];
    const type = types[Math.floor(Math.random() * types.length)];

    events.push({
      type,
      user: type !== 'Rebalance' ? `0x${Math.random().toString(16).slice(2, 42)}` : undefined,
      amount: type !== 'Rebalance' ? Math.random() * 10000 : undefined,
      timestamp,
      blockNumber: Math.floor(timestamp / 3000),
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// Generate time series data for charts
export async function getTimeSeriesData(days: number = 7) {
  const events = await getHistory(days);
  const now = Date.now();
  const dayMs = 86400000;
  const points: { timestamp: number; tvl: number; deposits: number; withdrawals: number }[] = [];

  let currentTvl = 1000000; // Starting TVL

  for (let i = days; i >= 0; i--) {
    const dayStart = now - i * dayMs;
    const dayEvents = events.filter(
      e => e.timestamp >= dayStart && e.timestamp < dayStart + dayMs
    );

    const deposits = dayEvents
      .filter(e => e.type === 'Deposit')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const withdrawals = dayEvents
      .filter(e => e.type === 'Withdraw')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    currentTvl += deposits - withdrawals;

    points.push({
      timestamp: dayStart,
      tvl: currentTvl,
      deposits,
      withdrawals,
    });
  }

  return points;
}

/**
 * Execute rebalance via BoringVault manage() function
 * Only allows whitelisted vault targets
 */
export async function executeRebalance(
  calldata: `0x${string}`,
  targetVault: `0x${string}`,
  walletClient?: any
): Promise<`0x${string}`> {
  if (MOCK_MODE) {
    // Return mock transaction hash
    return `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` as `0x${string}`;
  }

  // Validate whitelist
  if (!isWhitelisted(targetVault)) {
    throw new Error(`Target vault ${targetVault} is not in whitelist`);
  }

  if (!walletClient) {
    throw new Error('Wallet client required for rebalance execution');
  }

  try {
    const hash = await walletClient.writeContract({
      address: VAULT_ADDRESS,
      abi: boringVaultABI,
      functionName: 'manage',
      args: [targetVault, calldata],
    });

    return hash;
  } catch (error) {
    console.error('Rebalance execution error:', error);
    throw error;
  }
}

/**
 * Update getCurrentState to support mock mode
 */
export async function getCurrentStateWithMock(): Promise<VaultState> {
  if (MOCK_MODE) {
    return {
      tvlUsd: 1_250_000 + Math.random() * 100000,
      sharePrice: 1.05 + Math.random() * 0.05,
      collateralRatio: 1.75 + Math.random() * 0.2,
      timestamp: Date.now(),
      block: 12345678 + Math.floor(Math.random() * 1000),
    };
  }

  return getCurrentState();
}

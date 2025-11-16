import { createPublicClient, http, defineChain } from 'viem';

// Hyperliquid chain configuration
export const hyperliquid = defineChain({
  id: 998, // Hyperliquid chain ID
  name: 'Hyperliquid',
  nativeCurrency: {
    decimals: 18,
    name: 'Hyperliquid',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: {
      http: [process.env.LAVA_RPC_HTTPS || 'https://rpc.lavanet.xyz'],
    },
    public: {
      http: [process.env.LAVA_RPC_HTTPS || 'https://rpc.lavanet.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.hyperliquid.xyz' },
  },
});

// Public client for reading blockchain data via Lava RPC
export const publicClient = createPublicClient({
  chain: hyperliquid,
  transport: http(process.env.LAVA_RPC_HTTPS || 'https://rpc.lavanet.xyz'),
});

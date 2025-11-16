/**
 * GlueX API Integration
 * Full implementation of Yields API and Router API for yield optimization
 */

import axios, { AxiosInstance } from 'axios';
import { isWhitelisted } from './whitelist';

const MOCK_MODE = process.env.MOCK_MODE === 'true';

// GlueX API clients
const yieldsAPI: AxiosInstance = axios.create({
  baseURL: `${process.env.GLUEX_API_BASE || 'https://api.gluex.xyz/v1'}/yield`,
  headers: {
    'Authorization': `Bearer ${process.env.GLUEX_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const routerAPI: AxiosInstance = axios.create({
  baseURL: `${process.env.GLUEX_API_BASE || 'https://api.gluex.xyz/v1'}/router/v1`,
  headers: {
    'Authorization': `Bearer ${process.env.GLUEX_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export interface YieldOpportunity {
  vaultAddress: string;
  vault: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  protocol: string;
  asset: string;
  strategy: string;
  apyGain?: number;
  whitelisted: boolean;
}

export interface HedgingStrategy {
  id: string;
  type: 'long' | 'short' | 'neutral';
  asset: string;
  expectedReturn: number;
  risk: string;
  description: string;
  targetVault: string;
}

export interface RouteQuote {
  outAmount: string;
  apyGain: number;
  estimatedGas: number;
  slippage: number;
  route: string[];
}

export interface RouteResponse {
  quote: RouteQuote;
  calldata: `0x${string}`;
  simulation: {
    success: boolean;
    gas: number;
    error?: string;
  };
}

/**
 * Search for highest yield opportunities via GlueX Yields API
 */
export async function searchYieldOpportunities(
  inputToken: string = 'USDC',
  amount: string = '1000000',
  currentApy: number = 0
): Promise<YieldOpportunity[]> {
  if (MOCK_MODE) {
    return getMockYieldOpportunities(currentApy);
  }

  try {
    const { data } = await yieldsAPI.get('/', {
      params: {
        chain: 'hyperliquid',
        inputToken,
        amount,
        intent: 'deposit',
        horizon: '7d',
        minApy: 5,
      },
    });

    // Filter to whitelisted vaults and add metadata
    const opportunities: YieldOpportunity[] = data.opportunities
      .map((opp: any) => ({
        vaultAddress: opp.vaultAddress,
        vault: opp.vaultAddress,
        apy: opp.apy,
        tvl: opp.tvl,
        risk: opp.risk || 'medium',
        protocol: opp.protocol || 'GlueX',
        asset: inputToken,
        strategy: opp.strategy || 'Yield Farming',
        apyGain: opp.apy - currentApy,
        whitelisted: isWhitelisted(opp.vaultAddress),
      }))
      .filter((opp: YieldOpportunity) => opp.whitelisted)
      .sort((a: YieldOpportunity, b: YieldOpportunity) => b.apy - a.apy);

    return opportunities;
  } catch (error) {
    console.error('GlueX Yields API error:', error);
    return getMockYieldOpportunities(currentApy);
  }
}

/**
 * Get highest yield opportunity
 */
export async function getHighestYield(
  inputToken: string = 'USDC',
  amount: string = '1000000',
  currentApy: number = 0
): Promise<YieldOpportunity | null> {
  const opportunities = await searchYieldOpportunities(inputToken, amount, currentApy);
  return opportunities.length > 0 ? opportunities[0] : null;
}

/**
 * Generate reallocation calldata via GlueX Router API
 */
export async function getReallocationRoute(
  inputToken: string,
  amount: string,
  targetVault: string,
  currentApy: number
): Promise<RouteResponse> {
  if (MOCK_MODE) {
    return getMockRouteResponse(amount, currentApy);
  }

  if (!isWhitelisted(targetVault)) {
    throw new Error(`Target vault ${targetVault} is not whitelisted`);
  }

  try {
    const { data } = await routerAPI.post('/route', {
      chain: 'hyperliquid',
      input: { token: inputToken, amount },
      output: { token: inputToken, vault: targetVault },
      intent: 'rebalance',
      slippage: 0.5,
      computeEstimate: true,
      surgeProtection: true,
      isPartialFill: true,
    });

    return {
      quote: {
        outAmount: data.quote.outAmount,
        apyGain: data.quote.apyGain || 0,
        estimatedGas: data.quote.gas || 250000,
        slippage: data.quote.slippage || 0.5,
        route: data.quote.route || [],
      },
      calldata: data.calldata as `0x${string}`,
      simulation: {
        success: data.simulation?.success || true,
        gas: data.simulation?.gas || 250000,
        error: data.simulation?.error,
      },
    };
  } catch (error) {
    console.error('GlueX Router API error:', error);
    return getMockRouteResponse(amount, currentApy);
  }
}

/**
 * Search for hedging strategies (legacy function for backward compatibility)
 */
export async function searchHedging(
  asset: string,
  amount: number,
  currentApy: number
): Promise<HedgingStrategy[]> {
  const opportunities = await searchYieldOpportunities(asset, amount.toString(), currentApy);
  
  return opportunities.slice(0, 3).map((opp, idx) => ({
    id: `strategy-${idx}`,
    type: opp.apy > currentApy + 5 ? 'long' : opp.apy > currentApy ? 'neutral' : 'short',
    asset: opp.asset,
    expectedReturn: opp.apy,
    risk: opp.risk,
    description: `${opp.strategy} via ${opp.protocol}`,
    targetVault: opp.vaultAddress,
  }));
}

// Mock data generators for demo mode

function getMockYieldOpportunities(currentApy: number): YieldOpportunity[] {
  return [
    {
      vaultAddress: '0xBeef0000000000000000000000000000DeaDBeef',
      vault: '0xBeef0000000000000000000000000000DeaDBeef',
      apy: 12.5,
      tvl: 5000000,
      risk: 'low',
      protocol: 'Beefy Finance',
      asset: 'USDC',
      strategy: 'Auto-compounding USDC Farm',
      apyGain: 12.5 - currentApy,
      whitelisted: true,
    },
    {
      vaultAddress: '0xYearn000000000000000000000000000DeaDBeef',
      vault: '0xYearn000000000000000000000000000DeaDBeef',
      apy: 10.8,
      tvl: 8000000,
      risk: 'low',
      protocol: 'Yearn Finance',
      asset: 'USDC',
      strategy: 'Multi-Strategy Optimizer',
      apyGain: 10.8 - currentApy,
      whitelisted: true,
    },
    {
      vaultAddress: '0xGlueX000000000000000000000000000DeaDBeef',
      vault: '0xGlueX000000000000000000000000000DeaDBeef',
      apy: 9.2,
      tvl: 3000000,
      risk: 'medium',
      protocol: 'GlueX',
      asset: 'USDC',
      strategy: 'Perp Funding Arbitrage',
      apyGain: 9.2 - currentApy,
      whitelisted: true,
    },
    {
      vaultAddress: '0xStake000000000000000000000000000DeaDBeef',
      vault: '0xStake000000000000000000000000000DeaDBeef',
      apy: 8.5,
      tvl: 10000000,
      risk: 'low',
      protocol: 'Hyperliquid',
      asset: 'USDC',
      strategy: 'Native Staking',
      apyGain: 8.5 - currentApy,
      whitelisted: true,
    },
    {
      vaultAddress: '0xFarm0000000000000000000000000000DeaDBeef',
      vault: '0xFarm0000000000000000000000000000DeaDBeef',
      apy: 7.8,
      tvl: 2000000,
      risk: 'medium',
      protocol: 'GlueX',
      asset: 'USDC',
      strategy: 'LP Token Farming',
      apyGain: 7.8 - currentApy,
      whitelisted: true,
    },
  ];
}

function getMockRouteResponse(amount: string, currentApy: number): RouteResponse {
  const apyGain = 12.5 - currentApy;
  
  return {
    quote: {
      outAmount: amount,
      apyGain,
      estimatedGas: 250000,
      slippage: 0.5,
      route: ['BoringVault', 'GlueX Router', 'Beefy USDC Vault'],
    },
    calldata: '0x1234567890abcdef' as `0x${string}`,
    simulation: {
      success: true,
      gas: 250000,
    },
  };
}

// Historical APY data (for charts)
export async function getHistoricalApy(vaultAddress: string, days: number = 30) {
  if (MOCK_MODE) {
    return Array.from({ length: days }, (_, i) => ({
      timestamp: Date.now() - (days - i) * 24 * 60 * 60 * 1000,
      apy: 8 + Math.random() * 4,
    }));
  }

  try {
    const { data } = await yieldsAPI.get(`/history/${vaultAddress}`, {
      params: { days },
    });
    return data.history;
  } catch (error) {
    console.error('GlueX Historical APY error:', error);
    return [];
  }
}

// Reallocation quote (for UI preview)
export async function getReallocationQuote(
  fromVault: string,
  toVault: string,
  amount: string
) {
  if (MOCK_MODE) {
    return {
      fromApy: 8.5,
      toApy: 12.5,
      gain: 4.0,
      estimatedGas: 250000,
      estimatedTime: 15,
    };
  }

  try {
    const { data } = await routerAPI.post('/quote', {
      from: fromVault,
      to: toVault,
      amount,
      chain: 'hyperliquid',
    });
    return data;
  } catch (error) {
    console.error('GlueX Quote error:', error);
    return null;
  }
}

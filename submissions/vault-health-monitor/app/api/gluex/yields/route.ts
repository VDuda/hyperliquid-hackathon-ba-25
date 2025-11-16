import { NextRequest } from 'next/server';
import { searchYieldOpportunities, getHighestYield } from '@/lib/gluex';

/**
 * GET /api/gluex/yields
 * Search for highest yield opportunities via GlueX Yields API
 * Filters to whitelisted vaults only
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inputToken = searchParams.get('inputToken') || 'USDC';
    const amount = searchParams.get('amount') || '1000000';
    const currentApy = parseFloat(searchParams.get('currentApy') || '0');

    const opportunities = await searchYieldOpportunities(inputToken, amount, currentApy);
    const highest = opportunities.length > 0 ? opportunities[0] : null;

    return Response.json({
      highest,
      topOpportunities: opportunities.slice(0, 5),
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Yields API error:', error);
    return Response.json(
      { error: 'Failed to fetch yield opportunities' },
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { getReallocationRoute } from '@/lib/gluex';

/**
 * POST /api/gluex/route
 * Generate reallocation calldata via GlueX Router API
 * Returns quote, calldata, and simulation results
 */
export async function POST(req: NextRequest) {
  try {
    const { inputToken, amount, targetVault, currentApy } = await req.json();

    if (!inputToken || !amount || !targetVault) {
      return Response.json(
        { error: 'Missing required parameters: inputToken, amount, targetVault' },
        { status: 400 }
      );
    }

    const route = await getReallocationRoute(
      inputToken,
      amount,
      targetVault,
      currentApy || 0
    );

    return Response.json({
      ...route,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Router API error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate route' },
      { status: 500 }
    );
  }
}

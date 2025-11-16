import { NextRequest } from 'next/server';
import { getCurrentState, executeRebalance } from '@/lib/boring';
import { getHighestYield, getReallocationRoute } from '@/lib/gluex';
import { useAlertStore } from '@/lib/store';

/**
 * POST /api/execute
 * Execute rebalance to highest yield opportunity
 * Combines Yields API → Router API → BoringVault manage()
 */
export async function POST(req: NextRequest) {
  try {
    const { targetVault, calldata, amount } = await req.json();

    if (!targetVault || !calldata) {
      return Response.json(
        { error: 'Missing required parameters: targetVault, calldata' },
        { status: 400 }
      );
    }

    // In production, this would use a backend wallet or require user signature
    // For MVP, we return the prepared transaction for frontend execution
    const MOCK_MODE = process.env.MOCK_MODE === 'true';

    if (MOCK_MODE) {
      // Simulate execution
      const mockHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}` as `0x${string}`;
      
      return Response.json({
        hash: mockHash,
        success: true,
        message: 'Rebalance executed successfully (mock mode)',
        timestamp: Date.now(),
      });
    }

    // Real execution would happen here via backend wallet
    // For now, return transaction data for frontend to execute
    return Response.json({
      success: false,
      message: 'Please execute via wallet in frontend',
      txData: {
        to: process.env.BORING_VAULT_ADDRESS,
        data: calldata,
        value: '0',
      },
    });
  } catch (error: any) {
    console.error('Execute API error:', error);
    return Response.json(
      { error: error.message || 'Failed to execute rebalance' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/execute/prepare
 * Prepare rebalance transaction (get calldata + quote)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const percentage = parseFloat(searchParams.get('percentage') || '20');

    // Get current state
    const state = await getCurrentState();
    const rebalanceAmount = Math.floor(state.tvlUsd * (percentage / 100));

    // Get highest yield
    const highest = await getHighestYield('USDC', rebalanceAmount.toString(), 8.5);

    if (!highest) {
      return Response.json({ error: 'No suitable yield opportunities found' }, { status: 404 });
    }

    // Get route
    const route = await getReallocationRoute(
      'USDC',
      rebalanceAmount.toString(),
      highest.vaultAddress,
      8.5
    );

    return Response.json({
      opportunity: highest,
      route,
      rebalanceAmount,
      currentTvl: state.tvlUsd,
      percentage,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Prepare API error:', error);
    return Response.json(
      { error: error.message || 'Failed to prepare rebalance' },
      { status: 500 }
    );
  }
}

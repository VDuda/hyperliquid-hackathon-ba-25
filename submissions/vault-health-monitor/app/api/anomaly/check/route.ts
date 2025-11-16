import { getCurrentState } from '@/lib/boring';
import { searchHedging } from '@/lib/gluex';
import { getRecentStates } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const THRESHOLDS = {
  tvlDrop: 0.08, // 8% drop triggers alert
  collateralLow: 1.5,
  volatilityHigh: 0.15, // 15% volatility
};

export async function GET() {
  try {
    const current = await getCurrentState();
    const history = getRecentStates();

    // Check for TVL drop
    if (history.length > 0) {
      const oldestState = history[0];
      const tvlDrop = (oldestState.tvlUsd - current.tvlUsd) / oldestState.tvlUsd;

      if (tvlDrop > THRESHOLDS.tvlDrop) {
        const strategies = await searchHedging(current);
        return Response.json({
          id: Date.now(),
          type: 'TVL_DROP',
          severity: 'high',
          message: `TVL dropped ${(tvlDrop * 100).toFixed(1)}% in last hour`,
          strategies,
          timestamp: Date.now(),
          currentState: current,
        });
      }

      // Check for high volatility
      const tvlValues = history.map(s => s.tvlUsd);
      const mean = tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length;
      const variance = tvlValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / tvlValues.length;
      const stdDev = Math.sqrt(variance);
      const volatility = stdDev / mean;

      if (volatility > THRESHOLDS.volatilityHigh) {
        const strategies = await searchHedging(current);
        return Response.json({
          id: Date.now(),
          type: 'HIGH_VOLATILITY',
          severity: 'medium',
          message: `High TVL volatility detected: ${(volatility * 100).toFixed(1)}%`,
          strategies,
          timestamp: Date.now(),
          currentState: current,
        });
      }
    }

    // Check for low collateral ratio
    if (current.collateralRatio < THRESHOLDS.collateralLow) {
      const strategies = await searchHedging(current);
      return Response.json({
        id: Date.now(),
        type: 'COLLATERAL_LOW',
        severity: 'high',
        message: `Collateral ratio below threshold: ${current.collateralRatio.toFixed(2)}`,
        strategies,
        timestamp: Date.now(),
        currentState: current,
      });
    }

    // No anomalies detected
    return Response.json({
      ok: true,
      message: 'No anomalies detected',
      currentState: current,
    });
  } catch (error) {
    console.error('Error checking for anomalies:', error);
    return Response.json(
      { error: 'Failed to check for anomalies' },
      { status: 500 }
    );
  }
}

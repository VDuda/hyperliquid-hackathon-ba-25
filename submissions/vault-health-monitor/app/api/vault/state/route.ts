import { getCurrentState } from '@/lib/boring';
import { addRecentState } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const state = await getCurrentState();
    
    // Cache state for anomaly detection
    addRecentState(state.tvlUsd);
    
    return Response.json(state);
  } catch (error) {
    console.error('Error fetching vault state:', error);
    return Response.json(
      { error: 'Failed to fetch vault state' },
      { status: 500 }
    );
  }
}

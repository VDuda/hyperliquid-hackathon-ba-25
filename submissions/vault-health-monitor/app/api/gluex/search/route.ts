import { searchYieldOpportunities } from '@/lib/gluex';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const opportunities = await searchYieldOpportunities();
    
    return Response.json({ opportunities });
  } catch (error) {
    console.error('Error searching yield opportunities:', error);
    return Response.json(
      { error: 'Failed to search yield opportunities' },
      { status: 500 }
    );
  }
}

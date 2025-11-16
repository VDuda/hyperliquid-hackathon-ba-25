import { getTimeSeriesData } from '@/lib/boring';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    const data = await getTimeSeriesData(days);
    
    return Response.json({ data, days });
  } catch (error) {
    console.error('Error fetching vault history:', error);
    return Response.json(
      { error: 'Failed to fetch vault history' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isValidDate } from '@/lib/date';
import { findSpot } from '@/lib/spots';
import { rateOneSpot } from '@/lib/ratingsService';
import { WeatherServiceError } from '@/lib/openMeteo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spotId: string }> },
) {
  const { spotId } = await params;
  const date = request.nextUrl.searchParams.get('date');
  if (!isValidDate(date)) {
    return NextResponse.json({ error: 'Provide a valid date in YYYY-MM-DD format.' }, { status: 400 });
  }
  const spot = findSpot(spotId);
  if (!spot) return NextResponse.json({ error: 'Spot not found.' }, { status: 404 });
  try {
    return NextResponse.json(await rateOneSpot(spot, date));
  } catch (error) {
    console.error('GET /api/ratings/[spotId] failed:', error);
    const message = error instanceof WeatherServiceError ? error.message : 'Could not calculate spot rating.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

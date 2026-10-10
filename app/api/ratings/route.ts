import { NextRequest, NextResponse } from 'next/server';
import { isValidDate } from '@/lib/date';
import { getSpots } from '@/lib/spots';
import { rateSpots } from '@/lib/ratingsService';
import { WeatherServiceError } from '@/lib/openMeteo';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!isValidDate(date)) {
    return NextResponse.json({ error: 'Provide a valid date in YYYY-MM-DD format.' }, { status: 400 });
  }
  try {
    return NextResponse.json(await rateSpots(getSpots(), date));
  } catch (error) {
    console.error('GET /api/ratings failed:', error);
    const message = error instanceof WeatherServiceError ? error.message : 'Could not calculate ratings.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

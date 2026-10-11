import { NextRequest, NextResponse } from 'next/server';
import { isValidDate } from '@/lib/date';
import { getSpotsInState } from '@/lib/spots';
import { rateSpots } from '@/lib/ratingsService';
import { WeatherServiceError } from '@/lib/openMeteo';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  if (!isValidDate(date)) {
    return NextResponse.json({ error: 'Provide a valid date in YYYY-MM-DD format.' }, { status: 400 });
  }
  // Optional: rate only one state's spots, which keeps the forecast request small.
  const state = request.nextUrl.searchParams.get('state');
  if (state !== null && !/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: 'Provide state as a two-letter code, like FL.' }, { status: 400 });
  }
  try {
    return NextResponse.json(await rateSpots(getSpotsInState(state), date));
  } catch (error) {
    console.error('GET /api/ratings failed:', error);
    const message = error instanceof WeatherServiceError ? error.message : 'Could not calculate ratings.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

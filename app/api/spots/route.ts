import { getSpots } from '@/lib/spots';
export async function GET() {
  return Response.json(getSpots());
}

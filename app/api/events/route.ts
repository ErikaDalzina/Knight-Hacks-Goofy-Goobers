import { getUpcomingAstroEvents } from '@/lib/astroEvents';

export async function GET() {
    return Response.json(
        {
            title: 'Upcoming Astronomy Events',
            events: getUpcomingAstroEvents(),
        },
        {
            headers: {
                'Cache-Control': 'public, max-age=3600',
            },
        }
    );
}
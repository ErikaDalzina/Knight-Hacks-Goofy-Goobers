
export type AstroEvent = {
    id: string;
    name: string;
    category: 'Meteor Shower' | 'Moon Phase';
    startDate: string;
    endDate: string;
    dateLabel: string;
    description: string;
    viewingTip: string;
    sourceName: string;
    sourceUrl: string;
};

const meteorSource = 'https://www.amsmeteors.org/calendar/';

const moonSource =
    'https://aa.usno.navy.mil/calculated/moon/phases?date=2026-08-12&format=p&nump=50&submit=Get+Data';

export const astroEvents: AstroEvent[] = [
    {
        id: 'orionids-2026',
        name: 'Orionid Meteor Shower',
        category: 'Meteor Shower',
        startDate: '2026-10-21',
        endDate: '2026-10-22',
        dateLabel: 'OCT 21–22, 2026',
        description:
            "Fast-moving meteors created by debris from Halley's Comet. The Orionids are one of October's best-known meteor showers.",
        viewingTip:
            'Find a dark location and look up in the hours before dawn. Moonlight may hide fainter meteors this year.',
        sourceName: 'American Meteor Society',
        sourceUrl: meteorSource,
    },
    {
        id: 'southern-taurids-2026',
        name: 'Southern Taurids',
        category: 'Meteor Shower',
        startDate: '2026-11-04',
        endDate: '2026-11-05',
        dateLabel: 'NOV 4–5, 2026',
        description:
            'A slower meteor shower known for occasionally producing impressive bright fireballs.',
        viewingTip:
            'Watch from a dark, open area. Be patient: this shower produces fewer meteors than the major annual showers.',
        sourceName: 'American Meteor Society',
        sourceUrl: meteorSource,
    },
    {
        id: 'november-new-moon-2026',
        name: 'November New Moon',
        category: 'Moon Phase',
        startDate: '2026-11-09',
        endDate: '2026-11-09',
        dateLabel: 'NOV 9, 2026',
        description:
            'The Moon reaches its new phase, creating an excellent opportunity to plan a dark-sky observing trip.',
        viewingTip:
            'Choose a low-Bortle location and check cloud cover. New Moon does not guarantee clear skies.',
        sourceName: 'U.S. Naval Observatory',
        sourceUrl: moonSource,
    },
    {
        id: 'leonids-2026',
        name: 'Leonid Meteor Shower',
        category: 'Meteor Shower',
        startDate: '2026-11-16',
        endDate: '2026-11-17',
        dateLabel: 'NOV 16–17, 2026',
        description:
            'A meteor shower associated with Comet Tempel-Tuttle, famous for spectacular displays in certain years.',
        viewingTip:
            'Look after midnight toward the predawn hours. A wide view of the sky works better than a telescope.',
        sourceName: 'American Meteor Society',
        sourceUrl: meteorSource,
    },
    {
        id: 'december-new-moon-2026',
        name: 'December New Moon',
        category: 'Moon Phase',
        startDate: '2026-12-08',
        endDate: '2026-12-08',
        dateLabel: 'DEC 8, 2026',
        description:
            'A moonless observing opportunity in U.S. time zones. The astronomical new Moon occurs on December 9 in UTC.',
        viewingTip:
            'An excellent time to plan a Milky Way, deep-sky, or general stargazing outing, weather permitting.',
        sourceName: 'U.S. Naval Observatory',
        sourceUrl: moonSource,
    },
    {
        id: 'geminids-2026',
        name: 'Geminid Meteor Shower',
        category: 'Meteor Shower',
        startDate: '2026-12-13',
        endDate: '2026-12-14',
        dateLabel: 'DEC 13–14, 2026',
        description:
            'One of the strongest annual meteor showers, often producing bright, colorful meteors.',
        viewingTip:
            'The Geminids can be productive before midnight. Dress warmly and allow your eyes to adjust to darkness.',
        sourceName: 'American Meteor Society',
        sourceUrl: meteorSource,
    },
    {
        id: 'ursids-2026',
        name: 'Ursid Meteor Shower',
        category: 'Meteor Shower',
        startDate: '2026-12-21',
        endDate: '2026-12-22',
        dateLabel: 'DEC 21–22, 2026',
        description:
            'A smaller Northern Hemisphere meteor shower occurring near the December solstice.',
        viewingTip:
            'The bright Moon may interfere with the 2026 peak. Try observing after moonset if conditions allow.',
        sourceName: 'American Meteor Society',
        sourceUrl: meteorSource,
    },
    {
        id: 'quadrantids-2027',
        name: 'Quadrantid Meteor Shower',
        category: 'Meteor Shower',
        startDate: '2027-01-03',
        endDate: '2027-01-04',
        dateLabel: 'JAN 3–4, 2027',
        description:
            'A potentially strong meteor shower with a relatively short peak and occasional bright fireballs.',
        viewingTip:
            'The peak is brief and timing varies by location. Check the latest observing forecast before heading out.',
        sourceName: 'American Meteor Society',
        sourceUrl: meteorSource,
    },
];

export function getUpcomingAstroEvents(
    today = new Date()
): AstroEvent[] {
    const todayString = today.toISOString().slice(0, 10);

    return astroEvents
        .filter((event) => event.endDate >= todayString)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

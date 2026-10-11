import { describe, expect, it } from 'vitest';
import type { AstroEvent } from '@/lib/astroEvents';
import { formatEventDates, formatMonthYear, moonAtPeak, upcomingEvents, whenText } from './skyEvents';

const event = (id: string, startDate: string, endDate = startDate): AstroEvent => ({
  id, name: id, category: 'Meteor Shower', startDate, endDate, dateLabel: '',
  description: '', viewingTip: '', sourceName: '', sourceUrl: '',
});

describe('whenText', () => {
  it('says tonight on the start date and while an event is under way', () => {
    expect(whenText('2026-10-21', '2026-10-21')).toBe('tonight');
    expect(whenText('2026-10-22', '2026-10-21')).toBe('tonight');
  });
  it('says tomorrow, then counts days', () => {
    expect(whenText('2026-10-20', '2026-10-21')).toBe('tomorrow');
    expect(whenText('2026-10-11', '2026-10-21')).toBe('in 10 days');
  });
  it('counts across months and years', () => {
    expect(whenText('2026-12-30', '2027-01-03')).toBe('in 4 days');
  });
});

describe('formatEventDates', () => {
  it('shows a single night, a range in one month, and a range across months', () => {
    expect(formatEventDates('2026-11-09', '2026-11-09')).toBe('Nov 9');
    expect(formatEventDates('2026-10-21', '2026-10-22')).toBe('Oct 21–22');
    expect(formatEventDates('2026-12-31', '2027-01-01')).toBe('Dec 31 – Jan 1');
  });
  it('formats a month and year for the page range', () => {
    expect(formatMonthYear('2027-01-03')).toBe('Jan 2027');
  });
});

describe('upcomingEvents', () => {
  const events = [event('later', '2026-11-04', '2026-11-05'), event('ended', '2026-10-01'), event('now', '2026-10-21', '2026-10-22')];

  it('keeps an event through its last night and sorts soonest first', () => {
    expect(upcomingEvents(events, '2026-10-22').map((e) => e.id)).toEqual(['now', 'later']);
  });
  it('drops an event the night after it ends', () => {
    expect(upcomingEvents(events, '2026-10-23').map((e) => e.id)).toEqual(['later']);
  });
});

describe('moonAtPeak', () => {
  it('names the phase and the lit percentage', () => {
    // Nov 9, 2026 is a new moon (USNO), so the Moon is a sliver or less.
    expect(moonAtPeak('2026-11-09')).toMatch(/^(New moon|Waning crescent|Waxing crescent) · [0-3]% lit$/);
  });
});

import { describe, expect, it } from 'vitest';
import type { SpotRating } from '../lib/types';
import { nightLabels, summarizeNight } from './tonight';

const HOME = { lat: 28.6, lon: -81.2 };

// A clear, moonless rating near HOME; tests override what they need.
function rating({ id = 'a', lat = 28.6, ...rest }: Partial<SpotRating> & { id?: string; lat?: number } = {}): SpotRating {
  return {
    spot: { id, name: `Spot ${id}`, lat, lon: -81.2, bortle: 4, openAtNight: true },
    date: '2026-10-10',
    score: 85,
    label: 'Excellent',
    factors: { clouds: 0.95, darkness: 0.625, moon: 1 },
    darkWindow: { start: '2026-10-10T20:01:00-04:00', end: '2026-10-11T05:41:00-04:00' },
    bestWindow: null,
    moon: { illumination: 0.01, rise: null, set: null },
    hourly: [{ time: '2026-10-10T21:00:00-04:00', cloudCover: 5, moonUp: false }],
    ...rest,
  };
}

const gated = (id: string): SpotRating =>
  rating({ id, score: null, label: 'Not tonight', gateReason: 'Cloud cover above 75%' });

describe('nightLabels', () => {
  it('formats the date without shifting it by time zone', () => {
    expect(nightLabels('2026-10-10')).toEqual({ short: 'Sat · Oct 10', long: 'Saturday, October 10' });
  });
});

describe('summarizeNight', () => {
  it('calls a clear, moonless night and reads dusk, dawn and the moon', () => {
    const s = summarizeNight([rating()], HOME);
    expect(s.headline).toBe('A clear, moonless night. Go dark.');
    expect(s.shortHeadline).toBe('Clear and moonless. Go dark.');
    expect(s.dark).toEqual({ text: '8:01 PM – 5:41 AM', sub: '9 h 40 m · sun 18° below' });
    expect(s.moon).toEqual({ text: '1% · New moon', sub: 'Below the horizon all night' });
    expect(s.top?.spot.id).toBe('a');
  });

  it('says clouds win when every spot is gated', () => {
    const s = summarizeNight([gated('a'), gated('b')], HOME);
    expect(s.headline).toBe('Clouds win tonight. Try again tomorrow.');
    expect(s.top).toBeNull();
    expect(s.dark).not.toBeNull();
  });

  it('calls patchy clouds when the top spot is not clear', () => {
    const s = summarizeNight([rating({ factors: { clouds: 0.5, darkness: 0.6, moon: 1 } })], HOME);
    expect(s.headline).toBe('Patchy clouds. Pick your spot and time.');
  });

  it('sends people out after moonset', () => {
    const s = summarizeNight([rating({
      factors: { clouds: 0.9, darkness: 0.6, moon: 0.5 },
      moon: { illumination: 0.6, set: '2026-10-10T23:40:00-04:00', rise: null },
      hourly: [{ time: '2026-10-10T21:00:00-04:00', cloudCover: 5, moonUp: true }],
    })], HOME);
    expect(s.headline).toBe('Clear skies. Go dark after moonset at 11:40 PM.');
    expect(s.shortHeadline).toBe('Clear. Dark after 11:40 PM.');
    expect(s.moon).toEqual({ text: '60% · Half moon', sub: 'Sets 11:40 PM' });
  });

  it('lists a moonset and a later moonrise in order', () => {
    const s = summarizeNight([rating({
      factors: { clouds: 0.9, darkness: 0.6, moon: 0.6 },
      moon: { illumination: 0.5, rise: '2026-10-11T05:02:00-04:00', set: '2026-10-10T23:40:00-04:00' },
    })], HOME);
    expect(s.headline).toBe('Clear skies. Go dark after moonset at 11:40 PM.');
    expect(s.moon?.sub).toBe('Sets 11:40 PM · rises 5:02 AM');
  });

  it('sends people out early before moonrise', () => {
    const s = summarizeNight([rating({
      factors: { clouds: 0.9, darkness: 0.6, moon: 0.6 },
      moon: { illumination: 0.7, rise: '2026-10-11T01:10:00-04:00', set: null },
    })], HOME);
    expect(s.headline).toBe('Clear skies. Go early, before moonrise at 1:10 AM.');
    expect(s.moon?.sub).toBe('Rises 1:10 AM');
  });

  it('warns about a bright moon that is up all night', () => {
    const s = summarizeNight([rating({
      factors: { clouds: 0.9, darkness: 0.6, moon: 0.05 },
      moon: { illumination: 0.98, rise: null, set: null },
      hourly: [{ time: '2026-10-10T21:00:00-04:00', cloudCover: 5, moonUp: true }],
    })], HOME);
    expect(s.headline).toBe('Clear, but the moon is bright. Planets and the Moon tonight.');
    expect(s.moon).toEqual({ text: '98% · Full moon', sub: 'Up all night' });
  });

  it('breaks a tie for top spot by distance, and reads the night from the nearest spot', () => {
    const far = rating({
      id: 'far', lat: 29.6, score: 80,
      darkWindow: { start: '2026-10-10T20:05:00-04:00', end: '2026-10-11T05:40:00-04:00' },
    });
    const near = rating({ id: 'near', lat: 28.7, score: 80 });
    const s = summarizeNight([far, near], HOME);
    expect(s.top?.spot.id).toBe('near');
    expect(s.dark?.text).toBe('8:01 PM – 5:41 AM');
  });
});

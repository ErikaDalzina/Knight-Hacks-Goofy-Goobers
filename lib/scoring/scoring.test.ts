import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HourlyForecast, Spot } from '@/lib/types';
import { rateSpot, SCORING_CONFIG } from '../../../../Downloads';

// ---------------------------------------------------------------------------
// A controllable stand-in for SunCalc, so these tests don't depend on real
// astronomy. Defaults: astronomical night 8:25pm -> 5:58am EDT, moon below the
// horizon all night and 0% lit (i.e. a "perfect" moon factor of 1).
// ---------------------------------------------------------------------------
const sun = vi.hoisted(() => {
  const defaults = () => ({
    night: new Date('2026-10-18T00:25:00Z'),
    nightEnd: new Date('2026-10-18T09:58:00Z'),
    illumination: 0,
    moonUp: (_d: Date): boolean => false,
  });
  return { state: defaults(), defaults };
});

vi.mock('suncalc', () => ({
  default: {
    getTimes: () => ({ night: sun.state.night, nightEnd: sun.state.nightEnd }),
    getMoonPosition: (d: Date) => ({ altitude: sun.state.moonUp(d) ? 0.3 : -0.3 }),
    getMoonIllumination: () => ({ fraction: sun.state.illumination }),
  },
}));

beforeEach(() => {
  Object.assign(sun.state, sun.defaults());
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DATE = '2026-10-17';

const spot = (over: Partial<Spot> = {}): Spot => ({
  id: 'test', name: 'Test Spot', lat: 28.5, lon: -81.3, bortle: 4, openAtNight: true, ...over,
});

// 15 hourly points from 6pm Oct 17 to 8am Oct 18 (EDT, -04:00).
// Indexes 3..11 (9pm-5am) fall inside the dark window; the rest are outside it.
function forecast(clouds: number | number[], precip: number[] = []): HourlyForecast[] {
  const start = Date.parse('2026-10-17T22:00:00Z');
  return Array.from({ length: 15 }, (_, i) => ({
    time: new Date(start + i * 3600e3 - 4 * 3600e3).toISOString().slice(0, 19) + '-04:00',
    cloudCover: Array.isArray(clouds) ? clouds[i] : clouds,
    precipitation: precip[i] ?? 0,
  }));
}

// Cloud values for the 9 dark-window hours. Hours outside the window get 100%,
// so the tests fail if the engine ever wrongly counts them.
const win = (nine: number[]) => [100, 100, 100, ...nine, 100, 100, 100];

// ---------------------------------------------------------------------------
// These tests pin the current rules (75% cloud gate, 30% best-window cutoff, label
// cutoffs and weights). If you deliberately retune SCORING_CONFIG, update the numbers here too.
describe('gates ("Not tonight")', () => {
  it('gates a spot that is closed at night', () => {
    const r = rateSpot(spot({ openAtNight: false }), DATE, forecast(5));
    expect(r.score).toBeNull();
    expect(r.label).toBe('Not tonight');
    expect(r.gateReason).toBe('Spot is closed at night');
  });

  it('gates when average cloud cover is above the limit', () => {
    const r = rateSpot(spot(), DATE, forecast(win(Array(9).fill(76))));
    expect(r.score).toBeNull();
    expect(r.label).toBe('Not tonight');
    expect(r.gateReason).toBe('Cloud cover above 75%');
  });

  it('does not gate when average cloud cover is exactly at the limit', () => {
    const r = rateSpot(spot(), DATE, forecast(win(Array(9).fill(75))));
    expect(r.score).not.toBeNull();
    expect(r.label).not.toBe('Not tonight');
  });

  it('gates when any precipitation is forecast during the dark hours', () => {
    const precip = Array(15).fill(0);
    precip[6] = 0.1; // midnight
    const r = rateSpot(spot(), DATE, forecast(5, precip));
    expect(r.score).toBeNull();
    expect(r.gateReason).toBe('Precipitation forecast during dark hours');
  });

  it('ignores precipitation that falls outside the dark window', () => {
    const precip = Array(15).fill(0);
    precip[0] = 2; // 6pm, before dark
    precip[13] = 2; // 7am, after dark
    const r = rateSpot(spot(), DATE, forecast(5, precip));
    expect(r.score).not.toBeNull();
  });

  it('checks "closed" before clouds, and clouds before rain', () => {
    const cloudy = forecast(90);
    expect(rateSpot(spot({ openAtNight: false }), DATE, cloudy).gateReason).toBe('Spot is closed at night');
    const rainyAndCloudy = forecast(90, Array(15).fill(1));
    expect(rateSpot(spot(), DATE, rainyAndCloudy).gateReason).toContain('Cloud cover');
  });

  it('still returns dark window, factors and hourly data for gated spots', () => {
    const r = rateSpot(spot(), DATE, forecast(90));
    expect(r.darkWindow).not.toBeNull();
    expect(r.hourly).toHaveLength(9);
    expect(r.bestWindow).toBeNull();
  });

  it('gates when there is no astronomical darkness', () => {
    sun.state.night = new Date(NaN);
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.label).toBe('Not tonight');
    expect(r.gateReason).toBe('No true astronomical darkness');
    expect(r.darkWindow).toBeNull();
    expect(r.hourly).toEqual([]);
  });

  it('gates when the dark window ends before it starts', () => {
    sun.state.night = new Date('2026-10-18T10:00:00Z');
    sun.state.nightEnd = new Date('2026-10-18T09:00:00Z');
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.gateReason).toBe('No true astronomical darkness');
  });

  it('throws when the forecast does not cover the dark window', () => {
    const daytimeOnly = forecast(5).slice(0, 2); // 6pm and 7pm only
    expect(() => rateSpot(spot(), DATE, daytimeOnly)).toThrow('Forecast did not cover the astronomical dark window.');
    expect(() => rateSpot(spot(), DATE, [])).toThrow('Forecast did not cover the astronomical dark window.');
  });
});

// ---------------------------------------------------------------------------
describe('score factors', () => {
  it('scores perfect conditions as 100', () => {
    const r = rateSpot(spot({ bortle: 1 }), DATE, forecast(win(Array(9).fill(0))));
    expect(r.score).toBe(100);
    expect(r.label).toBe('Excellent');
  });

  it('matches a hand-calculated example', () => {
    // bortle 3 -> darkness (9-3)/8 = 0.75; 10% cloud -> 0.9; moon below horizon -> 1
    // 100 * (0.40*0.9 + 0.35*0.75 + 0.25*1) = 100 * 0.8725 = 87
    const r = rateSpot(spot({ bortle: 3 }), DATE, forecast(win(Array(9).fill(10))));
    expect(r.factors.clouds).toBeCloseTo(0.9);
    expect(r.factors.darkness).toBeCloseTo(0.75);
    expect(r.factors.moon).toBeCloseTo(1);
    expect(r.score).toBe(87);
  });

  it('clamps darkness to the 0-1 range', () => {
    expect(rateSpot(spot({ bortle: 12 }), DATE, forecast(5)).factors.darkness).toBe(0);
    expect(rateSpot(spot({ bortle: 0 }), DATE, forecast(5)).factors.darkness).toBe(1);
  });

  it('ignores a bright moon that never rises during the dark window', () => {
    sun.state.illumination = 1;
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.factors.moon).toBe(1);
    expect(r.moon.rise).toBeNull();
    expect(r.moon.set).toBeNull();
  });

  it('penalises a moon that is up all night by its illumination', () => {
    sun.state.illumination = 0.5;
    sun.state.moonUp = () => true;
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.factors.moon).toBeCloseTo(0.5);
    expect(r.hourly.every(h => h.moonUp)).toBe(true);
  });

  it('records the moonset and per-hour moonUp when the moon sets mid-window', () => {
    sun.state.illumination = 0.42;
    sun.state.moonUp = d => d.getTime() < Date.parse('2026-10-18T03:50:00Z'); // sets 11:50pm local
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.moon.rise).toBeNull();
    expect(r.moon.set).toBe('2026-10-17T23:55:00-04:00'); // first 15-minute sample after it sets
    expect(r.hourly.map(h => h.moonUp)).toEqual([true, true, true, false, false, false, false, false, false]);
    expect(r.factors.moon).toBeGreaterThan(0.8);
    expect(r.factors.moon).toBeLessThan(1);
  });

  it('records the moonrise when the moon rises mid-window', () => {
    sun.state.illumination = 0.8;
    sun.state.moonUp = d => d.getTime() >= Date.parse('2026-10-18T06:10:00Z'); // rises 2:10am local
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.moon.rise).toBe('2026-10-18T02:10:00-04:00');
    expect(r.moon.set).toBeNull();
  });

  it('keeps every factor between 0 and 1 and the score a whole number from 0 to 100', () => {
    for (const bortle of [-3, 0, 5, 9, 15]) {
      for (const illumination of [0, 0.5, 1]) {
        sun.state.illumination = illumination;
        sun.state.moonUp = () => true;
        const r = rateSpot(spot({ bortle }), DATE, forecast(win(Array(9).fill(60))));
        for (const f of Object.values(r.factors)) {
          expect(f).toBeGreaterThanOrEqual(0);
          expect(f).toBeLessThanOrEqual(1);
        }
        expect(Number.isInteger(r.score)).toBe(true);
        expect(r.score as number).toBeGreaterThanOrEqual(0);
        expect(r.score as number).toBeLessThanOrEqual(100);
      }
    }
  });
});

// ---------------------------------------------------------------------------
describe('label boundaries', () => {
  // Perfect moon, uniform cloud cover. Each row lands on one side of a cutoff.
  const cases: [number, number, number, string][] = [
    // bortle, cloud %, expected score, expected label
    [1, 50, 80, 'Excellent'],
    [3, 30, 79, 'Good'],
    [5, 56, 60, 'Good'],
    [5, 58, 59, 'Fair'],
    [9, 62, 40, 'Fair'],
    [9, 64, 39, 'Poor'],
  ];
  for (const [bortle, cloud, score, label] of cases) {
    it(`bortle ${bortle}, ${cloud}% cloud -> ${score} ${label}`, () => {
      const r = rateSpot(spot({ bortle }), DATE, forecast(win(Array(9).fill(cloud))));
      expect(r.score).toBe(score);
      expect(r.label).toBe(label);
    });
  }
});

// ---------------------------------------------------------------------------
describe('best window', () => {
  it('covers the whole night when it is clear and the moon is down', () => {
    const r = rateSpot(spot(), DATE, forecast(win(Array(9).fill(5))));
    expect(r.bestWindow).toEqual({
      start: '2026-10-17T21:00:00-04:00',
      end: r.darkWindow!.end, // the last hour is cut off at the end of darkness (5:58am)
    });
  });

  it('is null when no hour is clear enough', () => {
    expect(rateSpot(spot(), DATE, forecast(win(Array(9).fill(45)))).bestWindow).toBeNull();
  });

  it('needs cloud cover strictly below the cutoff', () => {
    expect(rateSpot(spot(), DATE, forecast(win(Array(9).fill(30)))).bestWindow).toBeNull();
    expect(rateSpot(spot(), DATE, forecast(win(Array(9).fill(29)))).bestWindow).not.toBeNull();
  });

  it('leaves out hours when the moon is up', () => {
    sun.state.illumination = 0.42;
    sun.state.moonUp = d => d.getTime() < Date.parse('2026-10-18T03:50:00Z'); // up until ~midnight
    const r = rateSpot(spot(), DATE, forecast(win(Array(9).fill(5))));
    expect(r.bestWindow!.start).toBe('2026-10-18T00:00:00-04:00');
  });

  it('picks the longest unbroken run of good hours', () => {
    // 9pm..5am: clear, cloudy, then 3 clear hours (11pm-1am), cloudy, 2 clear, cloudy
    const r = rateSpot(spot(), DATE, forecast(win([10, 50, 10, 10, 10, 50, 10, 10, 50])));
    expect(r.bestWindow).toEqual({
      start: '2026-10-17T23:00:00-04:00',
      end: '2026-10-18T02:00:00-04:00',
    });
  });

  it('keeps the earlier run when two runs are the same length', () => {
    const r = rateSpot(spot(), DATE, forecast(win([10, 10, 50, 10, 10, 50, 50, 50, 50])));
    expect(r.bestWindow).toEqual({
      start: '2026-10-17T21:00:00-04:00',
      end: '2026-10-17T23:00:00-04:00',
    });
  });
});

// ---------------------------------------------------------------------------
describe('output shape', () => {
  it('returns the spot and date unchanged', () => {
    const s = spot({ notes: 'Bring bug spray' });
    const r = rateSpot(s, DATE, forecast(5));
    expect(r.spot).toEqual(s);
    expect(r.date).toBe(DATE);
  });

  it('only includes hours inside the dark window in hourly', () => {
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.hourly).toHaveLength(9);
    expect(r.hourly[0].time).toBe('2026-10-17T21:00:00-04:00');
    expect(r.hourly[8].time).toBe('2026-10-18T05:00:00-04:00');
  });

  it('formats the dark window with the UTC offset used by the forecast', () => {
    const utc = forecast(5).map(h => ({
      ...h,
      time: new Date(Date.parse(h.time)).toISOString().slice(0, 19) + '+00:00',
    }));
    const r = rateSpot(spot(), DATE, utc);
    expect(r.darkWindow).toEqual({
      start: '2026-10-18T00:25:00+00:00',
      end: '2026-10-18T09:58:00+00:00',
    });
  });

  it('formats the dark window in local time for a -04:00 forecast', () => {
    const r = rateSpot(spot(), DATE, forecast(5));
    expect(r.darkWindow).toEqual({
      start: '2026-10-17T20:25:00-04:00',
      end: '2026-10-18T05:58:00-04:00',
    });
  });
});

// ---------------------------------------------------------------------------
describe('SCORING_CONFIG sanity', () => {
  it('has weights that add up to 1', () => {
    const { clouds, darkness, moon } = SCORING_CONFIG.weights;
    expect(clouds + darkness + moon).toBeCloseTo(1);
  });

  it('has label cutoffs in descending order', () => {
    const { excellent, good, fair } = SCORING_CONFIG.labels;
    expect(excellent).toBeGreaterThan(good);
    expect(good).toBeGreaterThan(fair);
    expect(fair).toBeGreaterThan(0);
  });
});

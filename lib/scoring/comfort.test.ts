import { describe, it, expect } from 'vitest';
import { assessComfort } from './comfort';

// These tests pin the current thresholds: cold at or below 50 F, wind at or above
// 20 km/h, dew when temperature minus dew point is 5 F or less. If you retune
// COMFORT_CONFIG on purpose, update the numbers here too.
const mild = { temperatureF: 68, dewPointF: 57, windSpeedKmh: 8 };
const kinds = (c: ReturnType<typeof assessComfort>) => c!.warnings.map(w => w.kind);

describe('assessComfort: when there is nothing to assess', () => {
  it('returns null for no samples or samples without weather fields', () => {
    expect(assessComfort([])).toBeNull();
    expect(assessComfort([{}, {}])).toBeNull();
  });

  it('returns null when every value is null or not a real number', () => {
    expect(assessComfort([{ temperatureF: null, windSpeedKmh: NaN, dewPointF: Infinity }])).toBeNull();
  });
});

describe('assessComfort: a comfortable night', () => {
  it('reports the numbers but no warnings and no advice', () => {
    expect(assessComfort([mild, mild])).toEqual({
      minTempF: 68, maxWindKmh: 8, minDewSpreadF: 11, warnings: [], advice: null,
    });
  });
});

describe('assessComfort: thresholds', () => {
  it('warns about cold at 50 F or below, not above', () => {
    expect(kinds(assessComfort([{ temperatureF: 50 }]))).toEqual(['cold']);
    expect(kinds(assessComfort([{ temperatureF: 50.1 }]))).toEqual([]);
  });

  it('warns about wind at 20 km/h or more, not below', () => {
    expect(kinds(assessComfort([{ windSpeedKmh: 20 }]))).toEqual(['wind']);
    expect(kinds(assessComfort([{ windSpeedKmh: 19.9 }]))).toEqual([]);
  });

  it('warns about dew when temperature is within 5 F of the dew point, not more', () => {
    expect(kinds(assessComfort([{ temperatureF: 60, dewPointF: 55 }]))).toEqual(['dew']);
    expect(kinds(assessComfort([{ temperatureF: 60, dewPointF: 54.9 }]))).toEqual([]);
  });
});

describe('assessComfort: using the worst hour', () => {
  it('uses the coldest, windiest and dampest hours of the night', () => {
    const c = assessComfort([
      { temperatureF: 59, windSpeedKmh: 5, dewPointF: 48 },
      { temperatureF: 45, windSpeedKmh: 25, dewPointF: 34 },
      { temperatureF: 54, windSpeedKmh: 10, dewPointF: 50 },
    ]);
    expect(c!.minTempF).toBe(45);
    expect(c!.maxWindKmh).toBe(25);
    expect(c!.minDewSpreadF).toBe(4);
  });

  it('skips hours with missing values instead of failing', () => {
    const c = assessComfort([{ temperatureF: null }, { temperatureF: 41 }, { temperatureF: NaN }]);
    expect(c!.minTempF).toBe(41);
  });

  it('needs temperature and dew point from the same hour for the dew gap', () => {
    const c = assessComfort([{ temperatureF: 68 }, { dewPointF: 66 }]);
    expect(c!.minDewSpreadF).toBeNull();
    expect(c!.warnings).toEqual([]);
  });

  it('works with only some of the fields', () => {
    const c = assessComfort([{ temperatureF: 41 }]);
    expect(c!.maxWindKmh).toBeNull();
    expect(c!.minDewSpreadF).toBeNull();
    expect(kinds(c)).toEqual(['cold']);
    expect(assessComfort([{ windSpeedKmh: 5 }])!.minTempF).toBeNull();
  });
});

describe('assessComfort: wording', () => {
  it('writes each warning in Fahrenheit, with wind in both km/h and mph', () => {
    const c = assessComfort([{ temperatureF: 46, windSpeedKmh: 28, dewPointF: 43 }]);
    expect(c!.warnings).toEqual([
      { kind: 'cold', message: 'Cold: low of 46°F' },
      { kind: 'wind', message: 'Windy: up to 28 km/h (17 mph)' },
      { kind: 'dew', message: 'Dew likely: temperature within 3°F of the dew point' },
    ]);
  });

  it('writes one advice line for the warnings that apply', () => {
    expect(assessComfort([{ temperatureF: 41 }])!.advice).toBe('Cold: pack warm layers.');
    expect(assessComfort([{ windSpeedKmh: 30 }])!.advice).toBe('Windy: pack a windbreak.');
    expect(assessComfort([{ temperatureF: 59, dewPointF: 57 }])!.advice).toBe('Dewy: pack a dew shield.');
    expect(assessComfort([{ temperatureF: 46, dewPointF: 44 }])!.advice)
      .toBe('Cold and dewy: pack warm layers and a dew shield.');
    expect(assessComfort([{ temperatureF: 43, dewPointF: 41, windSpeedKmh: 30 }])!.advice)
      .toBe('Cold, windy and dewy: pack warm layers, a windbreak and a dew shield.');
  });

  it('rounds the reported numbers to one decimal place', () => {
    expect(assessComfort([{ temperatureF: 54.34 }])!.minTempF).toBe(54.3);
  });

  it('never shows a negative dew gap in the message', () => {
    const c = assessComfort([{ temperatureF: 54, dewPointF: 55 }]);
    expect(c!.minDewSpreadF).toBe(-1);
    expect(c!.warnings[0].message).toBe('Dew likely: temperature within 0°F of the dew point');
  });

  it('does not modify the samples it is given', () => {
    const samples = Object.freeze([Object.freeze({ temperatureF: 41, windSpeedKmh: 30, dewPointF: 40 })]);
    expect(() => assessComfort(samples as never)).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { assessCloudLayers } from './cloudLayers';

describe('assessCloudLayers', () => {
  it('averages each layer and rounds to a whole percent', () => {
    expect(assessCloudLayers([
      { cloudCoverLow: 1, cloudCoverMid: 10, cloudCoverHigh: 20 },
      { cloudCoverLow: 2, cloudCoverMid: 15, cloudCoverHigh: 25 },
    ])).toEqual({ low: 2, mid: 13, high: 23 });
  });

  it('skips hours that are missing a value or are not a real number', () => {
    expect(assessCloudLayers([
      { cloudCoverLow: 10, cloudCoverMid: null, cloudCoverHigh: NaN },
      { cloudCoverLow: 20, cloudCoverHigh: 40 },
    ])).toEqual({ low: 15, mid: null, high: 40 });
  });

  it('gives null for a layer with no data at all', () => {
    expect(assessCloudLayers([{ cloudCoverHigh: 30 }, { cloudCoverHigh: 10 }]))
      .toEqual({ low: null, mid: null, high: 20 });
  });

  it('returns null when no layer has data', () => {
    expect(assessCloudLayers([])).toBeNull();
    expect(assessCloudLayers([{}, { cloudCoverLow: null, cloudCoverMid: Infinity }])).toBeNull();
  });
});

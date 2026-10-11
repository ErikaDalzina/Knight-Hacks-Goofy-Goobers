import type { CloudLayers } from '@/lib/types';

export type CloudLayerSample = {
    cloudCoverLow?: number | null;
    cloudCoverMid?: number | null;
    cloudCoverHigh?: number | null;
};

const isNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const average = (values: unknown[]): number | null => {
    const nums = values.filter(isNumber);
    return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
};

/** Average low/mid/high cloud over the given hours; null when no layer data at all. */
export function assessCloudLayers(samples: CloudLayerSample[]): CloudLayers | null {
    const layers = {
        low: average(samples.map(s => s.cloudCoverLow)),
        mid: average(samples.map(s => s.cloudCoverMid)),
        high: average(samples.map(s => s.cloudCoverHigh)),
    };
    return layers.low === null && layers.mid === null && layers.high === null ? null : layers;
}
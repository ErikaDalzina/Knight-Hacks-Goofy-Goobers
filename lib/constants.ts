import type { RatingLabel } from '@/lib/types';
// Shared contract: get team approval before changing these values.

// Label colors from the Umbra mockup. fg is for text, rings and pins, glow for the
// badge shadow, and tint for faint fills such as the best-window band.
export const LABEL_STYLES: Record<RatingLabel, { fg: string; glow: string; tint: string }> = {
  Excellent: { fg: 'oklch(0.82 0.13 165)', glow: 'rgba(80,220,170,.32)', tint: 'rgba(80,220,170,.09)' },
  Good: { fg: 'oklch(0.80 0.12 240)', glow: 'rgba(110,170,255,.32)', tint: 'rgba(110,170,255,.09)' },
  Fair: { fg: 'oklch(0.83 0.13 85)', glow: 'rgba(240,190,90,.30)', tint: 'rgba(240,190,90,.09)' },
  Poor: { fg: 'oklch(0.74 0.15 30)', glow: 'rgba(240,110,80,.30)', tint: 'rgba(240,110,80,.09)' },
  'Not tonight': { fg: '#7a7d96', glow: 'rgba(120,125,150,.15)', tint: 'rgba(120,125,150,.08)' },
};

// One color per label, taken from LABEL_STYLES so the two never drift apart.
export const LABEL_COLORS: Record<RatingLabel, string> = {
  Excellent: LABEL_STYLES.Excellent.fg,
  Good: LABEL_STYLES.Good.fg,
  Fair: LABEL_STYLES.Fair.fg,
  Poor: LABEL_STYLES.Poor.fg,
  'Not tonight': LABEL_STYLES['Not tonight'].fg,
};

// Same shapes as SCORING_CONFIG.labels and SCORING_CONFIG.weights in lib/scoring,
// so the rating engine can import these instead of keeping its own copy.
export const LABEL_THRESHOLDS = { excellent: 80, good: 60, fair: 40 };
export const DEFAULT_WEIGHTS = { clouds: 0.40, darkness: 0.35, moon: 0.25 };

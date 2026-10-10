import type { RatingLabel } from '@/lib/types';
// Shared contract: get team approval before changing these values.
export const LABEL_COLORS: Record<RatingLabel, string> = {
  Excellent: '#36c689', Good: '#85d27b', Fair: '#e7b85b',
  Poor: '#e57b72', 'Not tonight': '#8c92a8',
};

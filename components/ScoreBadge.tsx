import { LABEL_STYLES } from '@/lib/constants';
import type { RatingLabel } from '@/lib/types';

export type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

// Sizes from the Umbra mockup: phone list, desktop list, phone detail, desktop detail.
const SIZES: Record<BadgeSize, { px: number; ring: number; font: number; glow: number }> = {
  sm: { px: 46, ring: 3, font: 15, glow: 0 },
  md: { px: 52, ring: 3, font: 17, glow: 0 },
  lg: { px: 104, ring: 5, font: 38, glow: 40 },
  xl: { px: 184, ring: 8, font: 64, glow: 60 },
};

// The theme step defines these font variables; until then the fallbacks apply.
const MONO = 'var(--font-mono, ui-monospace, monospace)';
const SANS = 'var(--font-sans, system-ui, sans-serif)';

export const labelColor = (label: RatingLabel) => LABEL_STYLES[label].fg;

const scoreText = (score: number | null) => (score === null ? '—' : String(Math.round(score)));
const ariaLabel = (score: number | null, label: RatingLabel) =>
  score === null ? 'Not tonight' : `Score ${Math.round(score)} of 100, ${label}`;

// Fills the ring clockwise in proportion to the score. Gated spots get an empty grey ring.
function ringFill(score: number | null, label: RatingLabel) {
  const deg = score === null ? 0 : Math.max(0, Math.min(100, score)) * 3.6;
  return `conic-gradient(${labelColor(label)} ${deg}deg, rgba(255,255,255,.08) 0)`;
}

export default function ScoreBadge({ score, label, size = 'md' }: {
  score: number | null;
  label: RatingLabel;
  size?: BadgeSize;
}) {
  const s = SIZES[size];
  const { fg, glow } = LABEL_STYLES[label];
  const big = size === 'lg' || size === 'xl';
  return (
    <div
      role="img"
      aria-label={ariaLabel(score, label)}
      style={{
        width: s.px, height: s.px, flex: 'none', borderRadius: '50%', padding: s.ring,
        boxSizing: 'border-box', background: ringFill(score, label),
        boxShadow: s.glow ? `0 0 ${s.glow}px ${glow}` : undefined,
      }}
    >
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%', background: '#0b0e19',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <span style={{
          color: fg,
          font: big ? `500 ${s.font}px/1 ${SANS}` : `600 ${s.font}px/1 ${MONO}`,
          letterSpacing: big ? '-.04em' : undefined,
        }}>
          {scoreText(score)}
        </span>
        {size === 'xl' && score !== null && <span style={{ font: `400 12px ${MONO}`, color: '#8487a3' }}>/ 100</span>}
      </div>
    </div>
  );
}

// Leaflet divIcon pins take HTML strings, not React elements. Pass the pin's size as
// iconSize and half of it as iconAnchor so the pin centers on the spot. The active pin is the
// same element grown by CSS (.umbra-pin-active in globals.css, scale = active / normal), so
// hovering never swaps the element under the cursor.
export const PIN_SIZE = { normal: 30, active: 38 };

export function badgeHtml(score: number | null, label: RatingLabel): string {
  const { fg, glow } = LABEL_STYLES[label];
  const px = PIN_SIZE.normal;
  return `<div class="umbra-pin" role="img" aria-label="${ariaLabel(score, label)}" style="--pin-glow:${glow};`
    + `width:${px}px;height:${px}px;box-sizing:border-box;border-radius:50%;background:#0a0d18;`
    + `border:2px solid ${fg};color:${fg};font:600 11px/1 ${MONO};`
    + `display:flex;align-items:center;justify-content:center">${scoreText(score)}</div>`;
}

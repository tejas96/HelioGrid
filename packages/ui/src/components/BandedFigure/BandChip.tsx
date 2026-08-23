import type { CSSProperties, ReactNode } from 'react';
import { isValidElement } from 'react';
import { classNames } from '../../primitives/class-names';
import type { BandSpec, BandTone, BandToneStyle } from './BandedFigure.types';

/**
 * The mark is measured on the tint it sits on, against WCAG's 3:1 non-text floor — not against a
 * guess. success 3.28 · danger 3.43 · info 3.26 · neutral 3.93 all pass; `--warning` measures 1.99
 * on `--warning-bg`, so the warning mark takes `--warning-text` (6.53 on tint).
 */
export const BAND_TONES: Record<BandTone, BandToneStyle> = {
  success: { fg: 'var(--success-text)', bg: 'var(--success-bg)', mark: 'var(--success)' },
  warning: { fg: 'var(--warning-text)', bg: 'var(--warning-bg)', mark: 'var(--warning-text)' },
  danger: { fg: 'var(--danger-text)', bg: 'var(--danger-bg)', mark: 'var(--danger)' },
  info: { fg: 'var(--info-text)', bg: 'var(--info-bg)', mark: 'var(--info)' },
  neutral: { fg: 'var(--neutral-text)', bg: 'var(--neutral-bg)', mark: 'var(--neutral)' },
};

interface WebBandChipProps {
  band?: BandSpec | string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** The verdict pill: word, mark, tint — in that order of importance. Shared with `StatCard.band`. */
export function BandChip({ band, size = 13, className, style }: WebBandChipProps) {
  const spec = typeof band === 'string' ? { label: band, tone: 'neutral' as const } : band;
  if (spec === undefined || spec.label === '') return null;
  const vars = {
    '--hg-band-chip-fs': `${size}px`,
    '--hg-band-chip-h': `${size + 13}px`,
    '--hg-band-chip-px': `${Math.round(size * 0.8)}px`,
  } as CSSProperties;
  return (
    <span
      className={classNames('hg-band-chip', className)}
      data-tone={spec.tone ?? 'neutral'}
      style={{ ...vars, ...style }}
    >
      <span aria-hidden="true" className="hg-band-chip-dot" />
      {spec.label}
    </span>
  );
}

/** What a host's `band` prop runs through: a spec, a bare word, or a ready node. */
export function renderBand(
  spec?: BandSpec | string | ReactNode,
  extra?: { size?: number },
): ReactNode {
  if (spec === undefined || spec === null || spec === false) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') return <BandChip band={{ label: spec }} {...extra} />;
  if (typeof spec === 'object' && 'label' in spec) {
    return <BandChip band={spec as BandSpec} {...extra} />;
  }
  return null;
}

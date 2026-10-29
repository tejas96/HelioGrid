import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { bandChipBox, bandChipFace, bandChipFor } from './BandedFigure.logic';
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
  band?: BandSpec | TranslatedText;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

interface ChipFaceProps {
  words: ReactNode;
  tone: BandTone;
  size: number;
  className?: string;
  style?: CSSProperties;
}

/** The verdict pill: word, mark, tint — in that order of importance. Shared with `StatCard.band`. */
export function BandChip({ band, size = 13, className, style }: WebBandChipProps) {
  const face = bandChipFace(band);
  if (face === null) return null;
  return (
    <ChipFace words={face.words} tone={face.tone} size={size} className={className} style={style} />
  );
}

/** The pill itself, around words already in the reader's language — a band's, or a host's. */
function ChipFace({ words, tone, size, className, style }: ChipFaceProps) {
  const box = bandChipBox(size);
  const vars = {
    '--hg-band-chip-fs': `${size}px`,
    '--hg-band-chip-h': `${box.height}px`,
    '--hg-band-chip-px': `${box.paddingX}px`,
  } as CSSProperties;
  return (
    <span
      className={classNames('hg-band-chip', className)}
      data-tone={tone}
      style={{ ...vars, ...style }}
    >
      <span aria-hidden="true" className="hg-band-chip-dot" />
      {words}
    </span>
  );
}

/**
 * What a host's `band` prop runs through: a spec, a bare word, or a ready node. A bare word is the
 * host's words, typed by the host's own contract, drawn in the neutral pill.
 */
export function renderBand(
  spec?: BandSpec | TranslatedText | ReactNode,
  extra?: { size?: number },
): ReactNode {
  return bandChipFor(spec, (face) => (
    <ChipFace words={face.words} tone={face.tone} size={extra?.size ?? 13} />
  ));
}

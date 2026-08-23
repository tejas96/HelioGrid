import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useFormat } from '../MarketProvider';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import { BAND_TONES, BandChip } from './BandChip.native';
import { BandedCard } from './BandedCard.native';
import type { BandedFigureProps } from './BandedFigure.types';
import { bandedReadOut, formatFigure, resolveBand } from './BandedFigure.types';
import { BandedLine } from './BandedLine.native';

interface NativeBandedFigureProps extends BandedFigureProps {
  style?: StyleProp<ViewStyle>;
}

/** Narrows the declared union onto `renderProvenance`'s parameter — Provenance owns the tier. */
function provenanceSlot(spec: BandedFigureProps['provenance']): ReactNode {
  return renderProvenance(spec as ProvenanceProps | ReactNode, { size: 12 });
}

/**
 * A figure and the named band it lands in. The band is a word, then a mark, then a tint (F7-12),
 * and the remedy belongs to the band rather than to the screen.
 */
export function BandedFigure({
  label,
  value,
  unit,
  bands,
  band,
  remedy,
  bound,
  variant = 'card',
  provenance,
  note,
  compact = false,
  money = false,
  ariaLabel,
  children,
  style,
}: NativeBandedFigureProps) {
  const format = useFormat();
  const resolved = resolveBand(value, bands, band);
  const shown = formatFigure(value, format, { money, compact });
  const move = remedy ?? resolved?.remedy;
  const accessibilityLabel = ariaLabel ?? bandedReadOut(label, shown, unit, resolved, move);

  if (variant === 'line') {
    return (
      <BandedLine
        label={label}
        shown={shown}
        unit={unit}
        band={resolved}
        move={move}
        accessibilityLabel={accessibilityLabel}
        style={style}
      />
    );
  }

  return (
    <BandedCard
      label={label}
      shown={shown}
      unit={unit}
      band={resolved}
      tone={BAND_TONES[resolved?.tone ?? 'neutral']}
      move={move}
      bound={bound}
      note={note}
      provenance={provenanceSlot(provenance)}
      accessibilityLabel={accessibilityLabel}
      big={variant === 'box'}
      style={style}
    >
      {children}
    </BandedCard>
  );
}

BandedFigure.resolve = resolveBand;
BandedFigure.Chip = BandChip;
BandedFigure.tones = BAND_TONES;

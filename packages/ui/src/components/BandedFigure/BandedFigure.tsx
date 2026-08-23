import type { CSSProperties, ReactNode } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import type { ProvenanceProps } from '../Provenance';
import { renderProvenance } from '../Provenance';
import { BAND_TONES, BandChip } from './BandChip';
import type { BandedFigureProps } from './BandedFigure.types';
import { bandedReadOut, formatFigure, resolveBand } from './BandedFigure.types';
import { BandedLine } from './BandedLine';

interface WebBandedFigureProps extends BandedFigureProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The slot goes straight to the one renderer, as the DS reference does. `ProvenanceTierSpec`'s
 * object arm is wider than `renderProvenance`'s declared parameter, so it is narrowed here rather
 * than being re-spelled — Provenance owns what a tier renders as.
 */
function provenanceSlot(spec: BandedFigureProps['provenance']): ReactNode {
  return renderProvenance(spec as ProvenanceProps | ReactNode, { size: 12 });
}

function RemedyGlyph() {
  return (
    <svg
      className="hg-banded-remedy-glyph"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * A figure and the named band it lands in. The band is a word, then a mark, then a tint (F7-12),
 * and the remedy belongs to the band rather than to the screen — a fault says what to do about it
 * in its own block, never in a banner elsewhere.
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
  className,
  style,
}: WebBandedFigureProps) {
  const format = useFormat();
  const resolved = resolveBand(value, bands, band);
  const tone = resolved?.tone ?? 'neutral';
  const shown = formatFigure(value, format, { money, compact });
  const move = remedy ?? resolved?.remedy;
  const accessibilityLabel = ariaLabel ?? bandedReadOut(label, shown, unit, resolved, move);
  const big = variant === 'box';

  if (variant === 'line') {
    return (
      <BandedLine
        label={label}
        shown={shown}
        unit={unit}
        band={resolved}
        move={move}
        accessibilityLabel={accessibilityLabel}
        className={className}
        style={style}
      />
    );
  }

  return (
    <section
      aria-label={accessibilityLabel}
      className={classNames('hg-banded', className)}
      data-variant={variant}
      data-tone={tone}
      style={style}
    >
      {big ? <span aria-hidden="true" className="hg-banded-edge" /> : null}
      <div className="hg-banded-head">
        <span className="hg-banded-label">{label}</span>
      </div>
      <div className="hg-banded-figure-row">
        <div className="hg-banded-figure">
          <span className="hg-banded-value">{shown}</span>
          {unit !== undefined ? <span className="hg-banded-unit">{unit}</span> : null}
        </div>
        {resolved !== null ? <BandChip band={resolved} size={big ? 14 : 13} /> : null}
      </div>
      {bound !== undefined ? <p className="hg-banded-bound">{bound}</p> : null}
      {move !== undefined && move !== null ? (
        <p className="hg-banded-remedy">
          <RemedyGlyph />
          <span>{move}</span>
        </p>
      ) : null}
      {provenanceSlot(provenance)}
      {note !== undefined ? <p className="hg-banded-note">{note}</p> : null}
      {children}
    </section>
  );
}

BandedFigure.resolve = resolveBand;
BandedFigure.Chip = BandChip;
BandedFigure.tones = BAND_TONES;

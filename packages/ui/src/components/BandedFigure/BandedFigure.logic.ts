import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import type { BandedFigureProps, BandSpec, BandTone } from './BandedFigure.types';
import { bandedReadOut, formatFigure, resolveBand } from './BandedFigure.types';

/** What a chip shows: the band's name and its tone — a bare name is a neutral band. */
export interface BandChipFace {
  words: ReactNode;
  tone: BandTone;
}

/** A band with no name draws no chip. */
export function bandChipFace(band: BandSpec | TranslatedText | undefined): BandChipFace | null {
  const spec = typeof band === 'string' ? { label: band, tone: 'neutral' as const } : band;
  if (spec === undefined || spec.label === '') return null;
  return { words: spec.label, tone: spec.tone ?? 'neutral' };
}

/** The chip grows with its type: a fixed 13 above the size, and padding of four fifths of it. */
export function bandChipBox(size: number): { height: number; paddingX: number } {
  return { height: size + 13, paddingX: Math.round(size * 0.8) };
}

/**
 * What a host's band prop draws: a ready node as it is, a chip through `draw` — a band's name on
 * its own is a neutral chip — or nothing.
 */
export function bandChipFor(
  spec: BandSpec | TranslatedText | ReactNode,
  draw: (face: BandChipFace) => ReactNode,
): ReactNode {
  if (spec === undefined || spec === null || spec === false) return null;
  if (isValidElement(spec)) return spec;
  if (typeof spec === 'string') {
    return spec === '' ? null : draw({ words: spec, tone: 'neutral' });
  }
  if (typeof spec === 'object' && 'label' in spec) {
    const face = bandChipFace(spec as BandSpec);
    return face === null ? null : draw(face);
  }
  return null;
}

/**
 * The figure read once for both platforms: its band, the figure as printed, the move a faulty band
 * asks for (the caller's own first), and the one sentence a reader hears.
 */
export function bandedReading(
  {
    label,
    value,
    unit,
    bands,
    band,
    remedy,
    compact = false,
    money = false,
    ariaLabel,
  }: BandedFigureProps,
  format: Parameters<typeof formatFigure>[1],
): { resolved: BandSpec | null; shown: string; move: ReactNode; readOut: string } {
  const resolved = resolveBand(value, bands, band);
  const shown = formatFigure(value, format, { money, compact });
  const move = remedy ?? resolved?.remedy;
  return {
    resolved,
    shown,
    move,
    readOut: ariaLabel ?? bandedReadOut(label, shown, unit, resolved, move),
  };
}

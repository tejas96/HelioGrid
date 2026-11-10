import type { ComponentKind, SearchNumber, SearchRow } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { SearchResultsWords } from './SearchResults.types';

/** A number in three runs — before the digits typed, the digits typed, after — for the mark. */
export function numberRuns(number: SearchNumber): {
  readonly before: string;
  readonly typed: string;
  readonly after: string;
} {
  if (number.typed === null) return { before: number.shown, typed: '', after: '' };
  const [start, end] = number.typed;
  return {
    before: number.shown.slice(0, start),
    typed: number.shown.slice(start, end),
    after: number.shown.slice(end),
  };
}

/** Each kind of catalog item's tile glyph, as the catalog draws it. */
export const CATALOG_GLYPH: Record<ComponentKind, ShellGlyphName> = {
  panel: 'solar-panel',
  inverter: 'inverter',
  battery: 'battery',
  micro_inverter: 'inverter',
  optimiser: 'bolt',
};

/** The name a row is known by: a person's or a lead's, an item's brand and model. */
export function rowNameOf<Failure>(row: SearchRow<Failure>): string | null {
  return row.kind === 'catalog_item' ? `${row.brand} ${row.model}` : row.name;
}

/** The row's target, when it opens something: its spoken name and what it opens. */
export function rowOpenOf<Failure>(
  row: SearchRow<Failure>,
  words: SearchResultsWords<Failure>,
  onOpen: (address: string) => void,
): { readonly name: string; readonly address: string; readonly onOpen: () => void } | undefined {
  const { address } = row;
  if (address === null) return undefined;
  return {
    name: words.open(row.kind, rowNameOf(row)),
    address,
    onOpen: () => onOpen(address),
  };
}

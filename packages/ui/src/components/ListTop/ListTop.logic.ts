import type { TranslatedText } from '@heliogrid/contracts';
import { glyphStroke } from '../AppShell/ShellGlyph.logic';
import type { ListSortProps } from './ListTop.types';

/** The chosen order's words; an order the choices do not hold reads as the first choice. */
export function chosenSortOf(sort: ListSortProps): TranslatedText {
  const chosen = sort.choices.find((choice) => choice.key === sort.chosen) ?? sort.choices[0];
  return chosen?.label ?? sort.title;
}

/** The bar's parts: each stage holding a lead, as its share of the row — a stage with none takes no room. */
export function stageBarPartsOf(
  stages: readonly { readonly stage: string; readonly count: number }[],
): readonly { readonly stage: string; readonly count: number }[] {
  return stages.filter((one) => one.count > 0);
}

/** A side figure's tile: its glyph on its tint, at the tile size a list's summary takes. */
export const FIGURE_TILE = { size: 32, stroke: glyphStroke('sm') } as const;

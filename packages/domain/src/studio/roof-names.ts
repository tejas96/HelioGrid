import type { StudioDocument } from './document';
import { belongsTo, roofKindOf } from './roof-kind';
import type { RoofKind } from './roof-parts';

/**
 * What a roof is called (`T-M05-002`, part e): "Roof n" names only a roof on the ground, counted
 * in the order they were drawn; a roof that stands on another, or is part of one, is named by its
 * kind — the stair room, the upper floor, the open shed — and says which roof it goes with.
 */
export type RoofName =
  | { readonly kind: 'roof'; readonly number: number }
  | {
      readonly kind: Exclude<RoofKind, 'building'>;
      /** The number of the ground roof it goes with; `null` when it goes with none that has one. */
      readonly with: number | null;
    };

/** Whether a roof is one of the numbered roofs: a building that goes with no other roof. */
function numbered(document: StudioDocument, index: number): boolean {
  const roof = document.roofs[index];
  return (
    roof !== undefined && roofKindOf(roof) === 'building' && belongsTo(document, roof) === null
  );
}

/** The number of roof `index` among the roofs on the ground, from 1; `null` when it is not one. */
export function roofNumber(document: StudioDocument, index: number): number | null {
  if (!numbered(document, index)) return null;
  return document.roofs.slice(0, index + 1).filter((_, i) => numbered(document, i)).length;
}

export function roofNameOf(document: StudioDocument, index: number): RoofName | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const number = roofNumber(document, index);
  if (number !== null) return { kind: 'roof', number };
  const kind = roofKindOf(roof);
  const owner = belongsTo(document, roof);
  const withNumber = owner === null ? null : roofNumber(document, owner);
  // A building that goes with another roof is a part of it by any other name.
  return { kind: kind === 'building' ? 'separate_part' : kind, with: withNumber };
}

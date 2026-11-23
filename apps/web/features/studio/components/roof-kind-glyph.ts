import type { RoofKind } from '@heliogrid/domain';
import type { ShellGlyphName } from '@heliogrid/ui';

/** The small picture of what a roof is, on its row and its sheet. */
export const ROOF_KIND_GLYPH: Record<RoofKind, ShellGlyphName> = {
  building: 'house',
  stair_room: 'steps',
  upper_floor: 'storeys',
  open_shed: 'canopy',
  hole: 'opening',
  dormer: 'house',
  separate_part: 'columns',
};

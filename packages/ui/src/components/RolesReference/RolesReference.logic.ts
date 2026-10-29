import type { TranslatedText } from '@heliogrid/contracts';
import type { ReadKind } from '@heliogrid/domain';
import type { RolesReferencePreset, RolesReferenceSide } from './RolesReference.types';

/** The side panel's width the board gives at 1536 (`d-open`); `RolesReference.css` keeps the tiles clear of it. */
export const ROLES_PANEL_WIDTH = 480;

/**
 * The window width from which the details are the side panel, not the sheet: below it the panel
 * would stand over most of the tiles, so the sheet keeps them in view above it (`RolesReference.css`
 * keeps the tiles clear of the panel from the same width).
 */
export const ROLES_PANEL_ABOVE = 1180;

/** The details' list for the side *Show* is on. */
export function linesOn(preset: RolesReferencePreset, side: RolesReferenceSide) {
  return side === 'can'
    ? { label: preset.canList, lines: preset.can }
    : { label: preset.cantList, lines: preset.cant };
}

/**
 * A tile's name as a screen reader says it, in every state: the role and its count, its wait or its
 * gap. Stated, never derived from the children — TalkBack derives a stale word from them.
 */
export function spokenName(
  preset: RolesReferencePreset,
  counts: ReadKind,
  countGap: TranslatedText,
): string {
  if (counts === 'loading') return `${preset.name}, ${preset.loadingCount}`;
  return `${preset.name}, ${counts === 'failed' || preset.count === null ? countGap : preset.count}`;
}

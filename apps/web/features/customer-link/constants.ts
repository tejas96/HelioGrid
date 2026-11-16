import type { AfterRow } from '@heliogrid/ui';
import type { ComponentProps } from 'react';

type Glyph = ComponentProps<typeof AfterRow>['glyph'];

/**
 * The mark each kind of solar-file document wears, so the customer finds a warranty or an approval
 * by its shape before its words (`F5-71`). A row this map does not name — a file the company chose
 * to show, or a row a newer pack adds — wears the plain document mark.
 */
const DOCUMENT_GLYPHS: Readonly<Record<string, Glyph>> = {
  warranty_documents: 'shield-check',
  commissioning_certificate: 'document',
  utility_approval: 'bolt',
  net_metering_application: 'bolt',
  electrical_inspector_approval: 'bolt',
  utility_feasibility: 'bolt',
  incentive_application: 'rupee',
  advance_receipt: 'rupee',
  handover_pack: 'layers',
};

export function documentGlyphOf(row: string | null): Glyph {
  return (row === null ? undefined : DOCUMENT_GLYPHS[row]) ?? 'document';
}

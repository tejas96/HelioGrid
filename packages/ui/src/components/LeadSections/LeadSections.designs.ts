import type { TranslatedText } from '@heliogrid/contracts';
import type { DesignStatus } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { LeadDesign, LeadDesignsPanel } from './LeadSections.types';

/** A reader with the design grant on a lead still open: the one offered an act that changes a design. */
export function mayChangeDesigns(panel: LeadDesignsPanel): boolean {
  return panel.canDesign && !panel.closed;
}

/** The designs a read holds; a ready read with none is the empty one. */
export function leadDesignsOf(panel: LeadDesignsPanel): readonly LeadDesign[] {
  return panel.read.kind === 'ready' ? panel.read.value : [];
}

/**
 * Why the cards offer only *View*, said over them: the lead is closed, or the reader holds no
 * design grant. `null` for a reader who may change them.
 */
export function leadDesignsNoteOf(panel: LeadDesignsPanel): TranslatedText | null {
  if (panel.closed) return panel.words.closedLine;
  return panel.canDesign ? null : panel.words.viewOnly;
}

/**
 * The line under "No design yet": what the section is for, for a reader who may start one; why a
 * closed lead takes none; and nothing for a reader without the grant — an invitation to start a
 * design they cannot start would send them looking for a button that is not there.
 */
export function leadDesignsNoneLineOf(panel: LeadDesignsPanel): TranslatedText | null {
  if (!panel.canDesign) return null;
  return panel.closed ? panel.words.closedLine : panel.words.noneLine;
}

/** Each status's own mark; a status domain adds fails to compile here until it has one. */
const DESIGN_STATUS_GLYPH: Record<DesignStatus, ShellGlyphName> = {
  draft: 'pencil',
};

/** A status's own mark; one this build does not know keeps its tone's glyph. */
export function leadDesignStatusGlyph(status: string): ShellGlyphName | null {
  return (DESIGN_STATUS_GLYPH as Record<string, ShellGlyphName | undefined>)[status] ?? null;
}

/** One act of a card's overflow menu. */
export interface LeadDesignMenuAct {
  readonly key: string;
  readonly label: TranslatedText;
  readonly glyph: ShellGlyphName;
  readonly onSelect: () => void;
}

/** A card's overflow acts: a copy as a variant, and the recommended mark put on or taken off. */
export function leadDesignMenuOf(
  design: LeadDesign,
  panel: LeadDesignsPanel,
): readonly LeadDesignMenuAct[] {
  const { words } = panel;
  return [
    { key: 'copy', label: words.copy, glyph: 'layers', onSelect: () => panel.onCopy(design.id) },
    {
      key: 'recommend',
      label: design.recommended ? words.unrecommend : words.recommend,
      glyph: 'star',
      onSelect: () => panel.onRecommend(design.id, !design.recommended),
    },
  ];
}

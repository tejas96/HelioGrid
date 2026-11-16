import type { ProposalStanding } from '@heliogrid/domain';
import type { ShellGlyphProps } from '../AppShell/AppShell.types';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { StatusTone } from '../StatusMark';

/**
 * Each standing's tone (`M06-48`): waiting on a person is info or neutral, the customer's yes
 * success, a change asked warning, their no danger. The word beside it carries the fact.
 */
export const PROPOSAL_STANDING_TONE: Record<ProposalStanding, StatusTone> = {
  draft: 'neutral',
  ready: 'info',
  shared: 'neutral',
  opened: 'info',
  negotiating: 'warning',
  accepted: 'success',
  declined: 'danger',
  won: 'success',
  replaced: 'neutral',
  withdrawn: 'neutral',
};

/** The tone of a standing as sent; one this build does not know reads neutral, never borrowed. */
export function proposalStandingTone(standing: string): StatusTone {
  return (PROPOSAL_STANDING_TONE as Record<string, StatusTone | undefined>)[standing] ?? 'neutral';
}

/**
 * Each standing's own mark, as the approved design draws it: the document ready to go, the send,
 * the eye that read it, the chat that asked, the tick, the cross, the star of a win.
 */
const PROPOSAL_STANDING_GLYPH: Record<ProposalStanding, ShellGlyphName> = {
  draft: 'pencil',
  ready: 'document',
  shared: 'send',
  opened: 'eye',
  negotiating: 'chat',
  accepted: 'check',
  declined: 'close',
  won: 'star',
  replaced: 'layers',
  withdrawn: 'close',
};

/** A standing's own mark; one this build does not know keeps its tone's glyph. */
export function proposalStandingGlyph(standing: string): ShellGlyphName | null {
  return (PROPOSAL_STANDING_GLYPH as Record<string, ShellGlyphName | undefined>)[standing] ?? null;
}

/** The glyph's ink for a tone: the tone's own, so the mark and the word read as one. */
export const GLYPH_TONE_OF: Record<StatusTone, NonNullable<ShellGlyphProps['tone']>> = {
  neutral: 'secondary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  accent: 'accent',
};

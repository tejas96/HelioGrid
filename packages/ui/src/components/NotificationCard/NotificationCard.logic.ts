import type { NotificationType } from '@heliogrid/domain';

/**
 * Which mark each notification type wears (`SCR-SHELL-03`), drawn from the activity glyphs so a
 * shape is outlined once. `system` has none: product news wears the product's own tile.
 */
const GLYPH_BY_TYPE: Record<Exclude<NotificationType, 'system'>, string> = {
  proposal_opened: 'eye',
  agent_escalation: 'phone',
  follow_up_due: 'clock',
  survey_submitted: 'calendar-check',
  design_returned: 'grid',
  signoff_requested: 'check',
  payment_due: 'rupee',
  lead_unassigned_24h: 'user-plus',
};

/** The bell for a type this build does not know yet — never an empty circle. */
export function notificationGlyph(type: string): string {
  return (GLYPH_BY_TYPE as Record<string, string | undefined>)[type] ?? 'bell';
}

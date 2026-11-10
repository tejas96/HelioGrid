import type { LeadDetailAction, LeadStateAct } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';

/** Each of the five actions' glyph: a phone, a speech bubble, a pencil, a calendar, a panel. */
export const DOCK_ACTION_GLYPH: Record<LeadDetailAction, ShellGlyphName> = {
  call: 'phone',
  message: 'chat',
  log: 'pencil',
  visit: 'calendar',
  design: 'solar-panel',
};

/** Each state act's glyph: night for a snooze, the sun for a wake, a bar for a disqualify. */
export const STATE_ACT_GLYPH: Record<LeadStateAct, ShellGlyphName> = {
  snooze: 'moon',
  wake: 'sun',
  disqualify: 'blocked',
  junk: 'trash',
  reopen: 'undo',
};

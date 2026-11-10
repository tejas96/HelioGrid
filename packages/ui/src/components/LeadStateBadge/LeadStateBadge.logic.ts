import type { LeadLifecycleState } from '@heliogrid/domain';
import type { StatusTone } from '../../primitives/StatusMark';

/**
 * Each state's meaning as a tone: a snooze is a plan, dormancy and junk are quiet, a
 * disqualification is a caution and a loss is the funnel's one failure. The tone's glyph is the
 * second channel (`F7-12`); the word is the first.
 */
export const LEAD_STATE_TONE: Record<LeadLifecycleState, StatusTone> = {
  snoozed: 'info',
  dormant: 'neutral',
  disqualified: 'warning',
  lost: 'danger',
  junk: 'neutral',
};

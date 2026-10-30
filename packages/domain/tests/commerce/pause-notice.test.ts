import { describe, expect, it } from 'vitest';
import { pauseNoticeOf } from '../../src/commerce/pause-notice';
import {
  BILLING_CAPABILITIES,
  BILLING_PHASES,
  type BillingCapability,
  type BillingPhase,
  isAlwaysOn,
} from '../../src/commerce/soft-block';

const ALWAYS_ON = BILLING_CAPABILITIES.filter(isAlwaysOn);
const HALTED_PAUSES: BillingCapability[] = [
  'create_edit_records',
  'studio_design_edit',
  'sell_and_deliver',
  'new_file_upload',
  'voice_agent',
  'ai_roof_detections',
  'team_invites',
];

describe('pauseNoticeOf — what paused, what still works, and the one act (M12-31, F8-34)', () => {
  it.each<{ phase: BillingPhase; paused: BillingCapability[]; act: string | null }>([
    { phase: 'trialing', paused: [], act: null },
    { phase: 'active', paused: [], act: null },
    { phase: 'past_due_full_function', paused: [], act: 'pay' },
    {
      phase: 'past_due_metered_paused',
      paused: ['voice_agent', 'ai_roof_detections', 'team_invites'],
      act: 'pay',
    },
    { phase: 'halted', paused: HALTED_PAUSES, act: 'reactivate' },
    { phase: 'expired', paused: HALTED_PAUSES, act: 'pick_plan' },
    { phase: 'cancelled_post_period', paused: HALTED_PAUSES, act: 'reactivate' },
  ])(
    "each phase's notice names exactly what paused and what still works — $phase",
    ({ phase, paused, act }) => {
      const notice = pauseNoticeOf(phase);
      expect(notice.paused).toEqual(paused);
      expect(notice.stillWorks).toEqual(
        BILLING_CAPABILITIES.filter((capability) => !paused.includes(capability)),
      );
      expect(notice.act).toBe(act);
    },
  );

  it.each(BILLING_PHASES)('no notice names a consequence that will not occur — %s', (phase) => {
    const notice = pauseNoticeOf(phase);
    for (const capability of ALWAYS_ON) {
      expect(notice.paused).not.toContain(capability);
      expect(notice.stillWorks).toContain(capability);
    }
    expect(notice.stillWorks.slice(0, 4)).toEqual([
      'read_and_search',
      'export',
      'customer_links',
      'billing_screens',
    ]);
    if (notice.paused.length > 0) expect(notice.act).not.toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  BILLING_CAPABILITIES,
  BILLING_PHASES,
  type BillingPhase,
  capabilityStanding,
  isAlwaysOn,
} from '../../src/commerce/soft-block';

/** The three phases in which a tenant has stopped paying and the block has fully landed. */
const BLOCKED_PHASES = ['halted', 'expired', 'cancelled_post_period'] as const;

describe('the soft-block law — what no phase may ever take away (BM-32, BM-36)', () => {
  it.each([
    { capability: 'read_and_search', why: 'read everything, search and dashboards included' },
    { capability: 'export', why: 'a tenant can always leave with their data' },
    { capability: 'customer_links', why: 'the tenant’s customer is never punished' },
    { capability: 'billing_screens', why: 'reactivation is always one payment away' },
    {
      capability: 'pending_field_photo_upload',
      why: 'BM-36 — already on the device, not a new mutation',
    },
  ] as const)('$capability is available in every phase — $why', ({ capability }) => {
    expect(isAlwaysOn(capability)).toBe(true);
    for (const phase of BILLING_PHASES) {
      expect(capabilityStanding(capability, phase)).toBe('available');
    }
  });

  it('leaves exactly five capabilities no phase can pause — four of BM-32 and BM-36’s one', () => {
    expect(BILLING_CAPABILITIES.filter(isAlwaysOn)).toEqual([
      'read_and_search',
      'export',
      'customer_links',
      'billing_screens',
      'pending_field_photo_upload',
    ]);
  });

  it.each(BLOCKED_PHASES)('never hard-blocks %s — something always still works', (phase) => {
    const working = BILLING_CAPABILITIES.filter(
      (capability) => capabilityStanding(capability, phase) !== 'paused',
    );
    expect(working).not.toEqual([]);
  });
});

describe('the grace window — core selling runs it out, metered features do not (BM-35)', () => {
  it.each([
    'create_edit_records',
    'studio_design_edit',
    'sell_and_deliver',
    'new_file_upload',
  ] as const)('%s survives the whole past_due window, both phases', (capability) => {
    expect(capabilityStanding(capability, 'past_due_full_function')).toBe('available');
    expect(capabilityStanding(capability, 'past_due_metered_paused')).toBe('available');
  });

  it.each([
    { capability: 'voice_agent', earlyStanding: 'within_allowance' },
    { capability: 'ai_roof_detections', earlyStanding: 'within_allowance' },
    { capability: 'team_invites', earlyStanding: 'available' },
  ] as const)(
    '$capability works to day 3 and pauses from day 4 — it costs per use',
    ({ capability, earlyStanding }) => {
      expect(capabilityStanding(capability, 'past_due_full_function')).toBe(earlyStanding);
      expect(capabilityStanding(capability, 'past_due_metered_paused')).toBe('paused');
    },
  );

  it('treats the three ended phases identically — expired and cancelled behave as halted', () => {
    const standingsIn = (phase: BillingPhase) =>
      BILLING_CAPABILITIES.map((capability) => capabilityStanding(capability, phase));
    expect(standingsIn('expired')).toEqual(standingsIn('halted'));
    expect(standingsIn('cancelled_post_period')).toEqual(standingsIn('halted'));
  });

  it('treats trialing exactly as active — a trial is not a smaller product (BM-28)', () => {
    for (const capability of BILLING_CAPABILITIES) {
      expect(capabilityStanding(capability, 'trialing')).toBe(
        capabilityStanding(capability, 'active'),
      );
    }
  });
});

describe('the metered cells are the only ones bounded by an allowance (BM-35)', () => {
  it('marks voice and detections within_allowance, and nothing else', () => {
    const bounded = BILLING_CAPABILITIES.filter((capability) =>
      BILLING_PHASES.some((phase) => capabilityStanding(capability, phase) === 'within_allowance'),
    );
    expect(bounded).toEqual(['voice_agent', 'ai_roof_detections']);
  });
});

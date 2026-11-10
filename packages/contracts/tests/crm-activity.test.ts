import { ACTIVITY_KINDS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { activitySchema, knownActivitySchema } from '../src/crm/activities';

const ENTRY = {
  id: '11111111-1111-4111-8111-111111111111',
  leadId: null,
  actor: { kind: 'person', id: '22222222-2222-4222-8222-222222222222', name: 'Rajesh' },
  capturedAt: '2026-11-09T09:05:00.000Z',
  appliedAt: '2026-11-09T09:05:02.000Z',
};

describe('the timeline reads every kind, the known ones by their own body (M02-35)', () => {
  it.each(ACTIVITY_KINDS)('the kind %s has its body', (kind) => {
    expect(knownActivitySchema.optionsMap.has(kind)).toBe(true);
  });

  it('reads a known kind with its own body', () => {
    const entry = { ...ENTRY, kind: 'note', body: { text: 'Call after 6' } };
    expect(knownActivitySchema.safeParse(entry).success).toBe(true);
  });

  it('reads a kind a newer server learned as a plain entry rather than refusing the page', () => {
    const entry = { ...ENTRY, kind: 'proposal_opened', body: { proposalId: 'p-1' } };
    expect(knownActivitySchema.safeParse(entry).success).toBe(false);
    expect(activitySchema.safeParse(entry)).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ kind: 'proposal_opened' }),
      }),
    );
  });
});

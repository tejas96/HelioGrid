import { describe, expect, it } from 'vitest';
import { inviteOutcome } from '../../src/tenancy/invite';

describe('inviteOutcome — what an answer to a send means (SCR-M01-07)', () => {
  it('a 201 is sent', () => {
    expect(inviteOutcome({ status: 201, code: '' })).toBe('sent');
  });

  it('no answer, a 5xx or a reused creation key failed: the form keeps its values', () => {
    expect(inviteOutcome(null)).toBe('failed');
    expect(inviteOutcome({ status: 500, code: 'INTERNAL_ERROR' })).toBe('failed');
    expect(inviteOutcome({ status: 422, code: 'IDEMPOTENCY_KEY_REUSED' })).toBe('failed');
  });
});

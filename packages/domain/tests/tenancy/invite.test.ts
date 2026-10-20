import { describe, expect, it } from 'vitest';
import { inviteOutcome, inviteRefusal, numberOnTeam, sendsNothing } from '../../src/tenancy/invite';

describe('inviteOutcome — what an answer to a send means (SCR-M01-07)', () => {
  it('a 201 is sent', () => {
    expect(inviteOutcome({ status: 201, code: '' })).toBe('sent');
  });

  it('each refusal the screen draws is told apart by its code', () => {
    expect(inviteOutcome({ status: 409, code: 'ALREADY_MEMBER' })).toBe('already_member');
    expect(inviteOutcome({ status: 409, code: 'ALREADY_INVITED' })).toBe('already_invited');
    expect(inviteOutcome({ status: 422, code: 'DOMAIN_RULE_VIOLATION' })).toBe('not_covered');
    expect(inviteOutcome({ status: 429, code: 'INVITE_CAP_REACHED' })).toBe('cap');
  });

  it('a 401 is the session ending, a 403 the reader no longer inviting', () => {
    expect(inviteOutcome({ status: 401, code: 'UNAUTHENTICATED' })).toBe('signed_out');
    expect(inviteOutcome({ status: 403, code: 'FORBIDDEN' })).toBe('forbidden');
  });

  it('no answer, a 5xx, a reused creation key or an unknown code failed: the form keeps its values', () => {
    expect(inviteOutcome(null)).toBe('failed');
    expect(inviteOutcome({ status: 500, code: 'INTERNAL_ERROR' })).toBe('failed');
    expect(inviteOutcome({ status: 422, code: 'IDEMPOTENCY_KEY_REUSED' })).toBe('failed');
    expect(inviteOutcome({ status: 409, code: 'SOMETHING_ELSE' })).toBe('failed');
  });
});

describe('inviteRefusal — which outcomes the form draws in place of the send', () => {
  it('the four refusals, and nothing else', () => {
    expect(inviteRefusal('already_member')).toBe('already_member');
    expect(inviteRefusal('already_invited')).toBe('already_invited');
    expect(inviteRefusal('not_covered')).toBe('not_covered');
    expect(inviteRefusal('cap')).toBe('cap');
    expect(inviteRefusal('sent')).toBeNull();
    expect(inviteRefusal('forbidden')).toBeNull();
    expect(inviteRefusal('failed')).toBeNull();
    expect(inviteRefusal('signed_out')).toBeNull();
  });
});

describe('numberOnTeam and sendsNothing', () => {
  it('a member or a live invite is on Team; the cap sends nothing too; a number not covered can still be sent', () => {
    expect(numberOnTeam('already_member')).toBe(true);
    expect(numberOnTeam('already_invited')).toBe(true);
    expect(numberOnTeam('cap')).toBe(false);
    expect(numberOnTeam(null)).toBe(false);
    expect(sendsNothing('cap')).toBe(true);
    expect(sendsNothing('already_invited')).toBe(true);
    expect(sendsNothing('not_covered')).toBe(false);
    expect(sendsNothing(null)).toBe(false);
  });
});

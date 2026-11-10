import { describe, expect, it } from 'vitest';
import { createLeadSchema } from '../src/crm/capture';
import { mergeCustomersSchema } from '../src/crm/merge';
import { composeMessageSchema } from '../src/crm/messages';
import { createTaskSchema } from '../src/crm/tasks';

const AT = '2026-11-09T21:40:00.000Z';
const CUSTOMER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const VISIT = '33333333-3333-4333-8333-333333333333';

describe('quick add takes the number alone, a referrer once and a kept duplicate with its reason', () => {
  it.each([
    ['the number alone', {}, true],
    ['a referring customer', { referredBy: { customerId: CUSTOMER } }, true],
    ['a typed referrer name', { referredBy: { name: 'Sunita Patil' } }, true],
    ['a referrer named both ways', { referredBy: { customerId: CUSTOMER, name: 'Sunita' } }, false],
    ['a referrer named neither way', { referredBy: {} }, false],
    ['keep both with a reason', { keepBoth: { otherCustomerId: CUSTOMER, reason: 'Wife' } }, true],
    [
      'keep both with a blank reason',
      { keepBoth: { otherCustomerId: CUSTOMER, reason: ' ' } },
      false,
    ],
    ['keep both without a reason', { keepBoth: { otherCustomerId: CUSTOMER } }, false],
  ])('%s', (_, extra, accepted) => {
    const capture = { phoneE164: '+919876543210', capturedAt: AT, ...extra };
    expect(createLeadSchema.safeParse(capture).success).toBe(accepted);
  });
});

describe('a visit confirmation names its visit; a nudge needs none', () => {
  it.each([
    ['a confirmation with its visit', { templateKey: 'visit_confirmation', visitId: VISIT }, true],
    ['a confirmation without a visit', { templateKey: 'visit_confirmation' }, false],
    ['a nudge without a visit', { templateKey: 'follow_up_nudge' }, true],
    ['a template the CRM does not compose', { templateKey: 'proposal_share' }, false],
  ])('%s', (_, message, accepted) => {
    expect(composeMessageSchema.safeParse({ ...message, capturedAt: AT }).success).toBe(accepted);
  });
});

describe('a custom task says what it is', () => {
  it.each([
    ['a call with no title', { kind: 'call' }, true],
    ['a custom task with its title', { kind: 'custom', title: 'Bring the bill' }, true],
    ['a custom task with no title', { kind: 'custom' }, false],
  ])('%s', (_, task, accepted) => {
    expect(createTaskSchema.safeParse({ ...task, dueAt: AT }).success).toBe(accepted);
  });
});

describe('a merge names two customers', () => {
  it.each([
    ['two customers', OTHER, true],
    ['one customer into itself', CUSTOMER, false],
  ])('%s', (_, loserId, accepted) => {
    const merge = { survivorId: CUSTOMER, loserId, picks: { name: 'loser' }, capturedAt: AT };
    expect(mergeCustomersSchema.safeParse(merge).success).toBe(accepted);
  });
});

// @vitest-environment happy-dom
import type { DedupeMatchWire, LeadDetail } from '@heliogrid/contracts';
import { describe, expect, it } from 'vitest';
import { createDataLayer } from '../../src/data-layer';
import { ApiError } from '../../src/errors/errors';
import { listeningOrigin, refusal, send, writeBodyOf } from '../react/origin-wire';

/**
 * The CRM writes a screen answers in place (`M02-07`, `M02-34`, `M02-67`): the refusal that carries
 * the record a number belongs to, or the owner who won a race, comes back as an outcome with its
 * facts — driven through the real client against an origin answering in the contract's shapes.
 */

const LEAD_ID = '01a30000-0000-7000-8000-000000000001';
const CUSTOMER_ID = '01a30000-0000-7000-8000-000000000002';
const OWNER = { userId: '01a30000-0000-7000-8000-000000000003', name: 'Rajesh Jadhav' };
const PHONE = '+919822041234';
const AT = '2026-11-09T09:05:00.000Z';

const LEAD: LeadDetail = {
  currencyCode: 'INR',
  lead: {
    id: LEAD_ID,
    customerId: CUSTOMER_ID,
    name: 'Priya Sharma',
    phoneE164: PHONE,
    city: 'Nashik',
    segment: 'residential',
    source: 'quick_add',
    stage: 'new',
    state: null,
    owner: OWNER,
    monthlyBill: null,
    value: null,
    createdAt: AT,
    lastActivityAt: AT,
  },
  customer: {
    id: CUSTOMER_ID,
    name: 'Priya Sharma',
    phoneE164: PHONE,
    city: 'Nashik',
    preferredLanguage: null,
    doNotCall: false,
    wrongNumber: false,
    primaryContactId: null,
    contacts: [],
    keptDuplicates: [],
    referred: [],
  },
  qualify: {
    roofOwnership: null,
    roofType: null,
    shading: null,
    timeline: null,
    decisionMaker: null,
  },
  qualifiedAt: null,
  lifecycle: {
    wakeOn: null,
    resurfaceOn: null,
    noCallUntil: null,
    lastClose: null,
    reopenCount: 0,
  },
  unansweredCalls: 0,
  canDial: true,
  cameFrom: null,
  visit: null,
  openTasks: [],
  sections: { designs: 0, proposals: 0, files: 0 },
};

const MATCH: DedupeMatchWire = {
  kind: 'out_of_scope',
  leadId: LEAD_ID,
  ownerName: OWNER.name,
  stage: 'qualified',
  lastContactAt: AT,
};

const withFacts = (code: string, facts: unknown) => ({
  error: { ...refusal(code).error, facts },
});

/** What the origin answers each write with, set by the case running. */
let answer: { status: number; body: unknown } = { status: 500, body: refusal('INTERNAL') };

const origin = listeningOrigin(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, req, 204);
  const write = await writeBodyOf(req, res);
  if (write === null) return;
  send(res, req, answer.status, answer.body);
});

function repositories() {
  return createDataLayer({ baseUrl: origin.url(), language: () => 'en' }).repositories;
}

describe('a CRM write answered with the facts it was refused over', () => {
  it.each([
    { status: 201, body: LEAD, outcome: { kind: 'created', lead: LEAD } },
    {
      status: 409,
      body: withFacts('DUPLICATE_PHONE', MATCH),
      outcome: { kind: 'duplicate', match: MATCH },
    },
  ])(
    'quick add answering $status is the outcome $outcome.kind',
    async ({ status, body, outcome }) => {
      answer = { status, body };
      const created = await repositories().leadCapture.create({ phoneE164: PHONE, capturedAt: AT });
      expect(created).toEqual(outcome);
    },
  );

  it.each([
    { status: 200, body: LEAD, outcome: { kind: 'assigned', lead: LEAD } },
    {
      status: 409,
      body: withFacts('LEAD_ALREADY_ASSIGNED', { owner: OWNER }),
      outcome: { kind: 'already_assigned', owner: OWNER },
    },
    {
      status: 409,
      body: withFacts('LEAD_ALREADY_ASSIGNED', { owner: null }),
      outcome: { kind: 'already_assigned', owner: null },
    },
  ])(
    'an assign answering $status is the outcome $outcome.kind',
    async ({ status, body, outcome }) => {
      answer = { status, body };
      const assigned = await repositories().leadAssign.assign(LEAD_ID, {
        assigneeId: OWNER.userId,
        expectedOwnerId: null,
      });
      expect(assigned).toEqual(outcome);
    },
  );

  it('a contact whose number is someone else’s comes back with that record’s facts', async () => {
    answer = { status: 409, body: withFacts('CONTACT_PHONE_TAKEN', MATCH) };
    const added = await repositories().contacts.add(CUSTOMER_ID, {
      name: 'Suresh Sharma',
      phoneE164: PHONE,
      roleLabelId: null,
    });
    expect(added).toEqual({ kind: 'phone_taken', match: MATCH });
  });

  it('a refusal that carries no facts still leaves as an ApiError with its code', async () => {
    answer = { status: 422, body: refusal('DOMAIN_RULE_VIOLATION') };
    const refused = repositories().leadCapture.create({ phoneE164: PHONE, capturedAt: AT });
    await expect(refused).rejects.toBeInstanceOf(ApiError);
    await expect(refused).rejects.toMatchObject({ status: 422, code: 'DOMAIN_RULE_VIOLATION' });
  });
});

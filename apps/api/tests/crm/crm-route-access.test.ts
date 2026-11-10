import { randomUUID } from 'node:crypto';
import type { LeadDetail, LeadList } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  openCrmWorld,
  preset,
  retryKey,
} from './support';

/**
 * The CRM's doors on the wire (`F2-25`, RFC decision 9): a preset without the add-and-edit grant
 * is refused every write before its handler runs, and another company's lead or customer answers
 * 404 on every route that names one — never 403, which would say it exists.
 */

const here = aStaffedCompany('Doors EPC', {
  owner: [FOUNDER_ROLE],
  surveyor: [preset.survey_engineer],
});
const elsewhere = aStaffedCompany('Other Doors EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CRM DOORS PROOF',
  'Who may use the CRM routes is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the CRM routes, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  let made: LeadDetail;
  const now = () => new Date().toISOString();

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere]);
    made = await captured(world.as(here.members.owner), aCapture(aPhone(), { name: 'Door Lead' }));
  });

  afterAll(async () => {
    await world.close();
  });

  it('a preset without the add-and-edit grant is refused every write', async () => {
    const surveyor = world.as(here.members.surveyor);
    const writes = [
      ['GET', `/customers/match?phone=${encodeURIComponent(made.customer.phoneE164)}`, undefined],
      ['POST', '/leads', aCapture(aPhone())],
      ['PATCH', `/leads/${made.lead.id}`, { city: 'Pune', capturedAt: now() }],
      ['POST', `/leads/${made.lead.id}/enquiries`, aCapture(made.customer.phoneE164)],
      ['POST', `/leads/${made.lead.id}/owner-requests`, aCapture(made.customer.phoneE164)],
      [
        'POST',
        `/customers/${made.customer.id}/contacts`,
        { name: 'X', phoneE164: aPhone(), roleLabelId: null },
      ],
      ['PUT', `/customers/${made.customer.id}/primary-contact`, { contactId: null }],
      ['POST', '/contact-role-labels', { text: 'Surveyor label' }],
    ] as const;
    for (const [method, path, body] of writes) {
      const reply = await surveyor.call(method, path, body, retryKey());
      expect({ method, path, status: reply.status }).toEqual({
        method,
        path,
        status: HttpStatus.FORBIDDEN,
      });
    }
    const list = await surveyor.call<LeadList>('GET', '/leads');
    expect(list).toMatchObject({ status: HttpStatus.OK, body: { items: [], totalCount: 0 } });
  });

  it("another company's lead or customer answers 404 on every route that names one", async () => {
    const stranger = world.as(elsewhere.members.owner);
    const named = [
      ['GET', `/leads/${made.lead.id}`, undefined],
      ['GET', `/leads/${made.lead.id}/activities`, undefined],
      ['GET', `/customers/${made.customer.id}/activities`, undefined],
      ['PATCH', `/leads/${made.lead.id}`, { city: 'Pune', capturedAt: now() }],
      ['POST', `/leads/${made.lead.id}/enquiries`, aCapture(made.customer.phoneE164)],
      ['POST', `/leads/${made.lead.id}/owner-requests`, aCapture(made.customer.phoneE164)],
      [
        'POST',
        `/customers/${made.customer.id}/contacts`,
        { name: 'X', phoneE164: aPhone(), roleLabelId: null },
      ],
      ['PUT', `/customers/${made.customer.id}/primary-contact`, { contactId: null }],
      ['GET', `/leads/${randomUUID()}`, undefined],
    ] as const;
    for (const [method, path, body] of named) {
      const reply = await stranger.call(method, path, body, retryKey());
      expect({ method, path, status: reply.status }).toEqual({
        method,
        path,
        status: HttpStatus.NOT_FOUND,
      });
    }
    const theirs = await stranger.call<LeadList>('GET', '/leads');
    expect(theirs.body.items.map((one) => one.id)).not.toContain(made.lead.id);
    const match = await stranger.call(
      'GET',
      `/customers/match?phone=${encodeURIComponent(made.customer.phoneE164)}`,
    );
    expect(match.body).toEqual({ match: null });
  });
});

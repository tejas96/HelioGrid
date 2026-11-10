import type {
  Contact,
  ContactRoleLabel,
  ContactRoleLabels,
  Customer,
  LeadDetail,
} from '@heliogrid/contracts';
import { CONTACT_ROLE_SEEDS, FOUNDER_ROLE } from '@heliogrid/domain';
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
  retryKey,
  type SheetRefusal,
} from './support';

/**
 * A customer's contacts (`M02-34`, `M02-02`): a contact's number joins the dedupe, a number someone
 * already holds is refused with that record's facts, exactly one primary holds by shape, and the
 * company's role labels are the three seeded at its creation and its own.
 */

const here = aStaffedCompany('Contacts EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CONTACTS PROOF',
  'Contacts are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('contacts, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it("a capture of a contact's number meets the existing customer", async () => {
    const family = await captured(owner(), aCapture(aPhone(), { name: 'Sharma family' }));
    const spousePhone = aPhone();
    const labels = await owner().call<ContactRoleLabels>('GET', '/contact-role-labels');
    const spouse = labels.body.items.find((label) => label.seed === 'spouse');
    const added = await owner().call<Contact>(
      'POST',
      `/customers/${family.customer.id}/contacts`,
      { name: 'Priya Sharma', phoneE164: spousePhone, roleLabelId: spouse?.id ?? null },
      retryKey(),
    );
    expect(added).toMatchObject({
      status: HttpStatus.CREATED,
      body: {
        customerId: family.customer.id,
        phoneE164: spousePhone,
        role: { seed: 'spouse', text: null },
      },
    });
    const capture = await owner().call<SheetRefusal>(
      'POST',
      '/leads',
      aCapture(spousePhone),
      retryKey(),
    );
    expect(capture.status).toBe(HttpStatus.CONFLICT);
    expect(capture.body.error.facts).toMatchObject({
      kind: 'visible',
      customerId: family.customer.id,
    });
  });

  it('a contact whose number someone already holds is refused with that record’s facts', async () => {
    const other = await captured(owner(), aCapture(aPhone(), { name: 'Other customer' }));
    const family = await captured(owner(), aCapture(aPhone(), { name: 'Patil family' }));
    const refused = await owner().call<SheetRefusal>(
      'POST',
      `/customers/${family.customer.id}/contacts`,
      { name: 'Somebody', phoneE164: other.customer.phoneE164, roleLabelId: null },
      retryKey(),
    );
    expect(refused.status).toBe(HttpStatus.CONFLICT);
    expect(refused.body.error).toMatchObject({
      code: 'CONTACT_PHONE_TAKEN',
      facts: { kind: 'visible', customerId: other.customer.id },
    });
    const added = await owner().call<Contact>(
      'POST',
      `/customers/${family.customer.id}/contacts`,
      { name: 'Anil Patil', phoneE164: aPhone(), roleLabelId: null },
      retryKey(),
    );
    const moved = await owner().call<SheetRefusal>('PATCH', `/contacts/${added.body.id}`, {
      phoneE164: other.customer.phoneE164,
    });
    expect(moved.status).toBe(HttpStatus.CONFLICT);
    const renamed = await owner().call<Contact>('PATCH', `/contacts/${added.body.id}`, {
      name: 'Anil P.',
    });
    expect(renamed.body.name).toBe('Anil P.');
  });

  it('a contact number the market cannot read is refused on its field and stored nowhere', async () => {
    const family = await captured(owner(), aCapture(aPhone(), { name: 'Joshi family' }));
    const added = await owner().call<Contact>(
      'POST',
      `/customers/${family.customer.id}/contacts`,
      { name: 'Asha Joshi', phoneE164: aPhone(), roleLabelId: null },
      retryKey(),
    );
    const unreadable = '+91984502774';
    const replies = [
      await owner().call(
        'POST',
        `/customers/${family.customer.id}/contacts`,
        { name: 'Ravi Joshi', phoneE164: unreadable, roleLabelId: null },
        retryKey(),
      ),
      await owner().call('PATCH', `/contacts/${added.body.id}`, { phoneE164: unreadable }),
    ];
    for (const reply of replies) {
      expect(reply).toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        body: { error: { code: 'VALIDATION_FAILED', details: [{ path: 'phoneE164' }] } },
      });
    }
    const record = await owner().call<LeadDetail>('GET', `/leads/${family.lead.id}`);
    expect(record.body.customer.contacts.map((one) => one.phoneE164)).toEqual([
      added.body.phoneE164,
    ]);
  });

  it('exactly one primary: a contact of this customer, or the customer themself', async () => {
    const family = await captured(owner(), aCapture(aPhone(), { name: 'Kale family' }));
    const added = await owner().call<Contact>(
      'POST',
      `/customers/${family.customer.id}/contacts`,
      { name: 'Ravi Kale', phoneE164: aPhone(), roleLabelId: null },
      retryKey(),
    );
    const primary = await owner().call<Customer>(
      'PUT',
      `/customers/${family.customer.id}/primary-contact`,
      {
        contactId: added.body.id,
      },
    );
    expect(primary.body.primaryContactId).toBe(added.body.id);
    const stranger = await captured(owner(), aCapture(aPhone()));
    const elsewhere = await owner().call(
      'PUT',
      `/customers/${stranger.customer.id}/primary-contact`,
      {
        contactId: added.body.id,
      },
    );
    expect(elsewhere.status).toBe(HttpStatus.NOT_FOUND);
    const back = await owner().call<Customer>(
      'PUT',
      `/customers/${family.customer.id}/primary-contact`,
      {
        contactId: null,
      },
    );
    expect(back.body.primaryContactId).toBeNull();
  });

  it('the role labels are the three seeded and the company’s own, the same text answering its label', async () => {
    const first = await owner().call<ContactRoleLabel>(
      'POST',
      '/contact-role-labels',
      { text: 'Site manager' },
      retryKey(),
    );
    const again = await owner().call<ContactRoleLabel>(
      'POST',
      '/contact-role-labels',
      { text: 'Site manager' },
      retryKey(),
    );
    expect(first.status).toBe(HttpStatus.CREATED);
    expect(again.body).toEqual(first.body);
    const labels = await owner().call<ContactRoleLabels>('GET', '/contact-role-labels');
    expect(labels.body.items.map((label) => label.seed ?? label.text)).toEqual([
      ...CONTACT_ROLE_SEEDS,
      'Site manager',
    ]);
  });
});

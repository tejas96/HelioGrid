import type { CustomerMatch, LeadDetail, OwnerRequestSent } from '@heliogrid/contracts';
import { duplicateLink } from '@heliogrid/db';
import { FOUNDER_ROLE, leadScopeOf } from '@heliogrid/domain';
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CrmCaptureService } from '../../src/modules/crm/crm.capture.service';
import { phoneLockKey } from '../../src/modules/crm/crm.public';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  auditEntriesOf,
  type CrmWorld,
  capture,
  captured,
  customersHolding,
  entriesOfKind,
  leadsOf,
  noticesOf,
  openCrmWorld,
  ownLead,
  preset,
  retryKey,
  type SheetRefusal,
  withTrunkZero,
} from './support';

/**
 * Duplicate detection and the dedupe sheet (`M02-07`…`M02-12`, `M02-66`): a number someone holds
 * — typed any way, a customer's or a contact's — saves nothing and answers the sheet's facts, only
 * the three outside the actor's scope; the sheet's enquiry answers change no stage or owner; keep
 * both needs a reason and is audited; and of two same-moment saves the second meets the sheet.
 */

const here = aStaffedCompany('Dedupe EPC', {
  owner: [FOUNDER_ROLE],
  rajesh: [preset.sales_executive],
  sunita: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'DEDUPE PROOF',
  'The dedupe sheet is UNPROVEN on the wire in this run.',
);

const REASON = 'Two shops share one landline';

describe.skipIf(skip)('the dedupe sheet, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const rajesh = () => world.as(here.members.rajesh);
  const sunita = () => world.as(here.members.sunita);
  const holding = (phone: string) => customersHolding(world, here.company.tenantId, phone);
  const refusalOf = (reply: { body: unknown }) => (reply.body as SheetRefusal).error;

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the same number typed two ways meets the existing customer', async () => {
    const phone = aPhone();
    const first = await captured(owner(), aCapture(phone, { name: 'Priya Sharma' }));
    const again = await capture(owner(), aCapture(withTrunkZero(phone)));
    expect(again.status).toBe(HttpStatus.CONFLICT);
    expect(refusalOf(again)).toMatchObject({
      code: 'DUPLICATE_PHONE',
      facts: { kind: 'visible', customerId: first.customer.id, leadId: first.lead.id },
    });
    const typed = encodeURIComponent(withTrunkZero(phone));
    const live = await owner().call<CustomerMatch>('GET', `/customers/match?phone=${typed}`);
    expect(live.body.match).toMatchObject({ customerId: first.customer.id });
    expect(await holding(phone)).toHaveLength(1);
  });

  it('a capture whose number matches a customer or a contact saves nothing and answers the three facts', async () => {
    const [phone, contactPhone] = [aPhone(), aPhone()];
    const first = await captured(owner(), aCapture(phone, { name: 'Meera Joshi', city: 'Nashik' }));
    await ownLead(world, first.lead.id, here.people.rajesh.userId);
    const contact = { name: 'Arun Joshi', phoneE164: contactPhone, roleLabelId: null };
    const path = `/customers/${first.customer.id}/contacts`;
    expect((await owner().call('POST', path, contact, retryKey())).status).toBe(HttpStatus.CREATED);

    for (const typed of [phone, contactPhone]) {
      const refused = await capture(owner(), aCapture(typed, { name: 'Again' }));
      expect(refused.status).toBe(HttpStatus.CONFLICT);
      expect(refusalOf(refused).facts).toEqual({
        kind: 'visible',
        leadId: first.lead.id,
        customerId: first.customer.id,
        name: 'Meera Joshi',
        city: 'Nashik',
        ownerName: here.people.rajesh.name,
        stage: 'new',
        lastContactAt: expect.any(String),
      });
    }
    expect(await holding(phone)).toHaveLength(1);
    expect(await holding(contactPhone)).toHaveLength(0);
  });

  it('log enquiry appends one activity, notifies the owner and changes no stage or owner', async () => {
    const phone = aPhone();
    const first = await captured(owner(), aCapture(phone, { name: 'Kavita Rao' }));
    await ownLead(world, first.lead.id, here.people.rajesh.userId);
    const typed = aCapture(phone, { name: 'Kavita', city: 'Pune', segment: 'residential' });
    const path = `/leads/${first.lead.id}/enquiries`;
    const logged = await owner().call<LeadDetail>('POST', path, typed, retryKey());
    expect(logged.status).toBe(HttpStatus.CREATED);
    const enquiries = await entriesOfKind(world, first.lead.id, 'enquiry');
    expect(enquiries.map((one) => one.body)).toEqual([
      expect.objectContaining({ name: 'Kavita', city: 'Pune', phoneE164: phone, askedBy: null }),
    ]);
    const [told] = await noticesOf(world, here.people.rajesh.userId, first.lead.id);
    expect(told).toMatchObject({ type: 'lead_enquiry', subjectKind: 'lead' });
    expect(told?.title).toContain('Kavita Rao');
    expect(await leadsOf(world, first.customer.id)).toEqual([
      { id: first.lead.id, stage: 'new', owner: here.people.rajesh.userId },
    ]);
  });

  it('log enquiry on a lead outside the scope logs it and answers no more than the sheet showed', async () => {
    const phone = aPhone();
    const first = await captured(owner(), aCapture(phone, { name: 'Lata Pawar' }));
    await ownLead(world, first.lead.id, here.people.rajesh.userId);
    const path = `/leads/${first.lead.id}/enquiries`;
    const logged = await sunita().call('POST', path, aCapture(phone, { name: 'Lata' }), retryKey());
    expect(logged).toMatchObject({ status: HttpStatus.CREATED });
    expect(logged.body).toEqual({ leadId: first.lead.id, loggedAt: expect.any(String) });
    const enquiries = await entriesOfKind(world, first.lead.id, 'enquiry');
    expect(enquiries.map((one) => [one.actorRef, one.body])).toEqual([
      [here.people.sunita.userId, expect.objectContaining({ name: 'Lata', askedBy: null })],
    ]);
    const [told] = await noticesOf(world, here.people.rajesh.userId, first.lead.id);
    expect(told).toMatchObject({ type: 'lead_enquiry', subjectKind: 'lead' });
    expect(await noticesOf(world, here.people.sunita.userId, first.lead.id)).toHaveLength(0);
    expect(await leadsOf(world, first.customer.id)).toEqual([
      { id: first.lead.id, stage: 'new', owner: here.people.rajesh.userId },
    ]);
  });

  it('an enquiry number the market cannot read is refused on its field and logs nothing', async () => {
    const first = await captured(owner(), aCapture(aPhone(), { name: 'Neha Desai' }));
    const typed = aCapture('+91984502774', { name: 'Neha' });
    for (const answer of ['enquiries', 'owner-requests']) {
      const reply = await owner().call(
        'POST',
        `/leads/${first.lead.id}/${answer}`,
        typed,
        retryKey(),
      );
      expect({ answer, reply }).toMatchObject({
        answer,
        reply: {
          status: HttpStatus.BAD_REQUEST,
          body: { error: { code: 'VALIDATION_FAILED', details: [{ path: 'phoneE164' }] } },
        },
      });
    }
    expect(await entriesOfKind(world, first.lead.id, 'enquiry')).toHaveLength(0);
  });

  it('keep both needs a reason, links both customers and audits who, why and when', async () => {
    const phone = aPhone();
    const first = await captured(owner(), aCapture(phone, { name: 'Shop A' }));
    const keepBoth = (reason: string) =>
      aCapture(phone, { name: 'Shop B', keepBoth: { otherCustomerId: first.customer.id, reason } });

    expect((await capture(owner(), keepBoth('   '))).status).toBe(HttpStatus.BAD_REQUEST);
    // No preset that may add leads lacks the override today, so the rule is driven at the service.
    const roles = [preset.survey_engineer];
    const reader = { tenantId: here.company.tenantId, actorId: here.people.sunita.userId, roles };
    const act = { actorUserId: here.people.sunita.userId, now: Date.now() };
    await expect(
      world.http.app
        .get(CrmCaptureService)
        .create({ ...reader, scope: leadScopeOf(roles) }, keepBoth(REASON), {}, act),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(await holding(phone)).toHaveLength(1);

    const before = Date.now();
    const kept = await capture(owner(), keepBoth(REASON));
    expect(kept.status).toBe(HttpStatus.CREATED);
    const second = kept.body as LeadDetail;
    expect(second.customer.keptDuplicates).toEqual([
      { customerId: first.customer.id, name: 'Shop A', reason: REASON },
    ]);
    const firstNow = await owner().call<LeadDetail>('GET', `/leads/${first.lead.id}`);
    expect(firstNow.body.customer.keptDuplicates).toEqual([
      { customerId: second.customer.id, name: 'Shop B', reason: REASON },
    ]);
    const links = await world.pools.admin.db
      .select()
      .from(duplicateLink)
      .where(eq(duplicateLink.customerBId, second.customer.id));
    expect(links).toMatchObject([
      { customerAId: first.customer.id, reason: REASON, createdBy: here.people.owner.userId },
    ]);
    for (const [leadId, other] of [
      [first.lead.id, second.customer.id],
      [second.lead.id, first.customer.id],
    ] as const) {
      const entries = await entriesOfKind(world, leadId, 'duplicate_kept');
      expect(entries.map((one) => [one.actorRef, one.body])).toEqual([
        [
          here.people.owner.userId,
          expect.objectContaining({ otherCustomerId: other, reason: REASON }),
        ],
      ]);
    }
    const audited = await auditEntriesOf(world, here.company.tenantId, 'crm.duplicate_kept');
    expect(audited).toMatchObject([
      {
        actorRef: here.people.owner.userId,
        subjectKind: 'customer',
        subjectRef: second.customer.id,
        blocked: false,
        changePayload: { reason: REASON, keptBesideId: first.customer.id },
      },
    ]);
    expect(audited[0]?.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('of two same-number saves at one moment, the second meets the sheet with its typing kept', async () => {
    const phone = aPhone();
    const held = await holdLock(
      sql`select pg_advisory_xact_lock(hashtext(${phoneLockKey(here.company.tenantId, phone)}))`,
    );
    const saves = [
      capture(owner(), aCapture(phone, { name: 'Priya' })),
      capture(rajesh(), aCapture(phone, { name: 'Priya S' })),
    ];
    await held.waitForWaiters(saves.length);
    await held.release();
    const replies = await Promise.all(saves);
    const statuses = replies.map((one) => one.status).sort();
    expect(statuses).toEqual([HttpStatus.CREATED, HttpStatus.CONFLICT]);
    const saved = replies.find((one) => one.status === HttpStatus.CREATED)?.body as LeadDetail;
    const refused = replies.find((one) => one.status === HttpStatus.CONFLICT) ?? { body: null };
    expect(refusalOf(refused)).toMatchObject({
      code: 'DUPLICATE_PHONE',
      facts: { leadId: saved.lead.id },
    });
    expect(await holding(phone)).toEqual([{ id: saved.customer.id, name: saved.customer.name }]);
  });

  it("open existing outside the actor's scope becomes a request to the owner", async () => {
    const phone = aPhone();
    const first = await captured(
      owner(),
      aCapture(phone, { name: 'Deepa Kulkarni', city: 'Nagpur' }),
    );
    await ownLead(world, first.lead.id, here.people.rajesh.userId);

    const sheet = await capture(sunita(), aCapture(phone, { name: 'Deepa' }));
    expect(sheet.status).toBe(HttpStatus.CONFLICT);
    expect(refusalOf(sheet).facts).toEqual({
      kind: 'out_of_scope',
      leadId: first.lead.id,
      ownerName: here.people.rajesh.name,
      stage: 'new',
      lastContactAt: expect.any(String),
    });
    const opened = await sunita().call('GET', `/leads/${first.lead.id}`);
    expect(opened.status).toBe(HttpStatus.NOT_FOUND);

    const path = `/leads/${first.lead.id}/owner-requests`;
    const typed = aCapture(phone, { name: 'Deepa' });
    const asked = await sunita().call<OwnerRequestSent>('POST', path, typed, retryKey());
    expect(asked).toMatchObject({ status: HttpStatus.CREATED });
    expect(asked.body).toEqual({
      leadId: first.lead.id,
      ownerName: here.people.rajesh.name,
      requestedAt: expect.any(String),
    });
    const [told] = await noticesOf(world, here.people.rajesh.userId, first.lead.id);
    expect(told).toMatchObject({ type: 'lead_enquiry' });
    expect(told?.body).toContain(here.people.sunita.name);
    expect(await noticesOf(world, here.people.sunita.userId, first.lead.id)).toHaveLength(0);
    const [entry] = await entriesOfKind(world, first.lead.id, 'enquiry');
    expect(entry?.body).toMatchObject({
      askedBy: { userId: here.people.sunita.userId, name: here.people.sunita.name },
    });
    expect(await leadsOf(world, first.customer.id)).toEqual([
      { id: first.lead.id, stage: 'new', owner: here.people.rajesh.userId },
    ]);
  });
});

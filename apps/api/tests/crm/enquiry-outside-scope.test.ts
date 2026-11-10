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
  entriesOfKind,
  noticesOf,
  openCrmWorld,
  ownLead,
  preset,
  retryKey,
} from './support';

/**
 * The dedupe sheet's two enquiry answers outside the reader's scope (`M02-08`, `M02-11`): they
 * land only on the lead the typed number belongs to — the lead the sheet showed — so a number
 * that is not its customer's or a contact's answers as an id that does not exist, writes nothing
 * and tells no owner.
 */

const here = aStaffedCompany('Enquiry Reach EPC', {
  owner: [FOUNDER_ROLE],
  rajesh: [preset.sales_executive],
  sunita: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'ENQUIRY REACH PROOF',
  'Where an enquiry outside the scope may land is UNPROVEN on the wire in this run.',
);

const ANSWERS = ['enquiries', 'owner-requests'] as const;
const NO_SUCH_LEAD = '0190c0de-0000-7000-8000-000000000000';

describe.skipIf(skip)('enquiries outside the scope, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const sunita = () => world.as(here.members.sunita);
  const rajeshId = () => here.people.rajesh.userId;

  /** Rajesh's lead, which Sunita's scope never reaches, and its number. */
  const rajeshLead = async (name: string) => {
    const phone = aPhone();
    const made = await captured(owner(), aCapture(phone, { name }));
    await ownLead(world, made.lead.id, rajeshId());
    return { phone, leadId: made.lead.id, customerId: made.customer.id };
  };
  const sent = (answer: string, leadId: string, phone: string) =>
    sunita().call(
      'POST',
      `/leads/${leadId}/${answer}`,
      aCapture(phone, { name: 'Typed' }),
      retryKey(),
    );

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each(ANSWERS)(
    '%s on a lead outside the scope with a number not its own answers 404 and writes nothing',
    async (answer) => {
      const target = await rajeshLead('Lata Pawar');
      const someoneElses = (await rajeshLead('Someone Else')).phone;
      const replies = [
        await sent(answer, target.leadId, someoneElses),
        await sent(answer, target.leadId, aPhone()),
        await sent(answer, NO_SUCH_LEAD, target.phone),
      ];
      // A real id with the wrong number reads exactly as an id that does not exist.
      expect(replies.map((one) => [one.status, (one.body as { error?: unknown }).error])).toEqual(
        replies.map(() => [
          HttpStatus.NOT_FOUND,
          expect.objectContaining({ code: 'NOT_FOUND', message: 'No such lead or customer.' }),
        ]),
      );
      expect(await entriesOfKind(world, target.leadId, 'enquiry')).toHaveLength(0);
      expect(await noticesOf(world, rajeshId(), target.leadId)).toHaveLength(0);
    },
  );

  it.each(ANSWERS)(
    "%s on a lead outside the scope lands with its customer's number or a contact's",
    async (answer) => {
      const target = await rajeshLead('Meera Joshi');
      const contactPhone = aPhone();
      const contact = { name: 'Arun Joshi', phoneE164: contactPhone, roleLabelId: null };
      const path = `/customers/${target.customerId}/contacts`;
      expect((await owner().call('POST', path, contact, retryKey())).status).toBe(
        HttpStatus.CREATED,
      );
      for (const typed of [target.phone, contactPhone]) {
        expect((await sent(answer, target.leadId, typed)).status).toBe(HttpStatus.CREATED);
      }
      expect(await entriesOfKind(world, target.leadId, 'enquiry')).toHaveLength(2);
    },
  );
});

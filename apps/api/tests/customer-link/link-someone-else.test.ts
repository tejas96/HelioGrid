import type { CustomerLink } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  type AddressedLink,
  aLead,
  answerOn,
  aShared,
  aStaffedCompany,
  customersLink,
  linkAct,
  linkRowsOf,
  openProposalsWorld,
  type ProposalsWorld,
  pageOf,
  retryKey,
  share,
  tokenOf,
} from './support';

/*
 * A link named for someone the customer record does not hold (`F5-26`: "where the contact is
 * known") is its own link, never the customer's: a later share must not hand out its address —
 * with the customer's own revoked, it mints them a new one.
 */

const here = aStaffedCompany('Someone Else Link EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'SOMEONE ELSE LINK PROOF',
  'A contact-less named link told apart from the customer’s own is UNPROVEN in this run.',
);

const at = () => new Date().toISOString();

describe.skipIf(skip)('A link for someone else, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('mints its own link, and a later share never reuses it as the customer’s (F5-20, F5-26)', async () => {
    const leadId = await aLead(owner());
    const shared = await aShared(owner(), leadId);
    const own = await customersLink(owner(), leadId);

    const minted = await owner().call<AddressedLink>(
      'POST',
      `/leads/${leadId}/links`,
      { label: 'Bank officer', contactId: null, capturedAt: at() },
      retryKey(),
    );
    expect(minted.status).toBe(HttpStatus.CREATED);
    expect(minted.body.link.id).not.toBe(own.link.id);
    expect(minted.body.link).toMatchObject({ label: 'Bank officer', contact: null });

    await owner().call<CustomerLink>('POST', `/links/${own.link.id}/revoke`, {
      capturedAt: at(),
    });
    const again = await share(owner(), shared.id, 'copy_link');
    expect(again.status).toBe(HttpStatus.OK);
    // The customer's own link is off: the share mints them a new one, never another person's.
    const renewed = (await linkRowsOf(world, leadId)).filter(
      (row) => row.forCustomer && row.status === 'active',
    );
    expect(renewed).toHaveLength(1);
    expect(renewed[0]?.id).not.toBe(own.link.id);
    const address = again.body.message.link;
    expect(address).not.toBeNull();
    expect(address).not.toBe(minted.body.url);
    expect((await pageOf(world, tokenOf(address ?? ''))).body.kind).toBe('proposal');
  });

  it('another link on the deal never shows the words the customer wrote on theirs (F5-30)', async () => {
    const leadId = await aLead(owner());
    await aShared(owner(), leadId);
    const own = await customersLink(owner(), leadId);
    const minted = await owner().call<AddressedLink>(
      'POST',
      `/leads/${leadId}/links`,
      { label: 'Bank officer', contactId: null, capturedAt: at() },
      retryKey(),
    );
    const words = 'Private: my brother pays half';
    const asked = await linkAct(world, own.token, 'negotiate', {
      ...(await answerOn(world, own.token)),
      words,
    });
    expect(asked.body.proposal?.answer?.words).toBe(words);

    const theirs = await pageOf(world, tokenOf(minted.body.url));
    expect(theirs.body.proposal?.answer).toMatchObject({ kind: 'negotiate', words: null });
    expect(JSON.stringify(theirs.body)).not.toContain(words);
  });
});

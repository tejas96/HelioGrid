import { subscription } from '@heliogrid/db';
import { BILLING_STATES, FOUNDER_ROLE, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { linkTokenHash } from '../../src/modules/customer-link/internal/link-secret';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aGenerated,
  aLead,
  answerOn,
  anyVersion,
  aShared,
  aStaffedCompany,
  customersLink,
  linkAct,
  linkRowsOf,
  linksOf,
  openProposalsWorld,
  type ProposalsWorld,
  pageOf,
  preset,
  projectsStandIn,
  refusalOf,
  share,
  tokensOf,
} from './support';

/**
 * The link's life (`T-F5-006`; `F5-19`…`F5-24`, `F5-75`, `F5-76`): it exists once a proposal is
 * shared and never before; its address is a secret the store never holds; it serves in every
 * billing state; a revoke kills it at once; a new address leaves the earlier one working.
 */

const here = aStaffedCompany('Link Life EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  pm: [preset.project_manager],
});

const skip = skipWithoutDatabase(
  'CUSTOMER LINK LIFE PROOF',
  'Minting, permanence, revocation and billing independence are UNPROVEN in this run.',
);

const at = () => new Date().toISOString();
/** Long enough that a past-due, halted or cancelled company is past every grace it has. */
const LONG_AGO_DAYS = 40;
const LONG_AGO_MS = LONG_AGO_DAYS * MS_PER_DAY;
/** The secret's length: 32 bytes, base64url. */
const TOKEN_LENGTH = 43;

describe.skipIf(skip)('A customer link, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const tenantId = () => here.company.tenantId;

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  /** The company's billing row a proof set: removed, so the next proof starts unpaused. */
  const noSubscription = () =>
    world.pools.admin.db.delete(subscription).where(eq(subscription.tenantId, tenantId()));

  afterEach(noSubscription);

  afterAll(async () => {
    await world.close();
  });

  it('a proposal that was never shared has no link at all (F5-20)', async () => {
    const leadId = await aLead(owner());
    await aGenerated(owner(), leadId);
    expect((await linksOf(owner(), leadId)).body.links).toEqual([]);
    expect(await linkRowsOf(world, leadId)).toEqual([]);
  });

  it('the first share mints the customer’s link once, and the message carries its address (F5-20)', async () => {
    const leadId = await aLead(owner());
    const made = await aGenerated(owner(), leadId);
    const first = await share(owner(), made.proposal.id);
    const again = await share(owner(), made.proposal.id, 'copy_link');
    expect(await linkRowsOf(world, leadId)).toHaveLength(1);
    const { token } = await customersLink(owner(), leadId);
    expect(first.body.message.link).toMatch(new RegExp(`/p/${token}$`));
    expect(again.body.message.link).toBe(first.body.message.link);
    const page = await pageOf(world, token);
    expect(page.status).toBe(HttpStatus.OK);
    expect(page.body.kind).toBe('proposal');
  });

  it('the address is a secret the store never holds, and names no person (F5-75, F5-77)', async () => {
    const leadId = await aLead(owner());
    await aShared(owner(), leadId);
    const { link, token } = await customersLink(owner(), leadId);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const [stored] = await tokensOf(world, link.id);
    expect(stored?.tokenHash).toBe(linkTokenHash(token));
    expect(JSON.stringify(stored)).not.toContain(token);
  });

  it('a token the product never minted is a plain 404', async () => {
    const unknown = 'A'.repeat(TOKEN_LENGTH);
    expect((await pageOf(world, unknown)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await linkAct(world, unknown, 'accept', anyVersion)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a revoked link dies at once, and says so with a person to call (F5-76, F5-25)', async () => {
    const leadId = await aLead(owner());
    await aShared(owner(), leadId);
    const { link, token } = await customersLink(owner(), leadId);
    expect((await pageOf(world, token)).body.kind).toBe('proposal');

    const revoked = await owner().call('POST', `/links/${link.id}/revoke`, { capturedAt: at() });
    expect(revoked.status).toBe(HttpStatus.OK);
    const page = await pageOf(world, token);
    expect(page.status).toBe(HttpStatus.OK);
    expect(page.body).toMatchObject({ kind: 'off', off: { reason: 'revoked' }, mayAsk: false });
    expect(page.body.person?.phoneE164).toBe(here.people.owner.phoneE164);
    expect(page.body.proposal).toBeUndefined();
    expect(refusalOf(await linkAct(world, token, 'accept', anyVersion))).toBe('link_off');
  });

  it('a new address leaves the earlier one working, unless it is turned off in the same act (F5-22)', async () => {
    const leadId = await aLead(owner());
    await aShared(owner(), leadId);
    const { link, token: first } = await customersLink(owner(), leadId);

    const kept = await owner().call<{ url: string }>('POST', `/links/${link.id}/remint`, {
      revokeEarlier: false,
      capturedAt: at(),
    });
    const second = kept.body.url.slice(kept.body.url.lastIndexOf('/') + 1);
    expect(second).not.toBe(first);
    expect((await pageOf(world, first)).body.kind).toBe('proposal');
    expect((await pageOf(world, second)).body.kind).toBe('proposal');

    const swapped = await owner().call<{ url: string }>('POST', `/links/${link.id}/remint`, {
      revokeEarlier: true,
      capturedAt: at(),
    });
    const third = swapped.body.url.slice(swapped.body.url.lastIndexOf('/') + 1);
    expect((await pageOf(world, first)).body.off?.reason).toBe('revoked');
    expect((await pageOf(world, second)).body.off?.reason).toBe('revoked');
    expect((await pageOf(world, third)).body.kind).toBe('proposal');
  });

  it.each(BILLING_STATES)(
    'a company whose billing is %s still serves the page and takes the customer’s act (F5-23)',
    async (state) => {
      const leadId = await aLead(owner());
      await aShared(owner(), leadId);
      const { token } = await customersLink(owner(), leadId);
      const now = Date.now();
      await world.pools.admin.db.insert(subscription).values({
        tenantId: tenantId(),
        state,
        stateEnteredAt: new Date(now - LONG_AGO_MS),
        trialEndsAt: state === 'trialing' ? new Date(now + LONG_AGO_MS) : null,
        paidPeriodEnd: state === 'cancelled' ? new Date(now - LONG_AGO_MS) : null,
        createdAt: new Date(now - LONG_AGO_MS),
      });

      const page = await pageOf(world, token);
      expect(page.status).toBe(HttpStatus.OK);
      expect(page.body).toMatchObject({ kind: 'proposal', proposal: { mayRespond: true } });
      const asked = await linkAct(world, token, 'questions', { text: 'Is the subsidy sure?' });
      expect(asked.status).toBe(HttpStatus.OK);
      const accepted = await linkAct(world, token, 'accept', await answerOn(world, token));
      expect(accepted.status).toBe(HttpStatus.OK);
      expect(accepted.body.proposal?.answer?.kind).toBe('accept');
    },
  );

  it('once the deal is won the same address serves progress, and the respond scope grants nothing (F5-19, F5-21)', async () => {
    const leadId = await aLead(owner());
    await aShared(owner(), leadId);
    const { token } = await customersLink(owner(), leadId);
    projectsStandIn(
      world,
      new Map([
        [
          leadId,
          {
            projectId: '018f0000-0000-7000-8000-000000000001',
            stage: 'installation',
            cancelledAt: null,
            handedOverAt: null,
            managerId: here.people.pm.userId,
          },
        ],
      ]),
    );
    try {
      const page = await pageOf(world, token);
      expect(page.body.kind).toBe('progress');
      expect(page.body.proposal).toBeUndefined();
      // After Won the page names the project's manager, never the sales rep (`T-F5-002`).
      expect(page.body.person?.phoneE164).toBe(here.people.pm.phoneE164);
      expect(refusalOf(await linkAct(world, token, 'accept', anyVersion))).toBe('link_off');
      // A question is open in every phase (`F5-52`).
      expect((await linkAct(world, token, 'questions', { text: 'When do you come?' })).status).toBe(
        HttpStatus.OK,
      );
    } finally {
      projectsStandIn(world, new Map());
    }
  });
});

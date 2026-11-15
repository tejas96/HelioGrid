import { randomUUID } from 'node:crypto';
import { lead, proposalVersion } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ENV } from '../../src/config/env';
import { mintPrintGrant } from '../../src/modules/proposals/internal/print-grant';
import { ProposalsVersionsService } from '../../src/modules/proposals/proposals.public';
import { aPair, mergeOf } from '../crm/merge-support';
import { aPdf, printedThroughStore } from '../proposals/pdf-support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aLead,
  answerOn,
  aShared,
  aStaffedCompany,
  customersLink,
  linkAct,
  openProposalsWorld,
  type ProposalsWorld,
  pageOf,
} from './support';

/**
 * The link's files, the renderer's read and a merge (`T-F5-006`, `T-F5-009`, `T-M06-017`; `F5-21`,
 * `F5-38`, `M02-60`): the PDF and every file are reached by the token and checked against the
 * link's phase; the print page reads a frozen version behind its grant; a merged customer's link
 * keeps working.
 */

const here = aStaffedCompany('Link Files EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CUSTOMER LINK FILES PROOF',
  'The PDF by token, the print read and the merge of a linked customer are UNPROVEN in this run.',
);

describe.skipIf(skip)('A link’s files and its merge, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const tenantId = () => here.company.tenantId;
  const anonymous = <T>(path: string) => world.http.callAnonymously<T>('GET', path);

  const aSharedDeal = async () => {
    const leadId = await aLead(owner());
    const shared = await aShared(owner(), leadId);
    const { link, token } = await customersLink(owner(), leadId);
    const [version] = await world.pools.admin.db
      .select({ id: proposalVersion.id })
      .from(proposalVersion)
      .where(eq(proposalVersion.proposalId, shared.id));
    return { leadId, link, token, versionId: version?.id ?? '' };
  };
  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the token reaches the kept PDF of the version the page shows, and a dead link reaches none (F5-21, F5-38)', async () => {
    const deal = await aSharedDeal();
    const version = { tenantId: tenantId(), versionId: deal.versionId };
    const printed = await printedThroughStore(world, version, await aPdf());
    await world.http.app.get(ProposalsVersionsService).keep({ ...version, ...printed }, Date.now());

    const pdf = await anonymous<{ download: { url: string } | null }>(
      `/customer-link/${deal.token}/pdf`,
    );
    expect(pdf.status).toBe(HttpStatus.OK);
    expect(pdf.body.download?.url ?? '').not.toBe('');
    // The proposal phase lists no project file: any file id by this token is not found.
    expect((await anonymous(`/customer-link/${deal.token}/files/${randomUUID()}`)).status).toBe(
      HttpStatus.NOT_FOUND,
    );

    await owner().call('POST', `/links/${deal.link.id}/revoke`, {
      capturedAt: new Date().toISOString(),
    });
    expect((await anonymous(`/customer-link/${deal.token}/pdf`)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('the print read answers the frozen version behind its grant, and nothing without one (T-M06-017)', async () => {
    const deal = await aSharedDeal();
    const grant = mintPrintGrant(ENV.AUTH_TOKEN_SECRET, deal.versionId, Date.now());
    const printed = await anonymous<{ document: { version: number; money: { margin?: unknown } } }>(
      `/proposal-print/${deal.versionId}?grant=${encodeURIComponent(grant)}`,
    );
    expect(printed.status).toBe(HttpStatus.OK);
    expect(printed.body.document.version).toBe(1);
    expect(printed.body.document.money.margin ?? null).toBeNull();
    // The page and the print read draw one value set (`F5-38`).
    const page = await pageOf(world, deal.token);
    expect(page.body.proposal?.document.money).toEqual(printed.body.document.money);

    const forged = mintPrintGrant('not-the-key', deal.versionId, Date.now());
    for (const bad of [forged, mintPrintGrant(ENV.AUTH_TOKEN_SECRET, randomUUID(), Date.now())]) {
      const refused = await anonymous(
        `/proposal-print/${deal.versionId}?grant=${encodeURIComponent(bad)}`,
      );
      expect(refused.status).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it('a merged customer’s link resolves to the survivor and its token keeps working (M02-60)', async () => {
    const { survivor, loser } = await aPair(owner());
    await aShared(owner(), loser.lead.id);
    const { token } = await customersLink(owner(), loser.lead.id);
    expect((await pageOf(world, token)).body.kind).toBe('proposal');

    const merged = await mergeOf(owner(), survivor.customer.id, loser.customer.id);
    expect(merged.status).toBe(HttpStatus.OK);
    const [moved] = await world.pools.admin.db
      .select({ customerId: lead.customerId })
      .from(lead)
      .where(eq(lead.id, loser.lead.id));
    expect(moved?.customerId).toBe(survivor.customer.id);

    const page = await pageOf(world, token);
    expect(page.status).toBe(HttpStatus.OK);
    expect(page.body.kind).toBe('proposal');
    const on = await answerOn(world, token);
    expect((await linkAct(world, token, 'accept', on)).status).toBe(HttpStatus.OK);
  });
});

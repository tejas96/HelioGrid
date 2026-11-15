import { randomUUID } from 'node:crypto';
import type { ProposalDocument } from '@heliogrid/contracts';
import { proposalVersion } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ENV } from '../../src/config/env';
import { mintPrintGrant, printGrantHolds } from '../../src/modules/proposals/internal/print-grant';
import { ProposalsPrintService } from '../../src/modules/proposals/proposals.print.service';
import { ProposalsVersionsService } from '../../src/modules/proposals/proposals.versions.service';
import { skipWithoutDatabase } from '../support/fixture';
import { aPdf, printedThroughStore } from './pdf-support';
import {
  aLead,
  aReadyDraft,
  aStaffedCompany,
  edited,
  generate,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
  systemOf,
} from './support';

/**
 * A version's PDF (`T-M06-017`, `F5-38`): made the way its workflow's two api steps make it —
 * through the service, no Temporal — from the web's own print page behind a short-lived grant,
 * kept once against the version, and handed out by link to who may see the lead.
 */

const here = aStaffedCompany('Proposal PDF EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  other: [preset.sales_executive],
});
const there = aStaffedCompany('Proposal PDF Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL PDF PROOF',
  'A version’s print page, its grant and its kept PDF are UNPROVEN in this run.',
);

const MS_PER_SECOND = 1_000;
/** A grant lasts five minutes: long enough for one render, too short to keep. */
const PRINT_GRANT_SECONDS = 300;

describe.skipIf(skip)('A version’s PDF and its print page', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const versions = () => world.http.app.get(ProposalsVersionsService);
  const print = () => world.http.app.get(ProposalsPrintService);
  const tenantId = () => here.company.tenantId;

  const aVersion = async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const ready = await aReadyDraft(owner(), leadId);
    const costed = await edited(owner(), ready, {
      fields: { system: systemOf(ready, { ourCost: '150000.00' }) },
    });
    const made = (await generate(owner(), costed)).body;
    const [row] = await world.pools.admin.db
      .select({ id: proposalVersion.id })
      .from(proposalVersion)
      .where(eq(proposalVersion.proposalId, made.proposal.id));
    if (row === undefined) throw new Error('the generated version has no row');
    return { ...made, versionId: row.id };
  };
  const grantIn = (url: string) => new URL(url).searchParams.get('grant') ?? '';

  beforeAll(async () => {
    world = await openProposalsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the page to print is the web’s own print page for that version, behind a grant that reads it', async () => {
    const { versionId, number } = await aVersion();
    const page = await versions().page({ tenantId: tenantId(), versionId });
    if (page?.kind !== 'page') throw new Error(`expected a page, got ${JSON.stringify(page)}`);
    expect(page.url.startsWith(`${ENV.WEB_ORIGIN}/print/proposal/${versionId}?grant=`)).toBe(true);
    expect(page.origins).toEqual([ENV.WEB_ORIGIN, ENV.API_PUBLIC_ORIGIN]);
    const read = await print().printable(versionId, grantIn(page.url), Date.now());
    expect(read).toMatchObject({
      number,
      version: 1,
      money: { payable: { amount: '190575.00' } },
    });
    // What a browser with no session draws never holds our cost, a margin or a person's id.
    const printed = read as ProposalDocument;
    expect(printed.fields.system).not.toHaveProperty('ourCost');
    expect(printed.money).not.toHaveProperty('margin');
    expect(JSON.stringify(printed)).not.toContain(here.people.owner.userId);
  });

  it.each([
    ['one minted for another version', (_: string, other: string) => mint(other, Date.now())],
    ['one signed with another key', (id: string) => mintPrintGrant('not-the-key', id, Date.now())],
    [
      'one that ran out',
      (id: string) => mint(id, Date.now() - (PRINT_GRANT_SECONDS + 1) * MS_PER_SECOND),
    ],
    [
      'one whose expiry was pushed out',
      (id: string) => {
        const [expiry = '0', signature] = mint(id, Date.now()).split('.');
        return `${Number(expiry) + PRINT_GRANT_SECONDS}.${signature}`;
      },
    ],
    ['no grant at all', () => ''],
  ])('the print read refuses %s', async (_, grantFor) => {
    const { versionId } = await aVersion();
    const grant = grantFor(versionId, randomUUID());
    expect(await print().printable(versionId, grant, Date.now())).toBeNull();
    // The same version reads with its own grant: the refusal above is the grant's.
    expect(
      await print().printable(versionId, mint(versionId, Date.now()), Date.now()),
    ).not.toBeNull();
  });

  it('a grant lasts its five minutes and no longer', () => {
    const versionId = randomUUID();
    const at = Date.parse('2026-01-01T00:00:00Z');
    const grant = mintPrintGrant('k', versionId, at);
    const lasts = PRINT_GRANT_SECONDS * MS_PER_SECOND;
    expect(printGrantHolds('k', versionId, grant, at + lasts)).toBe(true);
    expect(printGrantHolds('k', versionId, grant, at + lasts + 1)).toBe(false);
  });

  it('keeps the PDF once: the next ask finds it kept, and the route hands out its link', async () => {
    const { versionId, proposal } = await aVersion();
    const kept = await versions().keep(
      {
        tenantId: tenantId(),
        versionId,
        ...(await printedThroughStore(world, { tenantId: tenantId(), versionId }, await aPdf())),
      },
      Date.now(),
    );
    expect(kept.fileId).not.toBeNull();
    expect(await versions().page({ tenantId: tenantId(), versionId })).toEqual({
      kind: 'kept',
      fileId: kept.fileId,
    });
    const path = `/proposals/${proposal.id}/versions/1/pdf`;
    const own = await world
      .as(here.members.seller)
      .call<{ download: { url: string } | null }>('GET', path);
    expect(own.status).toBe(HttpStatus.OK);
    expect(own.body.download?.url).toEqual(expect.any(String));
    // A Sales Executive whose leads do not include this one, and another company, find no version.
    expect((await world.as(here.members.other).call('GET', path)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    expect((await world.as(there.members.owner).call('GET', path)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('a version that does not exist, or is another company’s, has no page and keeps nothing', async () => {
    const { versionId } = await aVersion();
    const elsewhere = there.company.tenantId;
    expect(await versions().page({ tenantId: tenantId(), versionId: randomUUID() })).toBeNull();
    expect(await versions().page({ tenantId: elsewhere, versionId })).toBeNull();
    const kept = await versions().keep(
      {
        tenantId: elsewhere,
        versionId,
        ...(await printedThroughStore(world, { tenantId: tenantId(), versionId }, await aPdf())),
      },
      Date.now(),
    );
    expect(kept).toEqual({ fileId: null });
    expect(
      await print().printable(randomUUID(), mint(randomUUID(), Date.now()), Date.now()),
    ).toBeNull();
  });

  function mint(versionId: string, now: number): string {
    return mintPrintGrant(ENV.AUTH_TOKEN_SECRET, versionId, now);
  }
});

import { file, notification, proposalVersion, tenantMembership } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { ApplicationFailure } from '@temporalio/client';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ProposalsVersionsService } from '../../src/modules/proposals/proposals.versions.service';
import { skipWithoutDatabase } from '../support/fixture';
import { printedThroughStore, sha256Of } from './pdf-support';
import {
  aLead,
  aReadyDraft,
  aStaffedCompany,
  generate,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
} from './support';

/**
 * A version's PDF goes to the store by a signed address, never through a workflow payload
 * (`infra/temporal/README.md` §4 Payload rule): the page step signs the address, the renderer PUTs
 * the bytes, and the keep step records them only once it has read back what was printed. A PDF
 * that could not be made tells the proposal's owner (`F5-39`).
 */

const here = aStaffedCompany('Proposal PDF Store EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'PROPOSAL PDF STORE PROOF',
  'A version’s PDF through the store, and its failure notice, are UNPROVEN in this run.',
);

/** A real proposal with its pictures prints near 1.9 MB — past the 1 MB a payload step allowed. */
const PRINTED_BYTES = 1_950_000;

const aPrint = (size = PRINTED_BYTES) => {
  const bytes = new Uint8Array(size);
  bytes.set(Buffer.from('%PDF-1.7\n'));
  return bytes;
};

describe.skipIf(skip)('A version’s PDF through the store', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const versions = () => world.http.app.get(ProposalsVersionsService);
  const tenantId = () => here.company.tenantId;

  const aVersion = async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.seller.userId);
    const made = (await generate(owner(), await aReadyDraft(owner(), leadId))).body;
    const [row] = await world.pools.admin.db
      .select({ id: proposalVersion.id })
      .from(proposalVersion)
      .where(eq(proposalVersion.proposalId, made.proposal.id));
    if (row === undefined) throw new Error('the generated version has no row');
    return { proposalId: made.proposal.id, versionId: row.id };
  };
  const printed = (versionId: string, bytes: Uint8Array) =>
    printedThroughStore(world, { tenantId: tenantId(), versionId }, bytes);
  const keptRows = (versionId: string) =>
    world.pools.admin.db
      .select({ id: file.id, byteSize: file.byteSize })
      .from(file)
      .where(and(eq(file.tenantId, tenantId()), eq(file.subjectRef, versionId)));
  const noticesOn = (proposalId: string) =>
    world.pools.admin.db
      .select({ to: notification.recipientUserRef, type: notification.type })
      .from(notification)
      .where(and(eq(notification.tenantId, tenantId()), eq(notification.subjectRef, proposalId)));

  beforeAll(async () => {
    world = await openProposalsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('keeps a PDF far past 1 MB once: a second keep answers the same file', async () => {
    const { versionId } = await aVersion();
    const facts = await printed(versionId, aPrint());
    const first = await versions().keep({ tenantId: tenantId(), versionId, ...facts }, Date.now());
    const again = await versions().keep({ tenantId: tenantId(), versionId, ...facts }, Date.now());
    expect(first.fileId).toEqual(expect.any(String));
    expect(again).toEqual(first);
    expect(await keptRows(versionId)).toEqual([{ id: first.fileId, byteSize: PRINTED_BYTES }]);
    expect(await versions().page({ tenantId: tenantId(), versionId })).toEqual({
      kind: 'kept',
      fileId: first.fileId,
    });
  });

  it.each([
    ['nothing was PUT', async () => ({ byteSize: PRINTED_BYTES, checksumSha256: 'x' })],
    [
      'other bytes than were printed',
      async (versionId: string) => {
        const facts = await printed(versionId, aPrint());
        return { ...facts, checksumSha256: sha256Of(aPrint(PRINTED_BYTES - 1)) };
      },
    ],
    [
      'another length than was printed',
      async (versionId: string) => {
        const facts = await printed(versionId, aPrint());
        return { ...facts, byteSize: PRINTED_BYTES + 1 };
      },
    ],
  ])('a store holding %s fails the keep for good and keeps no row', async (_, factsOf) => {
    const { versionId } = await aVersion();
    const facts = await factsOf(versionId);
    const keep = versions().keep({ tenantId: tenantId(), versionId, ...facts }, Date.now());
    await expect(keep).rejects.toBeInstanceOf(ApplicationFailure);
    await expect(keep).rejects.toMatchObject({ nonRetryable: true });
    expect(await keptRows(versionId)).toEqual([]);
  });

  it('a PDF that could not be made tells the proposal’s owner, in-app', async () => {
    const { proposalId, versionId } = await aVersion();
    await versions().failed({ tenantId: tenantId(), versionId }, Date.now());
    expect(await noticesOn(proposalId)).toEqual([
      { to: here.people.seller.userId, type: 'system' },
    ]);
  });

  it('asked again while the last notice is unread, the owner is told once; once read, told again', async () => {
    const { proposalId, versionId } = await aVersion();
    const failedNow = () => versions().failed({ tenantId: tenantId(), versionId }, Date.now());
    await failedNow();
    await failedNow();
    const told = [{ to: here.people.seller.userId, type: 'system' }];
    expect(await noticesOn(proposalId)).toEqual(told);
    await world.pools.admin.db
      .update(notification)
      .set({ readAt: new Date() })
      .where(and(eq(notification.tenantId, tenantId()), eq(notification.subjectRef, proposalId)));
    await failedNow();
    expect(await noticesOn(proposalId)).toEqual([...told, ...told]);
  });

  it('with the lead’s owner no longer active, the company’s owner is told instead', async () => {
    const { proposalId, versionId } = await aVersion();
    const seller = here.people.seller.userId;
    const membership = and(
      eq(tenantMembership.tenantId, tenantId()),
      eq(tenantMembership.userAccountId, seller),
    );
    await world.pools.admin.db
      .update(tenantMembership)
      .set({ status: 'deactivated' })
      .where(membership);
    try {
      await versions().failed({ tenantId: tenantId(), versionId }, Date.now());
    } finally {
      await world.pools.admin.db
        .update(tenantMembership)
        .set({ status: 'active' })
        .where(membership);
    }
    expect(await noticesOn(proposalId)).toEqual([{ to: here.people.owner.userId, type: 'system' }]);
  });
});

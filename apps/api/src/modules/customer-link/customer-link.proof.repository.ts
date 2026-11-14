import { acceptanceRecord, contact, customerLink, type DbTransaction } from '@heliogrid/db';
import { and, eq } from 'drizzle-orm';

/** A version's acceptance as its proof reads (`F5-46`, `F5-49`): which link carried it, whose, and when. */
export interface AcceptanceProof {
  readonly acceptanceId: string;
  readonly acceptedAt: Date;
  readonly linkLabel: string;
  readonly contactName: string | null;
}

/**
 * The acceptance recorded on a version, or `null` where the customer never accepted it — Mark won's
 * proof line and the handover checklist's signed-proposal row (`T-M06-025`). On the CALLER's
 * transaction, naming its tenant.
 */
export async function acceptanceProofOf(
  tx: DbTransaction,
  tenantId: string,
  versionId: string,
): Promise<AcceptanceProof | null> {
  const [proof] = await tx
    .select({
      acceptanceId: acceptanceRecord.id,
      acceptedAt: acceptanceRecord.acceptedAt,
      linkLabel: customerLink.label,
      contactName: contact.name,
    })
    .from(acceptanceRecord)
    .innerJoin(
      customerLink,
      and(
        eq(customerLink.tenantId, acceptanceRecord.tenantId),
        eq(customerLink.id, acceptanceRecord.linkId),
      ),
    )
    .leftJoin(
      contact,
      and(
        eq(contact.tenantId, acceptanceRecord.tenantId),
        eq(contact.id, acceptanceRecord.contactId),
      ),
    )
    .where(
      and(
        eq(acceptanceRecord.tenantId, tenantId),
        eq(acceptanceRecord.proposalVersionId, versionId),
      ),
    );
  return proof ?? null;
}

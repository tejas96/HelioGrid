import { creditNote, subscriptionInvoice, type TenantPool } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/**
 * Which file holds an invoice's or a credit note's PDF (`M12-46`), on the tenant pool: the policy
 * and the predicate both, so a company finds only its own documents.
 */
@Injectable()
export class BillingDocumentRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The PDF's file id; `null` while it is not made, or for a document this company does not hold. */
  async pdfOf(tenantId: string, documentId: string): Promise<string | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [invoice] = await tx
        .select({ pdfFileId: subscriptionInvoice.pdfFileId })
        .from(subscriptionInvoice)
        .where(
          and(eq(subscriptionInvoice.tenantId, tenantId), eq(subscriptionInvoice.id, documentId)),
        )
        .limit(1);
      if (invoice !== undefined) return invoice.pdfFileId;
      const [note] = await tx
        .select({ pdfFileId: creditNote.pdfFileId })
        .from(creditNote)
        .where(and(eq(creditNote.tenantId, tenantId), eq(creditNote.id, documentId)))
        .limit(1);
      return note?.pdfFileId ?? null;
    });
  }
}

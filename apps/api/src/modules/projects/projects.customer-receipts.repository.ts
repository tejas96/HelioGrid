import { type DbTransaction, file } from '@heliogrid/db';
import { and, eq, inArray } from 'drizzle-orm';
import type { EntryFacts } from './projects.payments-read.repository';

/* The receipt PDFs the customer's link may serve (`F5-59`, `M11-45`): one per payment still standing. */

/** The payments not taken back: a reversed one's plain PDF is no longer the customer's (`M11-46`). */
export function standingPaymentsOf(entries: readonly EntryFacts[]): string[] {
  const reversed = new Set(entries.flatMap((entry) => entry.reversesId ?? []));
  return entries
    .filter((entry) => entry.kind === 'payment' && !reversed.has(entry.id))
    .map((entry) => entry.id);
}

/** The receipt PDF stored against each payment: one read for them all. */
export async function receiptFilesOf(
  tx: DbTransaction,
  tenantId: string,
  entryIds: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  if (entryIds.length === 0) return new Map();
  const rows = await tx
    .select({ entryId: file.subjectRef, fileId: file.id })
    .from(file)
    .where(
      and(
        eq(file.tenantId, tenantId),
        eq(file.subjectKind, 'project_payment'),
        inArray(file.subjectRef, [...entryIds]),
        eq(file.contentType, 'application/pdf'),
      ),
    );
  return new Map(rows.map((row) => [row.entryId, row.fileId]));
}

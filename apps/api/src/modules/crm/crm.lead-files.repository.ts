import type { LeadFile } from '@heliogrid/contracts';
import { type DbTransaction, file, leadFile, type TenantPool, userAccount } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberNameOf } from './crm.lead-columns.repository';
import { findLeadInScope } from './crm.lead-detail.repository';
import { lockLeadInScope } from './crm.lead-lock.repository';
import type { LeadReader } from './internal/reader';

/** A file put on the lead: its stored file and the name the team reads it by. */
export interface LeadFileAttach {
  readonly fileId: string;
  readonly name: string;
}

/** What putting a file on the lead came to: the lead's files, or why nothing was added. */
export type LeadFileOutcome =
  | { readonly outcome: 'listed'; readonly items: LeadFile[] }
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'not-ready' };

const adder = alias(userAccount, 'lead_file_adder');

/**
 * A lead's files (`M02-32`) on the runtime pool: read in the reader's scope, and put on the lead
 * under its lock, so a file lands on the lead a merge or an edit left, never on one they changed
 * under it.
 */
@Injectable()
export class CrmLeadFilesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The lead's files; `null` when the lead is not one the reader may see. */
  async list(reader: LeadReader, leadId: string): Promise<LeadFile[] | null> {
    return this.db.withTenantTransaction(reader.tenantId, async (tx) => {
      if ((await findLeadInScope(tx, reader, leadId)) === null) return null;
      return leadFilesOf(tx, reader.tenantId, leadId);
    });
  }

  /** A stored file put on the lead; the same file again adds no second row. */
  async attach(
    reader: LeadReader,
    leadId: string,
    attach: LeadFileAttach,
    act: Act,
  ): Promise<LeadFileOutcome> {
    const { tenantId } = reader;
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if ((await lockLeadInScope(tx, reader, leadId)) === null) return { outcome: 'not-found' };
      if (!(await isUploadedFor(tx, tenantId, leadId, attach.fileId))) {
        return { outcome: 'not-ready' };
      }
      await tx
        .insert(leadFile)
        .values({
          tenantId,
          leadId,
          fileId: attach.fileId,
          name: attach.name,
          addedAt: new Date(act.now),
          addedBy: act.actorUserId,
        })
        .onConflictDoNothing({ target: [leadFile.tenantId, leadFile.fileId] });
      return { outcome: 'listed', items: await leadFilesOf(tx, tenantId, leadId) };
    });
  }
}

/** The file finished uploading, and it was stored for this lead — never another record's. */
async function isUploadedFor(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
  fileId: string,
): Promise<boolean> {
  const [stored] = await tx
    .select({ id: file.id })
    .from(file)
    .where(
      and(
        eq(file.tenantId, tenantId),
        eq(file.id, fileId),
        eq(file.subjectKind, 'lead'),
        eq(file.subjectRef, leadId),
        isNotNull(file.uploadedAt),
      ),
    );
  return stored !== undefined;
}

/**
 * The lead's files, oldest first, each with who added it — the one read the lead's Files section
 * and the project won from it ("From the lead") both list, on the caller's transaction.
 */
export async function leadFilesOf(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<LeadFile[]> {
  const rows = await tx
    .select({
      id: leadFile.id,
      fileId: leadFile.fileId,
      name: leadFile.name,
      contentType: file.contentType,
      addedAt: leadFile.addedAt,
      addedBy: leadFile.addedBy,
      adderName: memberNameOf(adder),
    })
    .from(leadFile)
    .innerJoin(file, and(eq(file.id, leadFile.fileId), eq(file.tenantId, leadFile.tenantId)))
    .innerJoin(adder, eq(adder.id, leadFile.addedBy))
    .where(and(eq(leadFile.tenantId, tenantId), eq(leadFile.leadId, leadId)))
    .orderBy(asc(leadFile.addedAt), asc(leadFile.id));
  return rows.map((row) => ({
    id: row.id,
    fileId: row.fileId,
    name: row.name,
    contentType: row.contentType,
    addedAt: row.addedAt.toISOString(),
    addedBy: { userId: row.addedBy, name: row.adderName ?? '' },
  }));
}

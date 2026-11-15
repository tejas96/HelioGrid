import { lead, proposal, proposalVersion, type TenantPool } from '@heliogrid/db';
import type { UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  type NoticeWords,
  recipientsFor,
  recordNotificationsOnceTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { type ServedVersion, versionById } from './proposals.link.repository';

/** The notice of a PDF that could not be made, rendered before the write. */
export interface PdfFailedNotice {
  readonly wordsIn: (language: UiLanguage) => NoticeWords;
  readonly quietHours: TenantQuietHours;
  readonly at: Date;
}

/** A version read by its id alone — the PDF's steps and the print page, which carry no reader. */
@Injectable()
export class ProposalsVersionsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async exists(tenantId: string, versionId: string): Promise<boolean> {
    const rows = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({ id: proposalVersion.id })
        .from(proposalVersion)
        .where(and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.id, versionId))),
    );
    return rows.length > 0;
  }

  byId(tenantId: string, versionId: string): Promise<ServedVersion | null> {
    return this.db.withTenantTransaction(tenantId, (tx) => versionById(tx, tenantId, versionId));
  }

  /**
   * Tells the proposal's owner — its lead's owner while an active member, else the company's
   * owners, as the `system` type's registration routes it — that the version's PDF could not be
   * made (`F5-39`), as the in-app notice the proposal opens; once while that notice is unread, so a
   * person who keeps asking does not tell them again and again. Nothing when the version is gone.
   */
  async tellPdfFailed(tenantId: string, versionId: string, notice: PdfFailedNotice): Promise<void> {
    await this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({ proposalId: proposal.id, ownerUserId: lead.ownerUserId })
        .from(proposalVersion)
        .innerJoin(
          proposal,
          and(eq(proposal.id, proposalVersion.proposalId), eq(proposal.tenantId, tenantId)),
        )
        .innerJoin(lead, and(eq(lead.id, proposal.leadId), eq(lead.tenantId, tenantId)))
        .where(and(eq(proposalVersion.tenantId, tenantId), eq(proposalVersion.id, versionId)));
      if (row === undefined) return;
      const recipients = await recipientsFor(
        tx,
        tenantId,
        'system',
        { ownerUserId: row.ownerUserId, assigneeUserId: null, awaits: null },
        // The lead's owner reads their own lead's proposal; the fallback is the company's owners.
        async () => true,
      );
      await recordNotificationsOnceTo(
        tx,
        recipients,
        {
          tenantId,
          type: 'system',
          subjectKind: 'proposal',
          subjectRef: row.proposalId,
          emittedAt: notice.at,
        },
        notice.wordsIn,
        notice.quietHours,
      );
    });
  }
}

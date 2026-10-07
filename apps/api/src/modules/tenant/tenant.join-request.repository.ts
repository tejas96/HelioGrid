import {
  membershipRole,
  notification,
  type TenantPool,
  tenantMembership,
  userAccount,
} from '@heliogrid/db';
import { FOUNDER_ROLE, type UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordNotification, type TenantQuietHours } from '../notification/notification.public';

/** The words of one notice, in the language they were rendered in (`F6-08`). */
export interface NoticeWords {
  readonly title: string;
  readonly body: string;
}

/**
 * The join request's write (`M01-09`), inside the MATCHED company's own transaction: the asker
 * belongs to no company, so the company is the one the request reaches, and RLS holds every read
 * and write to it.
 */
@Injectable()
export class JoinRequestRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * One `join_requested` to each active EPC Owner who does not already hold this asker's request,
   * in that owner's language; answers the new records' ids. An owner who holds one is skipped, so
   * asking again writes nothing.
   */
  async notifyOwners(
    tenantId: string,
    askerUserId: string,
    wordsIn: (language: UiLanguage) => NoticeWords,
    quietHours: TenantQuietHours,
    now: Date,
  ): Promise<string[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const owners = await tx
        .select({ userId: userAccount.id, language: userAccount.interfaceLanguage })
        .from(membershipRole)
        .innerJoin(tenantMembership, eq(tenantMembership.id, membershipRole.membershipId))
        .innerJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
        .where(
          and(
            eq(membershipRole.tenantId, tenantId),
            eq(membershipRole.rolePreset, FOUNDER_ROLE),
            eq(tenantMembership.status, 'active'),
          ),
        );
      if (owners.length === 0) return [];
      const asked = await tx
        .select({ recipient: notification.recipientUserRef })
        .from(notification)
        .where(
          and(
            eq(notification.tenantId, tenantId),
            inArray(
              notification.recipientUserRef,
              owners.map((owner) => owner.userId),
            ),
            eq(notification.type, 'join_requested'),
            eq(notification.subjectRef, askerUserId),
          ),
        );
      const alreadyAsked = new Set(asked.map((row) => row.recipient));
      const ids: string[] = [];
      for (const owner of owners.filter((one) => !alreadyAsked.has(one.userId))) {
        const words = wordsIn(owner.language);
        ids.push(
          await recordNotification(
            tx,
            {
              tenantId,
              recipientUserRef: owner.userId,
              type: 'join_requested',
              subjectKind: 'user_account',
              subjectRef: askerUserId,
              title: words.title,
              body: words.body,
              language: owner.language,
              emittedAt: now,
            },
            quietHours,
          ),
        );
      }
      return ids;
    });
  }
}

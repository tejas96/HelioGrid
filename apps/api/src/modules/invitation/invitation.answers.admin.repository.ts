import { type Db, invitation } from '@heliogrid/db';
import { invitationStatus, type UiLanguage } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';
import {
  activeOwnersOf,
  type NoticeWords,
  recordNotificationsTo,
  type TenantQuietHours,
} from '../notification/notification.public';
import { lifeOf, lockedByToken } from './invitation.admin.repository';

/** The notice an answer raises: its words in each language, and when its push may go (`F6-14`). */
export interface AnswerNotice {
  readonly wordsIn: (language: UiLanguage) => NoticeWords;
  readonly quietHours: TenantQuietHours;
}

/** An answer that landed; `notified` holds the notices it wrote, empty on a repeat. */
interface Answered {
  readonly outcome: 'done';
  readonly tenantId: string;
  readonly notified: readonly string[];
}
export type DeclineOutcome =
  | Answered
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'not-pending' };
export type ReinviteOutcome =
  | Answered
  | { readonly outcome: 'not-found' }
  | { readonly outcome: 'not-expired' };

/**
 * The invited person's two answers (`M01.2` S1.wrong.1, S1.wrong.2), on the admin pool because the
 * person holds no membership. Each answer and the notice it raises commit together (`F6-06`), and
 * each is written once: a repeat answers as the first did and tells nobody again (`F4-07`).
 */
@Injectable()
export class InvitationAnswersAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** The wrong person got the invite: it is voided, and the company's EPC Owners are told. */
  async decline(tokenHash: string, now: number, notice: AnswerNotice): Promise<DeclineOutcome> {
    return this.db.transaction(async (tx) => {
      const row = await lockedByToken(tx, tokenHash);
      if (!row) return { outcome: 'not-found' };
      if (row.status === 'declined')
        return { outcome: 'done', tenantId: row.tenantId, notified: [] };
      if (invitationStatus(lifeOf(row), now) !== 'pending') return { outcome: 'not-pending' };
      await tx
        .update(invitation)
        .set({ status: 'declined', declinedAt: new Date(now) })
        .where(eq(invitation.id, row.id));
      const owners = await activeOwnersOf(tx, row.tenantId);
      const notified = await recordNotificationsTo(
        tx,
        owners,
        aboutThe(row, 'invite_declined', now),
        notice.wordsIn,
        notice.quietHours,
      );
      return { outcome: 'done', tenantId: row.tenantId, notified };
    });
  }

  /**
   * The link ran out: the one-tap ask, stamped once. It tells the person who sent the invite while
   * they are still one of the company's EPC Owners — only an owner can send a new one — and every
   * active EPC Owner otherwise, the recipient of last resort, so the ask never reaches nobody.
   */
  async requestReinvite(
    tokenHash: string,
    now: number,
    notice: AnswerNotice,
  ): Promise<ReinviteOutcome> {
    return this.db.transaction(async (tx) => {
      const row = await lockedByToken(tx, tokenHash);
      if (!row) return { outcome: 'not-found' };
      if (invitationStatus(lifeOf(row), now) !== 'expired') return { outcome: 'not-expired' };
      if (row.reinviteRequestedAt !== null) {
        return { outcome: 'done', tenantId: row.tenantId, notified: [] };
      }
      await tx
        .update(invitation)
        .set({ reinviteRequestedAt: new Date(now) })
        .where(eq(invitation.id, row.id));
      const owners = await activeOwnersOf(tx, row.tenantId);
      const inviter = owners.filter((owner) => owner.userId === row.inviterUserId);
      const notified = await recordNotificationsTo(
        tx,
        inviter.length > 0 ? inviter : owners,
        aboutThe(row, 'reinvite_requested', now),
        notice.wordsIn,
        notice.quietHours,
      );
      return { outcome: 'done', tenantId: row.tenantId, notified };
    });
  }
}

function aboutThe(
  row: { readonly id: string; readonly tenantId: string },
  type: 'invite_declined' | 'reinvite_requested',
  now: number,
) {
  return {
    tenantId: row.tenantId,
    type,
    subjectKind: 'invitation' as const,
    subjectRef: row.id,
    emittedAt: new Date(now),
  };
}

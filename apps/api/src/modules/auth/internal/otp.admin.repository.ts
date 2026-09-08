import { type Db, otpChallenge } from '@heliogrid/db';
import type { OtpChannel } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../../common/db/admin.token';

/** One challenge as the store holds it. */
export interface ChallengeRow {
  readonly id: string;
  readonly phoneE164: string;
  readonly codeHash: string;
  readonly channel: OtpChannel;
  readonly issuedAt: Date;
  readonly failedVerifies: number;
  readonly verifiedAt: Date | null;
  readonly invalidatedAt: Date | null;
  readonly deliveryFailedAt: Date | null;
}

/**
 * The sign-in codes (`M01-04`, `M01-05`): keyed to a phone before any account exists, stored as
 * a hash, read over rolling windows. An unreachable platform table — the admin pool alone.
 */
@Injectable()
export class OtpAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** This phone's challenges since an instant, newest first — the rolling windows read these. */
  async challengesSince(phoneE164: string, since: number): Promise<ChallengeRow[]> {
    return this.db
      .select()
      .from(otpChallenge)
      .where(and(eq(otpChallenge.phoneE164, phoneE164), gt(otpChallenge.issuedAt, new Date(since))))
      .orderBy(desc(otpChallenge.issuedAt));
  }

  async createChallenge(row: {
    phoneE164: string;
    codeHash: string;
    channel: OtpChannel;
    issuedAt: number;
  }): Promise<string> {
    const [inserted] = await this.db
      .insert(otpChallenge)
      .values({
        phoneE164: row.phoneE164,
        codeHash: row.codeHash,
        channel: row.channel,
        issuedAt: new Date(row.issuedAt),
        failedVerifies: 0,
      })
      .returning({ id: otpChallenge.id });
    if (!inserted) throw new Error('otp_challenge insert returned no row');
    return inserted.id;
  }

  async challengeById(id: string): Promise<ChallengeRow | null> {
    const [row] = await this.db.select().from(otpChallenge).where(eq(otpChallenge.id, id)).limit(1);
    return row ?? null;
  }

  async markDeliveryFailed(id: string, at: number): Promise<void> {
    await this.db
      .update(otpChallenge)
      .set({ deliveryFailedAt: new Date(at) })
      .where(eq(otpChallenge.id, id));
  }

  /**
   * Marks the challenge verified only if nobody has: two requests racing on one code cannot
   * both win. Returns whether this caller won the claim.
   */
  async claimVerified(id: string, verifiedAt: number): Promise<boolean> {
    const claimed = await this.db
      .update(otpChallenge)
      .set({ verifiedAt: new Date(verifiedAt) })
      .where(
        and(
          eq(otpChallenge.id, id),
          isNull(otpChallenge.verifiedAt),
          isNull(otpChallenge.invalidatedAt),
        ),
      )
      .returning({ id: otpChallenge.id });
    return claimed.length === 1;
  }

  async recordVerify(
    id: string,
    outcome: { failedVerifies: number; verifiedAt?: number; invalidatedAt?: number },
  ): Promise<void> {
    await this.db
      .update(otpChallenge)
      .set({
        failedVerifies: outcome.failedVerifies,
        verifiedAt: outcome.verifiedAt === undefined ? undefined : new Date(outcome.verifiedAt),
        invalidatedAt:
          outcome.invalidatedAt === undefined ? undefined : new Date(outcome.invalidatedAt),
      })
      .where(eq(otpChallenge.id, id));
  }
}

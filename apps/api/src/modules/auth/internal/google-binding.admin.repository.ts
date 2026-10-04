import { type Db, userAccount } from '@heliogrid/db';
import type { GoogleBindOutcome } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { ADMIN_DB } from '../../../common/db/admin.token';
import { type AccountRow, accountColumns } from './auth.admin.repository';
import { OtpAdminRepository } from './otp.admin.repository';

const UNIQUE_VIOLATION = '23505';
const SUBJECT_UNIQUE = 'user_account_google_subject_unique';

/** Thrown inside the transaction to undo the code's claim; caught before it leaves this file. */
class BindRefused extends Error {
  constructor(readonly outcome: Exclude<GoogleBindOutcome, 'bound'>) {
    super(outcome);
  }
}

/**
 * The Google door's bind (`M01-02`): the code's claim and the login's link in one transaction.
 * A platform table read and written before any session exists — the admin pool alone.
 */
@Injectable()
export class GoogleBindingAdminRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ADMIN_DB) private readonly db: Db,
    @Inject(OtpAdminRepository) private readonly codes: OtpAdminRepository,
  ) {}

  /** The account a Google login is linked to, or null — the unique index reads it. */
  async accountBySubject(subject: string): Promise<AccountRow | null> {
    const [row] = await this.db
      .select(accountColumns())
      .from(userAccount)
      .where(eq(userAccount.googleSubject, subject))
      .limit(1);
    return row ?? null;
  }

  /**
   * Spends the code and links the login in ONE transaction, so neither happens alone. The link
   * lands only on an account holding no login yet — two logins racing onto one phone leave the
   * first, never overwrite it — and one login racing onto two phones loses on the column's
   * unique constraint. Either refusal rolls the claim back: the code stays usable.
   */
  async bindWithCode(
    challengeId: string,
    accountId: string,
    subject: string,
    now: number,
  ): Promise<GoogleBindOutcome> {
    try {
      await this.db.transaction(async (tx) => {
        const claimed = await this.codes.claimVerified(challengeId, now, tx);
        if (!claimed) throw new BindRefused('code-spent');
        const linked = await tx
          .update(userAccount)
          .set({ googleSubject: subject })
          .where(and(eq(userAccount.id, accountId), isNull(userAccount.googleSubject)))
          .returning({ id: userAccount.id });
        if (linked.length !== 1) throw new BindRefused('phone-taken');
      });
      return 'bound';
    } catch (error) {
      if (error instanceof BindRefused) return error.outcome;
      if (violatesSubjectUnique(error)) return 'subject-taken';
      throw error;
    }
  }
}

/** Drizzle wraps the driver's error; the Postgres code and constraint sit on it or its cause. */
function violatesSubjectUnique(error: unknown): boolean {
  const candidates = [error, (error as { cause?: unknown } | null)?.cause];
  return candidates.some((candidate) => {
    const pg = candidate as { code?: unknown; constraint_name?: unknown } | null;
    return pg?.code === UNIQUE_VIOLATION && pg.constraint_name === SUBJECT_UNIQUE;
  });
}

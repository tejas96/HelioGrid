import {
  AUTH_IDENTITY_ACCOUNT_KEY,
  AUTH_IDENTITY_SUBJECT_KEY,
  authIdentity,
  type Db,
  userAccount,
} from '@heliogrid/db';
import type { LoginBindOutcome, LoginProvider } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../../common/db/admin.token';
import { type AccountRow, accountColumns } from './auth.admin.repository';
import { OtpAdminRepository } from './otp.admin.repository';

const UNIQUE_VIOLATION = '23505';

/** A provider login: which door, and the provider's stable id for the person behind it. */
export interface LoginIdentity {
  readonly provider: LoginProvider;
  readonly subject: string;
}

/** Thrown inside the transaction to undo the code's claim; caught before it leaves this file. */
class CodeSpent extends Error {}

/**
 * The provider door's bind (`M01-02`): the code's claim and the login's link in one transaction.
 * A platform table read and written before any session exists — the admin pool alone.
 */
@Injectable()
export class LoginBindingAdminRepository {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(ADMIN_DB) private readonly db: Db,
    @Inject(OtpAdminRepository) private readonly codes: OtpAdminRepository,
  ) {}

  /** The account a login is linked to, or null — the primary key reads it. */
  async accountByLogin(login: LoginIdentity): Promise<AccountRow | null> {
    const [row] = await this.db
      .select(accountColumns())
      .from(authIdentity)
      .innerJoin(userAccount, eq(userAccount.id, authIdentity.userAccountId))
      .where(
        and(eq(authIdentity.provider, login.provider), eq(authIdentity.subject, login.subject)),
      )
      .limit(1);
    return row ?? null;
  }

  /**
   * Spends the code and links the login in ONE transaction, so neither happens alone. The link
   * lands only on an account holding no login of this provider yet — two logins racing onto one
   * phone leave the first, never overwrite it — and one login racing onto two phones loses on the
   * login's own key. Either refusal rolls the claim back: the code stays usable.
   */
  async bindWithCode(
    challengeId: string,
    accountId: string,
    login: LoginIdentity,
    now: number,
  ): Promise<LoginBindOutcome> {
    try {
      await this.db.transaction(async (tx) => {
        const claimed = await this.codes.claimVerified(challengeId, now, tx);
        if (!claimed) throw new CodeSpent();
        await tx.insert(authIdentity).values({
          userAccountId: accountId,
          provider: login.provider,
          subject: login.subject,
          createdAt: new Date(now),
        });
      });
      return 'bound';
    } catch (error) {
      if (error instanceof CodeSpent) return 'code-spent';
      const violated = violatedKey(error);
      if (violated === AUTH_IDENTITY_ACCOUNT_KEY) return 'phone-taken';
      if (violated === AUTH_IDENTITY_SUBJECT_KEY) return 'linked-elsewhere';
      throw error;
    }
  }
}

/** Drizzle wraps the driver's error; the Postgres code and constraint sit on it or its cause. */
function violatedKey(error: unknown): string | null {
  for (const candidate of [error, (error as { cause?: unknown } | null)?.cause]) {
    const pg = candidate as { code?: unknown; constraint_name?: unknown } | null;
    if (pg?.code === UNIQUE_VIOLATION && typeof pg.constraint_name === 'string') {
      return pg.constraint_name;
    }
  }
  return null;
}

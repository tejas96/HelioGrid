import type { TenantPool } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { meterUsage } from './usage-meter.repository';

/** A sign-in code that opened a session into a company, as the ledger meters it. */
export interface SignInCode {
  readonly tenantId: string;
  readonly userAccountId: string;
  /** The code's challenge: one code is one row, however often its sign-in is retried. */
  readonly challengeId: string;
  readonly now: number;
}

/** Writes a sign-in code's ledger hand-off in the company's own transaction (`M12-33`). */
@Injectable()
export class OtpUsageRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  meter(code: SignInCode): Promise<string> {
    return this.db.withTenantTransaction(code.tenantId, (tx) =>
      meterUsage(tx, {
        tenantId: code.tenantId,
        meter: 'otp_delivery',
        quantity: 1,
        billable: false,
        subjectKind: 'user_account',
        subjectRef: code.userAccountId,
        idempotencyKey: code.challengeId,
        occurredAt: code.now,
      }),
    );
  }
}

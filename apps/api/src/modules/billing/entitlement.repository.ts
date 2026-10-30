import { entitlement, type TenantPool } from '@heliogrid/db';
import type { EntitlementLimitKind, EntitlementSource } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

export interface StoredEntitlement {
  readonly key: string;
  readonly limitKind: EntitlementLimitKind;
  readonly limitValue: number | null;
  readonly source: EntitlementSource;
}

/**
 * The hot-path read every gate makes (`M12-16`): one company's limits, by the table's primary key,
 * on the tenant pool — the policy and the predicate both, so a gate can only ever read its own.
 */
@Injectable()
export class EntitlementRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async limitsOf(tenantId: string): Promise<StoredEntitlement[]> {
    return this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({
          key: entitlement.entitlementKey,
          limitKind: entitlement.limitKind,
          limitValue: entitlement.limitValue,
          source: entitlement.source,
        })
        .from(entitlement)
        .where(eq(entitlement.tenantId, tenantId)),
    );
  }
}

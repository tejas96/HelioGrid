import { proposal, type TenantPool } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/**
 * The open proposal drafts that name a catalog item (`M01-42`, decision 15): what the archive
 * warning counts — a draft keeps the item and its price, and archiving takes it out of pickers
 * only. Read through the company's drafts (`proposal_tenant_status_idx`), never the whole table.
 */
@Injectable()
export class CatalogOpenDraftsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async naming(tenantId: string, itemId: string): Promise<number> {
    const named = JSON.stringify([{ catalogItemId: itemId }]);
    const [row] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({ n: count() })
        .from(proposal)
        .where(
          and(
            eq(proposal.tenantId, tenantId),
            eq(proposal.status, 'draft'),
            sql`${proposal.fieldSet} -> 'components' @> ${named}::jsonb`,
          ),
        ),
    );
    return row?.n ?? 0;
  }
}

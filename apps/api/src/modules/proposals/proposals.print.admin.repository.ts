import { type Db, proposalVersion } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/**
 * Whose version an id names (`T-M06-017`): the print page arrives with no session and no company —
 * only a version id and its signed grant — so the company is found here, on the admin path, and
 * every read after it is the company's own. It answers the company's id and nothing else.
 */
@Injectable()
export class ProposalsPrintAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async tenantOf(versionId: string): Promise<string | null> {
    const [row] = await this.db
      .select({ tenantId: proposalVersion.tenantId })
      .from(proposalVersion)
      .where(eq(proposalVersion.id, versionId));
    return row?.tenantId ?? null;
  }
}

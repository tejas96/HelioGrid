import type { ProjectDetail } from '@heliogrid/contracts';
import { type TenantPool, tenant } from '@heliogrid/db';
import type { FormatPack } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import type { ProjectReader } from './internal/reader';
import { loadProjectDetail } from './projects.detail.repository';

/** One project read on its own transaction, and the company name its handover message signs. */
@Injectable()
export class ProjectsDetailReadRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  detail(
    reader: ProjectReader,
    projectId: string,
    formats: FormatPack,
  ): Promise<ProjectDetail | null> {
    return this.db.withTenantTransaction(reader.tenantId, (tx) =>
      loadProjectDetail(tx, reader, projectId, formats),
    );
  }

  companyNameOf(tenantId: string): Promise<string> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [own] = await tx
        .select({ name: tenant.companyName })
        .from(tenant)
        .where(eq(tenant.id, tenantId));
      if (own === undefined) throw new Error(`no company ${tenantId} to sign a message`);
      return own.name;
    });
  }
}

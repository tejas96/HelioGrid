import { lead, type TenantPool } from '@heliogrid/db';
import { can, leadScopeOf } from '@heliogrid/domain';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { FileSubjectRegistry } from '../file/file.public';
import { leadScopeWhere } from './crm.scope.repository';

/**
 * A lead's papers (`M02-32`): who may see the lead may read them, and who may also edit leads may
 * add one. Registered with the files module when the CRM starts, so files asks without importing it.
 */
@Injectable()
export class CrmFileSubjects implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TENANT_DB) private readonly db: TenantPool,
    @Inject(FileSubjectRegistry) private readonly registry: FileSubjectRegistry,
  ) {}

  onModuleInit(): void {
    this.registry.register('lead', async (tenantId, leadId, person, act) => {
      if (act === 'upload' && !can(person.roles, 'crm.add_edit_leads')) return false;
      return this.db.withTenantTransaction(tenantId, async (tx) => {
        const [found] = await tx
          .select({ id: lead.id })
          .from(lead)
          .where(
            and(
              eq(lead.tenantId, tenantId),
              eq(lead.id, leadId),
              leadScopeWhere(leadScopeOf(person.roles), person.userId),
            ),
          );
        return found !== undefined;
      });
    });
  }
}

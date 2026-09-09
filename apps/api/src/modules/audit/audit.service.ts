import type { AuditLogEntry, Paginated, PaginationQuery } from '@heliogrid/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

/**
 * The tenant's own log, read back (`F2-23`). Their data: it answers in every billing state, and
 * it answers with this tenant's entries and no other tenant's.
 */
@Injectable()
export class AuditService {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(AuditRepository) private readonly entries: AuditRepository) {}

  async list(tenantId: string, query: PaginationQuery): Promise<Paginated<AuditLogEntry>> {
    return this.entries.entries(tenantId, {
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
  }
}

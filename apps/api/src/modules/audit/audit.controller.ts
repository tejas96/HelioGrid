import { auditContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { tenantIdOf } from '../../common/auth/session-context';
import { AuditService } from './audit.service';

@Controller()
export class AuditController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @TsRestHandler(auditContract)
  // F2-23 gives the log to "a tenant administrator", and in this matrix exactly one preset is
  // that administrator — the row it already holds. No matrix row is coined for a read.
  @RouteAccessMap(auditContract, {
    entries: { capability: 'onboarding.manage_tenant_settings' },
  })
  handler(@Req() req: Request) {
    return tsRestHandler(auditContract, {
      entries: async ({ query }) => ({
        status: 200,
        body: await this.audit.list(tenantIdOf(req), query),
      }),
    });
  }
}

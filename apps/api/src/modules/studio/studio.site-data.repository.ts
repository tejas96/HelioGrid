import { randomUUID } from 'node:crypto';
import type { TenantPool } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { TENANT_DB } from '../../common/db/tenant.token';
import { meterUsage } from '../billing/billing.public';

/**
 * The cost lines of a design's height data calls (`T-M05-002`, part g): each call Google bills is
 * one `solar_imagery` row against the design, never billed to the company (`M12-37`) — the owner
 * sees the spend. Written in the company's own transaction (`M12-18`).
 */
@Injectable()
export class StudioSiteDataRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** One cost line for each call; answers the outbox events to hand on after the commit. */
  meterCalls(tenantId: string, designId: string, calls: number, now: number): Promise<string[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const events: string[] = [];
      for (let i = 0; i < calls; i += 1) {
        events.push(
          await meterUsage(tx, {
            tenantId,
            meter: 'solar_imagery',
            quantity: 1,
            billable: false,
            subjectKind: 'design',
            subjectRef: designId,
            // Each call is its own unit: no two openings' calls are one.
            idempotencyKey: randomUUID(),
            occurredAt: now,
          }),
        );
      }
      return events;
    });
  }
}

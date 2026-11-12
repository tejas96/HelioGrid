import { monthlyTarget, type TenantPool } from '@heliogrid/db';
import type { MinorUnits } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';

/**
 * The company's monthly target (`M13-17`): set, changed or cleared by the EPC Owner, each change
 * audited; the same target sent again writes and records nothing (`F4-07`).
 */
@Injectable()
export class DashboardsTargetRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** Stores `amount` for the month starting `firstDay` — `null` clears it — and answers what stands. */
  save(
    tenantId: string,
    firstDay: string,
    amount: MinorUnits | null,
    act: Act,
  ): Promise<MinorUnits | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const thisMonth = and(
        eq(monthlyTarget.tenantId, tenantId),
        eq(monthlyTarget.month, firstDay),
      );
      const [stored] = await tx
        .select({ amountMinor: monthlyTarget.amountMinor })
        .from(monthlyTarget)
        .where(thisMonth)
        .for('update');
      if ((stored?.amountMinor ?? null) === amount) return amount;
      const setAt = new Date(act.now);
      if (amount === null) {
        await tx.delete(monthlyTarget).where(thisMonth);
      } else {
        await tx
          .insert(monthlyTarget)
          .values({ tenantId, month: firstDay, amountMinor: amount, setAt, setBy: act.actorUserId })
          .onConflictDoUpdate({
            target: [monthlyTarget.tenantId, monthlyTarget.month],
            set: { amountMinor: amount, setAt, setBy: act.actorUserId },
          });
      }
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.monthly_target_changed',
          tenantId,
          { kind: 'tenant', ref: tenantId },
          act,
        ),
      );
      return amount;
    });
  }
}

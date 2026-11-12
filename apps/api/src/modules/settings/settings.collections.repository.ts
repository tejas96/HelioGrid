import { collectionsSettings, type TenantPool, userAccount } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';

/** The company's UPI ID and shown name as stored, with who saved them last. */
export interface StoredCollections {
  readonly upiId: string | null;
  readonly payeeName: string | null;
  readonly savedAt: Date;
  readonly savedBy: { readonly id: string; readonly name: string | null };
}

/**
 * How customers pay the company (`SCR-M11-04`): one row per company, written by its owner, every
 * change audited — a changed UPI ID sends every later payment to a new account.
 */
@Injectable()
export class SettingsCollectionsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  read(tenantId: string): Promise<StoredCollections | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          upiId: collectionsSettings.upiId,
          payeeName: collectionsSettings.payeeName,
          savedAt: collectionsSettings.updatedAt,
          byId: collectionsSettings.updatedBy,
          byName: userAccount.name,
        })
        .from(collectionsSettings)
        .leftJoin(userAccount, eq(userAccount.id, collectionsSettings.updatedBy))
        .where(eq(collectionsSettings.tenantId, tenantId));
      if (row === undefined) return null;
      return {
        upiId: row.upiId,
        payeeName: row.payeeName,
        savedAt: row.savedAt,
        savedBy: { id: row.byId, name: row.byName },
      };
    });
  }

  /** Saves what changed and audits it; the same values sent again write and record nothing. */
  save(
    tenantId: string,
    write: { readonly upiId: string | null; readonly payeeName: string },
    act: Act,
  ): Promise<void> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [stored] = await tx
        .select({ upiId: collectionsSettings.upiId, payeeName: collectionsSettings.payeeName })
        .from(collectionsSettings)
        .where(eq(collectionsSettings.tenantId, tenantId))
        .for('update');
      if (stored?.upiId === write.upiId && stored.payeeName === write.payeeName) return;
      const now = new Date(act.now);
      await tx
        .insert(collectionsSettings)
        .values({ tenantId, ...write, updatedAt: now, updatedBy: act.actorUserId })
        .onConflictDoUpdate({
          target: collectionsSettings.tenantId,
          set: { ...write, updatedAt: now, updatedBy: act.actorUserId },
        });
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.collections_changed',
          tenantId,
          { kind: 'collections_settings', ref: tenantId },
          act,
        ),
      );
    });
  }
}

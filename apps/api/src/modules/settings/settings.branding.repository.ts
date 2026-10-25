import { isDeepStrictEqual } from 'node:util';
import {
  brandingSettings,
  businessProfile,
  type TenantPool,
  type TenantScopedDb,
  userAccount,
} from '@heliogrid/db';
import type { BrandingSettings } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import type { LastSave } from './internal/wire';
import { brandingOf, ensureProfile } from './settings.repository';

/** What the Branding page reads beside the branding in force: the profile's logo and the last save. */
export interface BrandingFacts {
  readonly logoFileId: string | null;
  readonly changed: LastSave | null;
}

/** The page's one save: the branding row, and the logo when the page named it (`undefined` keeps it). */
export interface BrandingSaveRow extends BrandingSettings {
  readonly logoFileId: string | null | undefined;
}

/**
 * The Branding page's rows on the runtime pool (`SCR-M01-18`): the branding row and the
 * profile's logo pointer, written in ONE tenant transaction so a save never lands half (`D237`:
 * the logo is the profile's one value, which its own page writes too). A save equal to what is
 * stored writes and records nothing (`F4-07`).
 */
@Injectable()
export class SettingsBrandingRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async facts(tenantId: string): Promise<BrandingFacts> {
    return this.db.withTenantTransaction(tenantId, (tx) => factsOf(tx, tenantId));
  }

  /** A company from before the profile row was seeded gets its empty row, as a tax registration's save does. */
  async save(tenantId: string, save: BrandingSaveRow, act: Act): Promise<'saved' | 'unchanged'> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await brandingOf(tx, tenantId);
      const { logoFileId } = await factsOf(tx, tenantId);
      const branding = { brandColour: save.brandColour, letterhead: save.letterhead };
      const brandingSame = stored !== null && isDeepStrictEqual(stored, branding);
      const logoSame = save.logoFileId === undefined || save.logoFileId === logoFileId;
      if (brandingSame && logoSame) return 'unchanged';
      const now = new Date(act.now);
      if (!logoSame) {
        const profileId = await ensureProfile(tx, tenantId, act.now);
        await tx
          .update(businessProfile)
          .set({ logoFileId: save.logoFileId ?? null, updatedAt: now })
          .where(eq(businessProfile.id, profileId));
      }
      const values = { ...branding, updatedAt: now, updatedBy: act.actorUserId };
      const [row] = await tx
        .insert(brandingSettings)
        .values({ tenantId, ...values })
        .onConflictDoUpdate({ target: brandingSettings.tenantId, set: values })
        .returning({ id: brandingSettings.id });
      if (!row) throw new Error('branding_settings upsert returned no row');
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.branding_changed',
          tenantId,
          { kind: 'branding_settings', ref: row.id },
          act,
        ),
      );
      return 'saved';
    });
  }
}

async function factsOf(tx: TenantScopedDb, tenantId: string): Promise<BrandingFacts> {
  const [profile] = await tx
    .select({ logoFileId: businessProfile.logoFileId })
    .from(businessProfile)
    .where(eq(businessProfile.tenantId, tenantId))
    .limit(1);
  const [last] = await tx
    .select({
      at: brandingSettings.updatedAt,
      byId: brandingSettings.updatedBy,
      byName: userAccount.name,
    })
    .from(brandingSettings)
    .leftJoin(userAccount, eq(userAccount.id, brandingSettings.updatedBy))
    .where(eq(brandingSettings.tenantId, tenantId))
    .limit(1);
  return {
    logoFileId: profile?.logoFileId ?? null,
    changed:
      last === undefined
        ? null
        : {
            at: last.at,
            by: last.byId === null ? null : { id: last.byId, name: last.byName ?? null },
          },
  };
}

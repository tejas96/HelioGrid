import { isDeepStrictEqual } from 'node:util';
import {
  brandingSettings,
  businessProfile,
  onboardingProgress,
  type TenantPool,
  type TenantScopedDb,
  taxRegistration,
  tenant,
  tenantHoliday,
} from '@heliogrid/db';
import type {
  BrandingSettings,
  PromptPointStates,
  TaxRegistration,
  TenantFacts,
  TenantHoliday,
  TenantSettings,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notInArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { storedProposalTemplate, storedTimelineTemplate } from './settings.templates.repository';
import { trancheTemplatesOf } from './settings.tranches.repository';

/** The tenant's own row: the signup facts, the two declarations, the locale pair — and its market. */
export interface TenantRead extends TenantFacts {
  readonly marketCode: string;
}

/** Everything the effective read resolves, from one tenant transaction. */
export interface TenantSettingsRead {
  readonly tenant: TenantRead;
  readonly settings: TenantSettings;
  readonly promptPoints: PromptPointStates;
}

/**
 * The tenant's settings on the runtime pool, inside the tenant transaction: the one read the
 * effective resolver makes, and the writes that stay within tenant scope. The profile's company
 * facts live on `tenant`, an ARMED registry written on the admin path, so that write is
 * `settings.admin.repository.ts`'s. A save equal to what is stored writes and records nothing
 * (`F4-07`): it answers the stored value.
 */
@Injectable()
export class SettingsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The tenant's own row, or null where the session's tenant is not visible — a broken guard. */
  async tenant(tenantId: string): Promise<TenantRead | null> {
    return this.db.withTenantTransaction(tenantId, (tx) => tenantRead(tx, tenantId));
  }

  async everything(tenantId: string): Promise<TenantSettingsRead | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const own = await tenantRead(tx, tenantId);
      if (own === null) return null;
      const [profile] = await tx
        .select({ address: businessProfile.address, bankDetails: businessProfile.bankDetails })
        .from(businessProfile)
        .where(eq(businessProfile.tenantId, tenantId))
        .limit(1);
      const [progress] = await tx
        .select({ promptPointStates: onboardingProgress.promptPointStates })
        .from(onboardingProgress)
        .where(eq(onboardingProgress.tenantId, tenantId))
        .limit(1);
      return {
        tenant: own,
        settings: {
          businessProfile: profile ?? null,
          taxRegistrations: await registrationsOf(tx, tenantId),
          branding: await brandingOf(tx, tenantId),
          proposalTemplate: await storedProposalTemplate(tx, tenantId),
          timelineTemplate: await storedTimelineTemplate(tx, tenantId),
          trancheTemplates: await trancheTemplatesOf(tx, tenantId),
          holidays: await holidaysOf(tx, tenantId),
        },
        promptPoints: progress?.promptPointStates ?? {},
      };
    });
  }

  /** The list replaced whole: a type not sent goes, a type sent lands or updates, one entry. */
  async replaceTaxRegistrations(
    tenantId: string,
    registrations: readonly TaxRegistration[],
    act: Act,
  ): Promise<readonly TaxRegistration[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await registrationsOf(tx, tenantId);
      if (sameSet(stored, registrations, (one) => one.registrationType)) return stored;
      const kept = registrations.map((registration) => registration.registrationType);
      await tx
        .delete(taxRegistration)
        .where(
          kept.length === 0
            ? eq(taxRegistration.tenantId, tenantId)
            : and(
                eq(taxRegistration.tenantId, tenantId),
                notInArray(taxRegistration.registrationType, kept),
              ),
        );
      for (const registration of registrations) {
        await tx
          .insert(taxRegistration)
          .values({ tenantId, ...registration, createdAt: new Date(act.now) })
          .onConflictDoUpdate({
            target: [taxRegistration.tenantId, taxRegistration.registrationType],
            set: { value: registration.value },
          });
      }
      const profileId = await ensureProfile(tx, tenantId, act.now);
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.tax_registrations_changed',
          tenantId,
          { kind: 'business_profile', ref: profileId },
          act,
        ),
      );
      return registrationsOf(tx, tenantId);
    });
  }

  async saveBranding(
    tenantId: string,
    branding: BrandingSettings,
    act: Act,
  ): Promise<BrandingSettings> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await brandingOf(tx, tenantId);
      if (stored !== null && isDeepStrictEqual(stored, branding)) return stored;
      const now = new Date(act.now);
      const values = {
        brandColour: branding.brandColour,
        letterhead: branding.letterhead,
        updatedAt: now,
      };
      const [row] = await tx
        .insert(brandingSettings)
        .values({ tenantId, ...values })
        .onConflictDoUpdate({ target: brandingSettings.tenantId, set: values })
        .returning({
          id: brandingSettings.id,
          brandColour: brandingSettings.brandColour,
          letterhead: brandingSettings.letterhead,
        });
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
      return { brandColour: row.brandColour, letterhead: row.letterhead };
    });
  }

  /** The tenant's additions replaced whole; the pack's own days are never here to remove (`F1-17`). */
  async replaceHolidays(
    tenantId: string,
    holidays: readonly TenantHoliday[],
    act: Act,
  ): Promise<readonly TenantHoliday[]> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const stored = await holidaysOf(tx, tenantId);
      if (sameSet(stored, holidays, (one) => one.date)) return stored;
      const kept = holidays.map((holiday) => holiday.date);
      await tx
        .delete(tenantHoliday)
        .where(
          kept.length === 0
            ? eq(tenantHoliday.tenantId, tenantId)
            : and(eq(tenantHoliday.tenantId, tenantId), notInArray(tenantHoliday.date, kept)),
        );
      for (const holiday of holidays) {
        await tx
          .insert(tenantHoliday)
          .values({ tenantId, ...holiday, createdAt: new Date(act.now) })
          .onConflictDoUpdate({
            target: [tenantHoliday.tenantId, tenantHoliday.date],
            set: { label: holiday.label },
          });
      }
      await recordAuditEntry(
        tx,
        memberAct('settings.holidays_changed', tenantId, { kind: 'tenant', ref: tenantId }, act),
      );
      return holidaysOf(tx, tenantId);
    });
  }
}

async function tenantRead(tx: TenantScopedDb, tenantId: string): Promise<TenantRead | null> {
  const [row] = await tx
    .select({
      companyName: tenant.companyName,
      city: tenant.city,
      segment: tenant.segment,
      typicalSystemKwp: tenant.typicalSystemKwp,
      defaultLanguage: tenant.defaultLanguage,
      timezone: tenant.timezone,
      marketCode: tenant.marketCode,
    })
    .from(tenant)
    .where(eq(tenant.id, tenantId))
    .limit(1);
  return row ? withKwp(row) : null;
}

/** `typical_system_kwp` is `numeric`, which the driver reads back as text. */
export function withKwp<T extends { typicalSystemKwp: string | null }>(
  row: T,
): Omit<T, 'typicalSystemKwp'> & { typicalSystemKwp: number | null } {
  return {
    ...row,
    typicalSystemKwp: row.typicalSystemKwp === null ? null : Number(row.typicalSystemKwp),
  };
}

async function brandingOf(tx: TenantScopedDb, tenantId: string): Promise<BrandingSettings | null> {
  const [row] = await tx
    .select({ brandColour: brandingSettings.brandColour, letterhead: brandingSettings.letterhead })
    .from(brandingSettings)
    .where(eq(brandingSettings.tenantId, tenantId))
    .limit(1);
  return row ?? null;
}

/** A list the store keeps as a set, one row per key: equal whatever order either side holds it in. */
function sameSet<T>(stored: readonly T[], sent: readonly T[], keyOf: (one: T) => string): boolean {
  const byKey = (items: readonly T[]) =>
    [...items].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  return isDeepStrictEqual(byKey(stored), byKey(sent));
}

async function registrationsOf(
  tx: TenantScopedDb,
  tenantId: string,
): Promise<readonly TaxRegistration[]> {
  return tx
    .select({
      registrationType: taxRegistration.registrationType,
      value: taxRegistration.value,
    })
    .from(taxRegistration)
    .where(eq(taxRegistration.tenantId, tenantId))
    .orderBy(asc(taxRegistration.registrationType));
}

async function holidaysOf(tx: TenantScopedDb, tenantId: string): Promise<readonly TenantHoliday[]> {
  return tx
    .select({ date: tenantHoliday.date, label: tenantHoliday.label })
    .from(tenantHoliday)
    .where(eq(tenantHoliday.tenantId, tenantId))
    .orderBy(asc(tenantHoliday.date));
}

/**
 * The profile row a registration change is recorded against. Seeded at creation; a company
 * older than the seed gets its empty row here, on the same transaction as the change.
 */
async function ensureProfile(tx: TenantScopedDb, tenantId: string, now: number): Promise<string> {
  const [existing] = await tx
    .select({ id: businessProfile.id })
    .from(businessProfile)
    .where(eq(businessProfile.tenantId, tenantId))
    .limit(1);
  if (existing) return existing.id;
  const stamp = new Date(now);
  const [created] = await tx
    .insert(businessProfile)
    .values({ tenantId, address: null, bankDetails: null, createdAt: stamp, updatedAt: stamp })
    .returning({ id: businessProfile.id });
  if (!created) throw new Error('business_profile insert returned no row');
  return created.id;
}

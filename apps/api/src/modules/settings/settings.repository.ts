import {
  brandingSettings,
  businessProfile,
  type Db,
  onboardingProgress,
  proposalTemplateSettings,
  taxRegistration,
  tenant,
  tenantHoliday,
  timelineTemplate,
  withTenantTransaction,
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
import { RUNTIME_DB } from '../../common/db/runtime.token';
import { recordAuditEntry } from '../audit/audit.public';
import { settingsAct } from './internal/audit-act';
import { trancheTemplatesOf } from './settings.tranches.repository';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

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
 * `settings.admin.repository.ts`'s.
 */
@Injectable()
export class SettingsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  /** The tenant's own row, or null where the session's tenant is not visible — a broken guard. */
  async tenant(tenantId: string): Promise<TenantRead | null> {
    return withTenantTransaction(this.db, tenantId, (tx) => tenantRead(tx, tenantId));
  }

  async everything(tenantId: string): Promise<TenantSettingsRead | null> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const own = await tenantRead(tx, tenantId);
      if (own === null) return null;
      const [profile] = await tx
        .select({ address: businessProfile.address, bankDetails: businessProfile.bankDetails })
        .from(businessProfile)
        .where(eq(businessProfile.tenantId, tenantId))
        .limit(1);
      const [branding] = await tx
        .select({
          brandColour: brandingSettings.brandColour,
          letterhead: brandingSettings.letterhead,
        })
        .from(brandingSettings)
        .where(eq(brandingSettings.tenantId, tenantId))
        .limit(1);
      const [proposal] = await tx
        .select({
          cover: proposalTemplateSettings.cover,
          sectionsIncluded: proposalTemplateSettings.sectionsIncluded,
          defaultTerms: proposalTemplateSettings.defaultTerms,
        })
        .from(proposalTemplateSettings)
        .where(eq(proposalTemplateSettings.tenantId, tenantId))
        .limit(1);
      const [timeline] = await tx
        .select({ phases: timelineTemplate.phases })
        .from(timelineTemplate)
        .where(eq(timelineTemplate.tenantId, tenantId))
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
          branding: branding ?? null,
          proposalTemplate: proposal ?? null,
          timelineTemplate: timeline ?? null,
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
    return withTenantTransaction(this.db, tenantId, async (tx) => {
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
        settingsAct(
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
    return withTenantTransaction(this.db, tenantId, async (tx) => {
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
        settingsAct(
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
    return withTenantTransaction(this.db, tenantId, async (tx) => {
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
        settingsAct('settings.holidays_changed', tenantId, { kind: 'tenant', ref: tenantId }, act),
      );
      return holidaysOf(tx, tenantId);
    });
  }
}

async function tenantRead(tx: Tx, tenantId: string): Promise<TenantRead | null> {
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
  if (!row) return null;
  return {
    ...row,
    typicalSystemKwp: row.typicalSystemKwp === null ? null : Number(row.typicalSystemKwp),
  };
}

async function registrationsOf(tx: Tx, tenantId: string): Promise<readonly TaxRegistration[]> {
  return tx
    .select({
      registrationType: taxRegistration.registrationType,
      value: taxRegistration.value,
    })
    .from(taxRegistration)
    .where(eq(taxRegistration.tenantId, tenantId))
    .orderBy(asc(taxRegistration.registrationType));
}

async function holidaysOf(tx: Tx, tenantId: string): Promise<readonly TenantHoliday[]> {
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
async function ensureProfile(tx: Tx, tenantId: string, now: number): Promise<string> {
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

import {
  businessProfile,
  type Db,
  onboardingProgress,
  tenant,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import {
  type BankDetails,
  ONBOARDING_STEPS,
  STANDARD_TRANCHE_TEMPLATES,
  type TenantSegment,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { ADMIN_DB } from '../../common/db/admin.token';
import { recordAuditEntry } from '../audit/audit.public';
import { settingsAct } from './internal/audit-act';

/** Any transaction, on either pool: the seed rides the one that creates the tenant. */
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * What a company has before its owner has touched a setting (`M01-28`, `M01-54`): the setup
 * corridor at its first step, an empty profile, and the two standard splits with the first as
 * the default. Written INSIDE the tenant-creation transaction on the admin path, so a company
 * is never observed without them; every row lands once — the unique keys refuse a second seed,
 * and the splits are skipped where a template already exists.
 */
export async function seedTenantSettings(
  tx: Tx,
  input: { readonly tenantId: string; readonly now: number },
): Promise<void> {
  const { tenantId } = input;
  const now = new Date(input.now);
  await tx
    .insert(onboardingProgress)
    .values({
      tenantId,
      resumeStep: ONBOARDING_STEPS[0],
      stepStates: {},
      promptPointStates: {},
      updatedAt: now,
    })
    .onConflictDoNothing({ target: onboardingProgress.tenantId });
  await tx
    .insert(businessProfile)
    .values({ tenantId, address: null, bankDetails: null, createdAt: now, updatedAt: now })
    .onConflictDoNothing({ target: businessProfile.tenantId });
  const [existing] = await tx
    .select({ id: trancheTemplate.id })
    .from(trancheTemplate)
    .where(eq(trancheTemplate.tenantId, tenantId))
    .limit(1);
  if (existing !== undefined) return;
  for (const [position, standard] of STANDARD_TRANCHE_TEMPLATES.entries()) {
    const [template] = await tx
      .insert(trancheTemplate)
      .values({
        tenantId,
        name: standard.name,
        isDefault: position === 0,
        archived: false,
        createdAt: now,
      })
      .returning({ id: trancheTemplate.id });
    if (!template) throw new Error('tranche_template insert returned no row');
    await tx.insert(trancheTemplateLine).values(
      standard.lines.map((line, index) => ({
        tenantId,
        trancheTemplateId: template.id,
        position: index,
        label: line.label,
        shareBasisPoints: line.share,
        dueOnStage: line.dueOnStage,
      })),
    );
  }
}

/** The profile as one write (`M01-31`): the company facts on `tenant`, the rest on its own row. */
export interface ProfileToWrite {
  readonly companyName: string;
  readonly city: string;
  readonly segment: TenantSegment | null;
  readonly typicalSystemKwp: number | null;
  readonly address: string | null;
  readonly bankDetails: BankDetails | null;
}

/**
 * The one settings write that touches the tenant registry: `tenant` is ARMED, readable to its
 * own session and written on the admin path alone (`T-M01-025`), so the whole profile save —
 * the company facts by id, the profile row, the entry — is one transaction here, never split
 * across the two pools where half could land.
 */
@Injectable()
export class SettingsAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async saveProfile(tenantId: string, profile: ProfileToWrite, act: Act): Promise<ProfileToWrite> {
    return this.db.transaction(async (tx) => {
      const now = new Date(act.now);
      const [facts] = await tx
        .update(tenant)
        .set({
          companyName: profile.companyName,
          city: profile.city,
          segment: profile.segment,
          typicalSystemKwp:
            profile.typicalSystemKwp === null ? null : String(profile.typicalSystemKwp),
        })
        .where(eq(tenant.id, tenantId))
        .returning({
          companyName: tenant.companyName,
          city: tenant.city,
          segment: tenant.segment,
          typicalSystemKwp: tenant.typicalSystemKwp,
        });
      if (!facts) throw new Error('the tenant vanished inside its own profile save');
      const [row] = await tx
        .insert(businessProfile)
        .values({
          tenantId,
          address: profile.address,
          bankDetails: profile.bankDetails,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: businessProfile.tenantId,
          set: { address: profile.address, bankDetails: profile.bankDetails, updatedAt: now },
        })
        .returning({
          id: businessProfile.id,
          address: businessProfile.address,
          bankDetails: businessProfile.bankDetails,
        });
      if (!row) throw new Error('business_profile upsert returned no row');
      await recordAuditEntry(
        tx,
        settingsAct(
          'settings.business_profile_changed',
          tenantId,
          { kind: 'business_profile', ref: row.id },
          act,
        ),
      );
      return {
        ...facts,
        typicalSystemKwp: facts.typicalSystemKwp === null ? null : Number(facts.typicalSystemKwp),
        address: row.address,
        bankDetails: row.bankDetails,
      };
    });
  }
}

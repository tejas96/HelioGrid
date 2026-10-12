import { isDeepStrictEqual } from 'node:util';
import {
  businessProfile,
  type Db,
  type DbTransaction,
  onboardingProgress,
  tenant,
  trancheTemplate,
  trancheTemplateLine,
} from '@heliogrid/db';
import {
  type BankDetails,
  type BankDetailsTyped,
  ONBOARDING_STEPS,
  STANDARD_TRANCHE_TEMPLATES,
  type TenantSegment,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { ADMIN_DB } from '../../common/db/admin.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { withKwp } from './settings.repository';

/** Any transaction, on either pool: the seed rides the one that creates the tenant. */

/**
 * What a company has before its owner has touched a setting (`M01-28`, `M01-54`): the setup
 * corridor at its first step, an empty profile, and the two standard splits with the first as
 * the default. Written INSIDE the tenant-creation transaction on the admin path, so a company
 * is never observed without them; every row lands once — the unique keys refuse a second seed,
 * and the splits are skipped where a template already exists.
 */
export async function seedTenantSettings(
  tx: DbTransaction,
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

/** The profile as stored (`M01-31`): the company facts on `tenant`, the rest on its own row. */
export interface StoredProfile {
  readonly companyName: string;
  readonly city: string;
  readonly segment: TenantSegment | null;
  readonly typicalSystemKwp: number | null;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly logoFileId: string | null;
  readonly bankDetails: BankDetails | null;
  /** Held only while `bankDetails` is not: no document reads it. */
  readonly bankDetailsTyped: BankDetailsTyped | null;
}

/**
 * The profile as one write. A client built before the postal code, the logo or the typed bank
 * details existed sends back what it read, so a write that leaves one out keeps the stored one;
 * `null` clears it.
 */
export interface ProfileToWrite
  extends Omit<StoredProfile, 'postalCode' | 'logoFileId' | 'bankDetailsTyped'> {
  readonly postalCode?: string | null;
  readonly logoFileId?: string | null;
  readonly bankDetailsTyped?: BankDetailsTyped | null;
}

/** A fact a write may leave out: absent keeps what is stored, `null` clears it. */
function kept<Fact>(sent: Fact | null | undefined, stored: Fact | null | undefined): Fact | null {
  return sent === undefined ? (stored ?? null) : sent;
}

/**
 * The one settings write that touches the tenant registry: `tenant` is ARMED, readable to its
 * own session and written on the admin path alone (`T-M01-025`), so the whole profile save —
 * the company facts by id, the profile row, the entry — is one transaction here, never split
 * across the two pools where half could land. The profile as stored, sent again, writes and
 * records nothing (`F4-07`).
 */
@Injectable()
export class SettingsAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  async saveProfile(tenantId: string, write: ProfileToWrite, act: Act): Promise<StoredProfile> {
    return this.db.transaction(async (tx) => {
      const stored = await storedProfile(tx, tenantId);
      const profile: StoredProfile = {
        ...write,
        postalCode: kept(write.postalCode, stored?.postalCode),
        logoFileId: kept(write.logoFileId, stored?.logoFileId),
        // Whole bank details replace the half: the two are never stored together.
        bankDetailsTyped:
          write.bankDetails === null
            ? kept(write.bankDetailsTyped, stored?.bankDetailsTyped)
            : null,
      };
      if (stored !== null && isDeepStrictEqual(stored, profile)) return stored;
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
          postalCode: profile.postalCode,
          logoFileId: profile.logoFileId,
          bankDetails: profile.bankDetails,
          bankDetailsTyped: profile.bankDetailsTyped,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: businessProfile.tenantId,
          set: {
            address: profile.address,
            postalCode: profile.postalCode,
            logoFileId: profile.logoFileId,
            bankDetails: profile.bankDetails,
            bankDetailsTyped: profile.bankDetailsTyped,
            updatedAt: now,
          },
        })
        .returning({
          id: businessProfile.id,
          address: businessProfile.address,
          postalCode: businessProfile.postalCode,
          logoFileId: businessProfile.logoFileId,
          bankDetails: businessProfile.bankDetails,
          bankDetailsTyped: businessProfile.bankDetailsTyped,
        });
      if (!row) throw new Error('business_profile upsert returned no row');
      await recordAuditEntry(
        tx,
        memberAct(
          'settings.business_profile_changed',
          tenantId,
          { kind: 'business_profile', ref: row.id },
          act,
        ),
      );
      return withKwp({
        ...facts,
        address: row.address,
        postalCode: row.postalCode,
        logoFileId: row.logoFileId,
        bankDetails: row.bankDetails,
        bankDetailsTyped: row.bankDetailsTyped,
      });
    });
  }
}

async function storedProfile(tx: DbTransaction, tenantId: string): Promise<StoredProfile | null> {
  const [row] = await tx
    .select({
      companyName: tenant.companyName,
      city: tenant.city,
      segment: tenant.segment,
      typicalSystemKwp: tenant.typicalSystemKwp,
      address: businessProfile.address,
      postalCode: businessProfile.postalCode,
      logoFileId: businessProfile.logoFileId,
      bankDetails: businessProfile.bankDetails,
      bankDetailsTyped: businessProfile.bankDetailsTyped,
    })
    .from(tenant)
    .innerJoin(businessProfile, eq(businessProfile.tenantId, tenant.id))
    .where(eq(tenant.id, tenantId))
    .limit(1);
  return row === undefined ? null : withKwp(row);
}

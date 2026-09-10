import type {
  Branding,
  BrandingWrite,
  BusinessProfile,
  EffectiveSettings as EffectiveSettingsWire,
  Holidays,
  TaxRegistrations,
} from '@heliogrid/contracts';
import {
  checkTaxRegistration,
  compliantShades,
  type EffectiveSettings,
  type MarketPack,
  packLabel,
  resolveEffectiveSettings,
  type UiLanguage,
} from '@heliogrid/domain';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { ContractException } from '../../common/errors/contract-exception';
import { MarketPackService } from '../market/market.public';
import { brandingWire, effectiveWire } from './internal/wire';
import { SettingsAdminRepository } from './settings.admin.repository';
import { SettingsRepository } from './settings.repository';

/**
 * Tenant settings (`M01-28`, `M01-31`, `M01-50`, `M01-59`): the one resolved read, and the
 * writes to the profile, the registrations, the branding and the calendar. Every decision is
 * domain's — what a missing setting means, whether a registration reads as one, which shade
 * carries words — and this orders the reads and writes around them. A per-setting read serves
 * the setting IN FORCE, so a screen edits what a document would print.
 */
@Injectable()
export class SettingsService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(SettingsRepository) private readonly scoped: SettingsRepository,
    @Inject(SettingsAdminRepository) private readonly crossTenant: SettingsAdminRepository,
    @Inject(MarketPackService) private readonly markets: MarketPackService,
  ) {}

  async effective(tenantId: string): Promise<EffectiveSettingsWire> {
    return effectiveWire(await this.inForce(tenantId));
  }

  async businessProfile(tenantId: string): Promise<BusinessProfile> {
    const { value } = (await this.inForce(tenantId)).companyIdentity;
    return {
      companyName: value.companyName,
      city: value.city,
      segment: value.segment,
      typicalSystemKwp: value.typicalSystemKwp,
      address: value.address,
      bankDetails: value.bankDetails,
    };
  }

  async saveBusinessProfile(
    tenantId: string,
    body: BusinessProfile,
    act: Act,
  ): Promise<BusinessProfile> {
    return this.crossTenant.saveProfile(tenantId, body, act);
  }

  async taxRegistrations(tenantId: string): Promise<TaxRegistrations> {
    return { registrations: [...(await this.inForce(tenantId)).taxRegistrations.value] };
  }

  /**
   * Each registration checked against the tenant market's format before anything is written
   * (`M01-25`): a malformed one is refused with the market's own format sentence, in the
   * reader's language, on the field that holds it.
   */
  async saveTaxRegistrations(
    tenantId: string,
    body: TaxRegistrations,
    act: Act,
    language: UiLanguage,
  ): Promise<TaxRegistrations> {
    const pack = await this.packOf(tenantId);
    body.registrations.forEach((registration, index) => {
      const check = checkTaxRegistration(
        pack.tax,
        registration.registrationType,
        registration.value,
      );
      if (check.ok) return;
      if (check.reason === 'unknown_type') {
        throw new ContractException(
          'DOMAIN_RULE_VIOLATION',
          'This market has no registration of that type.',
          HttpStatus.UNPROCESSABLE_ENTITY,
          [{ path: `registrations.${index}.registrationType`, issue: 'not a type of this market' }],
        );
      }
      throw new ContractException(
        'TAX_REGISTRATION_MALFORMED',
        'That does not read as a registration of this type.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: `registrations.${index}.value`, issue: packLabel(check.format, language) }],
      );
    });
    const saved = await this.scoped.replaceTaxRegistrations(tenantId, body.registrations, act);
    return { registrations: [...saved] };
  }

  async branding(tenantId: string): Promise<Branding> {
    return brandingWire((await this.inForce(tenantId)).branding.value);
  }

  /** Never refused (`F7-07`): the colour is saved as given and the answer rides back with it. */
  async saveBranding(tenantId: string, body: BrandingWrite, act: Act): Promise<Branding> {
    const shades = body.brandColour === null ? null : compliantShades(body.brandColour);
    const saved = await this.scoped.saveBranding(
      tenantId,
      { brandColour: shades?.brand ?? null, letterhead: body.letterhead },
      act,
    );
    return brandingWire({ ...saved, shades });
  }

  async holidays(tenantId: string): Promise<Holidays> {
    const read = await this.scoped.everything(tenantId);
    if (read === null) throw notVisible();
    return { holidays: [...read.settings.holidays] };
  }

  async saveHolidays(tenantId: string, body: Holidays, act: Act): Promise<Holidays> {
    return { holidays: [...(await this.scoped.replaceHolidays(tenantId, body.holidays, act))] };
  }

  /** Every setting resolved for this tenant — one read, one rule (`M01-28`). */
  private async inForce(tenantId: string): Promise<EffectiveSettings> {
    const read = await this.scoped.everything(tenantId);
    if (read === null) throw notVisible();
    const { marketCode, ...tenant } = read.tenant;
    const pack = await this.packOfMarket(marketCode);
    return resolveEffectiveSettings({
      formats: pack.formats,
      tenant,
      settings: read.settings,
      promptPoints: read.promptPoints,
    });
  }

  private async packOf(tenantId: string): Promise<MarketPack> {
    const own = await this.scoped.tenant(tenantId);
    if (own === null) throw notVisible();
    return this.packOfMarket(own.marketCode);
  }

  /** The tenant's market has a published pack, or the deployment is broken: said loudly, never guessed. */
  private async packOfMarket(marketCode: string): Promise<MarketPack> {
    const pack = (await this.markets.currentPacks()).find((one) => one.market === marketCode);
    if (pack === undefined) throw new Error(`no pack is published for market ${marketCode}`);
    return pack;
  }
}

/** The guard admits a settings route only with a membership, so an invisible tenant is a broken guard, not a status to answer. */
function notVisible(): Error {
  return new Error('the guard admitted a settings route for a company its session cannot see');
}

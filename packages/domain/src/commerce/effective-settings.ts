import { type CompliantShades, compliantShades } from '../branding/compliant-shades';
import { type CalendarDate, holidaysInForce } from '../format/holidays';
import {
  type PackLabel,
  type PerLanguage,
  UI_SOURCE_LOCALE,
  type UiLanguage,
} from '../format/languages';
import type { FormatPack } from '../format/pack';
import type { BasisPoints } from '../money/basis-points';
import type { ProjectChainStage } from '../projects/stages';
import {
  type PromptPointFact,
  type PromptPointStates,
  pendingPromptPoints,
} from '../tenancy/onboarding-steps';
import type { TenantSegment } from '../tenancy/segment';
import {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
  type ProposalCover,
  type ProposalSection,
} from './proposal-template-defaults';
import type { RichTextValue } from './rich-text';
import { DEFAULT_TIMELINE_PHASES, type TimelinePhase } from './timeline-template-defaults';
import { STANDARD_TRANCHE_TEMPLATES } from './tranche-template-defaults';

/**
 * The tenant's settings as ONE shape (`M01-28`, `M01-53` — Law 11): what the tenant stored, and
 * what is in force once every platform default is filled in. The settings screens, the builder,
 * Quick mode, the documents and the customer link read the resolved half; nothing else decides
 * what a missing setting means.
 */

/** Whether a value in force is the tenant's own or the platform's stand-in — carried per setting. */
export const SETTING_SOURCES = ['tenant', 'platform'] as const;
export type SettingSource = (typeof SETTING_SOURCES)[number];

export interface Resolved<T> {
  readonly source: SettingSource;
  readonly value: T;
}

/** `M06-17`'s four bank facts, market-neutral names: the routing identifier is IFSC in IN, labelled by the pack. */
export interface BankDetails {
  readonly bankName: string;
  readonly accountName: string;
  readonly accountNumber: string;
  readonly bankRoutingIdentifier: string;
}

export interface BusinessProfileSettings {
  readonly address: string | null;
  readonly bankDetails: BankDetails | null;
}

export interface TaxRegistration {
  readonly registrationType: string;
  readonly value: string;
}

/** The band's extra lines and the note along every page's foot — the design system's `DocumentLetterhead`. */
export interface Letterhead {
  readonly tagline: PackLabel | null;
  readonly lines: readonly PackLabel[];
  readonly footerNote: PackLabel | null;
}

export interface BrandingSettings {
  readonly brandColour: string | null;
  readonly letterhead: Letterhead | null;
}

export interface ProposalTemplateSettings {
  readonly cover: ProposalCover | null;
  readonly sectionsIncluded: readonly ProposalSection[];
  readonly defaultTerms: PerLanguage<RichTextValue>;
}

export interface TimelineTemplateSettings {
  readonly phases: readonly TimelinePhase[];
}

export interface TrancheLine {
  readonly label: PackLabel;
  readonly share: BasisPoints;
  readonly dueOnStage: ProjectChainStage;
}

export interface TrancheTemplateContent {
  readonly name: PackLabel;
  readonly lines: readonly TrancheLine[];
}

export interface TrancheTemplate extends TrancheTemplateContent {
  readonly id: string;
  readonly isDefault: boolean;
  readonly archived: boolean;
  /** Edited since it was given: a seeded split is the platform's until the tenant touches it. */
  readonly changed: boolean;
}

export interface TenantHoliday {
  readonly date: CalendarDate;
  readonly label: string;
}

/** What the tenant stored — `null` or empty where it never set the setting. */
export interface TenantSettings {
  readonly businessProfile: BusinessProfileSettings | null;
  readonly taxRegistrations: readonly TaxRegistration[];
  readonly branding: BrandingSettings | null;
  readonly proposalTemplate: ProposalTemplateSettings | null;
  readonly timelineTemplate: TimelineTemplateSettings | null;
  readonly trancheTemplates: readonly TrancheTemplate[];
  readonly holidays: readonly TenantHoliday[];
}

/** The facts on `tenant` itself: the signup facts, the two `M01-23` declarations, the locale pair. */
export interface TenantFacts {
  readonly companyName: string;
  readonly city: string;
  readonly segment: TenantSegment | null;
  readonly typicalSystemKwp: number | null;
  readonly defaultLanguage: UiLanguage;
  readonly timezone: string;
}

export interface CompanyIdentity extends TenantFacts {
  readonly address: string | null;
  readonly bankDetails: BankDetails | null;
}

export interface BrandingInForce extends BrandingSettings {
  /** Derived on every read, never stored: the answer to the colour that is set, `null` without one. */
  readonly shades: CompliantShades | null;
}

export interface LocaleInForce {
  readonly defaultLanguage: UiLanguage;
  readonly timezone: string;
}

/** A tranche template in force: the tenant's default row, or the platform's first split with no row behind it. */
export interface TrancheTemplateInForce extends TrancheTemplateContent {
  readonly id: string | null;
}

export interface EffectiveSettings {
  readonly companyIdentity: Resolved<CompanyIdentity>;
  readonly taxRegistrations: Resolved<readonly TaxRegistration[]>;
  readonly branding: Resolved<BrandingInForce>;
  readonly proposalTemplate: Resolved<ProposalTemplateSettings>;
  readonly timelineTemplate: Resolved<TimelineTemplateSettings>;
  readonly defaultTrancheTemplate: Resolved<TrancheTemplateInForce>;
  /** The days in force: the pack's floor plus the tenant's additions, sorted (`F1-17`). */
  readonly holidays: Resolved<readonly CalendarDate[]>;
  readonly locale: Resolved<LocaleInForce>;
  /** The skipped facts still owed their one prompt-point (`M01-29`). */
  readonly pendingPromptPoints: readonly PromptPointFact[];
}

export interface EffectiveSettingsInput {
  readonly formats: FormatPack;
  readonly tenant: TenantFacts;
  readonly settings: TenantSettings;
  readonly promptPoints: PromptPointStates;
}

/**
 * The facts a skip left absent, judged from the rows alone: the profile until an address or a
 * registration exists, the bank details until they exist, the payment terms until any template is
 * the tenant's own. The catalog's absence is `T-M01-027`'s to judge, so it is never absent here.
 */
export function absentFacts(settings: TenantSettings): readonly PromptPointFact[] {
  const absent: PromptPointFact[] = [];
  const profile = settings.businessProfile;
  if ((profile?.address ?? null) === null && settings.taxRegistrations.length === 0) {
    absent.push('company_profile');
  }
  if ((profile?.bankDetails ?? null) === null) absent.push('bank_details');
  if (!settings.trancheTemplates.some((template) => template.changed)) absent.push('payment_terms');
  return absent;
}

function tenantOr<T>(own: T | null, platform: T): Resolved<T> {
  return own === null ? { source: 'platform', value: platform } : { source: 'tenant', value: own };
}

function identityInForce(
  tenant: TenantFacts,
  profile: BusinessProfileSettings | null,
): Resolved<CompanyIdentity> {
  const address = profile?.address ?? null;
  const bankDetails = profile?.bankDetails ?? null;
  return {
    source: address === null && bankDetails === null ? 'platform' : 'tenant',
    value: { ...tenant, address, bankDetails },
  };
}

function brandingInForce(branding: BrandingSettings | null): Resolved<BrandingInForce> {
  const brandColour = branding?.brandColour ?? null;
  const letterhead = branding?.letterhead ?? null;
  return {
    source: brandColour === null && letterhead === null ? 'platform' : 'tenant',
    value: {
      brandColour,
      letterhead,
      shades: brandColour === null ? null : compliantShades(brandColour),
    },
  };
}

function trancheTemplateInForce(
  templates: readonly TrancheTemplate[],
): Resolved<TrancheTemplateInForce> {
  const own = templates.find((template) => template.isDefault && !template.archived);
  if (own === undefined) {
    const [first] = STANDARD_TRANCHE_TEMPLATES;
    return { source: 'platform', value: { id: null, name: first.name, lines: first.lines } };
  }
  return {
    source: own.changed ? 'tenant' : 'platform',
    value: { id: own.id, name: own.name, lines: own.lines },
  };
}

function holidaysResolved(
  formats: FormatPack,
  holidays: readonly TenantHoliday[],
): Resolved<readonly CalendarDate[]> {
  return {
    source: holidays.length === 0 ? 'platform' : 'tenant',
    value: holidaysInForce(
      formats.holidayCalendar,
      holidays.map((holiday) => holiday.date),
    ),
  };
}

function localeInForce(formats: FormatPack, tenant: TenantFacts): Resolved<LocaleInForce> {
  const platform =
    tenant.defaultLanguage === UI_SOURCE_LOCALE && tenant.timezone === formats.timeZone;
  return {
    source: platform ? 'platform' : 'tenant',
    value: { defaultLanguage: tenant.defaultLanguage, timezone: tenant.timezone },
  };
}

/** Every setting in force for one tenant — the platform default wherever the tenant set nothing (`M01-28`). */
export function resolveEffectiveSettings(input: EffectiveSettingsInput): EffectiveSettings {
  const { formats, tenant, settings, promptPoints } = input;
  return {
    companyIdentity: identityInForce(tenant, settings.businessProfile),
    taxRegistrations:
      settings.taxRegistrations.length === 0
        ? { source: 'platform', value: [] }
        : { source: 'tenant', value: settings.taxRegistrations },
    branding: brandingInForce(settings.branding),
    proposalTemplate: tenantOr(settings.proposalTemplate, {
      cover: null,
      sectionsIncluded: DEFAULT_SECTIONS_INCLUDED,
      defaultTerms: DEFAULT_TERMS,
    }),
    timelineTemplate: tenantOr(settings.timelineTemplate, { phases: DEFAULT_TIMELINE_PHASES }),
    defaultTrancheTemplate: trancheTemplateInForce(settings.trancheTemplates),
    holidays: holidaysResolved(formats, settings.holidays),
    locale: localeInForce(formats, tenant),
    pendingPromptPoints: pendingPromptPoints(promptPoints, absentFacts(settings)),
  };
}

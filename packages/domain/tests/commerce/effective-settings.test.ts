import { describe, expect, it } from 'vitest';
import {
  absentFacts,
  resolveEffectiveSettings,
  type TenantFacts,
  type TenantSettings,
  type TrancheTemplate,
} from '../../src/commerce/effective-settings';
import {
  DEFAULT_SECTIONS_INCLUDED,
  DEFAULT_TERMS,
} from '../../src/commerce/proposal-template-defaults';
import { DEFAULT_TIMELINE_PHASES } from '../../src/commerce/timeline-template-defaults';
import { STANDARD_TRANCHE_TEMPLATES } from '../../src/commerce/tranche-template-defaults';
import { IN_FORMATS } from '../../src/format/pack';
import { basisPoints } from '../../src/money/basis-points';

const signupOnly: TenantFacts = {
  companyName: 'Sunrise Solar',
  city: 'Pune',
  segment: null,
  typicalSystemKwp: null,
  defaultLanguage: 'en',
  timezone: IN_FORMATS.timeZone,
};

const nothingSet: TenantSettings = {
  businessProfile: null,
  taxRegistrations: [],
  branding: null,
  proposalTemplate: null,
  timelineTemplate: null,
  trancheTemplates: [],
  holidays: [],
};

const [standard] = STANDARD_TRANCHE_TEMPLATES;
const seeded: TrancheTemplate = {
  id: 'tt-1',
  name: standard.name,
  lines: standard.lines,
  isDefault: true,
  archived: false,
  changed: false,
};

const everythingSet: TenantSettings = {
  businessProfile: {
    address: '12 MG Road, Pune',
    bankDetails: {
      bankName: 'Bank of Pune',
      accountName: 'Sunrise Solar',
      accountNumber: '0012345678',
      bankRoutingIdentifier: 'PUNE0001234',
    },
  },
  taxRegistrations: [{ registrationType: 'IN_GST', value: '27ABCDE1234F1Z5' }],
  branding: { brandColour: '#FF0000', letterhead: null },
  proposalTemplate: {
    cover: {
      aboutCompany: { en: 'Since 2011' },
      totalCapacityInstalledKw: 200,
      happyCustomers: 350,
      citiesServed: 10,
    },
    sectionsIncluded: ['system', 'terms'],
    defaultTerms: { en: { version: 1, blocks: [] } },
  },
  timelineTemplate: { phases: [{ name: { en: 'Survey' }, description: { en: 'We visit.' } }] },
  trancheTemplates: [
    { ...seeded, changed: true },
    { ...seeded, id: 'tt-2', isDefault: false, name: { en: 'Old' } },
  ],
  holidays: [{ date: '2026-08-15', label: 'Independence Day' }],
};

describe('resolveEffectiveSettings — a tenant with no rows gets the platform everywhere (M01-28)', () => {
  const effective = resolveEffectiveSettings({
    formats: IN_FORMATS,
    tenant: signupOnly,
    settings: nothingSet,
    promptPoints: {},
  });

  it('marks every setting platform and fills each with its default', () => {
    expect(effective.companyIdentity).toEqual({
      source: 'platform',
      value: { ...signupOnly, address: null, bankDetails: null },
    });
    expect(effective.taxRegistrations).toEqual({ source: 'platform', value: [] });
    expect(effective.branding).toEqual({
      source: 'platform',
      value: { brandColour: null, letterhead: null, shades: null },
    });
    expect(effective.proposalTemplate).toEqual({
      source: 'platform',
      value: {
        cover: null,
        sectionsIncluded: DEFAULT_SECTIONS_INCLUDED,
        defaultTerms: DEFAULT_TERMS,
      },
    });
    expect(effective.timelineTemplate).toEqual({
      source: 'platform',
      value: { phases: DEFAULT_TIMELINE_PHASES },
    });
    expect(effective.defaultTrancheTemplate).toEqual({
      source: 'platform',
      value: { id: null, name: standard.name, lines: standard.lines },
    });
    expect(effective.holidays).toEqual({ source: 'platform', value: [] });
    expect(effective.locale).toEqual({
      source: 'platform',
      value: { defaultLanguage: 'en', timezone: IN_FORMATS.timeZone },
    });
  });

  it('owes a prompt-point for the profile, the bank details and the payment terms — never the catalog here', () => {
    expect(effective.pendingPromptPoints).toEqual([
      'company_profile',
      'payment_terms',
      'bank_details',
    ]);
  });

  it('leaves nothing undefined: every setting resolves to a value', () => {
    for (const [name, setting] of Object.entries(effective)) {
      expect(setting, name).toBeDefined();
    }
  });
});

describe('resolveEffectiveSettings — the tenant’s own rows win, each marked tenant', () => {
  const effective = resolveEffectiveSettings({
    formats: IN_FORMATS,
    tenant: { ...signupOnly, segment: 'both', typicalSystemKwp: 5, defaultLanguage: 'mr' },
    settings: everythingSet,
    promptPoints: {},
  });

  it('reads the profile, registrations, template and timeline from the rows', () => {
    expect(effective.companyIdentity.source).toBe('tenant');
    expect(effective.companyIdentity.value.address).toBe('12 MG Road, Pune');
    expect(effective.companyIdentity.value.segment).toBe('both');
    expect(effective.taxRegistrations).toEqual({
      source: 'tenant',
      value: everythingSet.taxRegistrations,
    });
    expect(effective.proposalTemplate).toEqual({
      source: 'tenant',
      value: everythingSet.proposalTemplate,
    });
    expect(effective.timelineTemplate).toEqual({
      source: 'tenant',
      value: everythingSet.timelineTemplate,
    });
  });

  it('derives the shades from the colour that is set, on the read', () => {
    expect(effective.branding.source).toBe('tenant');
    expect(effective.branding.value.shades?.brand).toBe('#FF0000');
    expect(effective.branding.value.shades?.ink).not.toBe('#FF0000');
  });

  it('serves the default template the tenant edited, by id', () => {
    expect(effective.defaultTrancheTemplate).toEqual({
      source: 'tenant',
      value: { id: 'tt-1', name: standard.name, lines: standard.lines },
    });
  });

  it('adds the tenant’s holidays to the pack floor, and reads the locale as the tenant’s own', () => {
    expect(effective.holidays).toEqual({ source: 'tenant', value: ['2026-08-15'] });
    expect(effective.locale).toEqual({
      source: 'tenant',
      value: { defaultLanguage: 'mr', timezone: IN_FORMATS.timeZone },
    });
  });

  it('owes no prompt-point once every fact is present', () => {
    expect(effective.pendingPromptPoints).toEqual([]);
  });
});

describe('the seeded split is the platform’s until touched (SCR-M01-20: given, not locked)', () => {
  it('marks an untouched seeded default platform, with its row id', () => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: signupOnly,
      settings: { ...nothingSet, trancheTemplates: [seeded] },
      promptPoints: {},
    });
    expect(effective.defaultTrancheTemplate).toEqual({
      source: 'platform',
      value: { id: 'tt-1', name: standard.name, lines: standard.lines },
    });
  });

  it('falls back to the platform split when the only default is archived', () => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: signupOnly,
      settings: { ...nothingSet, trancheTemplates: [{ ...seeded, archived: true, changed: true }] },
      promptPoints: {},
    });
    expect(effective.defaultTrancheTemplate.value.id).toBeNull();
  });

  it('reads the locale as the tenant’s once the timezone differs from the pack’s', () => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: { ...signupOnly, timezone: 'Asia/Dubai' },
      settings: nothingSet,
      promptPoints: {},
    });
    expect(effective.locale.source).toBe('tenant');
  });

  it('reads branding as the tenant’s from a letterhead alone, with no shades to derive', () => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: signupOnly,
      settings: {
        ...nothingSet,
        branding: {
          brandColour: null,
          letterhead: { tagline: { en: 'Rooftop solar since 2011' }, lines: [], footerNote: null },
        },
      },
      promptPoints: {},
    });
    expect(effective.branding.source).toBe('tenant');
    expect(effective.branding.value.shades).toBeNull();
  });
});

describe('absentFacts — what a skip left behind, judged from the rows (M01-29)', () => {
  it.each([
    { rows: nothingSet, absent: ['company_profile', 'bank_details', 'payment_terms'] },
    {
      rows: { ...nothingSet, businessProfile: { address: 'x', bankDetails: null } },
      absent: ['bank_details', 'payment_terms'],
    },
    {
      rows: { ...nothingSet, taxRegistrations: [{ registrationType: 'IN_GST', value: 'x' }] },
      absent: ['bank_details', 'payment_terms'],
    },
    {
      rows: {
        ...nothingSet,
        businessProfile: {
          address: null,
          bankDetails: {
            bankName: 'b',
            accountName: 'a',
            accountNumber: '1',
            bankRoutingIdentifier: 'r',
          },
        },
      },
      absent: ['company_profile', 'payment_terms'],
    },
    {
      rows: { ...nothingSet, trancheTemplates: [seeded] },
      absent: ['company_profile', 'bank_details', 'payment_terms'],
    },
    {
      rows: { ...nothingSet, trancheTemplates: [{ ...seeded, changed: true }] },
      absent: ['company_profile', 'bank_details'],
    },
  ])('$absent are absent', ({ rows, absent }) => {
    expect(absentFacts(rows)).toEqual(absent);
  });

  it('never judges the catalog — that is the catalog slice’s own (T-M01-027)', () => {
    expect(absentFacts(nothingSet)).not.toContain('catalog');
    expect(basisPoints(0)).toBe(0);
  });
});

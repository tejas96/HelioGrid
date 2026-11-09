import { describe, expect, it } from 'vitest';
import {
  type DocumentDefaults,
  resolveEffectiveSettings,
  type TenantFacts,
  type TenantSettings,
} from '../../src/commerce/effective-settings';
import { DEFAULT_SECTIONS_INCLUDED } from '../../src/commerce/proposal-template-defaults';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import { IN_FORMATS } from '../../src/format/pack';
import { nothingSet, seeded, standard, standardSplits } from './settings-rows';

/** The platform's defaults in one reader's words — catalog copy, handed in. */
const defaults: DocumentDefaults = {
  terms: richTextParagraphs(['This proposal is valid until the date stated on it.']),
  phases: [{ name: 'Material ordered', description: 'Panels are ordered for your site.' }],
  trancheTemplates: standardSplits,
};

const signupOnly: TenantFacts = {
  companyName: 'Sunrise Solar',
  city: 'Pune',
  segment: null,
  typicalSystemKwp: null,
  defaultLanguage: 'en',
  timezone: IN_FORMATS.timeZone,
};

const everythingSet: TenantSettings = {
  businessProfile: {
    address: '12 MG Road, Pune',
    postalCode: '411001',
    logoFileId: null,
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
      aboutCompany: 'Since 2011',
      totalCapacityInstalledKw: 200,
      happyCustomers: 350,
      citiesServed: 10,
    },
    sectionsIncluded: ['system', 'terms'],
    defaultTerms: { version: 1, blocks: [] },
  },
  timelineTemplate: { phases: [{ name: 'Survey', description: 'We visit.' }] },
  trancheTemplates: [
    { ...seeded, changed: true },
    { ...seeded, id: 'tt-2', isDefault: false, name: 'Old' },
  ],
  holidays: [{ date: '2026-08-15', label: 'Independence Day' }],
};

describe('resolveEffectiveSettings — a tenant with no rows gets the platform everywhere (M01-28)', () => {
  const effective = resolveEffectiveSettings({
    formats: IN_FORMATS,
    tenant: signupOnly,
    settings: nothingSet,
    promptPoints: {},
    defaults,
  });

  it('marks every setting platform and fills each with its default', () => {
    expect(effective.companyIdentity).toEqual({
      source: 'platform',
      value: {
        ...signupOnly,
        address: null,
        postalCode: null,
        logoFileId: null,
        bankDetails: null,
      },
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
        defaultTerms: defaults.terms,
      },
    });
    expect(effective.timelineTemplate).toEqual({
      source: 'platform',
      value: { phases: defaults.phases },
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
    defaults,
  });

  it('reads the profile, registrations, template and timeline from the rows', () => {
    expect(effective.companyIdentity.source).toBe('tenant');
    expect(effective.companyIdentity.value.address).toBe('12 MG Road, Pune');
    expect(effective.companyIdentity.value.postalCode).toBe('411001');
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
      defaults,
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
      defaults,
    });
    expect(effective.defaultTrancheTemplate.value.id).toBeNull();
  });

  it('reads the locale as the tenant’s once the timezone differs from the pack’s', () => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: { ...signupOnly, timezone: 'Asia/Dubai' },
      settings: nothingSet,
      promptPoints: {},
      defaults,
    });
    expect(effective.locale.source).toBe('tenant');
  });

  it.each([
    ['a PIN code', { postalCode: '411001' }],
    ['a logo', { logoFileId: '0199d3a0-7c1e-7b7a-9d7e-4f6a2b8c1d3e' }],
  ])('reads the identity as the tenant’s from %s alone', (_fact, held) => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: signupOnly,
      settings: {
        ...nothingSet,
        businessProfile: {
          address: null,
          postalCode: null,
          logoFileId: null,
          bankDetails: null,
          ...held,
        },
      },
      promptPoints: {},
      defaults,
    });
    expect(effective.companyIdentity.source).toBe('tenant');
    expect(effective.companyIdentity.value).toMatchObject(held);
  });

  it('reads branding as the tenant’s from a letterhead alone, with no shades to derive', () => {
    const effective = resolveEffectiveSettings({
      formats: IN_FORMATS,
      tenant: signupOnly,
      settings: {
        ...nothingSet,
        branding: {
          brandColour: null,
          letterhead: { tagline: 'Rooftop solar since 2011', lines: [], footerNote: null },
        },
      },
      promptPoints: {},
      defaults,
    });
    expect(effective.branding.source).toBe('tenant');
    expect(effective.branding.value.shades).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { absentFacts } from '../../src/commerce/effective-settings';
import { nothingSet, seeded } from './settings-rows';

describe('absentFacts — what a skip left behind, judged from the rows (M01-29)', () => {
  const wholeBank = {
    bankName: 'b',
    accountName: 'a',
    accountNumber: '1',
    bankRoutingIdentifier: 'r',
  };
  it.each([
    { rows: nothingSet, absent: ['company_profile', 'bank_details', 'payment_terms'] },
    {
      rows: {
        ...nothingSet,
        businessProfile: { address: 'x', postalCode: null, logoFileId: null, bankDetails: null },
      },
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
          postalCode: null,
          logoFileId: null,
          bankDetails: wholeBank,
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
  });
});

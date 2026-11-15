import { describe, expect, it } from 'vitest';
import { PROPOSAL_SECTIONS } from '../../src/commerce/proposal-template-defaults';
import { richTextParagraphs } from '../../src/commerce/rich-text';
import { IN_FORMATS } from '../../src/format/pack';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { systemMonthlyKwh, yearlyKwh } from '../../src/proposals/energy';
import type { ProposalFieldSet } from '../../src/proposals/field-set';
import { proposalMoney } from '../../src/proposals/money';
import { proposalEmi, proposalSavings } from '../../src/proposals/projections';
import type { ProposalVersionSnapshot } from '../../src/proposals/snapshot';
import { PROPOSAL_PAGES, pagesPrinted } from '../../src/proposals/steps';
import { versionDiff } from '../../src/proposals/version-diff';
import { A_DEAL, aFieldSet, moneyInput, WAAREE, withSystem } from './proposal-fixture';

function snapshot(fields: ProposalFieldSet = aFieldSet()): ProposalVersionSnapshot {
  const money = proposalMoney(moneyInput(fields));
  if (money === null) throw new Error('the fixture is priced');
  const monthlyKwh = systemMonthlyKwh(fields.performance, fields.system.capacityKw);
  const tariff = fields.financials.tariffPerKwh;
  return {
    fields,
    deal: A_DEAL,
    company: {
      name: 'Suryodaya Solar',
      phoneE164: null,
      email: null,
      website: null,
      address: null,
      logoFileId: null,
      taxRegistration: null,
      bankDetails: null,
      brandColour: null,
    },
    money,
    generation:
      monthlyKwh === null
        ? null
        : {
            monthlyKwh,
            yearlyKwh: yearlyKwh(monthlyKwh),
            source: fields.performance.source,
            grain: 'district',
          },
    savings:
      monthlyKwh === null || tariff === null
        ? null
        : proposalSavings({
            formats: IN_FORMATS,
            monthlyKwh,
            source: fields.performance.source,
            financials: { ...fields.financials, tariffPerKwh: tariff },
            monthlyBill: A_DEAL.monthlyBill,
            exportRatePerKwh: minorUnits(0),
            netCost: money.netCost,
            incentive: money.incentive?.amount ?? null,
            freshness: null,
          }),
    emi:
      fields.system.emi === null
        ? null
        : proposalEmi(IN_FORMATS, money.payable, fields.system.emi, null),
    pages: pagesPrinted(PROPOSAL_SECTIONS),
    basisLine: 'indicative-basis',
    validityDays: 30,
    language: 'en',
    preparedBy: { name: 'Rahul Patil', phoneE164: null },
  };
}

const V1 = snapshot();

describe('versionDiff — only what moved, old value → new value (M06-42)', () => {
  it('nothing changed: no change, every page as it was', () => {
    expect(versionDiff(V1, V1)).toEqual({ changes: [], pagesUnchanged: PROPOSAL_PAGES.length });
  });

  it('a discount moves the payable and the saving’s payback, and leaves seven pages', () => {
    const v2 = snapshot(
      withSystem({ discount: { mode: 'amount', amount: minorUnits(1_000_000) } }),
    );
    const diff = versionDiff(V1, v2);
    expect(diff.changes).toEqual([
      {
        fact: 'payable',
        from: { kind: 'money', amount: 19_057_500 },
        to: { kind: 'money', amount: 17_968_500 },
      },
      { fact: 'discount', from: { kind: 'absent' }, to: { kind: 'money', amount: 1_000_000 } },
    ]);
    expect(diff.pagesUnchanged).toBe(7);
  });

  it.each([
    [
      'a bigger system',
      withSystem({ capacityKw: 5 }),
      'capacity',
      { kind: 'power', kw: 3 },
      { kind: 'power', kw: 5 },
    ],
    [
      'the system type',
      withSystem({ systemType: 'hybrid' }),
      'system_type',
      { kind: 'word', word: 'on_grid' },
      { kind: 'word', word: 'hybrid' },
    ],
    [
      'a battery added',
      withSystem({
        battery: {
          capacityKwh: 5,
          costInclusive: minorUnits(5_900_000),
          taxRate: basisPoints(1800),
          chemistry: 'lfp',
          chemistryCustom: null,
        },
      }),
      'battery',
      { kind: 'absent' },
      { kind: 'energy', kwh: 5 },
    ],
    [
      'a second panel brand',
      aFieldSet({
        components: [...aFieldSet().components, { ...WAAREE, brand: 'Adani', count: 5 }],
      }),
      'panels',
      { kind: 'text', text: '6 × Waaree' },
      { kind: 'text', text: '6 × Waaree · 5 × Adani' },
    ],
    [
      'another payment plan',
      aFieldSet({
        payment: {
          templateId: null,
          tranches: [
            { label: 'Advance', share: basisPoints(3000), dueOnStage: 'won' },
            { label: 'Rest', share: basisPoints(7000), dueOnStage: 'commissioned' },
          ],
        },
      }),
      'payment_plan',
      { kind: 'text', text: '10/60/20/10' },
      { kind: 'text', text: '30/70' },
    ],
    [
      'a maintenance plan',
      withSystem({ maintenance: { kind: 'years', years: 5 } }),
      'maintenance',
      { kind: 'word', word: 'none' },
      { kind: 'text', text: '5' },
    ],
    [
      'the EMI example switched on',
      withSystem({ emi: { rate: basisPoints(950), tenureYears: 5 } }),
      'emi_example',
      { kind: 'absent' },
      { kind: 'money', amount: 400_243 },
    ],
    [
      'the incentive left',
      withSystem({ incentiveClaimed: false }),
      'incentive',
      { kind: 'money', amount: 7_800_000 },
      { kind: 'absent' },
    ],
  ] as const)('%s', (_, fields, fact, from, to) => {
    const change = versionDiff(V1, snapshot(fields)).changes.find((one) => one.fact === fact);
    expect(change).toEqual({ fact, from, to });
  });

  it.each([
    ['the terms', { terms: richTextParagraphs(['Valid for 15 days.']) }, 'terms', 8],
    ['the timeline', { timeline: [] }, 'timeline', 8],
    [
      'the cover picture',
      {
        company: {
          proposalType: 'customer_owns',
          coverPicture: { kind: 'platform', key: 'villa' },
        },
      },
      'cover',
      8,
    ],
  ] as const)('%s changed says so, with no short value', (_, over, fact, unchanged) => {
    const diff = versionDiff(V1, snapshot(aFieldSet(over)));
    expect(diff.changes).toEqual([{ fact, from: { kind: 'content' }, to: { kind: 'content' } }]);
    expect(diff.pagesUnchanged).toBe(unchanged);
  });

  it('counts only the pages the newer version prints', () => {
    const v2: ProposalVersionSnapshot = { ...V1, pages: pagesPrinted([]) };
    expect(versionDiff(V1, v2).pagesUnchanged).toBe(3);
  });

  it('a version with no generation and no parts reads absent, never zero', () => {
    const bare = snapshot(
      aFieldSet({ components: [], performance: { ...aFieldSet().performance, yieldPerKwp: null } }),
    );
    const facts = Object.fromEntries(
      versionDiff(V1, bare).changes.map((change) => [change.fact, change.to]),
    );
    expect(facts.panels).toEqual({ kind: 'absent' });
    expect(facts.inverters).toEqual({ kind: 'absent' });
    expect(facts.other_parts).toEqual({ kind: 'absent' });
    expect(facts.yearly_generation).toEqual({ kind: 'absent' });
    expect(facts.yearly_saving).toEqual({ kind: 'absent' });
  });

  it('a version with no payment parts reads absent', () => {
    const none = snapshot(aFieldSet({ payment: { templateId: null, tranches: [] } }));
    expect(versionDiff(V1, none).changes).toContainEqual({
      fact: 'payment_plan',
      from: { kind: 'text', text: '10/60/20/10' },
      to: { kind: 'absent' },
    });
  });
});

describe('versionDiff — steps 1, 2, 10 and 11 are compared too (M06-42)', () => {
  const BANK = {
    bankName: 'State Bank of India',
    accountName: 'Suryodaya Solar',
    accountNumber: '00000011112222',
    bankRoutingIdentifier: 'SBIN0000001',
  };

  it.each([
    [
      'the proposal type',
      snapshot(
        aFieldSet({ company: { ...aFieldSet().company, proposalType: 'customer_pays_for_power' } }),
      ),
      'proposal_type',
      8,
    ],
    [
      'the track record',
      snapshot(aFieldSet({ achievements: { ...aFieldSet().achievements, happyCustomers: 120 } })),
      'about',
      8,
    ],
    [
      'the client’s name',
      { ...V1, deal: { ...V1.deal, clientName: 'Asha Kulkarni' } },
      'client',
      0,
    ],
    [
      'the site’s address',
      { ...V1, deal: { ...V1.deal, siteAddress: '12 MG Road, Pune' } },
      'client',
      0,
    ],
    ['the bank details', { ...V1, company: { ...V1.company, bankDetails: BANK } }, 'bank', 8],
    [
      'the bank page switched off',
      snapshot(aFieldSet({ bank: { includeInProposal: false } })),
      'bank',
      8,
    ],
  ] as const)('%s changed says so, and its pages are not unchanged', (_, v2, fact, unchanged) => {
    const diff = versionDiff(V1, v2);
    expect(diff.changes).toEqual([{ fact, from: { kind: 'content' }, to: { kind: 'content' } }]);
    expect(diff.pagesUnchanged).toBe(unchanged);
  });
});

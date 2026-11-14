import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { proposalMoney, tranchesTotal } from '../../src/proposals/money';
import type { SubsidyModel } from '../../src/subsidy/pack';
import {
  A_COMPANY,
  A_DEAL,
  aFieldSet,
  moneyInput,
  PRICE_TYPED,
  withSystem,
} from './proposal-fixture';

const money = (...args: Parameters<typeof moneyInput>) => {
  const block = proposalMoney(moneyInput(...args));
  if (block === null) throw new Error('the fixture is priced');
  return block;
};

describe('proposalMoney — M06-35’s own case, to the paisa', () => {
  const block = money();

  it('₹1,75,000 before tax and ₹15,575 of tax are the ₹1,90,575 typed', () => {
    expect(block.preTax).toBe(17_500_000);
    expect(block.taxAmount).toBe(1_557_500);
    expect(block.payable).toBe(PRICE_TYPED);
    expect(block.currency).toBe('INR');
  });

  it('the tranches sum to the payable, row for row', () => {
    expect(block.tranches?.map((part) => part.amount)).toEqual([
      1_905_750, 11_434_500, 3_811_500, 1_905_750,
    ]);
    expect(tranchesTotal(block.tranches ?? [])).toBe(PRICE_TYPED);
  });

  it('the ₹78,000 incentive shows beside it, and the net cost is ₹1,12,575', () => {
    expect(block.incentive).toEqual({
      scheme: 'PM Surya Ghar',
      amount: 7_800_000,
      paidTo: 'customer',
    });
    expect(block.netCost).toBe(11_257_500);
  });

  it('an IN incentive is never passed as a deduction: the customer receives it', () => {
    expect(block.equation.lines.map((line) => line.key)).toEqual(['system', 'tax']);
    expect(block.equation.deductions).toBe(0);
    expect(block.payable).toBe(PRICE_TYPED);
  });

  it('splits the tax in the place’s halves', () => {
    expect(block.taxes).toEqual([
      { code: 'CGST', amount: 778_750 },
      { code: 'SGST', amount: 778_750 },
    ]);
  });

  it('every figure reads assumed, a typed price with no design behind it (F8-21)', () => {
    expect(block.figures.payable).toMatchObject({ text: '₹1,90,575.00', tier: 'assumed' });
    expect(block.figures.incentive?.tier).toBe('assumed');
    expect(block.figures.netCost.text).toBe('₹1,12,575.00');
    expect(block.figures.discount).toBeNull();
    expect(block.figures.margin).toBeNull();
  });

  it('the price for each kW is a check on the typed price', () => {
    expect(block.perKw).toBe(6_352_500);
    expect(block.figures.perKw?.text).toBe('₹63,525.00');
  });
});

describe('proposalMoney — where the company receives the incentive, it comes off the payable', () => {
  const paidToCompany: SubsidyModel = {
    ...IN_PACK.subsidy,
    offered: true,
    paidTo: 'company',
  } as SubsidyModel;
  const block = money(aFieldSet(), { subsidy: paidToCompany });

  it('deducts it, and the net cost is the payable itself', () => {
    expect(block.equation.lines.map((line) => line.key)).toEqual(['system', 'tax', 'incentive']);
    expect(block.payable).toBe(PRICE_TYPED - 7_800_000);
    expect(block.netCost).toBe(block.payable);
  });
});

describe('proposalMoney — when the incentive is offered, and when it is claimed (M06-38)', () => {
  it.each([
    ['residential on-grid, claimed', {}, {}, true, 7_800_000],
    ['residential hybrid, claimed', { systemType: 'hybrid' as const }, {}, true, 7_800_000],
    ['the switch off: no amount', { incentiveClaimed: false }, {}, true, null],
    ['off-grid: not offered', { systemType: 'off_grid' as const }, {}, false, null],
    ['a commercial deal: not offered', {}, { segment: 'commercial' as const }, false, null],
    ['no segment on the lead: not offered', {}, { segment: null }, false, null],
    ['no size yet: nothing to compute', { capacityKw: null }, {}, true, null],
    ['2.5 kW earns ₹69,000', { capacityKw: 2.5 }, {}, true, 6_900_000],
  ])('%s', (_, system, deal, offered, amount) => {
    const block = money(withSystem(system), { deal: { ...A_DEAL, ...deal } });
    expect(block.incentiveOffered).toBe(offered);
    expect(block.incentive?.amount ?? null).toBe(amount);
  });

  it('a market with no incentive offers none', () => {
    const block = money(aFieldSet(), { subsidy: { offered: false } });
    expect(block.incentiveOffered).toBe(false);
    expect(block.incentive).toBeNull();
    expect(block.netCost).toBe(block.payable);
  });
});

describe('proposalMoney — a typed price is the authority (T-M06-024)', () => {
  it.each([10_000_00, 12_345_67, 19_057_500, 99_999_99, 1, 100, 33_333_33, 250_000_00])(
    'a price of %i paise adds up to exactly what was typed',
    (typed) => {
      const block = money(withSystem({ priceInclusive: minorUnits(typed) }));
      expect(block.preTax + block.taxAmount).toBe(typed);
      expect(block.payable).toBe(typed);
      expect(block.taxes.reduce((sum, tax) => sum + tax.amount, 0)).toBe(block.taxAmount);
    },
  );

  it('an inter-state customer carries one component, the same total', () => {
    const block = money(aFieldSet(), {
      deal: { ...A_DEAL, area: { area: 'IN-GJ', district: null } },
    });
    expect(block.taxes).toEqual([{ code: 'IGST', amount: 1_557_500 }]);
    expect(block.payable).toBe(PRICE_TYPED);
  });

  it('a site with no area yet is taxed at the supplier’s own place', () => {
    const block = money(aFieldSet(), { deal: { ...A_DEAL, area: null } });
    expect(block.taxes.map((tax) => tax.code)).toEqual(['CGST', 'SGST']);
  });

  it('an area the scheme names no place for is taxed at the supplier’s own place', () => {
    const block = money(aFieldSet(), { deal: { ...A_DEAL, area: { area: 'XX', district: null } } });
    expect(block.taxes.map((tax) => tax.code)).toEqual(['CGST', 'SGST']);
  });
});

describe('proposalMoney — a company with no tax registration prints no tax line', () => {
  const block = money(aFieldSet(), {
    company: { ...A_COMPANY, taxRegistered: false, supplierPlace: null },
  });

  it('its price is the price', () => {
    expect(block.preTax).toBe(PRICE_TYPED);
    expect(block.taxAmount).toBe(0);
    expect(block.taxes).toEqual([]);
    expect(block.payable).toBe(PRICE_TYPED);
    expect(block.equation.lines.map((line) => line.key)).toEqual(['system']);
  });
});

describe('proposalMoney — a discount is pre-tax, and the tax is on what the customer pays', () => {
  it.each([
    [
      '₹10,000 off',
      { mode: 'amount' as const, amount: minorUnits(1_000_000) },
      1_000_000,
      16_500_000,
      1_468_500,
    ],
    [
      '10% off',
      { mode: 'percent' as const, percent: basisPoints(1000) },
      1_750_000,
      15_750_000,
      1_401_750,
    ],
    [
      'a discount of nothing',
      { mode: 'amount' as const, amount: minorUnits(0) },
      0,
      17_500_000,
      1_557_500,
    ],
  ])('%s', (_, discount, amount, preTax, tax) => {
    const block = money(withSystem({ discount }));
    expect(block.discount).toBe(amount);
    expect(block.preTax).toBe(preTax);
    expect(block.taxAmount).toBe(tax);
    expect(block.payable).toBe(preTax + tax);
    expect(block.figures.discount === null).toBe(amount === 0);
  });

  it('is pro-rated across the system and the battery by value, the last line taking the remainder', () => {
    const fields = withSystem({
      priceInclusive: minorUnits(10_890_000),
      discount: { mode: 'amount', amount: minorUnits(1_000_001) },
      battery: {
        capacityKwh: 5,
        costInclusive: minorUnits(5_900_000),
        taxRate: basisPoints(1800),
        chemistry: 'lfp',
        chemistryCustom: null,
      },
    });
    const block = money(fields);
    /* ₹1,00,000 and ₹50,000 before tax: 6,666.67 of the discount to the system, the rest — 3,333.34
       — to the battery. 8.9% on 93,333.33 is 8,306.66; 18% on 46,666.66 is 8,400.00. */
    expect(block.equation.lines.map((line) => [line.key, line.amount])).toEqual([
      ['system', 10_000_000],
      ['battery', 5_000_000],
      ['discount', 1_000_001],
      ['tax', 1_670_666],
    ]);
    expect(block.preTax).toBe(13_999_999);
    expect(block.payable).toBe(block.preTax + block.taxAmount);
  });

  it('a discount on a zero price goes to the last line, never divided by nothing', () => {
    const fields = withSystem({
      priceInclusive: minorUnits(0),
      discount: { mode: 'amount', amount: minorUnits(500) },
      battery: {
        capacityKwh: 5,
        costInclusive: minorUnits(0),
        taxRate: basisPoints(1800),
        chemistry: 'lfp',
        chemistryCustom: null,
      },
    });
    expect(money(fields).preTax).toBe(-500);
  });
});

describe('proposalMoney — the payable floor reads the payable itself (M06-36)', () => {
  it.each([
    ['a ₹0 price with no discount', { priceInclusive: minorUnits(0) }, 0, true],
    [
      'a discount past the price shows the negative',
      { discount: { mode: 'amount' as const, amount: minorUnits(20_000_000) } },
      -2_500_000,
      true,
    ],
    ['one paisa is above the floor', { priceInclusive: minorUnits(1) }, 1, false],
  ])('%s', (_, system, payable, blocked) => {
    const block = money(withSystem(system));
    expect(block.payable).toBe(payable);
    expect(block.payableAtOrBelowZero).toBe(blocked);
    expect(block.tranches === null).toBe(blocked);
  });

  it('a zero price with no deduction is not what the equation calls zero-or-below', () => {
    expect(money(withSystem({ priceInclusive: minorUnits(0) })).equation.zeroOrBelow).toBe(false);
  });
});

describe('proposalMoney — the margin is on the pre-tax amount (M06-37)', () => {
  it.each([
    ['a margin', 15_000_000, 2_500_000, 1429, false],
    ['priced at cost', 17_500_000, 0, 0, false],
    ['priced below cost: the loss, negative', 18_000_000, -500_000, -286, true],
  ])('%s', (_, ourCost, amount, share, belowCost) => {
    const block = money(withSystem({ ourCost: minorUnits(ourCost) }));
    expect(block.margin).toEqual({ amount, share, belowCost });
    expect(block.figures.margin?.tier).toBe('assumed');
  });

  it('has no share where nothing is paid before tax', () => {
    const block = money(withSystem({ priceInclusive: minorUnits(0), ourCost: minorUnits(100) }));
    expect(block.margin).toEqual({ amount: -100, share: null, belowCost: true });
  });
});

describe('proposalMoney — what cannot be stated is not stated', () => {
  it('no price typed: no block', () => {
    expect(proposalMoney(moneyInput(withSystem({ priceInclusive: null })))).toBeNull();
  });

  it('a battery with no cost typed: no block, since the payable covers it', () => {
    const fields = withSystem({
      battery: {
        capacityKwh: 5,
        costInclusive: null,
        taxRate: basisPoints(1800),
        chemistry: 'lfp',
        chemistryCustom: null,
      },
    });
    expect(proposalMoney(moneyInput(fields))).toBeNull();
  });

  it('no size: no price per kW', () => {
    expect(money(withSystem({ capacityKw: null, incentiveClaimed: false })).perKw).toBeNull();
  });

  it('payment shares that do not add up: no tranche amounts', () => {
    const fields = aFieldSet();
    const short = {
      ...fields,
      payment: { templateId: null, tranches: fields.payment.tranches.slice(1) },
    };
    expect(money(short).tranches).toBeNull();
  });
});

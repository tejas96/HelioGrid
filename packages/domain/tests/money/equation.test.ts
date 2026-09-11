import { describe, expect, it } from 'vitest';
import { reconcileMinorUnits, resolvePayable } from '../../src/money/equation';
import { minorUnits } from '../../src/money/minor-units';

const paise = minorUnits;

describe('resolvePayable — cost + battery − incentive − discount = payable, in whole minor units', () => {
  it('adds the add lines, subtracts the deduct lines, and keeps every line with its sign', () => {
    const money = resolvePayable({
      lines: [
        { key: 'cost', label: 'System cost', amount: paise(10_000_000) },
        { key: 'battery', label: 'Battery', amount: paise(3_000_000) },
        { key: 'incentive', label: 'Incentive', amount: paise(7_800_000), kind: 'deduct' },
        { key: 'discount', label: 'Discount', amount: paise(500_000), kind: 'deduct' },
      ],
    });
    expect(money.gross).toBe(13_000_000);
    expect(money.deductions).toBe(8_300_000);
    expect(money.payable).toBe(4_700_000);
    expect(money.zeroOrBelow).toBe(false);
    expect(money.unresolved).toEqual([]);
    expect(money.reconciliation).toBeNull();
    expect(money.payableStandsUp).toBe(true);
    expect(money.lines.map((line) => line.kind)).toEqual(['add', 'add', 'deduct', 'deduct']);
  });

  it('reports a negative payable instead of flooring it, and warns (M06-35)', () => {
    const money = resolvePayable({
      lines: [
        { key: 'cost', label: 'System cost', amount: paise(10_000_000) },
        { key: 'discount', label: 'Discount', amount: paise(12_000_000), kind: 'deduct' },
      ],
    });
    expect(money.payable).toBe(-2_000_000);
    expect(money.zeroOrBelow).toBe(true);
    expect(money.payableStandsUp).toBe(true);
  });

  it('warns at exactly zero when a deduction drove it there, and not when nothing did', () => {
    const driven = resolvePayable({
      lines: [
        { label: 'Cost', amount: paise(100) },
        { label: 'Incentive', amount: paise(100), kind: 'deduct' },
      ],
    });
    expect(driven.payable).toBe(0);
    expect(driven.zeroOrBelow).toBe(true);
    expect(resolvePayable({ lines: [{ label: 'Cost', amount: paise(0) }] }).zeroOrBelow).toBe(
      false,
    );
  });

  it('resolves an empty equation to zero, standing up, with nothing to warn about', () => {
    const money = resolvePayable();
    expect(money.lines).toEqual([]);
    expect(money.gross).toBe(0);
    expect(money.deductions).toBe(0);
    expect(money.payable).toBe(0);
    expect(money.zeroOrBelow).toBe(false);
    expect(money.payableStandsUp).toBe(true);
  });

  it('never counts an unresolved line as zero: it is named, and the price does not stand up', () => {
    const money = resolvePayable({
      lines: [
        { key: 'cost', label: 'System cost', amount: paise(10_000_000) },
        { key: 'battery', label: 'Battery', amount: null },
        { label: 'Discount', amount: null, kind: 'deduct' },
      ],
    });
    expect(money.payable).toBe(10_000_000);
    expect(money.unresolved).toEqual(['battery', 'Discount']);
    expect(money.payableStandsUp).toBe(false);
    expect(money.lines.map((line) => line.kind)).toEqual(['add', 'add', 'deduct']);
  });

  it('reads a negative add amount as a deduction of that size, and a deduct amount as a magnitude', () => {
    const money = resolvePayable({
      lines: [
        { key: 'cost', label: 'System cost', amount: paise(1_000) },
        { key: 'rebate', label: 'Rebate', amount: paise(-250) },
        { key: 'discount', label: 'Discount', amount: paise(-100), kind: 'deduct' },
      ],
    });
    expect(money.lines.map((line) => [line.kind, line.amount])).toEqual([
      ['add', 1_000],
      ['deduct', 250],
      ['deduct', 100],
    ]);
    expect(money.payable).toBe(650);
  });

  it("carries a caller's own fields through a resolved line", () => {
    const money = resolvePayable({
      lines: [{ key: 'cost', label: 'Cost', amount: paise(5), note: 'as quoted' }],
    });
    expect(money.lines[0]?.note).toBe('as quoted');
  });
});

describe('reconciliation — the bill of materials against the price: equal, or a defect', () => {
  const lines = [
    { key: 'cost', label: 'System cost', amount: paise(10_000_000) },
    { key: 'discount', label: 'Discount', amount: paise(500_000), kind: 'deduct' as const },
  ];

  it('agrees only when the two figures are equal to the paisa, against the first add line', () => {
    const money = resolvePayable({
      lines,
      reconcile: {
        label: 'Bill of materials',
        amount: paise(10_000_000),
        againstLabel: 'the quoted price',
      },
    });
    expect(money.reconciliation).toEqual({
      label: 'Bill of materials',
      amount: 10_000_000,
      againstLabel: 'System cost',
      target: 10_000_000,
      delta: 0,
      agrees: true,
    });
    expect(money.payableStandsUp).toBe(true);
  });

  it('calls one paisa apart a defect — the gap a half-rupee tolerance used to wave through', () => {
    const money = resolvePayable({
      lines,
      reconcile: {
        label: 'Bill of materials',
        amount: paise(10_000_049),
        againstLabel: 'the quoted price',
      },
    });
    expect(money.reconciliation?.agrees).toBe(false);
    expect(money.reconciliation?.delta).toBe(49);
    expect(money.payableStandsUp).toBe(false);
  });

  it('compares against the line `against` names, and against the gross when no line has that key', () => {
    const named = resolvePayable({
      lines,
      reconcile: {
        label: 'BOM',
        amount: paise(500_000),
        against: 'discount',
        againstLabel: 'the price',
      },
    });
    expect(named.reconciliation?.againstLabel).toBe('Discount');
    expect(named.reconciliation?.agrees).toBe(true);

    const missing = resolvePayable({
      lines,
      reconcile: {
        label: 'BOM',
        amount: paise(10_000_000),
        against: 'nothing',
        againstLabel: 'the price',
      },
    });
    expect(missing.reconciliation?.target).toBe(10_000_000);
    expect(missing.reconciliation?.againstLabel).toBe('the price');
    expect(missing.reconciliation?.agrees).toBe(true);
  });

  it("falls back to the gross, in the caller's words, when there is no add line to compare with", () => {
    const money = resolvePayable({
      lines: [{ label: 'Discount', amount: paise(1), kind: 'deduct' }],
      reconcile: { label: 'BOM', amount: paise(0), againstLabel: 'the price' },
    });
    expect(money.reconciliation?.target).toBe(0);
    expect(money.reconciliation?.againstLabel).toBe('the price');
    expect(money.reconciliation?.agrees).toBe(true);
  });

  it('compares against the gross when the named line has not resolved, keeping that line’s label', () => {
    const money = resolvePayable({
      lines: [
        { key: 'cost', label: 'Cost', amount: null },
        { key: 'battery', label: 'Battery', amount: paise(300) },
      ],
      reconcile: { label: 'BOM', amount: paise(300), against: 'cost', againstLabel: 'the price' },
    });
    expect(money.reconciliation?.target).toBe(300);
    expect(money.reconciliation?.againstLabel).toBe('Cost');
    expect(money.reconciliation?.agrees).toBe(true);
    expect(money.payableStandsUp).toBe(false);
  });
});

describe('reconcileMinorUnits — two figures that must be equal', () => {
  it.each([
    [100, 100, 0, true],
    [100, 99, 1, false],
    [99, 100, -1, false],
    [0, 0, 0, true],
  ])('%d against %d is %d apart, agrees %s', (amount, target, delta, agrees) => {
    expect(reconcileMinorUnits(paise(amount), paise(target))).toEqual({ delta, agrees });
  });
});

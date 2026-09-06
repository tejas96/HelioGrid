import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { minorUnits } from '../../src/money/minor-units';
import { activeStatutoryExtras } from '../../src/tax/extras';

/** ₹5,00,00,000.00 in paise — the IN e-invoicing threshold (F1-30). */
const FIVE_CRORE = 50_000_000_000;

describe('activeStatutoryExtras — a duty binds strictly past its threshold (F1-30)', () => {
  it.each([
    [0, []],
    [FIVE_CRORE - 1, []],
    [FIVE_CRORE, []],
    [FIVE_CRORE + 1, ['e_invoicing']],
  ])('a financial-year turnover of %d paise binds %j', (turnover, keys) => {
    const active = activeStatutoryExtras(IN_PACK.tax, minorUnits(turnover));
    expect(active.map((extra) => extra.key)).toEqual(keys);
  });
});

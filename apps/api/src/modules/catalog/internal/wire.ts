import type { RateEntryWire, ResolvedCatalogItemWire } from '@heliogrid/contracts';
import { basisPointsToPercent, type ResolvedCatalogItem } from '@heliogrid/domain';
import { minorUnitsOfDecimal, minorUnitsToDecimal } from '@heliogrid/domain/server';
import type { RecordedRate } from '../catalog.rates.repository';

/** Whether this reader sees money, and how many digits the tenant's currency carries. */
export interface MoneyView {
  readonly visible: boolean;
  readonly minorUnitDigits: number;
}

/**
 * A resolved item on the wire. For a reader without `onboarding.manage_catalog` in any form the
 * money keys are LEFT OUT, never nulled (ruling 1A, b12): `null` already means "nothing in force".
 */
export function resolvedWire(item: ResolvedCatalogItem, money: MoneyView): ResolvedCatalogItemWire {
  const { tax, rate, certifications, badges, ...rest } = item;
  const shown = { ...rest, certifications: [...certifications], badges: [...badges] };
  if (!money.visible) return shown;
  return {
    ...shown,
    tax: tax === null ? null : { source: tax.source, pct: basisPointsToPercent(tax.value) },
    rate:
      rate === null
        ? null
        : {
            source: rate.source,
            amount: minorUnitsToDecimal(rate.value.amount, money.minorUnitDigits),
            currencyCode: rate.value.currency,
            effectiveOn: rate.value.effectiveOn,
          },
  };
}

/** A ledger row as the history shows it: the stored decimal scaled to the currency's digits. */
export function rateEntryWire(entry: RecordedRate, minorUnitDigits: number): RateEntryWire {
  return {
    amount:
      entry.amount === null
        ? null
        : minorUnitsToDecimal(minorUnitsOfDecimal(entry.amount, minorUnitDigits), minorUnitDigits),
    currencyCode: entry.currency,
    effectiveOn: entry.effectiveOn,
    recordedAt: entry.recordedAt.toISOString(),
  };
}

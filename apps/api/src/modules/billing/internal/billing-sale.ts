import type { BillingHome } from '@heliogrid/contracts';
import type {
  BasisPoints,
  MarketPack,
  MinorUnits,
  StoredInvoiceLine,
  TaxComponentAmount,
} from '@heliogrid/domain';
import {
  invoiceTotals,
  minorUnitsToDecimal,
  platformInvoice,
  sumMinorUnits,
} from '@heliogrid/domain/server';

/** A sale as the billing home sends it: the list price, its tax once registered, and the total. */
export type SaleWire = NonNullable<BillingHome['due']>['sale'];

/** An amount as the wire carries it: a decimal string in the market's minor unit. */
export function decimalOf(pack: MarketPack, amount: MinorUnits): string {
  return minorUnitsToDecimal(amount, pack.formats.minorUnitDigits);
}

/**
 * What a list price bills today (`F1-29`): the platform sale `platformSaleTotal` collects, worked
 * out by the one tax computation — the price alone while the platform is not registered.
 */
export function saleOfList(pack: MarketPack, list: MinorUnits): SaleWire {
  const sale = platformInvoice(pack, [list], null);
  const line = sale.lines[0];
  return wire(pack, {
    list,
    rate: line?.rateBasisPoints ?? null,
    taxes: line?.components ?? [],
    total: sale.totalAmount,
  });
}

/** What an issued invoice bills, summed from the lines it stored — never worked out again. */
export function saleOfInvoice(pack: MarketPack, lines: readonly StoredInvoiceLine[]): SaleWire {
  const totals = invoiceTotals(lines);
  return wire(pack, {
    list: totals.subtotal,
    rate: lines[0]?.rateBasisPoints ?? null,
    taxes: totals.taxByCode,
    total: totals.total,
  });
}

function wire(
  pack: MarketPack,
  sale: {
    readonly list: MinorUnits;
    readonly rate: BasisPoints | null;
    readonly taxes: readonly TaxComponentAmount[];
    readonly total: MinorUnits;
  },
): SaleWire {
  const taxed = sale.rate !== null;
  return {
    list: decimalOf(pack, sale.list),
    taxRateBasisPoints: sale.rate,
    tax: taxed ? decimalOf(pack, sumMinorUnits(sale.taxes.map((tax) => tax.amount))) : null,
    total: decimalOf(pack, sale.total),
  };
}

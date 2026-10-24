'use client';
import type { ResolvedCatalogItemWire } from '@heliogrid/contracts';
import { percentWireOf } from '@heliogrid/domain';
import { useState } from 'react';
import type { CatalogActs } from './use-catalog-acts';

type Item = ResolvedCatalogItemWire;

/** Why the editor's save did not land: a value the server refused, or no answer. */
export type CatalogPriceProblem = 'refused' | 'failed';

export interface CatalogPriceDraft {
  /** The item being priced; `null` while the editor is shut. */
  readonly item: Item | null;
  readonly amount: string;
  readonly taxPct: string;
  readonly hidden: boolean;
  readonly preferred: boolean;
  readonly busy: boolean;
  readonly problem: CatalogPriceProblem | null;
  open(item: Item): void;
  close(): void;
  setAmount(amount: string): void;
  setTaxPct(taxPct: string): void;
  setHidden(hidden: boolean): void;
  setPreferred(preferred: boolean): void;
  /** Resolves `true` once saved and the catalog read again; the editor then closes. */
  save(): Promise<boolean>;
}

/**
 * The price editor's draft (`M01-37`): seeded from the item as resolved, saved as one sparse
 * override on a platform item — price, tax, hide and preferred together — or as a dated rate on
 * an own SKU. An empty field saves as unset: no price, or the tax falling through to the pack.
 */
export function useCatalogPriceDraft(acts: CatalogActs): CatalogPriceDraft {
  const [item, setItem] = useState<Item | null>(null);
  const [amount, setAmount] = useState('');
  const [taxPct, setTaxPct] = useState('');
  const [hidden, setHidden] = useState(false);
  const [preferred, setPreferred] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<CatalogPriceProblem | null>(null);

  const edit =
    <V>(set: (value: V) => void) =>
    (value: V) => {
      set(value);
      setProblem(null);
    };

  return {
    item,
    amount,
    taxPct,
    hidden,
    preferred,
    busy,
    problem,
    open(next) {
      setItem(next);
      setAmount(next.rate?.amount ?? '');
      setTaxPct(next.tax?.source === 'override' ? next.tax.pct : '');
      setHidden(next.hidden);
      setPreferred(next.preferred);
      setProblem(null);
    },
    close: () => setItem(null),
    setAmount: edit(setAmount),
    setTaxPct: edit(setTaxPct),
    setHidden: edit(setHidden),
    setPreferred: edit(setPreferred),
    async save() {
      if (item === null || busy) return false;
      setBusy(true);
      const platform = item.source === 'platform_item';
      const outcome = await acts.savePrice(item, {
        amount: changedAmount(item, amount),
        ...(platform
          ? { taxPct: taxPct.trim() === '' ? null : percentWireOf(taxPct), hidden, preferred }
          : {}),
      });
      setBusy(false);
      if (outcome !== 'saved') {
        setProblem(outcome);
        return false;
      }
      setItem(null);
      return true;
    },
  };
}

/**
 * The typed amount when it moves the price in force, else `undefined`: an unchanged figure writes
 * no ledger entry (`M01-44`). Compared as figures — the wire's `13600.00` is the typed `13600`.
 */
function changedAmount(item: Item, typed: string): string | null | undefined {
  const next = typed.trim() === '' ? null : typed.trim();
  const held = item.rate?.amount ?? null;
  if (next === null || held === null) return next === held ? undefined : next;
  return Number(next) === Number(held) ? undefined : next;
}

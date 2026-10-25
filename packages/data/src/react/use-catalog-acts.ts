'use client';
import type { ResolvedCatalogItemWire } from '@heliogrid/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import type { Repositories } from '../data-layer';
import { ApiError } from '../errors/errors';
import { useRepositories } from './context';
import { useSession } from './use-session';

type Item = ResolvedCatalogItemWire;

/** What a row act was: the failed line names it, and *Retry* sends it again. */
export type CatalogAct = 'price' | 'preferred' | 'hidden' | 'archive' | 'restore';

/** A row whose write is out, or came back failed with nothing changed. */
export type CatalogRowState =
  | { readonly state: 'saving'; readonly act: CatalogAct }
  | { readonly state: 'failed'; readonly act: CatalogAct; retry(): void; dismiss(): void };

/**
 * The price editor's save, as the person sets it: an amount and a tax, each cleared by `null`. An
 * amount left `undefined` is unchanged and writes no ledger entry.
 */
export interface CatalogPrice {
  readonly amount: string | null | undefined;
  /** A platform item's override tax; an own SKU carries none. */
  readonly taxPct?: string | null;
  /** A platform item's picker switches, saved with its price as one override. */
  readonly hidden?: boolean;
  readonly preferred?: boolean;
}

export type CatalogSaveOutcome = 'saved' | 'refused' | 'failed';

/** What the screen tells the person once a write lands. */
export type CatalogActNote =
  | { readonly kind: 'archived'; readonly item: Item; undo(): void }
  | { readonly kind: 'restored'; readonly item: Item }
  | { readonly kind: 'undo-failed'; readonly item: Item };

export interface CatalogActs {
  readonly rows: Readonly<Record<string, CatalogRowState>>;
  togglePreferred(item: Item): void;
  toggleHidden(item: Item): void;
  savePrice(item: Item, price: CatalogPrice): Promise<CatalogSaveOutcome>;
  /** The drafts still naming an own SKU, read before *Archive* asks (`§M01.4`). */
  draftsNaming(item: Item): Promise<number>;
  archive(item: Item): void;
  restore(item: Item): void;
}

/**
 * Catalog settings' row acts (`M01-37`, `SCR-M01-15`): each write is sent once per tap, a row
 * shows it is working, a failure keeps the old value and offers *Retry* in place, and every
 * success refreshes the catalog's prefix — prices, layers, counts and the next release move
 * together. A toggle flips from the value last asked for, never the one a control hands back.
 */
export function useCatalogActs(onNote: (note: CatalogActNote) => void): CatalogActs {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useSession().user?.tenant?.id ?? '';
  const [rows, setRows] = useState<Record<string, CatalogRowState>>({});
  const asked = useRef(new Map<string, boolean>());
  const out = useRef(new Set<string>());

  const settleRow = useCallback((id: string) => {
    setRows(({ [id]: _settled, ...rest }) => rest);
  }, []);

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all(tenantId) }),
    [queryClient, tenantId],
  );

  const send = useCallback(
    async (
      item: Item,
      act: CatalogAct,
      write: () => Promise<unknown>,
      landed: () => void = () => undefined,
    ): Promise<boolean> => {
      if (out.current.has(item.id)) return false;
      out.current.add(item.id);
      setRows((now) => ({ ...now, [item.id]: { state: 'saving', act } }));
      try {
        await write();
        settleRow(item.id);
        await refresh();
        landed();
        return true;
      } catch {
        const again = () => void send(item, act, write, landed);
        setRows((now) => ({
          ...now,
          [item.id]: { state: 'failed', act, retry: again, dismiss: () => settleRow(item.id) },
        }));
        return false;
      } finally {
        out.current.delete(item.id);
      }
    },
    [refresh, settleRow],
  );

  const flip = (item: Item, field: 'preferred' | 'hidden') => {
    const key = `${field}:${item.id}`;
    const next = !(asked.current.get(key) ?? item[field]);
    asked.current.set(key, next);
    const write =
      item.source === 'own_item'
        ? () =>
            repositories.catalog.saveItem(item.id, {
              brand: item.brand,
              model: item.model,
              spec: item.spec,
              certifications: item.certifications,
              preferred: next,
            })
        : () => repositories.catalog.saveOverride(item.id, { [field]: next });
    void send(item, field, write).then((landed) => {
      if (!landed) asked.current.delete(key);
    });
  };

  return {
    rows,
    togglePreferred: (item) => flip(item, 'preferred'),
    toggleHidden: (item) => {
      if (item.source === 'platform_item') flip(item, 'hidden');
    },
    async savePrice(item, price) {
      try {
        await writePrice(repositories, item, price);
        await refresh();
        return 'saved';
      } catch (error) {
        return error instanceof ApiError && error.status === 422 ? 'refused' : 'failed';
      }
    },
    draftsNaming: async (item) => (await repositories.catalog.item(item.id)).openDraftCount,
    archive(item) {
      const undo = () =>
        void repositories.catalog
          .unarchive(item.id)
          .then(refresh)
          .catch(() => onNote({ kind: 'undo-failed', item }));
      void send(
        item,
        'archive',
        () => repositories.catalog.archive(item.id),
        () => onNote({ kind: 'archived', item, undo }),
      );
    },
    restore(item) {
      void send(
        item,
        'restore',
        () => repositories.catalog.unarchive(item.id),
        () => onNote({ kind: 'restored', item }),
      );
    },
  };
}

/** An own SKU's price is a dated entry; a platform item's lives on its override. */
async function writePrice(repositories: Repositories, item: Item, price: CatalogPrice) {
  if (item.source === 'own_item') {
    if (price.amount !== undefined) {
      await repositories.catalog.recordRate(item.id, { amount: price.amount });
    }
    return;
  }
  await repositories.catalog.saveOverride(item.id, {
    ...(typeof price.amount === 'string' ? { rate: { amount: price.amount } } : {}),
    ...(price.taxPct === undefined ? {} : { taxPct: price.taxPct }),
    ...(price.hidden === undefined ? {} : { hidden: price.hidden }),
    ...(price.preferred === undefined ? {} : { preferred: price.preferred }),
  });
  /* An override's rate is never null: a cleared price is a dated absence in its ledger. */
  if (price.amount === null && item.rate) {
    await repositories.catalog.recordRate(item.id, { amount: null });
  }
}

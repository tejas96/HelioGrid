'use client';
import { MAX_PAGE_LIMIT, type MoneyDue, type MoneyDueRow } from '@heliogrid/contracts';
import {
  type MoneyDueGroupView as GroupView,
  MONEY_DUE_GROUPS,
  type MoneyDueGroup,
  type Read,
  showsMoneyDue,
} from '@heliogrid/domain';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useShell } from './use-shell';
import { useTenantId } from './use-tenant-id';

/** How many rows a group shows before its *Show all*. */
export const MONEY_DUE_SHOWN = 4;

/** One group of Money due as it is drawn (`MoneyDueGroupView`), its rows the wire's. */
export type MoneyDueGroupView = GroupView<MoneyDueRow>;

export interface MoneyDueScreen {
  /** Whether this home holds Money due: Finance's, and the owner's (`showsMoneyDue`). */
  readonly shown: boolean;
  readonly read: Exclude<Read<MoneyDue>, { readonly kind: 'empty' }>;
  /** Late, due today and part paid, in that order; a group with nothing in it is left out. */
  readonly groups: readonly MoneyDueGroupView[];
  /** Opens one group to every row the page holds. */
  expand(group: MoneyDueGroup): void;
}

/**
 * Money due (`SCR-M11-01`, `M11-54`): every part due and unpaid that the reader may see, grouped
 * late, due today and part paid, each showing its first few until *Show all* — one read of the
 * largest page the api serves, and a group's own read where that page holds too few of it; past
 * the largest page a group's rest stay on the board. A home without it reads nothing.
 */
export function useMoneyDue(): MoneyDueScreen {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const shown = showsMoneyDue(useShell().home);
  const [open, setOpen] = useState<ReadonlySet<MoneyDueGroup>>(new Set());
  const due = useQuery({
    queryKey: queryKeys.projects.moneyDue(tenantId, MAX_PAGE_LIMIT),
    queryFn: ({ signal }) =>
      repositories.payments.moneyDue({ page: 1, limit: MAX_PAGE_LIMIT }, signal),
    enabled: shown && tenantId !== '',
  });
  const value = due.data;
  const pageRows = (group: MoneyDueGroup) =>
    value?.rows.items.filter((row) => row.group === group) ?? [];
  /*
   * A group the first page holds too few of — the late rows filled it, or the group is open past
   * what it holds — is read on its own, so every group the tiles count can be reached.
   */
  const short = (group: MoneyDueGroup) => {
    if (value === undefined) return false;
    const { count } = value.groups[group];
    const held = pageRows(group).length;
    return held < count && (open.has(group) || held < Math.min(MONEY_DUE_SHOWN, count));
  };
  const alone = useQueries({
    queries: MONEY_DUE_GROUPS.map((group) => ({
      queryKey: queryKeys.projects.moneyDue(tenantId, MAX_PAGE_LIMIT, group),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        repositories.payments.moneyDue({ page: 1, limit: MAX_PAGE_LIMIT, group }, signal),
      enabled: shown && tenantId !== '' && short(group),
    })),
  });
  return {
    shown,
    read: recordReadOf(due),
    groups:
      value === undefined
        ? []
        : MONEY_DUE_GROUPS.flatMap((group, at) => {
            const { count, amount } = value.groups[group];
            if (count === 0) return [];
            const rows = alone[at]?.data?.rows.items ?? pageRows(group);
            const all = open.has(group);
            const drawn = all ? rows : rows.slice(0, MONEY_DUE_SHOWN);
            return [{ group, count, amount, rows: drawn, hidden: all ? 0 : count - drawn.length }];
          }),
    expand: (group) => setOpen((was) => new Set(was).add(group)),
  };
}

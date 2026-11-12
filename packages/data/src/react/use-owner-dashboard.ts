'use client';
import type { OwnerDashboard } from '@heliogrid/contracts';
import {
  type NeedsYouKind,
  needsYouKindsOf,
  type Read,
  showsOwnerDashboard,
  type WinRate,
  winRateOf,
} from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useShell } from './use-shell';
import { useTenantId } from './use-tenant-id';

export interface OwnerDashboardScreen {
  /** Whether the home in force is the owner dashboard: the EPC Owner's and the Sales Manager's. */
  readonly shown: boolean;
  readonly read: Exclude<Read<OwnerDashboard>, { readonly kind: 'empty' }>;
  /** What needs the reader, in its fixed order, with nothing waiting left out (`M13-15`). */
  readonly needsYou: readonly NeedsYouKind[];
  /** Win rate on closed deals, or *too few* below the floor (`M13-27`, `M13-18`). */
  readonly winRate: WinRate | null;
  /** Sets this month's company target — `null` clears it (`M13-17`). */
  setTarget(amount: string | null): void;
  readonly targetSaving: boolean;
  readonly targetFailed: boolean;
}

/**
 * The owner dashboard (`SCR-M13-01`): one read scoped by role, what needs the reader first, then
 * cash, this month against the target, the pipeline and win/loss. Read-only, save the target set
 * inline (`M13-02`); a home without it reads nothing.
 */
export function useOwnerDashboard(): OwnerDashboardScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const shown = showsOwnerDashboard(useShell().home);
  const key = queryKeys.dashboards.owner(tenantId);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.dashboards.owner(signal),
    enabled: shown && tenantId !== '',
  });
  const target = useAction(
    (input: { readonly month: string; readonly amount: string | null }) =>
      repositories.dashboards.setTarget(input),
    { onDone: () => void queryClient.invalidateQueries({ queryKey: key }) },
  );
  const value = query.data;
  return {
    shown,
    read: recordReadOf(query),
    needsYou:
      value === undefined
        ? []
        : needsYouKindsOf({
            unassigned: value.needsYou.unassigned.count,
            paymentsLate: value.needsYou.paymentsLate.count,
            blockedOnUs: value.needsYou.blockedOnUs.count,
            waitingLongest: value.needsYou.waitingLongest.length,
            myOverdueTasks: value.needsYou.myOverdueTasks,
          }),
    winRate: value === undefined ? null : winRateOf(value.winLoss.won, value.winLoss.lost),
    setTarget: (amount) => {
      if (value === undefined || target.isOut()) return;
      void target.run({ month: value.month, amount });
    },
    targetSaving: target.pending,
    targetFailed: target.failure !== null,
  };
}

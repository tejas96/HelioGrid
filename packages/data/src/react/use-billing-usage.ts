'use client';
import type {
  BillingUsage,
  BillingUsageEvent,
  BillingUsageSignals,
  TenantOwners,
  UsageEventMeter,
} from '@heliogrid/contracts';
import { can, mapRead, type Read } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';
import { ownersRead } from './use-owners';
import { usePaginatedList } from './use-paginated-list';
import { useSession } from './use-session';

/** Events a page of the panel holds; `Show more` reads the next. */
const EVENTS_PAGE = 50;

/** The page's facts: the Owner's usage, or which meter is at its cap and whose screen this is. */
export type UsageFacts =
  | { readonly kind: 'owner'; readonly usage: BillingUsage }
  | {
      readonly kind: 'member';
      readonly signals: BillingUsageSignals;
      readonly owners: TenantOwners | null;
    };

/** Where the usage screen leads: the plan screen (`SCR-M12-03`), the one way to a bigger plan. */
export interface UsageScreenAdapter {
  readonly toPlans: () => void;
}

/**
 * The usage screen (`SCR-M12-04`) as both screens draw it, assembled once (Law 11): the page's
 * one read — the Owner's figures, or anyone else's signals and the owners' names — and one
 * meter's events panel at a time (`M12-36`).
 */
export interface UsageScreen {
  readonly owner: boolean;
  readonly read: Read<UsageFacts>;
  /** The meter whose events stand open, its rows and whether a next page waits. */
  readonly ledger: {
    readonly meter: UsageEventMeter;
    readonly read: Read<readonly BillingUsageEvent[]>;
    readonly more: boolean;
  } | null;
  openLedger(meter: UsageEventMeter): void;
  closeLedger(): void;
  moreEvents(): void;
  toPlans(): void;
}

export function useUsageScreen(adapter: UsageScreenAdapter): UsageScreen {
  const repositories = useRepositories();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const owner = can(user?.tenant?.roles ?? [], 'billing.view_usage_and_invoices');
  const usage = useQuery({
    queryKey: queryKeys.billing.usage(tenantId),
    queryFn: ({ signal }) => repositories.billingUsage.usage(signal),
    enabled: tenantId !== '' && owner,
  });
  const signals = useQuery({
    queryKey: queryKeys.billing.usageSignals(tenantId),
    queryFn: ({ signal }) => repositories.billingUsage.signals(signal),
    enabled: tenantId !== '' && !owner,
  });
  const owners = useQuery(ownersRead(repositories, tenantId, tenantId !== '' && !owner));
  const [meter, setMeter] = useState<UsageEventMeter | null>(null);
  const events = usePaginatedList({
    queryKey: queryKeys.billing.usageEvents(tenantId, meter ?? 'none'),
    fetchPage: (page) =>
      repositories.billingUsage.events({
        meter: meter ?? 'voice_minutes',
        page,
        limit: EVENTS_PAGE,
      }),
    enabled: tenantId !== '' && owner && meter !== null,
  });

  const read: Read<UsageFacts> = owner
    ? mapRead(presentOf(readOf(usage)), (value) => ({ kind: 'owner', usage: value }))
    : mapRead(presentOf(readOf(signals)), (value) => ({
        kind: 'member',
        signals: value,
        owners: owners.data ?? null,
      }));

  return {
    owner,
    read,
    ledger: meter === null ? null : { meter, read: events.read, more: events.hasNextPage },
    openLedger: setMeter,
    closeLedger: () => setMeter(null),
    moreEvents: () => {
      if (events.hasNextPage && !events.isFetchingNextPage) void events.fetchNextPage();
    },
    toPlans: adapter.toPlans,
  };
}

function presentOf<T>(read: Read<T | null>): Read<T> {
  if (read.kind !== 'ready') return read;
  return read.value === null ? { kind: 'empty' } : { kind: 'ready', value: read.value };
}

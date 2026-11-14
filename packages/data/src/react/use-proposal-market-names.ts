'use client';
import { subsidyPackOf, taxPackOf } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useTenantId } from './use-tenant-id';

/** A market read holds for the session: a pack revision reaches the app on its next start. */
const ASKED_ONCE = { staleTime: Number.POSITIVE_INFINITY } as const;

/** The market's own names a proposal's words carry (`F1-13`): never typed in a screen. */
export interface ProposalMarketNames {
  /** The tax scheme's name — `GST` — or `null` until the company's market pack is read. */
  readonly taxName: string | null;
  /** The incentive's name, or `null` where the market offers none or its pack is not read yet. */
  readonly incentiveScheme: string | null;
}

/**
 * The names a proposal's document, its share sheet and its notices take from the company's market
 * pack (`M06-34`): no market term is hard-coded, so a screen asks here.
 */
export function useProposalMarketNames(): ProposalMarketNames {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const company = useQuery({
    queryKey: queryKeys.shell.tenant(tenantId),
    queryFn: ({ signal }) => repositories.tenant.me(signal),
    enabled: tenantId !== '',
  });
  const marketCode = company.data?.marketCode;
  const pack = useQuery({
    queryKey: queryKeys.market.pack(marketCode ?? ''),
    queryFn: ({ signal }) => repositories.market.currentPack(marketCode ?? '', signal),
    enabled: marketCode !== undefined,
    ...ASKED_ONCE,
  });
  const tax = pack.data === undefined ? null : taxPackOf(pack.data.tax);
  const subsidy = pack.data === undefined ? null : subsidyPackOf(pack.data.subsidy);
  return {
    taxName: tax?.scheme ?? null,
    incentiveScheme: subsidy?.offered === true ? subsidy.scheme : null,
  };
}

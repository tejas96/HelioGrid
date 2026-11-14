'use client';
import { can } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useSession } from './use-session';

/** This cycle's proposal count against the plan, and when the count starts again (`M06-26`). */
export interface ProposalPlanLimit {
  readonly used: number;
  /** `null` where the plan sets no count — unlimited, or agreed by hand. */
  readonly limit: number | null;
  readonly resetsAt: string;
}

/**
 * What the Check sheet says when the plan's proposals are used (`T-M06-028`): the shipped usage
 * read, which only a reader with the billing right holds. Anyone else reads `null`, and the sheet
 * names who can change the plan without a count. Read only while `open`.
 */
export function useProposalPlanLimit(open: boolean): ProposalPlanLimit | null {
  const repositories = useRepositories();
  const { user } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const mayRead = can(user?.tenant?.roles ?? [], 'billing.view_usage_and_invoices');
  const usage = useQuery({
    queryKey: queryKeys.billing.usage(tenantId),
    queryFn: ({ signal }) => repositories.billingUsage.usage(signal),
    enabled: tenantId !== '' && mayRead && open,
  });
  const read = usage.data;
  if (read === undefined || read === null) return null;
  const { limit } = read.proposals;
  return {
    used: read.proposals.used,
    limit: typeof limit === 'number' ? limit : null,
    resetsAt: read.cycle.resetsAt,
  };
}

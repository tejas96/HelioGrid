import type { ActivityPage, PaginationQuery } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/**
 * The timeline (`M02-35`, `T-M02-012`), newest first by the server's apply order: one lead's
 * entries, or a customer's whole stream read through the merge tombstone.
 */
export interface ActivitiesRepository {
  leadTimeline(
    leadId: string,
    query: Partial<PaginationQuery>,
    signal?: AbortSignal,
  ): Promise<ActivityPage>;
  customerTimeline(
    customerId: string,
    query: Partial<PaginationQuery>,
    signal?: AbortSignal,
  ): Promise<ActivityPage>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createActivitiesRepository(api: ApiClient): ActivitiesRepository {
  return {
    leadTimeline: (leadId, query, signal) =>
      bodyAt(
        () =>
          api.activities.leadTimeline({ params: { id: leadId }, query, fetchOptions: { signal } }),
        200,
      ),
    customerTimeline: (customerId, query, signal) =>
      bodyAt(
        () =>
          api.activities.customerTimeline({
            params: { id: customerId },
            query,
            fetchOptions: { signal },
          }),
        200,
      ),
  };
}

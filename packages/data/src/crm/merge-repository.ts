import type { MergeCustomers, Merged, MergePreview } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/**
 * Customer merge (`M02-59`…`M02-63`): what a merge of two would ask and move — or why it cannot
 * run — and the merge itself, one transaction that cannot be undone.
 */
export interface CustomerMergeRepository {
  preview(survivorId: string, loserId: string, signal?: AbortSignal): Promise<MergePreview>;
  /**
   * Refused `MERGE_OUT_OF_SCOPE` or `CUSTOMER_ALREADY_MERGED` (409), or `MERGE_CHOICES_MISSING`
   * (422) while a differing field has no side.
   */
  merge(body: MergeCustomers): Promise<Merged>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createCustomerMergeRepository(api: ApiClient): CustomerMergeRepository {
  return {
    preview: (survivorId, loserId, signal) =>
      bodyAt(
        () =>
          api.customerMerge.preview({ query: { survivorId, loserId }, fetchOptions: { signal } }),
        200,
      ),
    merge: (body) => bodyAt(() => api.customerMerge.merge({ body }), 200),
  };
}

import type {
  Paginated,
  PaginationQuery,
  PriceBookActiveWire,
  PriceBookPublish,
  PriceBookVersionHeadWire,
  PriceBookVersionSummaryWire,
  PriceBookVersionWire,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/**
 * The price book (`M01-48`): immutable versions, exactly one in force. A new version is the whole
 * rate set again, never an edit of the one before.
 */
export interface PriceBookRepository {
  active(signal?: AbortSignal): Promise<PriceBookActiveWire>;
  versions(
    query: PaginationQuery,
    signal?: AbortSignal,
  ): Promise<Paginated<PriceBookVersionSummaryWire>>;
  version(id: string, signal?: AbortSignal): Promise<PriceBookVersionWire>;
  publish(body: PriceBookPublish): Promise<PriceBookVersionHeadWire>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createPriceBookRepository(api: ApiClient): PriceBookRepository {
  const publishKeys = createCreationKeys();
  return {
    active: (signal) => bodyAt(() => api.priceBook.active({ fetchOptions: { signal } }), 200),
    versions: (query, signal) =>
      bodyAt(() => api.priceBook.versions({ query, fetchOptions: { signal } }), 200),
    version: (id, signal) =>
      bodyAt(() => api.priceBook.version({ params: { id }, fetchOptions: { signal } }), 200),
    async publish(body) {
      const headers = publishKeys.headersFor(body);
      const head = await bodyAt(() => api.priceBook.publish({ body, headers }), 201);
      publishKeys.settle();
      return head;
    },
  };
}

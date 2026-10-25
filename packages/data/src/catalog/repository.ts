import type {
  CatalogItemWire,
  CatalogOverrideWrite,
  CatalogReleaseDetailWire,
  CatalogReleasePreviewWire,
  CatalogReleaseWire,
  OwnCatalogItemCreate,
  OwnCatalogItemWrite,
  Paginated,
  PaginationQuery,
  RateEntryWrite,
  ResolvedCatalogItemWire,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/** The list's query as it is sent — strings and comma lists, before the server parses them. */
export type CatalogItemsAsk = NonNullable<
  NonNullable<Parameters<ApiClient['catalog']['items']>[0]>['query']
>;

/**
 * The tenant's catalog (`M01-32` to `M01-43`): the resolved list, an item's acts and the labelled
 * releases. Money fields arrive absent for a reader the server hides them from.
 */
export interface CatalogRepository {
  items(query: CatalogItemsAsk, signal?: AbortSignal): Promise<Paginated<ResolvedCatalogItemWire>>;
  item(id: string, signal?: AbortSignal): Promise<CatalogItemWire>;
  /**
   * An own SKU from one form (`M01-36`). One key per body: a retried send makes one item, and a
   * changed body is a new create.
   */
  createItem(body: OwnCatalogItemCreate): Promise<CatalogItemWire>;
  /** Replaces an own SKU whole: send what was read, changed where the person answered. */
  saveItem(id: string, body: OwnCatalogItemWrite): Promise<CatalogItemWire>;
  archive(id: string): Promise<CatalogItemWire>;
  unarchive(id: string): Promise<CatalogItemWire>;
  /** The sparse override on a platform item; a rate in it appends a dated entry. */
  saveOverride(id: string, body: CatalogOverrideWrite): Promise<CatalogItemWire>;
  clearOverride(id: string): Promise<CatalogItemWire>;
  /** A dated rate on an own SKU or a platform item's override — never an edit. */
  recordRate(id: string, body: RateEntryWrite): Promise<CatalogItemWire>;
  releases(query: PaginationQuery, signal?: AbortSignal): Promise<Paginated<CatalogReleaseWire>>;
  release(
    id: string,
    query: PaginationQuery,
    signal?: AbortSignal,
  ): Promise<CatalogReleaseDetailWire>;
  /** What a publish now would carry; reads only. */
  preview(query: PaginationQuery, signal?: AbortSignal): Promise<CatalogReleasePreviewWire>;
  /** Refused `CATALOG_LABEL_TAKEN` (409) or `CATALOG_NOTHING_CHANGED` (422). */
  publish(label: string): Promise<CatalogReleaseWire>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createCatalogRepository(api: ApiClient): CatalogRepository {
  const itemKeys = createCreationKeys();
  const overrideKeys = createCreationKeys();
  const rateKeys = createCreationKeys();
  const releaseKeys = createCreationKeys();
  return {
    items: (query, signal) =>
      bodyAt(() => api.catalog.items({ query, fetchOptions: { signal } }), 200),
    item: (id, signal) =>
      bodyAt(() => api.catalog.item({ params: { id }, fetchOptions: { signal } }), 200),
    async createItem(body) {
      const headers = itemKeys.headersFor(body);
      const created = await bodyAt(() => api.catalog.createItem({ body, headers }), 201);
      itemKeys.settle();
      return created;
    },
    saveItem: (id, body) => bodyAt(() => api.catalog.saveItem({ params: { id }, body }), 200),
    archive: (id) => bodyAt(() => api.catalog.archiveItem({ params: { id } }), 200),
    unarchive: (id) => bodyAt(() => api.catalog.unarchiveItem({ params: { id } }), 200),
    async saveOverride(id, body) {
      const headers = overrideKeys.headersFor({ id, body });
      const saved = await bodyAt(
        () => api.catalog.saveOverride({ params: { id }, body, headers }),
        200,
      );
      overrideKeys.settle();
      return saved;
    },
    clearOverride: (id) => bodyAt(() => api.catalog.clearOverride({ params: { id } }), 200),
    async recordRate(id, body) {
      const headers = rateKeys.headersFor({ id, body });
      const saved = await bodyAt(
        () => api.catalog.recordRate({ params: { id }, body, headers }),
        201,
      );
      rateKeys.settle();
      return saved;
    },
    releases: (query, signal) =>
      bodyAt(() => api.catalogReleases.releases({ query, fetchOptions: { signal } }), 200),
    release: (id, query, signal) =>
      bodyAt(
        () => api.catalogReleases.release({ params: { id }, query, fetchOptions: { signal } }),
        200,
      ),
    preview: (query, signal) =>
      bodyAt(() => api.catalogReleases.preview({ query, fetchOptions: { signal } }), 200),
    async publish(label) {
      const body = { label };
      const headers = releaseKeys.headersFor(body);
      const published = await bodyAt(() => api.catalogReleases.publish({ body, headers }), 201);
      releaseKeys.settle();
      return published;
    },
  };
}

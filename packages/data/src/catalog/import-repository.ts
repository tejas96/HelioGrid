import type {
  CatalogImportFixedWire,
  CatalogImportMappingWrite,
  CatalogImportRowFixWrite,
  CatalogImportRowWire,
  CatalogImportStart,
  CatalogImportSummaryWire,
  CatalogImportWire,
  Paginated,
  PaginationQuery,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/** The rows read as it is sent — strings and comma lists, before the server parses them. */
export type CatalogImportRowsAsk = NonNullable<
  Parameters<ApiClient['catalogImport']['rows']>[0]
>['query'];

/**
 * A company's spreadsheet imports (`M01-41`, `T-M01-030`): start one from a stored file, read it
 * while the server reads, matches and runs it, confirm its mapping, page and fix its rows, run it.
 */
export interface CatalogImportRepository {
  /** One key per file and entry: the same start sent again resumes the job the first made. */
  start(body: CatalogImportStart): Promise<CatalogImportWire>;
  imports(
    query: PaginationQuery,
    signal?: AbortSignal,
  ): Promise<Paginated<CatalogImportSummaryWire>>;
  job(id: string, signal?: AbortSignal): Promise<CatalogImportWire>;
  map(id: string, body: CatalogImportMappingWrite): Promise<CatalogImportWire>;
  rows(
    id: string,
    query: CatalogImportRowsAsk,
    signal?: AbortSignal,
  ): Promise<Paginated<CatalogImportRowWire>>;
  fix(
    id: string,
    rowNumber: number,
    body: CatalogImportRowFixWrite,
  ): Promise<CatalogImportFixedWire>;
  /** A job already running answers as it stands: the run starts once. */
  run(id: string): Promise<CatalogImportWire>;
}

export function createCatalogImportRepository(api: ApiClient): CatalogImportRepository {
  const startKeys = createCreationKeys();
  return {
    async start(body) {
      const headers = startKeys.headersFor(body);
      const job = await bodyAt(() => api.catalogImport.start({ body, headers }), 201);
      startKeys.settle();
      return job;
    },
    imports: (query, signal) =>
      bodyAt(() => api.catalogImport.imports({ query, fetchOptions: { signal } }), 200),
    job: (id, signal) =>
      bodyAt(() => api.catalogImport.import({ params: { id }, fetchOptions: { signal } }), 200),
    map: (id, body) => bodyAt(() => api.catalogImport.map({ params: { id }, body }), 200),
    rows: (id, query, signal) =>
      bodyAt(
        () => api.catalogImport.rows({ params: { id }, query, fetchOptions: { signal } }),
        200,
      ),
    fix: (id, rowNumber, body) =>
      bodyAt(() => api.catalogImport.fix({ params: { id, rowNumber }, body }), 200),
    run: (id) => bodyAt(() => api.catalogImport.run({ params: { id } }), 200),
  };
}

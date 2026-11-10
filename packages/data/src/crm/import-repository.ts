import type {
  LeadImport,
  LeadImportMappingWrite,
  LeadImportRowWire,
  LeadImportRun,
  LeadImportStart,
  Paginated,
} from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { createCreationKeys } from '../client/creation-key';
import { bodyAt } from '../errors/errors';

/** The rows read as it is sent — a page, narrowed to one verdict or one result when asked. */
export type LeadImportRowsAsk = NonNullable<
  NonNullable<Parameters<ApiClient['leadImport']['rows']>[0]>['query']
>;

/**
 * The lead import (`M02-18`…`M02-21`, `SCR-M02-05`): start one from a stored spreadsheet, read the
 * job while the server reads and previews it, confirm its columns, page its rows, run it.
 */
export interface LeadImportRepository {
  /** One key per body: the same start sent again answers the job the first made. */
  start(body: LeadImportStart): Promise<LeadImport>;
  job(id: string, signal?: AbortSignal): Promise<LeadImport>;
  /** A job not where the act can happen is refused `CONFLICT` (409). */
  map(id: string, body: LeadImportMappingWrite): Promise<LeadImport>;
  rows(
    id: string,
    query: LeadImportRowsAsk,
    signal?: AbortSignal,
  ): Promise<Paginated<LeadImportRowWire>>;
  /** Landed rows are never rolled back; a job already run is refused `CONFLICT` (409). */
  run(id: string, body: LeadImportRun): Promise<LeadImport>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createLeadImportRepository(api: ApiClient): LeadImportRepository {
  const startKeys = createCreationKeys();
  return {
    async start(body) {
      const headers = startKeys.headersFor(body);
      const job = await bodyAt(() => api.leadImport.start({ body, headers }), 201);
      startKeys.settle();
      return job;
    },
    job: (id, signal) =>
      bodyAt(() => api.leadImport.import({ params: { id }, fetchOptions: { signal } }), 200),
    map: (id, body) => bodyAt(() => api.leadImport.map({ params: { id }, body }), 200),
    rows: (id, query, signal) =>
      bodyAt(() => api.leadImport.rows({ params: { id }, query, fetchOptions: { signal } }), 200),
    run: (id, body) => bodyAt(() => api.leadImport.run({ params: { id }, body }), 200),
  };
}

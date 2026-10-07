import type { RoleSet } from '@heliogrid/contracts';
import { type TenantPool, tenantCatalogItem } from '@heliogrid/db';
import type { CatalogImportField } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import type { Act } from '../../src/common/auth/session-context';
import { OutboxAdminRepository } from '../../src/common/temporal/outbox.admin.repository';
import { OutboxDispatcher } from '../../src/common/temporal/outbox.dispatcher';
import { CatalogImportRepository } from '../../src/modules/catalog/catalog.import.repository';
import { CatalogImportRunRepository } from '../../src/modules/catalog/catalog.import-run.repository';
import { CatalogImportRunService } from '../../src/modules/catalog/catalog.import-run.service';
import type { fileServiceOf } from '../files/support';
import type { openPools } from '../support/fixture';
import { aRecordingTemporal } from '../support/temporal';
import {
  anImportStart,
  aStoredPriceList,
  catalogServiceOf,
  importPreviewServiceOf,
  importServiceOf,
} from './support';

/*
 * A panel price list matched into a preview — the state a preview read and a row fix start from
 * (`T-M01-030d`, `T-M01-030e`). Its lines begin on sheet row 3, below a title row and the header.
 */
/** The three fields every mapping places: what names a product and what it costs. */
export const PRICE_COLUMNS: readonly CatalogImportField[] = ['brand', 'model', 'rate'];
/** The panel envelope's required fields, in the order a panel price list gives them. */
export const PANEL_ENVELOPE_COLUMNS: readonly CatalogImportField[] = [
  'kind',
  'watt',
  'technology',
  'lengthMm',
  'widthMm',
  'vocV',
  'vmpV',
  'iscA',
  'impA',
  'tempCoeffVocPct',
];
/** A panel price list's columns: brand, model and rate, then the panel envelope. */
export const PANEL_COLUMNS = [...PRICE_COLUMNS, ...PANEL_ENVELOPE_COLUMNS];
const PANEL_HEADER =
  'Brand,Model,Rate,Kind,Watt,Technology,Length,Width,Voc,Vmp,Isc,Imp,Temp Coeff Voc';
/** A new panel's cells after its brand, model and rate: `aPanelSpec`'s envelope. */
export const A_NEW_PANEL = 'panel,550,topcon,2278,1134,49.6,41.8,14,13.2,-0.25';

/**
 * A panel price list stored, read, mapped by `PANEL_COLUMNS` below its title row, and matched, as
 * the step host runs each step; its job id.
 */
export async function aPreviewOf(
  pools: ReturnType<typeof openPools>,
  files: ReturnType<typeof fileServiceOf>,
  tenantId: string,
  roles: RoleSet,
  act: () => Act,
  lines: readonly string[],
): Promise<string> {
  const imports = importServiceOf(pools, files, aRecordingTemporal());
  const csv = new TextEncoder().encode(['Supplier list', PANEL_HEADER, ...lines].join('\n'));
  const fileId = await aStoredPriceList(files, tenantId, act(), undefined, csv);
  const job = await imports.start(tenantId, roles, anImportStart(fileId), {}, act());
  const step = { tenantId, jobId: job.id };
  await imports.readFile(step, Date.now());
  const mapping = { sheet: 0, headerRow: 1, columns: [...PANEL_COLUMNS] };
  await imports.map(tenantId, roles, job.id, mapping, Date.now());
  const matched = await importPreviewServiceOf(pools, files).matchRows(step, Date.now());
  if (matched.status !== 'previewed') throw new Error(`the pass left ${matched.status}`);
  return job.id;
}

/**
 * The import's run as `catalog.module.ts` composes it, over the real repositories and the real
 * dispatcher on a Temporal client that only records; `tenants` stands in for the run's own pool.
 */
export function importRunServiceOf(
  pools: ReturnType<typeof openPools>,
  files: ReturnType<typeof fileServiceOf>,
  temporal: ReturnType<typeof aRecordingTemporal>,
  tenants: TenantPool = pools.tenants,
): CatalogImportRunService {
  const silent = new PinoLogger({ pinoHttp: { level: 'silent' } });
  return new CatalogImportRunService(
    new CatalogImportRepository(pools.tenants),
    new CatalogImportRunRepository(tenants),
    importServiceOf(pools, files, temporal),
    catalogServiceOf(pools),
    new OutboxDispatcher(temporal.gateway, new OutboxAdminRepository(pools.admin.db), silent),
  );
}

/** The run step called as the workflow calls it, batch after batch, until the job leaves `running`. */
export async function runEveryBatch(
  runs: CatalogImportRunService,
  step: { readonly tenantId: string; readonly jobId: string },
): Promise<string> {
  for (;;) {
    const applied = await runs.applyRows(step, Date.now());
    if (applied.status !== 'running') return applied.status;
  }
}

/** A company's own SKUs under one brand, read on the admin path — what a run made, or did not. */
export function ownSkusNamed(pools: ReturnType<typeof openPools>, tenantId: string, brand: string) {
  return pools.admin.db
    .select()
    .from(tenantCatalogItem)
    .where(and(eq(tenantCatalogItem.tenantId, tenantId), eq(tenantCatalogItem.brand, brand)));
}

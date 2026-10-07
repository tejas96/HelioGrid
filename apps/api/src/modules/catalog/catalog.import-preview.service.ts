import type {
  CatalogImportRowsQuery,
  CatalogImportRowWire,
  Paginated,
  RoleSet,
} from '@heliogrid/contracts';
import type {
  CatalogImportStepInput,
  CatalogImportStepResult,
} from '@heliogrid/contracts/workflows';
import {
  type CatalogImportMappedRow,
  type CatalogImportRowMatch,
  catalogSpecSchema,
  hasImportPreview,
  type ImportCatalog,
  type ImportCurrency,
  importProductNames,
  mappedRows,
} from '@heliogrid/domain';
import { matchImportRows, readImportPrice } from '@heliogrid/domain/server';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { FileService } from '../file/file.public';
import { CatalogImportRepository } from './catalog.import.repository';
import {
  CatalogImportRowsRepository,
  type JudgedRow,
  type PreviewRow,
} from './catalog.import-rows.repository';
import { CatalogService } from './catalog.service';
import { CatalogSliceRepository, type NamedItem } from './catalog.slice.repository';
import { importJobOf, PRICE_LIST } from './internal/import-job';
import { readSheetRows } from './internal/spreadsheet';
import { storedRateWire } from './internal/wire';
import { admitWrite } from './internal/write-checks';

/**
 * The import's preview (`T-M01-030d`, `M01-41`): the matching pass that turns a mapped sheet into
 * judged rows, run as a workflow step, and the grid's page of them. Every read is the manage grant
 * held outright, as every import route is (`T-M01-030c` decision 9).
 */
@Injectable()
export class CatalogImportPreviewService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogImportRepository) private readonly jobs: CatalogImportRepository,
    @Inject(CatalogImportRowsRepository) private readonly rows: CatalogImportRowsRepository,
    @Inject(FileService) private readonly files: FileService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(CatalogSliceRepository) private readonly slice: CatalogSliceRepository,
  ) {}

  /**
   * The match step: the mapped sheet read whole from the stored file, every filled row matched
   * against the items it names, the verdicts stored — unless a newer mapping has superseded the one
   * read here, when nothing is written. A store or database outage throws, and Temporal retries.
   */
  async matchRows(
    { tenantId, jobId }: CatalogImportStepInput,
    now: number,
  ): Promise<CatalogImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    if (job.status !== 'matching' || job.mapping === null) return { status: job.status };
    const { contentType, bytes } = await this.files.readStored(tenantId, job.fileId, PRICE_LIST);
    const sheet = await readSheetRows(bytes, contentType, job.mapping.sheet);
    // The read step opened this file and counted this sheet, so this is never the person's to fix.
    if (!sheet.readable) throw stepCannotSucceed(`import ${jobId}'s mapped sheet no longer reads`);
    const rows = mappedRows(sheet.rows, job.mapping);
    const scope = await this.catalog.scopeOf(tenantId, now);
    const named = await this.slice.named(tenantId, scope.marketCode, importProductNames(rows));
    const verdicts = matchImportRows(
      rows.map((row) => ({ cells: row.cells, leftOut: false, answer: null })),
      catalogOf(named, scope.formats),
    );
    const judged = rows.map((row, index) => judgedRow(row, verdicts[index]));
    const status = await this.rows.replace(tenantId, jobId, job.mappingRevision, judged, now);
    if (status === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    return { status };
  }

  /** A pass that failed past every retry: the job goes back to `mapped` for the confirm again. */
  async endMatch(
    { tenantId, jobId }: CatalogImportStepInput,
    now: number,
  ): Promise<CatalogImportStepResult> {
    const status = await this.jobs.endMatch(tenantId, jobId, now);
    if (status === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    return { status };
  }

  /** A page of the preview grid: the file's price beside the price the catalog holds today. */
  async page(
    tenantId: string,
    roles: RoleSet,
    id: string,
    query: CatalogImportRowsQuery,
    now: number,
  ): Promise<Paginated<CatalogImportRowWire>> {
    admitWrite(roles);
    const job = await importJobOf(this.jobs, tenantId, id);
    if (!hasImportPreview(job.status)) {
      throw new ConflictException('The matching pass has not previewed this import’s rows.');
    }
    const scope = await this.catalog.scopeOf(tenantId, now);
    const { rows, totalCount } = await this.rows.page(tenantId, id, {
      outcome: query.outcome,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      pricedOn: scope.resolve.pricedOn,
    });
    return { items: rows.map((row) => rowWire(row, scope.formats)), totalCount };
  }
}

function catalogOf(named: readonly NamedItem[], currency: ImportCurrency): ImportCatalog {
  const entryOf = (row: NamedItem) => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    spec: catalogSpecSchema.parse(row.spec),
  });
  return {
    platformItems: named.filter((row) => row.source === 'platform_item').map(entryOf),
    ownItems: named.filter((row) => row.source === 'own_item').map(entryOf),
    currency,
  };
}

function judgedRow(
  row: CatalogImportMappedRow,
  verdict: CatalogImportRowMatch | undefined,
): JudgedRow {
  if (verdict === undefined) throw new Error(`row ${row.rowNumber} has no verdict`);
  return {
    rowNumber: row.rowNumber,
    cells: row.cells,
    outcome: verdict.outcome,
    attention: verdict.outcome === 'needs_attention' ? verdict.attention : [],
    catalogItemId: verdict.outcome === 'price_override' ? verdict.platformItemId : null,
    tenantCatalogItemId: verdict.outcome === 'own_item_price' ? verdict.ownItemId : null,
  };
}

function rowWire(row: PreviewRow, currency: ImportCurrency): CatalogImportRowWire {
  const filePrice = readImportPrice({ ...row.cells, ...row.fix }.rate, currency);
  const match =
    row.catalogItemId !== null
      ? { source: 'platform_item' as const, id: row.catalogItemId }
      : row.tenantCatalogItemId !== null
        ? { source: 'own_item' as const, id: row.tenantCatalogItemId }
        : null;
  return {
    rowNumber: row.rowNumber,
    cells: { ...row.cells },
    fix: { ...row.fix },
    leftOut: row.leftOut,
    answer: row.answer,
    outcome: row.outcome,
    attention: row.attention.map((item) => ({ reason: item.reason, fields: [...item.fields] })),
    match,
    filePrice: filePrice.ok ? filePrice.amount : null,
    catalogPrice: row.rate === null ? null : storedRateWire(row.rate, currency.minorUnitDigits),
  };
}

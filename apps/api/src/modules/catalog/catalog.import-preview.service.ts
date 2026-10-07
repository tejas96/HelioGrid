import type {
  CatalogImportFixedWire,
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
  type CatalogImportRowFix,
  type CatalogImportRowMatch,
  catalogSpecSchema,
  countImportMatches,
  effectiveImportCells,
  fixedImportRow,
  hasImportPreview,
  type ImportCatalog,
  type ImportCurrency,
  type ImportProductName,
  importFixProblem,
  importProductNames,
  mappedRows,
  namesOneOf,
} from '@heliogrid/domain';
import { matchImportRows, readImportPrice } from '@heliogrid/domain/server';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContractException } from '../../common/errors/contract-exception';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { FileService } from '../file/file.public';
import { CatalogImportRepository } from './catalog.import.repository';
import { CatalogImportFixRepository } from './catalog.import-fix.repository';
import {
  CatalogImportRowsRepository,
  type JudgedRow,
  type PreviewRow,
  type StoredRow,
} from './catalog.import-rows.repository';
import { CatalogService } from './catalog.service';
import { CatalogSliceRepository, type NamedItem } from './catalog.slice.repository';
import { importJobOf, importNotFound, PRICE_LIST } from './internal/import-job';
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
    @Inject(CatalogImportFixRepository) private readonly fixes: CatalogImportFixRepository,
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

  /**
   * One fix to one row (`T-M01-030e`), under the job's lock: the row's next state, then every row
   * naming its product before or after the fix judged again. A row's verdict depends only on rows
   * and items of its own product, so these are the verdicts a whole new pass would give.
   */
  async fix(
    tenantId: string,
    roles: RoleSet,
    id: string,
    rowNumber: number,
    fix: CatalogImportRowFix,
    now: number,
  ): Promise<CatalogImportFixedWire> {
    admitWrite(roles);
    const scope = await this.catalog.scopeOf(tenantId, now);
    const fixed = await this.fixes.inLockedJob(tenantId, id, async (job) => {
      if (job.status !== 'previewed') {
        throw new ConflictException(`An import that is ${job.status} takes no fix.`);
      }
      const row = await job.row(rowNumber);
      if (row === null) throw new NotFoundException('That row is not in this import.');
      const problem = importFixProblem(row, fix);
      if (problem !== null) {
        throw new ContractException(
          'DOMAIN_RULE_VIOLATION',
          'That row asks no question to answer.',
          HttpStatus.UNPROCESSABLE_ENTITY,
          [{ path: 'answer', issue: problem }],
        );
      }
      const next: StoredRow = { ...row, ...fixedImportRow(row, fix) };
      const names = importProductNames([row, next].map(namingCells));
      const group = productGroup(await job.naming(names), next, names);
      const named = await job.named(scope.marketCode, names);
      const verdicts = matchImportRows(group.map(matchInput), catalogOf(named, scope.formats));
      const moved = group.flatMap((member, index) => {
        const judged = { ...member, ...verdictOf(member, verdicts[index]) };
        return member.rowNumber === rowNumber || verdictMoved(member, judged) ? [judged] : [];
      });
      await job.write(moved, now);
      const rows = await job.rows(
        moved.map((member) => member.rowNumber),
        scope.resolve.pricedOn,
      );
      return { rows, counts: await job.counts() };
    });
    if (fixed === null) throw importNotFound();
    return {
      rows: fixed.rows.map((row) => rowWire(row, scope.formats)),
      counts: countImportMatches(fixed.counts),
    };
  }
}

const namingCells = (row: StoredRow) => ({ cells: effectiveImportCells(row) });

const matchInput = (row: StoredRow) => ({
  cells: effectiveImportCells(row),
  leftOut: row.leftOut,
  answer: row.answer,
});

/**
 * The rows naming one of these products, in sheet order, with the fixed row as it now stands —
 * kept by the pass's own identity, since the database only narrowed to rows containing the names.
 */
function productGroup(
  candidates: readonly StoredRow[],
  fixed: StoredRow,
  names: readonly ImportProductName[],
): StoredRow[] {
  const naming = candidates.filter(
    (row) => row.rowNumber !== fixed.rowNumber && namesOneOf(effectiveImportCells(row), names),
  );
  return [...naming, fixed].sort((one, other) => one.rowNumber - other.rowNumber);
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

type Verdict = Pick<JudgedRow, 'outcome' | 'attention' | 'catalogItemId' | 'tenantCatalogItemId'>;

function verdictOf(
  row: { readonly rowNumber: number },
  match: CatalogImportRowMatch | undefined,
): Verdict {
  if (match === undefined) throw new Error(`row ${row.rowNumber} has no verdict`);
  return {
    outcome: match.outcome,
    attention: match.outcome === 'needs_attention' ? match.attention : [],
    catalogItemId: match.outcome === 'price_override' ? match.platformItemId : null,
    tenantCatalogItemId: match.outcome === 'own_item_price' ? match.ownItemId : null,
  };
}

function judgedRow(
  row: CatalogImportMappedRow,
  match: CatalogImportRowMatch | undefined,
): JudgedRow {
  return { rowNumber: row.rowNumber, cells: row.cells, ...verdictOf(row, match) };
}

function verdictMoved(before: Verdict, after: Verdict): boolean {
  return (
    before.outcome !== after.outcome ||
    before.catalogItemId !== after.catalogItemId ||
    before.tenantCatalogItemId !== after.tenantCatalogItemId ||
    !sameAttention(before.attention, after.attention)
  );
}

/**
 * Compared field by field, never as JSON text: a stored attention comes back from `jsonb` with its
 * keys reordered, so equal attention would read as changed.
 */
function sameAttention(one: Verdict['attention'], other: Verdict['attention']): boolean {
  return (
    one.length === other.length &&
    one.every((item, index) => {
      const twin = other[index];
      return (
        twin !== undefined &&
        item.reason === twin.reason &&
        item.fields.length === twin.fields.length &&
        item.fields.every((field, at) => field === twin.fields[at])
      );
    })
  );
}

function rowWire(row: PreviewRow, currency: ImportCurrency): CatalogImportRowWire {
  const filePrice = readImportPrice(effectiveImportCells(row).rate, currency);
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

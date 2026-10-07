import {
  type CatalogImportMappingWrite,
  type CatalogImportSheetWire,
  type CatalogImportStart,
  type CatalogImportSummaryWire,
  type CatalogImportWire,
  type CreateHeaders,
  catalogImportContract,
  type Paginated,
  type PaginationQuery,
  type RoleSet,
} from '@heliogrid/contracts';
import type {
  CatalogImportStepInput,
  CatalogImportStepResult,
} from '@heliogrid/contracts/workflows';
import {
  type CatalogImportMapping,
  type CatalogImportMappingProblem,
  type CatalogImportSheet,
  countImportMatches,
  hasImportPreview,
  importMappingProblem,
  sameImportMapping,
  takesImportMapping,
} from '@heliogrid/domain';
import { ConflictException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { FileService } from '../file/file.public';
import {
  CatalogImportRepository,
  type ImportJobRow,
  type ImportJobSummary,
} from './catalog.import.repository';
import { CatalogImportRowsRepository } from './catalog.import-rows.repository';
import { importJobOf, PRICE_LIST } from './internal/import-job';
import { readSpreadsheet } from './internal/spreadsheet';
import { admitWrite } from './internal/write-checks';

/**
 * The spreadsheet import (`M01-41`): a stored price list becomes a job, handed to the
 * `catalogImport` workflow in the same transaction, and read by its step in the background. Every
 * route is the manage grant held outright — an import writes prices, so Finance is refused even a
 * read of one (`T-M01-030c` decision 9).
 */
@Injectable()
export class CatalogImportService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogImportRepository) private readonly jobs: CatalogImportRepository,
    @Inject(CatalogImportRowsRepository) private readonly rows: CatalogImportRowsRepository,
    @Inject(FileService) private readonly files: FileService,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async start(
    tenantId: string,
    roles: RoleSet,
    body: CatalogImportStart,
    headers: CreateHeaders,
    act: Act,
  ): Promise<CatalogImportWire> {
    admitWrite(roles);
    await this.files.confirmed(tenantId, body.fileId, PRICE_LIST);
    const route = catalogImportContract.start;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const started = this.replies.rowOf(
      await this.jobs.start(
        tenantId,
        { ...body, savedAt: body.savedAt === null ? null : new Date(body.savedAt) },
        act,
        key,
      ),
      route,
      tenantId,
    );
    // After the commit, never inside it: the sweep starts the workflow if this start is lost.
    if (started.eventId !== null) await this.dispatcher.dispatchNow(started.eventId);
    return this.import(tenantId, roles, started.jobId);
  }

  async imports(
    tenantId: string,
    roles: RoleSet,
    page: PaginationQuery,
  ): Promise<Paginated<CatalogImportSummaryWire>> {
    admitWrite(roles);
    const { rows, totalCount } = await this.jobs.page(tenantId, {
      limit: page.limit,
      offset: (page.page - 1) * page.limit,
    });
    return { items: rows.map(summaryWire), totalCount };
  }

  async import(tenantId: string, roles: RoleSet, id: string): Promise<CatalogImportWire> {
    admitWrite(roles);
    const job = await importJobOf(this.jobs, tenantId, id);
    const file = await this.files.confirmed(tenantId, job.fileId, PRICE_LIST);
    return {
      ...summaryWire(job),
      unreadableReason: job.unreadableReason,
      file: { id: file.id, contentType: file.contentType, byteSize: file.byteSize },
      sheets: job.sheets?.map(sheetWire) ?? null,
      mapping: job.mapping === null ? null : { ...job.mapping, columns: [...job.mapping.columns] },
      counts: hasImportPreview(job.status)
        ? countImportMatches(await this.rows.countsByOutcome(tenantId, id))
        : null,
    };
  }

  /**
   * Confirms step 2's mapping and hands the matching pass to the workflow (`T-M01-030d`). A mapping
   * sent while a pass runs supersedes it; the same mapping sent again answers the job as it stands.
   */
  async map(
    tenantId: string,
    roles: RoleSet,
    id: string,
    mapping: CatalogImportMappingWrite,
    now: number,
  ): Promise<CatalogImportWire> {
    admitWrite(roles);
    const job = await importJobOf(this.jobs, tenantId, id);
    if (!takesImportMapping(job.status)) {
      throw new ConflictException(`An import that is ${job.status} takes no mapping.`);
    }
    const problem = importMappingProblem(mapping, job.sheets ?? []);
    if (problem !== null) {
      throw new ContractException(
        'DOMAIN_RULE_VIOLATION',
        'That mapping does not fit the sheets this file holds.',
        HttpStatus.UNPROCESSABLE_ENTITY,
        [{ path: MAPPING_FIELD_OF[problem], issue: problem }],
      );
    }
    if (job.status === 'mapped' || !sameImportMapping(job.mapping, mapping)) {
      const confirmed = await this.jobs.confirmMapping(
        tenantId,
        id,
        mapping,
        job.mappingRevision,
        now,
      );
      if (confirmed === null) throw new ConflictException('The import moved on; read it again.');
      // After the commit, never inside it: the sweep starts the workflow if this start is lost.
      await this.dispatcher.dispatchNow(confirmed.eventId);
    }
    return this.import(tenantId, roles, id);
  }

  /**
   * The read step: the stored file opened and what it holds recorded. A job already past `reading`
   * is answered as it stands, so a retried step changes nothing. A store or database outage throws,
   * and Temporal retries the step.
   */
  async readFile(
    { tenantId, jobId }: CatalogImportStepInput,
    now: number,
  ): Promise<CatalogImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null)
      throw stepCannotSucceed(`import ${jobId} is not in the company its step names`);
    if (job.status !== 'reading') return { status: job.status };
    const { contentType, bytes } = await this.files.readStored(tenantId, job.fileId, PRICE_LIST);
    const read = await readSpreadsheet(bytes, contentType);
    const outcome = read.readable ? { sheets: read.sheets } : { unreadable: read.reason };
    return this.recorded(
      tenantId,
      jobId,
      await this.jobs.recordRead(tenantId, jobId, outcome, now),
    );
  }

  /** A read that failed past every retry: the person is told to choose the file again. */
  async endRead(
    { tenantId, jobId }: CatalogImportStepInput,
    now: number,
  ): Promise<CatalogImportStepResult> {
    const status = await this.jobs.recordRead(tenantId, jobId, { unreadable: 'not_read' }, now);
    return this.recorded(tenantId, jobId, status);
  }

  private recorded(
    tenantId: string,
    jobId: string,
    status: ImportJobRow['status'] | null,
  ): CatalogImportStepResult {
    if (status === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    return { status };
  }
}

function sheetWire(sheet: CatalogImportSheet): CatalogImportSheetWire {
  return { ...sheet, topRows: sheet.topRows.map((row) => [...row]) };
}

function summaryWire(job: ImportJobSummary): CatalogImportSummaryWire {
  return {
    id: job.id,
    status: job.status,
    entryPoint: job.entryPoint,
    fileName: job.fileName,
    savedAt: job.savedAt?.toISOString() ?? null,
    startedBy: job.startedBy,
    createdAt: job.createdAt.toISOString(),
  };
}

/** The body field each misfit is about, so the wizard marks the control that caused it. */
const MAPPING_FIELD_OF: Readonly<Record<CatalogImportMappingProblem, keyof CatalogImportMapping>> =
  {
    sheet_missing: 'sheet',
    header_row_outside_top_rows: 'headerRow',
    more_columns_than_sheet: 'columns',
    required_field_unplaced: 'columns',
    field_placed_twice: 'columns',
  };

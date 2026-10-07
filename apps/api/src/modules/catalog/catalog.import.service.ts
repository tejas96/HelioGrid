import {
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
import type { CatalogImportSheet } from '@heliogrid/domain';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { FileService } from '../file/file.public';
import {
  CatalogImportRepository,
  type ImportJobRow,
  type ImportJobSummary,
} from './catalog.import.repository';
import { readSpreadsheet } from './internal/spreadsheet';
import { admitWrite } from './internal/write-checks';

/** The price lists an import reads are stored against the company's catalog (`T-M01-030` part a). */
const PRICE_LIST = 'catalog';

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
    const job = await this.jobs.find(tenantId, id);
    if (job === null) throw new NotFoundException('That import is not in this company’s catalog.');
    const file = await this.files.confirmed(tenantId, job.fileId, PRICE_LIST);
    return {
      ...summaryWire(job),
      unreadableReason: job.unreadableReason,
      file: { id: file.id, contentType: file.contentType, byteSize: file.byteSize },
      sheets: job.sheets?.map(sheetWire) ?? null,
    };
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

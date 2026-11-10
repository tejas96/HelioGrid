import type { LeadImportRowsQuery, LeadImportRowWire, Paginated } from '@heliogrid/contracts';
import type { LeadImportStepInput, LeadImportStepResult } from '@heliogrid/contracts/workflows';
import { hasImportPreview, mappedRows } from '@heliogrid/domain';
import { judgeLeadImportRows } from '@heliogrid/domain/server';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { FileService, readSheetRows } from '../file/file.public';
import { SettingsService } from '../settings/settings.public';
import { CrmLeadImportRepository } from './crm.lead-import.repository';
import { CrmLeadImportService, stepResult } from './crm.lead-import.service';
import {
  CrmLeadImportRowsRepository,
  type StagedLeadImportRow,
} from './crm.lead-import-rows.repository';
import { LEAD_SPREADSHEET, leadImportRowWire } from './internal/lead-import-wire';
import type { LeadReader } from './internal/reader';

/**
 * The lead import's preview (`M02-19`, `M02-20`): the pass that turns the mapped sheet into judged
 * rows — "N rows · M duplicates by phone" before anything runs — as a workflow step, and the page
 * of them the wizard shows with each duplicate's sheet facts.
 */
@Injectable()
export class CrmLeadImportPreviewService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmLeadImportRepository) private readonly jobs: CrmLeadImportRepository,
    @Inject(CrmLeadImportRowsRepository) private readonly rows: CrmLeadImportRowsRepository,
    @Inject(CrmLeadImportService) private readonly imports: CrmLeadImportService,
    @Inject(FileService) private readonly files: FileService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  /**
   * The preview pass: the mapped sheet read whole, every filled row read the market's way, each
   * landable number matched against the company's customers and contacts, a repeat within the file
   * named — and stored, unless a newer mapping superseded the one read here. Nothing is imported.
   */
  async matchRows(
    { tenantId, jobId }: LeadImportStepInput,
    now: number,
  ): Promise<LeadImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null) throw stepCannotSucceed(`lead import ${jobId} is not in company ${tenantId}`);
    if (job.status !== 'matching' || job.mapping === null) return { status: job.status };
    const stored = await this.files.readStored(tenantId, job.fileId, LEAD_SPREADSHEET);
    const sheet = await readSheetRows(stored.bytes, stored.contentType, job.mapping.sheet);
    // The read step opened this file and counted this sheet, so this is never the person's to fix.
    if (!sheet.readable) throw stepCannotSucceed(`lead import ${jobId}'s sheet no longer reads`);
    const { formats } = await this.settings.packOf(tenantId);
    const judged = judgeLeadImportRows(mappedRows(sheet.rows, job.mapping), formats);
    const firsts = judged.flatMap((row) =>
      row.problems.length === 0 && row.repeatsRow === null && row.phoneE164 !== null
        ? [row.phoneE164]
        : [],
    );
    const holders = await this.rows.holdersOf(tenantId, firsts);
    const staged: StagedLeadImportRow[] = judged.map((row) => ({
      ...row,
      duplicateOfCustomerId:
        row.repeatsRow === null && row.problems.length === 0 && row.phoneE164 !== null
          ? (holders.get(row.phoneE164) ?? null)
          : null,
    }));
    const status = await this.rows.replace(tenantId, jobId, job.mappingRevision, staged, now);
    return stepResult(jobId, status);
  }

  /** A pass that failed past every retry: the job goes back to `mapped` for the confirm again. */
  async endMatch(
    { tenantId, jobId }: LeadImportStepInput,
    now: number,
  ): Promise<LeadImportStepResult> {
    return stepResult(jobId, await this.jobs.endMatch(tenantId, jobId, now));
  }

  /** A page of the preview, or of the report once run, by sheet row. */
  async page(
    reader: LeadReader,
    id: string,
    query: LeadImportRowsQuery,
  ): Promise<Paginated<LeadImportRowWire>> {
    const job = await this.imports.jobOf(reader.tenantId, id);
    if (!hasImportPreview(job.status)) {
      throw new ConflictException('The preview pass has not judged this import’s rows.');
    }
    const { rows, totalCount, facts } = await this.rows.page(reader, id, {
      verdict: query.verdict,
      result: query.result,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return { items: rows.map((row) => leadImportRowWire(row, facts)), totalCount };
  }
}

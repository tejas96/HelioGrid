import {
  type CreateHeaders,
  type LeadImport,
  type LeadImportMappingWrite,
  type LeadImportStart,
  leadImportContract,
} from '@heliogrid/contracts';
import type { LeadImportStepInput, LeadImportStepResult } from '@heliogrid/contracts/workflows';
import {
  type CatalogImportState,
  leadImportMappingProblem,
  sameImportMapping,
  takesImportMapping,
} from '@heliogrid/domain';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { CreationReplies, creationKeyOf } from '../../common/creation-key';
import { ContractException } from '../../common/errors/contract-exception';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { FileService, readSpreadsheet } from '../file/file.public';
import { CrmLeadImportRepository, type LeadImportJob } from './crm.lead-import.repository';
import { CrmLeadImportRowsRepository } from './crm.lead-import-rows.repository';
import { LEAD_SPREADSHEET, leadImportWire, MAPPING_FIELD_OF } from './internal/lead-import-wire';

/**
 * The lead import (`M02-18`…`M02-21`, `SCR-M02-05`): a stored spreadsheet becomes a job handed to
 * the `leadImport` workflow in the same transaction and read by its step in the background; the
 * person confirms the guessed columns, and nothing is imported before the preview is seen. Every
 * route is `crm.import_leads` (Owner, Sales Manager), held at the door.
 */
@Injectable()
export class CrmLeadImportService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmLeadImportRepository) private readonly jobs: CrmLeadImportRepository,
    @Inject(CrmLeadImportRowsRepository) private readonly rows: CrmLeadImportRowsRepository,
    @Inject(FileService) private readonly files: FileService,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
    @Inject(CreationReplies) private readonly replies: CreationReplies,
  ) {}

  async start(
    tenantId: string,
    body: LeadImportStart,
    headers: CreateHeaders,
    act: Act,
  ): Promise<LeadImport> {
    await this.files.confirmed(tenantId, body.fileId, LEAD_SPREADSHEET);
    const route = leadImportContract.start;
    const key = creationKeyOf(headers, act.actorUserId, route, body);
    const savedAt = body.savedAt === null ? null : new Date(body.savedAt);
    const started = this.replies.rowOf(
      await this.jobs.start(tenantId, { ...body, savedAt }, act, key),
      route,
      tenantId,
    );
    // After the commit, never inside it: the sweep starts the workflow if this start is lost.
    if (started.eventId !== null) await this.dispatcher.dispatchNow(started.eventId);
    return this.import(tenantId, started.jobId);
  }

  /** The job as it stands — leave the screen and come back, and this is what it shows (`M02-21`). */
  async import(tenantId: string, id: string): Promise<LeadImport> {
    const job = await this.jobOf(tenantId, id);
    const file = await this.files.confirmed(tenantId, job.fileId, LEAD_SPREADSHEET);
    return leadImportWire(job, file, await this.rows.tallies(tenantId, id));
  }

  /**
   * Confirms the columns and hands the preview pass to the workflow. A mapping sent while a pass
   * runs supersedes it; the same mapping sent again answers the job as it stands and moves nothing.
   */
  async map(
    tenantId: string,
    id: string,
    mapping: LeadImportMappingWrite,
    now: number,
  ): Promise<LeadImport> {
    const job = await this.jobOf(tenantId, id);
    if (!takesImportMapping(job.status)) {
      throw new ConflictException(`An import that is ${job.status} takes no mapping.`);
    }
    const problem = leadImportMappingProblem(mapping, job.sheets ?? []);
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
    return this.import(tenantId, id);
  }

  /**
   * The read step: the stored file opened and what it holds recorded. A job already past `reading`
   * is answered as it stands, so a retried step changes nothing; an outage throws and is retried.
   */
  async readFile(
    { tenantId, jobId }: LeadImportStepInput,
    now: number,
  ): Promise<LeadImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null) throw stepCannotSucceed(`lead import ${jobId} is not in company ${tenantId}`);
    if (job.status !== 'reading') return { status: job.status };
    const stored = await this.files.readStored(tenantId, job.fileId, LEAD_SPREADSHEET);
    const read = await readSpreadsheet(stored.bytes, stored.contentType);
    const outcome = read.readable ? { sheets: read.sheets } : { unreadable: read.reason };
    return stepResult(jobId, await this.jobs.recordRead(tenantId, jobId, outcome, now));
  }

  /** A read that failed past every retry: the person is told to choose the file again. */
  async endRead(
    { tenantId, jobId }: LeadImportStepInput,
    now: number,
  ): Promise<LeadImportStepResult> {
    const status = await this.jobs.recordRead(tenantId, jobId, { unreadable: 'not_read' }, now);
    return stepResult(jobId, status);
  }

  /** The job, or the 404 a person sees for one that is not their company's — never a 403. */
  async jobOf(tenantId: string, id: string): Promise<LeadImportJob> {
    const job = await this.jobs.find(tenantId, id);
    if (job === null) throw new NotFoundException('That import is not in this company.');
    return job;
  }
}

/** A step's answer; a job no longer in its company can never succeed, so its workflow ends. */
export function stepResult(jobId: string, status: CatalogImportState | null): LeadImportStepResult {
  if (status === null) throw stepCannotSucceed(`lead import ${jobId} is not in its company`);
  return { status };
}

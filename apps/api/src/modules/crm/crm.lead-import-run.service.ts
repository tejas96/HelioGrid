import type { LeadImport, LeadImportRun } from '@heliogrid/contracts';
import type { LeadImportStepInput, LeadImportStepResult } from '@heliogrid/contracts/workflows';
import { type FormatPack, formatPhone, hasImportRun } from '@heliogrid/domain';
import { leadEnquiryNotice } from '@heliogrid/i18n';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Act } from '../../common/auth/session-context';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import {
  NotificationPushService,
  renderedInEveryLanguage,
} from '../notification/notification.public';
import { SettingsService } from '../settings/settings.public';
import { CrmLeadImportRepository } from './crm.lead-import.repository';
import { CrmLeadImportService, stepResult } from './crm.lead-import.service';
import type { ImportEnquiryNotice } from './crm.lead-import-notices.repository';
import {
  CrmLeadImportRunRepository,
  type LeadImportRunner,
} from './crm.lead-import-run.repository';

/**
 * Rows a run step takes per call. Each lands in its own transaction, so a batch is bounded only by
 * the step's one-minute timeout: raise it and a slow database can push a batch past the minute.
 */
const ROWS_PER_STEP = 100;

/**
 * The lead import's run (`M02-20`, `M02-21`): a previewed job handed to the `leadImport` workflow,
 * whose step lands its rows batch by batch — each row in its own small transaction, so a row that
 * fails rolls back alone, is rejected as not written, and no landed row is ever undone. Its
 * progress is read off the rows, so leaving the screen and returning shows it.
 */
@Injectable()
export class CrmLeadImportRunService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmLeadImportRepository) private readonly jobs: CrmLeadImportRepository,
    @Inject(CrmLeadImportRunRepository) private readonly runs: CrmLeadImportRunRepository,
    @Inject(CrmLeadImportService) private readonly imports: CrmLeadImportService,
    @Inject(SettingsService) private readonly settings: SettingsService,
    @Inject(NotificationPushService) private readonly push: NotificationPushService,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
    @Inject(PinoLogger) private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CrmLeadImportRunService.name);
  }

  /**
   * Runs a previewed import with the one choice every duplicate follows — skip unless said, never
   * keep both (`M02-20`). One already run is answered as it stands, with no second handoff.
   */
  async run(tenantId: string, id: string, body: LeadImportRun, act: Act): Promise<LeadImport> {
    const started = await this.runs.start(tenantId, id, body.duplicateChoice, act);
    if (started === null) throw new NotFoundException('That import is not in this company.');
    if ('eventId' in started) {
      // After the commit, never inside it: the sweep starts the workflow if this start is lost.
      await this.dispatcher.dispatchNow(started.eventId);
    } else if (!hasImportRun(started.status)) {
      throw new ConflictException(`An import that is ${started.status} has no preview to run.`);
    }
    return this.imports.import(tenantId, id);
  }

  /**
   * The run step: the next rows taken, each in sheet order. Answers `running` while rows remain;
   * the call that finds none completes the job and tells the owners of the leads it logged on.
   */
  async applyRows(
    { tenantId, jobId }: LeadImportStepInput,
    now: number,
  ): Promise<LeadImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null) throw stepCannotSucceed(`lead import ${jobId} is not in company ${tenantId}`);
    if (job.status !== 'running') return { status: job.status };
    // A step answering `running` without taking a row would loop the workflow for good.
    if (job.runBy === null || job.duplicateChoice === null) {
      throw stepCannotSucceed(`lead import ${jobId} is running with no one who ran it`);
    }
    const { formats } = await this.settings.packOf(tenantId);
    const runner = { runBy: job.runBy, duplicateChoice: job.duplicateChoice, formats };
    const untaken = await this.runs.untaken(tenantId, jobId, ROWS_PER_STEP);
    for (const rowNumber of untaken) {
      await this.takeRow({ tenantId, jobId }, rowNumber, runner, now);
    }
    if (untaken.length === ROWS_PER_STEP) return { status: 'running' };
    return this.complete(tenantId, jobId, job.runBy, false, now);
  }

  /**
   * One row taken; a row whose write throws is rejected alone, logged by its job and number, so
   * one bad row never fails its batch five times over and leaves every row after it unwritten.
   * A database that cannot take even the rejection fails the step, which the workflow retries.
   */
  private async takeRow(
    { tenantId, jobId }: LeadImportStepInput,
    rowNumber: number,
    runner: LeadImportRunner,
    now: number,
  ): Promise<void> {
    try {
      await this.runs.takeRow(tenantId, jobId, rowNumber, runner, now);
    } catch (failure) {
      this.logger.warn({ jobId, rowNumber, err: failure }, 'a lead import row was not written');
      await this.runs.rejectUnwritten(tenantId, jobId, rowNumber, now);
    }
  }

  /** A run that failed past every retry: the rows not yet taken are rejected, and the job completes. */
  async endRun(
    { tenantId, jobId }: LeadImportStepInput,
    now: number,
  ): Promise<LeadImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null) throw stepCannotSucceed(`lead import ${jobId} is not in company ${tenantId}`);
    if (job.status !== 'running' || job.runBy === null) return { status: job.status };
    return this.complete(tenantId, jobId, job.runBy, true, now);
  }

  private async complete(
    tenantId: string,
    jobId: string,
    runBy: string,
    endedEarly: boolean,
    now: number,
  ): Promise<LeadImportStepResult> {
    const { formats } = await this.settings.packOf(tenantId);
    const notice = await this.noticeOf(tenantId, formats, await this.runs.nameOf(tenantId, runBy));
    const ended = await this.runs.complete(tenantId, jobId, endedEarly, notice, now);
    if (ended !== null) await this.push.deliverAfterCommit(tenantId, ended.notified, new Date(now));
    return stepResult(jobId, ended?.status ?? null);
  }

  /** The enquiry notice's words for whoever pressed import, and the tenant's quiet hours. */
  private async noticeOf(
    tenantId: string,
    formats: FormatPack,
    importer: string,
  ): Promise<ImportEnquiryNotice> {
    return {
      wordsFor: (leads) =>
        renderedInEveryLanguage((translate) =>
          'name' in leads
            ? leadEnquiryNotice(translate, {
                name: leads.name ?? formatPhone(formats, leads.phoneE164),
                asker: importer,
                asked: false,
              })
            : leadEnquiryNotice(translate, { count: leads.count, asker: importer }),
        ),
      quietHours: await this.settings.quietHoursOf(tenantId),
    };
  }
}

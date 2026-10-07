import type { CatalogImportWire, RoleSet } from '@heliogrid/contracts';
import type {
  CatalogImportStepInput,
  CatalogImportStepResult,
} from '@heliogrid/contracts/workflows';
import { type CatalogImportRowMatch, hasImportRun, importProductNames } from '@heliogrid/domain';
import { matchImportRows } from '@heliogrid/domain/server';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { Act } from '../../common/auth/session-context';
import { OutboxDispatcher } from '../../common/temporal/outbox.dispatcher';
import { stepCannotSucceed } from '../../common/temporal/temporal.activity-host';
import { CatalogImportRepository } from './catalog.import.repository';
import { CatalogImportService } from './catalog.import.service';
import { CatalogImportRunRepository, type RowWrite } from './catalog.import-run.repository';
import type { RateToAppend } from './catalog.rates.repository';
import { CatalogService } from './catalog.service';
import { importNotFound } from './internal/import-job';
import { catalogOf, matchInput, namingCells } from './internal/import-judging';
import { admitWrite } from './internal/write-checks';

/**
 * The import's run (`T-M01-030f`, `M01-41`): a previewed job handed to the `catalogImport`
 * workflow, whose step writes its rows into the catalog batch by batch — each row judged again
 * against the catalog as it stands, so a preview gone stale never makes a second SKU — and keeps
 * what it did with every row. The route is the manage grant held outright, as every import route is.
 */
@Injectable()
export class CatalogImportRunService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogImportRepository) private readonly jobs: CatalogImportRepository,
    @Inject(CatalogImportRunRepository) private readonly runs: CatalogImportRunRepository,
    @Inject(CatalogImportService) private readonly imports: CatalogImportService,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(OutboxDispatcher) private readonly dispatcher: OutboxDispatcher,
  ) {}

  /** Runs a previewed import; one already run is answered as it stands, with no second handoff. */
  async run(tenantId: string, roles: RoleSet, id: string, act: Act): Promise<CatalogImportWire> {
    admitWrite(roles);
    const started = await this.runs.start(tenantId, id, act);
    if (started === null) throw importNotFound();
    if ('eventId' in started) {
      // After the commit, never inside it: the sweep starts the workflow if this start is lost.
      await this.dispatcher.dispatchNow(started.eventId);
    } else if (!hasImportRun(started.status)) {
      throw new ConflictException(`An import that is ${started.status} has no preview to run.`);
    }
    return this.imports.import(tenantId, roles, id);
  }

  /**
   * The run step: the next batch written into the catalog, dated the day it is written on the
   * tenant's clock and acted by whoever pressed import. A job no longer running is answered where it is.
   */
  async applyRows(
    { tenantId, jobId }: CatalogImportStepInput,
    now: number,
  ): Promise<CatalogImportStepResult> {
    const job = await this.jobs.find(tenantId, jobId);
    if (job === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    if (job.status !== 'running') return { status: job.status };
    // A step answering `running` without writing would loop the workflow for good.
    if (job.runAt === null || job.runBy === null) {
      throw stepCannotSucceed(`import ${jobId} is running with no one who ran it`);
    }
    // Dated the day this batch is written, never the day the run was pressed: a batch past
    // midnight would otherwise backdate its prices (rule b4, `T-M01-030f` D3).
    const scope = await this.catalog.scopeOf(tenantId, now);
    const priced = (amount: string): RateToAppend => ({
      amount,
      currency: scope.currencyCode,
      effectiveOn: scope.resolve.pricedOn,
    });
    const act = { actorUserId: job.runBy, now };
    const status = await this.runs.applyNext(
      tenantId,
      jobId,
      scope.marketCode,
      act,
      async (batch) => {
        const named = await batch.named(importProductNames(batch.rows.map(namingCells)));
        const verdicts = matchImportRows(
          batch.rows.map(matchInput),
          catalogOf(named, scope.formats),
        );
        const overrideOf = (id: string) => named.find((item) => item.id === id)?.overrideId ?? null;
        return batch.rows.map((row, index) =>
          rowWrite(row.rowNumber, verdicts[index], priced, overrideOf),
        );
      },
    );
    if (status === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    return { status };
  }

  /** A run that failed past every retry: the rows not yet written are failed, and the job completes. */
  async endRun(
    { tenantId, jobId }: CatalogImportStepInput,
    now: number,
  ): Promise<CatalogImportStepResult> {
    const status = await this.runs.end(tenantId, jobId, now);
    if (status === null) throw stepCannotSucceed(`import ${jobId} is not in company ${tenantId}`);
    return { status };
  }
}

/**
 * What a row judged again writes. A verdict that is no longer a write means the row's product
 * changed in the catalog since the person saw the preview: it is failed, never guessed at.
 */
function rowWrite(
  rowNumber: number,
  match: CatalogImportRowMatch | undefined,
  priced: (amount: string) => RateToAppend,
  overrideOf: (platformItemId: string) => string | null,
): RowWrite {
  switch (match?.outcome) {
    case 'price_override': {
      const id = match.platformItemId;
      const item = { on: 'platform_item', id, overrideId: overrideOf(id) } as const;
      return { rowNumber, on: 'price', item, rate: priced(match.rate) };
    }
    case 'own_item_price': {
      const item = { on: 'own_item', id: match.ownItemId } as const;
      return { rowNumber, on: 'price', item, rate: priced(match.rate) };
    }
    case 'new_item': {
      const { brand, model, spec } = match;
      const item = { brand, model, spec, certifications: [], preferred: false };
      return { rowNumber, on: 'new_item', item, rate: priced(match.rate) };
    }
    default:
      return { rowNumber, on: 'nothing', failure: 'changed_since_preview' };
  }
}

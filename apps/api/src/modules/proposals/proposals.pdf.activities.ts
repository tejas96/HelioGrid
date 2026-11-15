import {
  type ProposalDocumentActivities,
  proposalDocumentWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { ProposalsVersionsService } from './proposals.versions.service';

/**
 * A version's PDF's three api steps, registered with the step host on the workflow's queue: they run
 * here, beside the version. The print between them runs in the worker, on the renderer's queue.
 */
@Injectable()
export class ProposalsPdfActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(ProposalsVersionsService) private readonly versions: ProposalsVersionsService,
  ) {}

  onModuleInit(): void {
    const activities: ProposalDocumentActivities = {
      proposalDocumentPage: (input) => this.versions.page(input),
      keepProposalDocument: (input) => this.versions.keep(input, Date.now()),
      proposalDocumentFailed: (input) => this.versions.failed(input, Date.now()),
    };
    this.host.register({ taskQueue: proposalDocumentWorkflow.taskQueue, activities });
  }
}

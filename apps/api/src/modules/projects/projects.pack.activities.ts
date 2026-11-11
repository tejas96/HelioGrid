import { type HandoverPackActivities, handoverPackWorkflow } from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { ProjectsPackService } from './projects.pack.service';

/** The handover pack's step, registered with the step host on its workflow's queue. */
@Injectable()
export class ProjectsPackActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(ProjectsPackService) private readonly packs: ProjectsPackService,
  ) {}

  onModuleInit(): void {
    const activities: HandoverPackActivities = {
      makeHandoverPack: (input) => this.packs.make(input, Date.now()),
    };
    this.host.register({ taskQueue: handoverPackWorkflow.taskQueue, activities });
  }
}

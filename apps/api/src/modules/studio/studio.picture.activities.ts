import {
  type DesignPlanReadActivities,
  designPlanReadWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { StudioPictureService } from './studio.picture.service';

/**
 * A CAD plan's read, the api's steps (`T-M05-002d`): registered with the step host, they run here
 * beside the picture and its stored file; the worker's `designPlanRead` workflow calls them on
 * `heliogrid-studio`, and reads the plan itself on the CAD reader's queue.
 */
@Injectable()
export class StudioPictureActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(StudioPictureService) private readonly pictures: StudioPictureService,
  ) {}

  onModuleInit(): void {
    const activities: DesignPlanReadActivities = {
      designPlanSource: (input) => this.pictures.planSource(input),
      keepDesignPlan: (input) => this.pictures.keepPlan(input),
      endDesignPlanRead: (input) => this.pictures.endRead(input),
    };
    this.host.register({ taskQueue: designPlanReadWorkflow.taskQueue, activities });
  }
}

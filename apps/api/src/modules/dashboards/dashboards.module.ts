import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.public';
import { ProjectsModule } from '../projects/projects.public';
import { SettingsModule } from '../settings/settings.public';
import { DashboardsController } from './dashboards.controller';
import { DashboardsRepository } from './dashboards.repository';
import { DashboardsService } from './dashboards.service';
import { DashboardsSummaryActivityRegistration } from './dashboards.summary.activities';
import { DashboardsSummaryAdminRepository } from './dashboards.summary.admin.repository';
import { DashboardsSummaryRepository } from './dashboards.summary.repository';
import { DashboardsSummaryService } from './dashboards.summary.service';
import { DashboardsTargetRepository } from './dashboards.target.repository';

/**
 * Dashboards (`M13`): the owner dashboard and its company target, and the monthly summary written
 * on the first of each month. Read-only over every other module's tables; the target and the
 * summary's claim are its own.
 */
@Module({
  imports: [NotificationModule, ProjectsModule, SettingsModule],
  controllers: [DashboardsController],
  providers: [
    DashboardsRepository,
    DashboardsTargetRepository,
    DashboardsService,
    DashboardsSummaryAdminRepository,
    DashboardsSummaryRepository,
    DashboardsSummaryService,
    DashboardsSummaryActivityRegistration,
  ],
})
export class DashboardsModule {}

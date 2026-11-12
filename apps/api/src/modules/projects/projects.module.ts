import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.public';
import { FileModule } from '../file/file.public';
import { NotificationModule } from '../notification/notification.public';
import { SettingsModule } from '../settings/settings.public';
import { ProjectsActsController } from './projects.acts.controller';
import { ProjectsActsRepository } from './projects.acts.repository';
import { ProjectsActsService } from './projects.acts.service';
import { ProjectsBoardRepository } from './projects.board.repository';
import { ProjectsController } from './projects.controller';
import { ProjectsDetailReadRepository } from './projects.detail-read.repository';
import { ProjectFileSubjects } from './projects.file-subjects.repository';
import { ProjectsPackActivityRegistration } from './projects.pack.activities';
import { ProjectsPackRepository } from './projects.pack.repository';
import { ProjectsPackService } from './projects.pack.service';
import { ProjectsPaymentWordsService } from './projects.payment-words.service';
import { ProjectsPaymentsController } from './projects.payments.controller';
import { ProjectsPaymentsRepository } from './projects.payments.repository';
import { ProjectsPaymentsService } from './projects.payments.service';
import { ProjectsPaymentsReadRepository } from './projects.payments-read.repository';
import { ProjectsPeopleRepository } from './projects.people.repository';
import { ProjectsService } from './projects.service';
import { ProjectsWonRepository } from './projects.won.repository';
import { ProjectsWonService } from './projects.won.service';

/**
 * Projects (`M08`): the board, one project, its acts, and *Mark won* that starts one (`M07-62`);
 * and a project's money (`M11`), which is born at Mark won and falls due with its stages.
 */
@Module({
  imports: [BillingModule, FileModule, NotificationModule, SettingsModule],
  controllers: [ProjectsController, ProjectsActsController, ProjectsPaymentsController],
  providers: [
    ProjectFileSubjects,
    ProjectsPackRepository,
    ProjectsPackService,
    ProjectsPackActivityRegistration,
    ProjectsService,
    ProjectsActsService,
    ProjectsWonService,
    ProjectsPaymentWordsService,
    ProjectsPaymentsService,
    ProjectsPaymentsReadRepository,
    ProjectsPaymentsRepository,
    ProjectsBoardRepository,
    ProjectsDetailReadRepository,
    ProjectsPeopleRepository,
    ProjectsActsRepository,
    ProjectsWonRepository,
  ],
})
export class ProjectsModule {}

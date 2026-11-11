import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.public';
import { NotificationModule } from '../notification/notification.public';
import { SettingsModule } from '../settings/settings.public';
import { CrmActivitiesController } from './crm.activities.controller';
import { CrmActivitiesRepository } from './crm.activities.repository';
import { CrmActivitiesService } from './crm.activities.service';
import { CrmAssignController } from './crm.assign.controller';
import { CrmAssignRepository } from './crm.assign.repository';
import { CrmAssignService } from './crm.assign.service';
import { CrmCallsController } from './crm.calls.controller';
import { CrmCallsRepository } from './crm.calls.repository';
import { CrmCallsService } from './crm.calls.service';
import { CrmCaptureController } from './crm.capture.controller';
import { CrmCaptureRepository } from './crm.capture.repository';
import { CrmCaptureService } from './crm.capture.service';
import { CrmContactsController } from './crm.contacts.controller';
import { CrmContactsRepository } from './crm.contacts.repository';
import { CrmContactsService } from './crm.contacts.service';
import { CrmDailySweepActivityRegistration } from './crm.daily-sweep.activities';
import { CrmDailySweepAdminRepository } from './crm.daily-sweep.admin.repository';
import { CrmDailySweepRepository } from './crm.daily-sweep.repository';
import { CrmDailySweepService } from './crm.daily-sweep.service';
import { CrmEditsController } from './crm.edits.controller';
import { CrmEditsRepository } from './crm.edits.repository';
import { CrmEditsService } from './crm.edits.service';
import { CrmEnquiriesRepository } from './crm.enquiries.repository';
import { CrmFileSubjects } from './crm.file-subjects.repository';
import { CrmLeadFilesController } from './crm.lead-files.controller';
import { CrmLeadFilesRepository } from './crm.lead-files.repository';
import { CrmLeadFilesService } from './crm.lead-files.service';
import { CrmLeadImportActivityRegistration } from './crm.lead-import.activities';
import { CrmLeadImportController } from './crm.lead-import.controller';
import { CrmLeadImportRepository } from './crm.lead-import.repository';
import { CrmLeadImportService } from './crm.lead-import.service';
import { CrmLeadImportPreviewService } from './crm.lead-import-preview.service';
import { CrmLeadImportRowsRepository } from './crm.lead-import-rows.repository';
import { CrmLeadImportRunRepository } from './crm.lead-import-run.repository';
import { CrmLeadImportRunService } from './crm.lead-import-run.service';
import { CrmLeadsController } from './crm.leads.controller';
import { CrmLeadsRepository } from './crm.leads.repository';
import { CrmLeadsService } from './crm.leads.service';
import { CrmLifecycleController } from './crm.lifecycle.controller';
import { CrmLifecycleRepository } from './crm.lifecycle.repository';
import { CrmLifecycleService } from './crm.lifecycle.service';
import { CrmMergeController } from './crm.merge.controller';
import { CrmMergeRepository } from './crm.merge.repository';
import { CrmMergeService } from './crm.merge.service';
import { CrmMessagesController } from './crm.messages.controller';
import { CrmMessagesRepository } from './crm.messages.repository';
import { CrmMessagesService } from './crm.messages.service';
import { CrmTasksController } from './crm.tasks.controller';
import { CrmTasksRepository } from './crm.tasks.repository';
import { CrmTasksService } from './crm.tasks.service';
import { CrmVisitsController } from './crm.visits.controller';
import { CrmVisitsRepository } from './crm.visits.repository';
import { CrmVisitsService } from './crm.visits.service';

/**
 * The CRM (`M02`, build-order block 3): leads and their customers, capture with the dedupe sheet,
 * edits, the timeline, contacts, the lead's files and the lead import, whose steps run here beside
 * the tables they write. It reads the tenant's market pack and quiet hours through the settings
 * module, a stored spreadsheet through the file module, and raises its notices through the
 * notification module, never the other way.
 */
@Module({
  imports: [SettingsModule, NotificationModule, FileModule],
  controllers: [
    CrmLeadsController,
    CrmCaptureController,
    CrmEditsController,
    CrmActivitiesController,
    CrmContactsController,
    CrmLeadFilesController,
    CrmAssignController,
    CrmMergeController,
    CrmLeadImportController,
    CrmLifecycleController,
    CrmCallsController,
    CrmTasksController,
    CrmVisitsController,
    CrmMessagesController,
  ],
  providers: [
    CrmFileSubjects,
    CrmLeadFilesService,
    CrmLeadFilesRepository,
    CrmLeadsService,
    CrmLeadsRepository,
    CrmCaptureService,
    CrmCaptureRepository,
    CrmEnquiriesRepository,
    CrmEditsService,
    CrmEditsRepository,
    CrmActivitiesService,
    CrmActivitiesRepository,
    CrmContactsService,
    CrmContactsRepository,
    CrmAssignService,
    CrmAssignRepository,
    CrmMergeService,
    CrmMergeRepository,
    CrmLeadImportService,
    CrmLeadImportRepository,
    CrmLeadImportPreviewService,
    CrmLeadImportRowsRepository,
    CrmLeadImportRunService,
    CrmLeadImportRunRepository,
    CrmLeadImportActivityRegistration,
    CrmLifecycleService,
    CrmLifecycleRepository,
    CrmCallsService,
    CrmCallsRepository,
    CrmTasksService,
    CrmTasksRepository,
    CrmVisitsService,
    CrmVisitsRepository,
    CrmMessagesService,
    CrmMessagesRepository,
    CrmDailySweepService,
    CrmDailySweepRepository,
    CrmDailySweepAdminRepository,
    CrmDailySweepActivityRegistration,
  ],
})
export class CrmModule {}

/**
 * @heliogrid/data — the frontend SDK (ADR-0023). The ONLY data path for apps/web and
 * apps/mobile. This entry is framework-free: no React, no React Query, usable from a route
 * handler or a script. The React adapter is `@heliogrid/data/react`; a Next server render
 * uses `@heliogrid/data/server`, which is request-scoped for a reason its own file explains.
 *
 * `createApiClient`, `createTransport`, `createRepositoryRegistry`, `createHealthRepository`,
 * `normalizeClientError` and `toApiError` are deliberately NOT exported. `createDataLayer` is
 * the only construction entry an app gets from here — re-exporting the client or transport
 * factory would hand apps back the raw wire that the `apps-never-touch-the-wire` gate exists
 * to keep away from them.
 */
export type { AuditRepository } from './audit/repository';
export type { AuthRepository } from './auth/repository';
export { queryKeys } from './cache/keys';
export type { ActivitiesRepository } from './crm/activities-repository';
export type { LeadAssignOutcome, LeadAssignRepository } from './crm/assign-repository';
export type { LeadCallsRepository } from './crm/calls-repository';
export type {
  EnquiryOutcome,
  LeadCaptureOutcome,
  LeadCaptureRepository,
} from './crm/capture-repository';
export type { ContactSaveOutcome, ContactsRepository } from './crm/contacts-repository';
export type { LeadEditsRepository } from './crm/edits-repository';
export type { LeadImportRepository, LeadImportRowsAsk } from './crm/import-repository';
export type { LeadInboxAsk, LeadsAsk, LeadsRepository } from './crm/leads-repository';
export type { LeadLifecycleRepository } from './crm/lifecycle-repository';
export { LeadActRefusedError } from './crm/lifecycle-repository';
export type { CustomerMergeRepository } from './crm/merge-repository';
export type { LeadMessagesRepository } from './crm/messages-repository';
export type { TasksRepository } from './crm/tasks-repository';
export type { VisitsRepository } from './crm/visits-repository';
export type { DataLayer, DataLayerConfig, Repositories } from './data-layer';
export { createDataLayer } from './data-layer';
export type { ApiErrorDetail } from './errors/errors';
export {
  ApiError,
  DataError,
  InvalidResponseError,
  NetworkError,
  RequestCancelledError,
  RequestTimeoutError,
  UnauthorizedError,
} from './errors/errors';
export type { FileRepository, FileToStore } from './file/repository';
export type { HealthRepository } from './health/repository';
export type { InvitationRepository } from './invitation/repository';
export type { MarketRepository } from './market/repository';
export type {
  NotificationCentreQuery,
  NotificationRepository,
} from './notification/repository';
export type { OnboardingRepository } from './onboarding/repository';
export type { SearchAsk, SearchRepository } from './search/repository';
export type { BlockedRefusal, BlockedStore } from './session/blocked';
export type { HeldWork } from './session/held-work';
export { NO_HELD_WORK } from './session/held-work';
export type { SessionApi, SessionStore } from './session/types';
export type { UpdateRequired, UpgradeStore } from './session/upgrade';
export type { SettingsRepository } from './settings/repository';
export type { SimilarTenant, TenantRepository } from './tenant/repository';
export type { TokenStorage } from './transport/storage';
export type { UserRepository } from './user/repository';

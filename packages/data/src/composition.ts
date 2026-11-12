import { type AuditRepository, createAuditRepository } from './audit/repository';
import { type AuthRepository, createAuthRepository } from './auth/repository';
import { type BillingRepository, createBillingRepository } from './billing/repository';
import {
  type BillingUsageRepository,
  createBillingUsageRepository,
} from './billing/usage-repository';
import {
  type CatalogImportRepository,
  createCatalogImportRepository,
} from './catalog/import-repository';
import { type CatalogRepository, createCatalogRepository } from './catalog/repository';
import { createApiClient } from './client/client';
import { type ActivitiesRepository, createActivitiesRepository } from './crm/activities-repository';
import { createLeadAssignRepository, type LeadAssignRepository } from './crm/assign-repository';
import { createLeadCallsRepository, type LeadCallsRepository } from './crm/calls-repository';
import { createLeadCaptureRepository, type LeadCaptureRepository } from './crm/capture-repository';
import { type ContactsRepository, createContactsRepository } from './crm/contacts-repository';
import { createLeadEditsRepository, type LeadEditsRepository } from './crm/edits-repository';
import { createLeadFilesRepository, type LeadFilesRepository } from './crm/files-repository';
import { createLeadImportRepository, type LeadImportRepository } from './crm/import-repository';
import { createLeadsRepository, type LeadsRepository } from './crm/leads-repository';
import {
  createLeadLifecycleRepository,
  type LeadLifecycleRepository,
} from './crm/lifecycle-repository';
import {
  type CustomerMergeRepository,
  createCustomerMergeRepository,
} from './crm/merge-repository';
import {
  createLeadMessagesRepository,
  type LeadMessagesRepository,
} from './crm/messages-repository';
import { createTasksRepository, type TasksRepository } from './crm/tasks-repository';
import { createVisitsRepository, type VisitsRepository } from './crm/visits-repository';
import { createFileRepository, type FileRepository } from './file/repository';
import { createHealthRepository, type HealthRepository } from './health/repository';
import { createInvitationRepository, type InvitationRepository } from './invitation/repository';
import { createMarketRepository, type MarketRepository } from './market/repository';
import {
  createNotificationRepository,
  type NotificationRepository,
} from './notification/repository';
import { createOnboardingRepository, type OnboardingRepository } from './onboarding/repository';
import { createPaymentsRepository, type PaymentsRepository } from './payments/payments-repository';
import { createPriceBookRepository, type PriceBookRepository } from './price-book/repository';
import { createPricingRepository, type PricingRepository } from './pricing/repository';
import { createProjectsRepository, type ProjectsRepository } from './projects/projects-repository';
import { createSearchRepository, type SearchRepository } from './search/repository';
import { createSettingsRepository, type SettingsRepository } from './settings/repository';
import { createTenantRepository, type TenantRepository } from './tenant/repository';
import type { TokenStorage } from './transport/storage';
import {
  type BlockedSignals,
  createTransport,
  type ReaderLanguage,
  type RequestHeaders,
  type SessionSignals,
  type UpgradeSignals,
} from './transport/transport';
import { createUserRepository, type UserRepository } from './user/repository';

/** Every repository an app can reach. One entry per contract router. */
export interface Repositories {
  audit: AuditRepository;
  notification: NotificationRepository;
  auth: AuthRepository;
  catalog: CatalogRepository;
  catalogImport: CatalogImportRepository;
  file: FileRepository;
  health: HealthRepository;
  invitation: InvitationRepository;
  market: MarketRepository;
  onboarding: OnboardingRepository;
  priceBook: PriceBookRepository;
  pricing: PricingRepository;
  billing: BillingRepository;
  billingUsage: BillingUsageRepository;
  search: SearchRepository;
  settings: SettingsRepository;
  tenant: TenantRepository;
  user: UserRepository;
  activities: ActivitiesRepository;
  contacts: ContactsRepository;
  customerMerge: CustomerMergeRepository;
  leadAssign: LeadAssignRepository;
  leadCalls: LeadCallsRepository;
  leadCapture: LeadCaptureRepository;
  leadEdits: LeadEditsRepository;
  leadFiles: LeadFilesRepository;
  leadImport: LeadImportRepository;
  leadLifecycle: LeadLifecycleRepository;
  payments: PaymentsRepository;
  projects: ProjectsRepository;
  leadMessages: LeadMessagesRepository;
  leads: LeadsRepository;
  tasks: TasksRepository;
  visits: VisitsRepository;
}

type RepositoryRegistryConfig = { baseUrl: string } & (
  | { mode: 'browser'; session: SessionSignals; language: ReaderLanguage; blocked: BlockedSignals }
  | {
      mode: 'mobile';
      storage: TokenStorage;
      language: ReaderLanguage;
      appVersion: string;
      session: SessionSignals;
      upgrade: UpgradeSignals;
      blocked: BlockedSignals;
    }
  | { mode: 'server'; headers: RequestHeaders }
);

/**
 * The ONE place a transport, a client and a repository are wired together — internal on
 * purpose. `createDataLayer` (browser/mobile) and `createServerDataContext` (a Next render)
 * are the two public doors onto it, so neither app is ever handed a raw client or transport
 * factory, and adding a repository is one edit rather than one per host.
 */
export function createRepositoryRegistry(config: RepositoryRegistryConfig): Repositories {
  const transport =
    config.mode === 'mobile'
      ? createTransport({
          mode: 'mobile',
          storage: config.storage,
          language: config.language,
          appVersion: config.appVersion,
          baseUrl: config.baseUrl,
          session: config.session,
          upgrade: config.upgrade,
          blocked: config.blocked,
        })
      : config.mode === 'server'
        ? createTransport({ mode: 'server', headers: config.headers })
        : createTransport({
            mode: 'browser',
            baseUrl: config.baseUrl,
            session: config.session,
            language: config.language,
            blocked: config.blocked,
          });
  const api = createApiClient(config.baseUrl, transport);
  return {
    audit: createAuditRepository(api),
    notification: createNotificationRepository(api),
    auth: createAuthRepository(api),
    catalog: createCatalogRepository(api),
    catalogImport: createCatalogImportRepository(api),
    file: createFileRepository(api),
    health: createHealthRepository(api),
    invitation: createInvitationRepository(api),
    market: createMarketRepository(api),
    onboarding: createOnboardingRepository(api),
    priceBook: createPriceBookRepository(api),
    pricing: createPricingRepository(api),
    billing: createBillingRepository(api),
    billingUsage: createBillingUsageRepository(api),
    search: createSearchRepository(api),
    settings: createSettingsRepository(api),
    tenant: createTenantRepository(api),
    user: createUserRepository(api),
    activities: createActivitiesRepository(api),
    contacts: createContactsRepository(api),
    customerMerge: createCustomerMergeRepository(api),
    leadAssign: createLeadAssignRepository(api),
    leadCalls: createLeadCallsRepository(api),
    leadCapture: createLeadCaptureRepository(api),
    leadEdits: createLeadEditsRepository(api),
    leadFiles: createLeadFilesRepository(api),
    leadImport: createLeadImportRepository(api),
    leadLifecycle: createLeadLifecycleRepository(api),
    payments: createPaymentsRepository(api),
    projects: createProjectsRepository(api),
    leadMessages: createLeadMessagesRepository(api),
    leads: createLeadsRepository(api),
    tasks: createTasksRepository(api),
    visits: createVisitsRepository(api),
  };
}

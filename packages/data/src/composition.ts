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
import { createFileRepository, type FileRepository } from './file/repository';
import { createHealthRepository, type HealthRepository } from './health/repository';
import { createInvitationRepository, type InvitationRepository } from './invitation/repository';
import { createMarketRepository, type MarketRepository } from './market/repository';
import {
  createNotificationRepository,
  type NotificationRepository,
} from './notification/repository';
import { createOnboardingRepository, type OnboardingRepository } from './onboarding/repository';
import { createPriceBookRepository, type PriceBookRepository } from './price-book/repository';
import { createPricingRepository, type PricingRepository } from './pricing/repository';
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
  settings: SettingsRepository;
  tenant: TenantRepository;
  user: UserRepository;
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
    settings: createSettingsRepository(api),
    tenant: createTenantRepository(api),
    user: createUserRepository(api),
  };
}

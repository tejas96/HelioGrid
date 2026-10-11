import { type AuditRepository, createAuditRepository } from './audit/repository';
import { type AuthRepository, createAuthRepository } from './auth/repository';
import { createApiClient } from './client/client';
import { createHealthRepository, type HealthRepository } from './health/repository';
import { createInvitationRepository, type InvitationRepository } from './invitation/repository';
import {
  createNotificationRepository,
  type NotificationRepository,
} from './notification/repository';
import { createTenantRepository, type TenantRepository } from './tenant/repository';
import type { TokenStorage } from './transport/storage';
import {
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
  health: HealthRepository;
  invitation: InvitationRepository;
  tenant: TenantRepository;
  user: UserRepository;
}

type RepositoryRegistryConfig = { baseUrl: string } & (
  | { mode: 'browser'; session: SessionSignals; language: ReaderLanguage }
  | {
      mode: 'mobile';
      storage: TokenStorage;
      language: ReaderLanguage;
      appVersion: string;
      session: SessionSignals;
      upgrade: UpgradeSignals;
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
        })
      : config.mode === 'server'
        ? createTransport({ mode: 'server', headers: config.headers })
        : createTransport({
            mode: 'browser',
            baseUrl: config.baseUrl,
            session: config.session,
            language: config.language,
          });
  const api = createApiClient(config.baseUrl, transport);
  return {
    audit: createAuditRepository(api),
    notification: createNotificationRepository(api),
    auth: createAuthRepository(api),
    health: createHealthRepository(api),
    invitation: createInvitationRepository(api),
    tenant: createTenantRepository(api),
    user: createUserRepository(api),
  };
}

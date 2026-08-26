import { createApiClient } from './client/client';
import { createHealthRepository, type HealthRepository } from './health/repository';
import type { TokenStorage } from './transport/storage';
import { createTransport, type RequestHeaders } from './transport/transport';

/** Every repository an app can reach. One entry per contract router. */
export interface Repositories {
  health: HealthRepository;
}

type RepositoryRegistryConfig = { baseUrl: string } & (
  | { mode: 'browser' }
  | { mode: 'mobile'; storage: TokenStorage }
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
      ? createTransport({ mode: 'mobile', storage: config.storage })
      : config.mode === 'server'
        ? createTransport({ mode: 'server', headers: config.headers })
        : createTransport({ mode: 'browser' });
  const api = createApiClient(config.baseUrl, transport);
  return {
    health: createHealthRepository(api),
  };
}

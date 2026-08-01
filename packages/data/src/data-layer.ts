import { createApiClient } from './client/client';
import { createHealthRepository, type HealthRepository } from './health/repository';
import type { SessionStore } from './session/types';
import { createWalkthroughSession } from './session/walkthrough';
import type { TokenStorage } from './transport/storage';
import { createTransport } from './transport/transport';

export interface Repositories {
  health: HealthRepository;
}

export interface DataLayerConfig {
  baseUrl: string;
  /** React Native only — web's session is an HttpOnly cookie the browser attaches itself. */
  storage?: TokenStorage;
}

export interface DataLayer {
  repositories: Repositories;
  session: SessionStore;
}

/**
 * Called ONCE per app, at the root. Apps never construct a repository, a client or a
 * transport themselves — they supply only what is genuinely platform-specific.
 */
export function createDataLayer({ baseUrl, storage }: DataLayerConfig): DataLayer {
  const api = createApiClient(baseUrl, createTransport(storage));
  return {
    repositories: { health: createHealthRepository(api) },
    session: createWalkthroughSession(),
  };
}

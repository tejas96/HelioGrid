import { createRepositoryRegistry, type Repositories } from './composition';
import type { SessionStore } from './session/types';
import { createWalkthroughSession } from './session/walkthrough';
import type { TokenStorage } from './transport/storage';

export type { Repositories } from './composition';

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
  return {
    repositories: storage
      ? createRepositoryRegistry({ baseUrl, mode: 'mobile', storage })
      : createRepositoryRegistry({ baseUrl, mode: 'browser' }),
    session: createWalkthroughSession(),
  };
}

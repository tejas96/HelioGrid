import { createRepositoryRegistry, type Repositories } from './composition';
import { type HeldWork, NO_HELD_WORK } from './session/held-work';
import { createSessionStore } from './session/store';
import type { SessionStore } from './session/types';
import type { TokenStorage } from './transport/storage';

export type { Repositories } from './composition';

export interface DataLayerConfig {
  baseUrl: string;
  /** React Native only — web's session is an HttpOnly cookie the browser attaches itself. */
  storage?: TokenStorage;
  /** What the device holds for its user (`F4-37`); nothing, until a capture feature lands. */
  heldWork?: HeldWork;
}

export interface DataLayer {
  repositories: Repositories;
  session: SessionStore;
}

/**
 * Called ONCE per app, at the root. Apps never construct a repository, a client or a
 * transport themselves — they supply only what is genuinely platform-specific. Storage IS the
 * platform: a jar means React Native, and the session opens as a mobile one (`M01-07`).
 */
export function createDataLayer({ baseUrl, storage, heldWork }: DataLayerConfig): DataLayer {
  const repositories = storage
    ? createRepositoryRegistry({ baseUrl, mode: 'mobile', storage })
    : createRepositoryRegistry({ baseUrl, mode: 'browser' });
  return {
    repositories,
    session: createSessionStore({
      auth: repositories.auth,
      platform: storage ? 'mobile' : 'web',
      heldWork: heldWork ?? NO_HELD_WORK,
    }),
  };
}

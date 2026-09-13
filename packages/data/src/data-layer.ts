import { createRepositoryRegistry, type Repositories } from './composition';
import { type HeldWork, NO_HELD_WORK } from './session/held-work';
import { createSessionStore } from './session/store';
import type { SessionStore } from './session/types';
import type { TokenStorage } from './transport/storage';
import type { SessionSignals } from './transport/transport';

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
  /*
   * The transport is built INSIDE the registry, and the store is built from the registry's
   * repositories — so the two cannot be handed to each other directly. This relay is the knot:
   * the transport gets a stable object now and the store fills it in a line later. Until then
   * `couldHoldSession` answers true, which is the safe direction — a refresh that was not needed
   * costs one call, and one skipped wrongly would sign a person out mid-session.
   */
  let session: SessionStore | null = null;
  const signals: SessionSignals = {
    onSessionLost: () => session?.signals.onSessionLost(),
    couldHoldSession: () => session?.signals.couldHoldSession() ?? true,
  };

  const repositories = storage
    ? createRepositoryRegistry({ baseUrl, mode: 'mobile', storage, session: signals })
    : createRepositoryRegistry({ baseUrl, mode: 'browser', session: signals });
  session = createSessionStore({
    auth: repositories.auth,
    user: repositories.user,
    tenant: repositories.tenant,
    platform: storage ? 'mobile' : 'web',
    heldWork: heldWork ?? NO_HELD_WORK,
  });
  return { repositories, session };
}

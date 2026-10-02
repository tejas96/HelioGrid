import type { StorePlatform } from '@heliogrid/domain';
import { createRepositoryRegistry, type Repositories } from './composition';
import { type HeldWork, NO_HELD_WORK } from './session/held-work';
import { createSessionStore } from './session/store';
import type { SessionStore } from './session/types';
import { createUpgradeStore, NEVER_REFUSED, type UpgradeStore } from './session/upgrade';
import type { TokenStorage } from './transport/storage';
import type { SessionSignals } from './transport/transport';

export type { Repositories } from './composition';

/**
 * A jar means React Native, and a phone always says which build it is and which store it updates
 * from (`F4-36`) — so the three come together or not at all, and a mobile layer without them does
 * not compile. Web sends none: its session is an HttpOnly cookie the browser attaches, and it
 * deploys with the api.
 */
export type DataLayerConfig = {
  baseUrl: string;
  /** What the device holds for its user (`F4-37`); nothing, until a capture feature lands. */
  heldWork?: HeldWork;
} & (
  | { storage: TokenStorage; appVersion: string; storePlatform: StorePlatform }
  | { storage?: undefined }
);

export interface DataLayer {
  repositories: Repositories;
  session: SessionStore;
  /** Whether the api has turned this build away as too old (`F4-36`); never, on the web. */
  upgrade: UpgradeStore;
}

/**
 * Called ONCE per app, at the root. Apps never construct a repository, a client or a
 * transport themselves — they supply only what is genuinely platform-specific. Storage IS the
 * platform: a jar means React Native, and the session opens as a mobile one (`M01-07`).
 */
export function createDataLayer(config: DataLayerConfig): DataLayer {
  const { baseUrl, storage, heldWork } = config;
  /*
   * The transport is built INSIDE the registry, and the store is built from the registry's
   * repositories — so the two cannot be handed to each other directly. This relay is the knot:
   * the transport gets a stable object now and the store fills it in a line later. Until then
   * `couldHoldSession` answers true, which is the safe direction — a refresh that was not needed
   * costs one call, and one skipped wrongly would sign a person out mid-session.
   */
  let session: SessionStore | null = null;
  const signals: SessionSignals = {
    onSessionLost: (loss) => session?.signals.onSessionLost(loss),
    couldHoldSession: () => session?.signals.couldHoldSession() ?? true,
  };

  const upgrade = config.storage
    ? createUpgradeStore({ appVersion: config.appVersion, storePlatform: config.storePlatform })
    : NEVER_REFUSED;
  const repositories = config.storage
    ? createRepositoryRegistry({
        baseUrl,
        mode: 'mobile',
        storage: config.storage,
        appVersion: config.appVersion,
        session: signals,
        upgrade: upgrade.signals,
      })
    : createRepositoryRegistry({ baseUrl, mode: 'browser', session: signals });
  session = createSessionStore({
    auth: repositories.auth,
    user: repositories.user,
    tenant: repositories.tenant,
    platform: storage ? 'mobile' : 'web',
    heldWork: heldWork ?? NO_HELD_WORK,
  });
  return { repositories, session, upgrade };
}

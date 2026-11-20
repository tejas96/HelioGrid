import { API_TOKEN_COOKIE } from '@heliogrid/contracts';
import type { StorePlatform } from '@heliogrid/domain';
import { createRepositoryRegistry, type Repositories } from './composition';
import { type BlockedStore, createBlockedStore } from './session/blocked';
import { type HeldWork, NO_HELD_WORK } from './session/held-work';
import { createSessionStore } from './session/store';
import type { SessionStore } from './session/types';
import { createUpgradeStore, NEVER_REFUSED, type UpgradeStore } from './session/upgrade';
import type { TokenStorage } from './transport/storage';
import type { BorrowedToken, ReaderLanguage, SessionSignals } from './transport/transport';

export type { Repositories } from './composition';

/**
 * A jar means React Native, and a phone always says which build it is and which store it updates
 * from (`F4-36`) — so the three come together or not at all, and a mobile layer without them does
 * not compile. Web sends none: its session is an HttpOnly cookie the browser attaches, and it
 * deploys with the api.
 */
export type DataLayerConfig = {
  baseUrl: string;
  /** The mount's language as each call leaves. Required: unwired, every new account is English. */
  language: ReaderLanguage;
  /** What the device holds for its user (`F4-37`); nothing, until a capture feature lands. */
  heldWork?: HeldWork;
} & (
  | {
      storage: TokenStorage;
      appVersion: string;
      storePlatform: StorePlatform;
      borrowed?: undefined;
    }
  | { storage?: undefined; borrowed?: BorrowedToken }
);

export interface DataLayer {
  repositories: Repositories;
  session: SessionStore;
  /** Whether the api has turned this build away as too old (`F4-36`); never, on the web. */
  upgrade: UpgradeStore;
  /** The latest save the billing gate refused, for the app's one denial (`M12-21`). */
  blocked: BlockedStore;
  /**
   * The phone's API token, fresh, to lend a page it shows in a web view — never the session, which
   * stays in the jar. `null` on the web, and on a phone with no one signed in.
   */
  lendToken(): Promise<string | null>;
}

/** One cookie's value out of the jar's `name=value; …` text. */
function cookieIn(jar: string | null, name: string): string | null {
  for (const pair of (jar ?? '').split('; ')) {
    const eq = pair.indexOf('=');
    if (eq > 0 && pair.slice(0, eq) === name) return pair.slice(eq + 1);
  }
  return null;
}

/**
 * Called ONCE per app, at the root. Apps never construct a repository, a client or a
 * transport themselves — they supply only what is genuinely platform-specific. Storage IS the
 * platform: a jar means React Native, and the session opens as a mobile one (`M01-07`).
 */
export function createDataLayer(config: DataLayerConfig): DataLayer {
  const { baseUrl, language, storage, heldWork } = config;
  /*
   * The transport is built INSIDE the registry, and the store is built from the registry's
   * repositories — so the two cannot be handed to each other directly. This relay is the knot:
   * the transport gets a stable object now and the store fills it in a line later. Until then
   * `couldHoldSession` answers true, which is the safe direction — a refresh that was not needed
   * costs one call, and one skipped wrongly would sign a person out mid-session. A loss or a
   * renewal reported before then has no store to move and nobody to read again.
   */
  let session: SessionStore | null = null;
  const signals: SessionSignals = {
    onSessionLost: (loss) => session?.signals.onSessionLost(loss),
    onSessionRenewed: () => session?.signals.onSessionRenewed(),
    couldHoldSession: () => session?.signals.couldHoldSession() ?? true,
  };

  const upgrade = config.storage
    ? createUpgradeStore({ appVersion: config.appVersion, storePlatform: config.storePlatform })
    : NEVER_REFUSED;
  const blocked = createBlockedStore();
  const repositories = config.storage
    ? createRepositoryRegistry({
        baseUrl,
        mode: 'mobile',
        storage: config.storage,
        language,
        appVersion: config.appVersion,
        session: signals,
        upgrade: upgrade.signals,
        blocked: blocked.signals,
      })
    : config.borrowed
      ? createRepositoryRegistry({
          baseUrl,
          mode: 'borrowed',
          token: config.borrowed,
          session: signals,
          language,
          blocked: blocked.signals,
        })
      : createRepositoryRegistry({
          baseUrl,
          mode: 'browser',
          session: signals,
          language,
          blocked: blocked.signals,
        });
  session = createSessionStore({
    auth: repositories.auth,
    user: repositories.user,
    tenant: repositories.tenant,
    invitation: repositories.invitation,
    platform: storage ? 'mobile' : 'web',
    heldWork: heldWork ?? NO_HELD_WORK,
  });
  const lendToken = async (): Promise<string | null> => {
    if (!storage) return null;
    // A session read renews a lapsed token first, so the token lent has its ten minutes ahead.
    await repositories.auth.session().catch(() => undefined);
    return cookieIn(await storage.get(), API_TOKEN_COOKIE);
  };
  return { repositories, session, upgrade, blocked, lendToken };
}

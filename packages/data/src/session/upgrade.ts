import type { StorePlatform } from '@heliogrid/domain';
import type { UpgradeSignals } from '../transport/transport';

/** What the phone shows once the api has turned this build away (`F4-36`). */
export interface UpdateRequired {
  /** This build's own store version, as it sent it. */
  readonly currentVersion: string;
  readonly requiredVersion: string;
  readonly storePlatform: StorePlatform;
  /** This platform's link from the refusal. */
  readonly storeUrl: string;
}

export interface UpgradeStore {
  readonly signals: UpgradeSignals;
  getSnapshot(): UpdateRequired | null;
  subscribe(listener: () => void): () => void;
}

/**
 * `null` until the api refuses this build, then the refusal — and it STAYS until the app
 * restarts. During a roll one machine may refuse and the next still serve; a screen that cleared
 * on the next served call would flicker the person back into an app that is about to fail again.
 */
export function createUpgradeStore(build: {
  appVersion: string;
  storePlatform: StorePlatform;
}): UpgradeStore {
  let snapshot: UpdateRequired | null = null;
  const listeners = new Set<() => void>();

  return {
    signals: {
      onUpgradeRequired(upgrade) {
        if (snapshot !== null) return;
        snapshot = {
          currentVersion: build.appVersion,
          requiredVersion: upgrade.requiredVersion,
          storePlatform: build.storePlatform,
          storeUrl: upgrade.storeUrls[build.storePlatform],
        };
        for (const listener of listeners) listener();
      },
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The web's: it sends no version, so the api never refuses it and this never moves. */
export const NEVER_REFUSED: UpgradeStore = {
  signals: { onUpgradeRequired: () => undefined },
  getSnapshot: () => null,
  subscribe: () => () => undefined,
};

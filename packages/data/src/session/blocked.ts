import type { EntitlementBlocked } from '@heliogrid/contracts';
import type { BlockedSignals } from '../transport/transport';

/** One refusal to show, numbered so the same refusal twice still opens the denial again. */
export interface BlockedRefusal {
  readonly blocked: EntitlementBlocked;
  readonly seq: number;
}

export interface BlockedStore {
  readonly signals: BlockedSignals;
  getSnapshot(): BlockedRefusal | null;
  subscribe(listener: () => void): () => void;
  /** The person closed the denial: it goes until the next refusal. */
  dismiss(): void;
}

/**
 * The latest save the billing gate refused (`M12-21`), held for the one denial the app draws: the
 * transport reports every `ENTITLEMENT_BLOCKED` here and still rejects the call, so the screen
 * that saved learns it failed and the denial says why — one message for one act.
 */
export function createBlockedStore(): BlockedStore {
  let snapshot: BlockedRefusal | null = null;
  let seq = 0;
  const listeners = new Set<() => void>();
  const tell = () => {
    for (const listener of listeners) listener();
  };
  return {
    signals: {
      onEntitlementBlocked(blocked) {
        seq += 1;
        snapshot = { blocked, seq };
        tell();
      },
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dismiss() {
      if (snapshot === null) return;
      snapshot = null;
      tell();
    },
  };
}

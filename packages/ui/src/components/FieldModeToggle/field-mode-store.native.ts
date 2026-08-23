/*
 * The same one-store contract as the web half, for React Native.
 *
 * TWO THINGS THE PLATFORM DOES NOT GIVE US, named rather than faked:
 *
 *  · There is no <html> and no token layer to override, so flipping the mode here cannot re-tint
 *    the tree the way the web's `[data-field-mode="on"]` scope does. The native halves in this
 *    package read `@heliogrid/theme`'s static values; `theme.fieldMode.on` exists and is what a
 *    future theme provider would swap in. Until that provider lands, this store is the switch's
 *    honest state and every consumer agrees on it — which is the half the store was for.
 *  · There is no persistence. `@heliogrid/ui` takes no storage dependency, and the DS's own
 *    persistence is `window.localStorage`. The mode is per-session on native.
 */

const subs = new Set<() => void>();
let current = false;

/** The store's value. */
export function getFieldMode(): boolean {
  return current;
}

/** Native has no server render; the same snapshot answers both. */
export function getServerFieldMode(): boolean {
  return current;
}

/** Set the mode without the switch — a deep link, a QA harness. Every mounted consumer re-renders. */
export function setFieldMode(on: boolean): void {
  current = on === true;
  for (const fn of subs) {
    fn();
  }
}

/** Subscribe a consumer. */
export function subscribeFieldMode(onStoreChange: () => void): () => void {
  subs.add(onStoreChange);
  return () => {
    subs.delete(onStoreChange);
  };
}

import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The phone's setting, asked once and then followed: the answer is asynchronous, so it is held
 * here from the first component that reads it, and a sheet opened by a tap reads the settled one.
 */
let reduced = false;
let asked = false;
const listeners = new Set<() => void>();

function settle(next: boolean): void {
  if (next === reduced) return;
  reduced = next;
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  if (!asked) {
    asked = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(settle);
    AccessibilityInfo.addEventListener('reduceMotionChanged', settle);
  }
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/**
 * Whether the person asked for reduced motion (`F7-51` floor 3): read once here for every
 * component, never by its own `AccessibilityInfo` call. With it on a motion shows its end state.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => reduced,
    () => reduced,
  );
}

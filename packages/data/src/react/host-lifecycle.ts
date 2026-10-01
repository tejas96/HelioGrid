import { focusManager, onlineManager } from '@tanstack/react-query';

/** The host's own word for "the person is looking" and "the network is there" — AppState, NetInfo. */
export interface HostLifecycle {
  /** Calls back with the current focus, then on every change; returns the unsubscribe. */
  followFocus(listener: (focused: boolean) => void): () => void;
  /** Calls back with the current reachability, then on every change; returns the unsubscribe. */
  followOnline(listener: (online: boolean) => void): () => void;
}

/**
 * Feeds the host's focus and network into THIS package's query client, so a read refreshes when
 * the app comes back and waits while the network is gone. It lives here, never in an app: the app
 * importing the query library itself loaded a second copy under Metro (this package's build is
 * CommonJS, the app's import ES modules), and its listeners then drove a manager no query reads —
 * coming back to the phone app refreshed nothing. Returns the teardown.
 */
export function followHostLifecycle(host: HostLifecycle): () => void {
  focusManager.setEventListener((setFocused) => host.followFocus(setFocused));
  onlineManager.setEventListener((setOnline) => host.followOnline(setOnline));
  return () => {
    focusManager.setEventListener(() => undefined);
    focusManager.setFocused(undefined);
    onlineManager.setEventListener(() => undefined);
    onlineManager.setOnline(true);
  };
}

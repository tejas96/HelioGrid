'use client';
import { onlineManager } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

/** Whether the device can reach anything, and the retry the no-connection screen offers. */
export interface Connection {
  readonly online: boolean;
  /**
   * The device's last word again — `false` while it still says offline, so the screen says so. The
   * screen leaves by itself when the device reports the connection back; nothing is asked here.
   */
  retry(): Promise<boolean>;
}

/**
 * The device's own word on reachability — the browser's, or the host's through
 * `followHostLifecycle` — read from this package's query client, whose reads pause while it is
 * false. A shell shows the one no-connection screen then, instead of blocks that load forever
 * (`F8-36`).
 */
export function useConnection(): Connection {
  const online = useSyncExternalStore(
    onlineManager.subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const retry = useCallback(() => Promise.resolve(onlineManager.isOnline()), []);
  return useMemo(() => ({ online, retry }), [online, retry]);
}

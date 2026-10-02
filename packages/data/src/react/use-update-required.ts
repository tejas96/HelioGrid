'use client';
import { useSyncExternalStore } from 'react';
import type { UpdateRequired } from '../session/upgrade';
import { useDataLayer } from './context';

/**
 * The api's refusal of this build (`F4-36`), or `null`. Once set it stays until the app restarts;
 * the app root renders it in place of every surface. Always `null` on the web.
 */
export function useUpdateRequired(): UpdateRequired | null {
  const { upgrade } = useDataLayer();
  return useSyncExternalStore(upgrade.subscribe, upgrade.getSnapshot, upgrade.getSnapshot);
}

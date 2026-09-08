'use client';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { DataLayer } from '../data-layer';
import { DataLayerContext } from './context';
import { createQueryClient } from './query-client';
import { useSession } from './use-session';

/**
 * Nothing a device fetched for one person survives into the next (`F4-37`): the moment the
 * session's user changes — sign-in, sign-out, a switch — every cached read is dropped before
 * the new user's screens can ask for anything.
 */
function CacheFollowsUser() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const lastUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const userId = user?.id ?? null;
    if (lastUserId.current !== undefined && lastUserId.current !== userId) queryClient.clear();
    lastUserId.current = userId;
  }, [user?.id, queryClient]);
  return null;
}

export function DataProvider({ layer, children }: { layer: DataLayer; children: ReactNode }) {
  // useState initialiser, not a module constant: one client per mounted tree, created once.
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <DataLayerContext.Provider value={layer}>
        <CacheFollowsUser />
        {children}
      </DataLayerContext.Provider>
    </QueryClientProvider>
  );
}

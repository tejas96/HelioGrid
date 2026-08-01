'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import type { DataLayer } from '../data-layer';
import { DataLayerContext } from './context';

/** Query defaults live HERE — one definition for both platforms, which had drifted. */
function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });
}

export function DataProvider({ layer, children }: { layer: DataLayer; children: ReactNode }) {
  // useState initialiser, not a module constant: one client per mounted tree, created once.
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <DataLayerContext.Provider value={layer}>{children}</DataLayerContext.Provider>
    </QueryClientProvider>
  );
}

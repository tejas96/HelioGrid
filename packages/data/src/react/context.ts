'use client';
import { createContext, useContext } from 'react';
import type { DataLayer, Repositories } from '../data-layer';

export const DataLayerContext = createContext<DataLayer | null>(null);

export function useDataLayer(): DataLayer {
  const layer = useContext(DataLayerContext);
  if (!layer) throw new Error('useDataLayer must be used inside <DataProvider>');
  return layer;
}

export function useRepositories(): Repositories {
  return useDataLayer().repositories;
}

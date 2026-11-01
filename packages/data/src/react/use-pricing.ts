'use client';
import type { PublicPricingRead } from '@heliogrid/contracts';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { readOf } from './read';

/** A market's public price list; `empty` when it publishes none (`SCR-M12-01`). */
export function usePricing(marketCode: string) {
  const repositories = useRepositories();
  const pricing = useQuery({
    queryKey: queryKeys.pricing.current(marketCode),
    queryFn: ({ signal }) => repositories.pricing.current(marketCode, signal),
  });
  return readOf<PublicPricingRead | null>(pricing, (value) => value === null);
}

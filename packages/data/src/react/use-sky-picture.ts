'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRepositories } from './context';

/**
 * The sky picture a studio opens on (`T-M05-002a`), fetched for this opening and dropped with it —
 * never kept — or, while a person picks it, Google's straight-down picture from the site's height
 * data in its place (`T-M05-002`, part g), for this opening alone.
 */
export function useSkyPicture(
  designId: string,
  ready: boolean,
  designKey: readonly unknown[],
  tenantId: string,
) {
  const repositories = useRepositories();
  const [straightDown, setStraightDown] = useState(false);
  const skyQuery = useQuery({
    queryKey: [...designKey, 'sky-picture', straightDown],
    queryFn: ({ signal }) =>
      repositories.studio.skyPicture(designId, signal, straightDown ? 'straight_down' : undefined),
    enabled: tenantId !== '' && ready,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
  return { skyQuery, straightDown, setStraightDown };
}

'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '../cache/keys';
import { useTenantId } from './use-tenant-id';

/** The import this device follows, and whether its report has been shown since it completed. */
interface Followed {
  readonly jobId: string;
  readonly reportSeen: boolean;
}

/**
 * The import a person started or opened on this device, held for as long as the app runs, so
 * leaving the wizard mid-run and coming back finds its progress or its report (`M02-21`). Once its
 * report has been shown, coming back starts a new import; *Import another file* lets it go. Held
 * in the data layer's own cache, never sent anywhere.
 */
export function useFollowedImport() {
  const tenantId = useTenantId();
  const queryClient = useQueryClient();
  const key = queryKeys.crm.leadImportFollowed(tenantId);
  const held = useQuery<Followed | null>({
    queryKey: key,
    queryFn: () => queryClient.getQueryData<Followed | null>(key) ?? null,
    initialData: null,
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  const followed = held.data;

  const follow = useCallback(
    (jobId: string | null, reportShown: boolean) => {
      if (jobId === null) return;
      const now = queryClient.getQueryData<Followed | null>(key) ?? null;
      const reportSeen = reportShown || (now?.jobId === jobId && now.reportSeen);
      if (now?.jobId === jobId && now.reportSeen === reportSeen) return;
      const next: Followed = { jobId, reportSeen };
      queryClient.setQueryData(key, next);
    },
    [queryClient, key],
  );
  const forget = useCallback(() => queryClient.setQueryData(key, null), [queryClient, key]);

  return {
    /** The followed import to open on coming back: one whose report has not been shown yet. */
    resumable: resumableOf(followed),
    /** The same, read from the cache this moment: a *forget* in the same press is already seen. */
    resumableNow: () => resumableOf(queryClient.getQueryData<Followed | null>(key) ?? null),
    follow,
    forget,
  };
}

function resumableOf(followed: Followed | null): string | null {
  return followed === null || followed.reportSeen ? null : followed.jobId;
}

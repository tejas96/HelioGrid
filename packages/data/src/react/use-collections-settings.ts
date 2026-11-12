'use client';
import type { CollectionsSettings, CollectionsSettingsWrite } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useTenantId } from './use-tenant-id';

export interface CollectionsSettingsScreen {
  readonly read: Exclude<Read<CollectionsSettings>, { readonly kind: 'empty' }>;
  readonly saving: boolean;
  /** The UPI ID did not read as name@bank, or the save failed. */
  readonly failure: 'malformed' | 'failed' | null;
  save(write: CollectionsSettingsWrite): Promise<boolean>;
}

/**
 * How customers pay the company (`SCR-M11-04`): its UPI ID and the name a UPI app shows, saved by
 * its owner; every project's pay request reads them, so a save refreshes the projects too.
 */
export function useCollectionsSettings(): CollectionsSettingsScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const key = queryKeys.settings.collections(tenantId);
  const settings = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.settings.collections(signal),
    enabled: tenantId !== '',
  });
  const action = useAction(
    (write: CollectionsSettingsWrite) => repositories.settings.saveCollections(write),
    {
      onDone: async (saved) => {
        queryClient.setQueryData(key, saved);
        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
      },
    },
  );
  const failed = action.failure;
  return {
    read: recordReadOf(settings),
    saving: action.pending,
    failure:
      failed === null
        ? null
        : failed instanceof ApiError && failed.status === 422
          ? 'malformed'
          : 'failed',
    save: async (write) => (await action.run(write)).kind === 'done',
  };
}

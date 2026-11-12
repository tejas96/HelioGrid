'use client';
import type { CollectionsSettings, CollectionsSettingsWrite } from '@heliogrid/contracts';
import { opensSettingsRow, type Read, type SettingsStanding, standingOf } from '@heliogrid/domain';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { queryKeys } from '../cache/keys';
import { ApiError } from '../errors/errors';
import { useAction } from './action';
import { useRepositories } from './context';
import { recordReadOf } from './read';
import { useSession } from './use-session';
import { useTenantId } from './use-tenant-id';

/** The UPI ID and shown name as the owner is typing them. */
export interface CollectionsDraft {
  readonly upiId: string;
  readonly payee: string;
}

export interface CollectionsSettingsScreen {
  /** Only a person whose presets open the row reaches it (`F7-48`). */
  readonly allowed: boolean;
  readonly read: Exclude<Read<CollectionsSettings>, { readonly kind: 'empty' }>;
  /** Who saved where the money goes last, and when — the line under the page's lead. */
  readonly standing: SettingsStanding;
  readonly saving: boolean;
  /** The UPI ID did not read as name@bank, or the save failed. */
  readonly failure: 'malformed' | 'failed' | null;
  /** What the fields hold: the saved values until the owner types. */
  readonly draft: CollectionsDraft;
  edit(next: Partial<CollectionsDraft>): void;
  /** Something typed differs from what is saved, and may be saved: a shown name is required. */
  readonly changed: boolean;
  discard(): void;
  save(): Promise<boolean>;
}

/**
 * How customers pay the company (`SCR-M11-04`): its UPI ID and the name a UPI app shows, saved by
 * its owner; every project's pay request reads them, so a save refreshes the projects too.
 */
export function useCollectionsSettings(): CollectionsSettingsScreen {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const { user } = useSession();
  const allowed = opensSettingsRow(user?.tenant?.roles ?? [], 'collections');
  const [typed, setTyped] = useState<CollectionsDraft | null>(null);
  const key = queryKeys.settings.collections(tenantId);
  const settings = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => repositories.settings.collections(signal),
    enabled: allowed && tenantId !== '',
  });
  const action = useAction(
    (write: CollectionsSettingsWrite) => repositories.settings.saveCollections(write),
    {
      onDone: async (saved) => {
        queryClient.setQueryData(key, saved);
        setTyped(null);
        await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(tenantId) });
      },
    },
  );
  const stored = settings.data?.payTo;
  const savedDraft = { upiId: stored?.upiId ?? '', payee: stored?.payee ?? '' };
  const draft = typed ?? savedDraft;
  const write = writeOf(draft);
  const changed =
    typed !== null &&
    write.payee !== '' &&
    (write.upiId !== (stored?.upiId ?? null) || write.payee !== stored?.payee);
  const failed = action.failure;
  return {
    allowed,
    read: recordReadOf(settings),
    standing: standingOf(settings.data?.lastSaved) ?? { kind: 'never-set' },
    saving: action.pending,
    failure:
      failed === null
        ? null
        : failed instanceof ApiError && failed.status === 422
          ? 'malformed'
          : 'failed',
    draft,
    edit: (next) => setTyped({ ...draft, ...next }),
    changed,
    discard: () => setTyped(null),
    save: async () => changed && (await action.run(writeOf(draft))).kind === 'done',
  };
}

/** The save as typed: an empty UPI ID takes it away; the shown name is trimmed. */
function writeOf(draft: CollectionsDraft): {
  readonly upiId: string | null;
  readonly payee: string;
} {
  const id = draft.upiId.trim();
  return { upiId: id === '' ? null : id, payee: draft.payee.trim() };
}

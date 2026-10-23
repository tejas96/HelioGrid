'use client';
import type { SavedPhoto } from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';
import { useFileLink } from './use-file-link';
import { useSession } from './use-session';

/**
 * My photo in the company I act under (`M01-14`): held is the server's answer, known before and
 * apart from its picture, which is `null` while it is read, when I have none, and when its link
 * cannot be had.
 */
export function useMyPhoto(): SavedPhoto {
  const { user, ended } = useSession();
  const tenantId = user?.tenant?.id ?? '';
  const repositories = useRepositories();
  const photo = useQuery({
    queryKey: queryKeys.myPhoto(tenantId),
    queryFn: ({ signal }) => repositories.user.myPhoto(signal),
    enabled: tenantId !== '' && ended === null,
  });
  const fileId = photo.data?.photoFileId ?? null;
  return { held: fileId !== null, picture: useFileLink(tenantId, fileId) };
}

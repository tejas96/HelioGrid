'use client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../cache/keys';
import { useRepositories } from './context';

/**
 * A stored file's picture: its download link, or `null` while there is no file or no link yet.
 * The link is read once while it is held: a new link is another address for the same picture, so
 * asking again would only redraw it. An unused link drops out of the cache before it dies, so a
 * screen opened later asks for a fresh one.
 */
export function useFileLink(
  tenantId: string,
  fileId: string | null,
  enabled = true,
): string | null {
  const repositories = useRepositories();
  const link = useQuery({
    queryKey: queryKeys.files.downloadUrl(tenantId, fileId ?? ''),
    queryFn: ({ signal }) => repositories.file.downloadUrl(fileId ?? '', signal),
    enabled: enabled && fileId !== null,
    staleTime: Number.POSITIVE_INFINITY,
    networkMode: 'always',
  });
  return fileId === null ? null : (link.data?.url ?? null);
}

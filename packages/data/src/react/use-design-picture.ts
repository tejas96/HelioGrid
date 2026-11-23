'use client';
import {
  type DesignPictureWire,
  type PlanLines,
  planLinesSchema,
  type SkyPictureWire,
} from '@heliogrid/contracts';
import {
  FILE_DOWNLOAD_LINK_SECONDS,
  type Read,
  type SkyPictureRead,
  type StudioDocument,
  shownPicture,
} from '@heliogrid/domain';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '../cache/keys';
import { DataError } from '../errors/errors';
import { useRepositories } from './context';
import { readOf } from './read';
import { pictureOf, piecesOf, type StudioPicture, skyReadOf } from './studio-document-state';
import { useTenantId } from './use-tenant-id';

/** A design's own picture and its plan's lines, as the studio shows them (`T-M05-002d`). */

const MS_PER_SECOND = 1_000;
const RENEW_BEFORE_SECONDS = 60;
const LINK_RENEW_MS = (FILE_DOWNLOAD_LINK_SECONDS - RENEW_BEFORE_SECONDS) * MS_PER_SECOND;

/** The lines of one page, fetched by their short-lived link and held to the contract. */
export async function linesAt(url: string, signal?: AbortSignal): Promise<PlanLines> {
  const answer = await fetch(url, { signal });
  if (!answer.ok) throw new DataError('The plan’s lines did not load.', true, 'no_answer');
  return planLinesSchema.parse(await answer.json());
}

/** A picture of the design's own as it stands, read once per opening and kept while it is shown. */
export function useDesignPicture(
  designId: string,
  pictureId: string | null,
): Read<DesignPictureWire> {
  const { studio } = useRepositories();
  const tenantId = useTenantId();
  const query = useQuery({
    queryKey: [...queryKeys.studio.design(tenantId, designId), 'picture', pictureId],
    queryFn: ({ signal }) => studio.picture(designId, pictureId as string, signal),
    enabled: tenantId !== '' && pictureId !== null,
    // Its links live five minutes: asked again a minute before they die, so a page turned or a
    // ground drawn again later still reaches its files.
    // A tab back from the background asks again too, its timer having slept.
    staleTime: LINK_RENEW_MS,
    refetchInterval: LINK_RENEW_MS,
    gcTime: 0,
  });
  return readOf(query);
}

/** One page's lines of a laid plan, fetched once its picture is read. */
export function usePlanLines(picture: DesignPictureWire | null, page: number): Read<PlanLines> {
  const part = picture?.files.find((file) => file.role === 'lines' && file.page === page);
  const query = useQuery({
    queryKey: ['plan-lines', picture?.id ?? null, page],
    queryFn: ({ signal }) => linesAt(part?.url as string, signal),
    enabled: part !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    // The page shown stays while ‹ › fetches the next, so the plan never blinks out; a new plan
    // never shows the old one's lines.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[1] === (picture?.id ?? null) ? previous : undefined,
  });
  return readOf(query);
}

/**
 * The picture the ground shows (`T-M05-002d`): the sky picture, the company's own once it is read,
 * or none — and the sky picture as domain's rules read it.
 */
export function useStudioPicture(
  designId: string,
  document: StudioDocument | null,
  skyRead: Read<SkyPictureWire>,
): { readonly sky: SkyPictureRead; readonly picture: StudioPicture } {
  const sky = skyReadOf(skyRead);
  const laid = document?.ownPicture ?? null;
  const read = useDesignPicture(designId, laid?.pictureId ?? null);
  const shown = shownPicture(document?.picture ?? null, sky, laid !== null);
  // One pieces list per read: the ground is drawn again only when its files change, never on a
  // turn, a drag or a slider.
  const value = read.kind === 'ready' ? read.value : null;
  const pieces = useMemo(() => (value === null ? [] : piecesOf(value)), [value]);
  const picture = pictureOf(shown, skyRead, { read, laid });
  return { sky, picture: picture.kind === 'own' ? { ...picture, pieces } : picture };
}

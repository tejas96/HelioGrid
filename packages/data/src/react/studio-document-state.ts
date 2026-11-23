'use client';
import type {
  DesignPictureWire,
  EditTurnWire,
  MemberRef,
  SkyPicturePiece,
  SkyPictureWire,
} from '@heliogrid/contracts';
import {
  EDIT_TURN_RENEW_SECONDS,
  type History,
  historyOf,
  type LaidPicture,
  type NoPictureReason,
  type PictureChoice,
  type PictureStamp,
  type Read,
  type ShownPicture,
  SKY_PICTURE_GAPS,
  type SkyPictureGap,
  type SkyPictureRead,
  type StudioDocument,
} from '@heliogrid/domain';
import { onlineManager, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { queryKeys } from '../cache/keys';
import { DesignActRefusedError } from '../studio/studio-repository';
import { useRepositories } from './context';
import { StudioSaveQueue, type StudioSaveState } from './studio-save-queue';
import { useTenantId } from './use-tenant-id';

/** What the ground shows: the sky picture with its facts, nothing yet, or no picture and why. */
export type StudioPicture =
  | { readonly kind: 'waiting' }
  | {
      readonly kind: 'sky';
      readonly source: string;
      readonly credit: string;
      readonly metresPerPixel: number;
      readonly takenOn: string | null;
      readonly pieces: readonly SkyPicturePiece[];
      /** The softer picture round the sharp one; empty where the api gave none. */
      readonly around: readonly SkyPicturePiece[];
    }
  /**
   * The company's own photo or drone map (`T-M05-002d`): its pieces in the picture's own units,
   * laid on the ground by `laid`. A drone map's sharpness, and whether its place was read.
   */
  | {
      readonly kind: 'own';
      readonly pictureKind: 'photo' | 'drone';
      readonly name: string;
      readonly takenOn: string | null;
      readonly metresPerPixel: number | null;
      readonly placeRead: boolean;
      readonly laid: LaidPicture;
      readonly pieces: readonly SkyPicturePiece[];
    }
  | { readonly kind: 'none'; readonly reason: NoPictureReason };

/**
 * Whether the reader may change the design now. `view-only` with an editor: another person holds
 * the turn. Without one: the reader may not edit designs, or the lead takes no more change.
 */
export type StudioEditing =
  | { readonly kind: 'opening' }
  | { readonly kind: 'editor' }
  | { readonly kind: 'view-only'; readonly editor: MemberRef | null };

/** A change that could not go is tried again this often while it waits. */
const RETRY_MS = 5_000;
const MS_PER_SECOND = 1_000;

export type Turn =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'closed' }
  | { readonly kind: 'mine' }
  | { readonly kind: 'theirs'; readonly editor: MemberRef };

const isSkyPictureGap = (gap: string): gap is SkyPictureGap =>
  (SKY_PICTURE_GAPS as readonly string[]).includes(gap);

/** The sky picture as domain's rule reads it: a failed read is a provider that did not answer. */
export function skyReadOf(read: Read<SkyPictureWire>): SkyPictureRead {
  if (read.kind === 'failed') return { kind: 'none', gap: 'not_answered' };
  if (read.kind !== 'ready') return { kind: 'loading' };
  if (read.value.kind === 'none') {
    const { gap } = read.value;
    // A reason a newer api learned reads as the provider not answering: the studio still opens.
    return { kind: 'none', gap: isSkyPictureGap(gap) ? gap : 'not_answered' };
  }
  return { kind: 'ready', takenOn: read.value.takenOn };
}

/** The sky picture's sharpness and date, read whether it shows or not: the picker names them. */
export interface SkyFacts {
  readonly metresPerPixel: number;
  readonly takenOn: string | null;
}

export function skyFactsOf(read: Read<SkyPictureWire>): SkyFacts | null {
  if (read.kind !== 'ready' || read.value.kind !== 'picture') return null;
  return { metresPerPixel: read.value.metresPerPixel, takenOn: read.value.takenOn };
}

/** Your picture's pieces, each with its box in the picture's own units. */
export function piecesOf(picture: DesignPictureWire): readonly SkyPicturePiece[] {
  return picture.files.flatMap((part) =>
    part.role === 'piece' && part.box !== null ? [{ image: part.url, ...part.box }] : [],
  );
}

/**
 * What the ground shows: the sky picture with its facts, or the company's own laid where the
 * document lays it, once each is read.
 */
export function pictureOf(
  shown: ShownPicture,
  sky: Read<SkyPictureWire>,
  own: { readonly read: Read<DesignPictureWire>; readonly laid: LaidPicture | null },
): StudioPicture {
  if (shown.kind === 'none') return shown;
  if (shown.kind === 'sky' && sky.kind === 'ready' && sky.value.kind === 'picture') {
    const { kind: _picture, around, ...facts } = sky.value;
    return { kind: 'sky', ...facts, around: around ?? [] };
  }
  if (shown.kind === 'own' && own.read.kind === 'ready' && own.laid !== null) {
    const picture = own.read.value;
    const pieces = piecesOf(picture);
    return {
      kind: 'own',
      pictureKind: picture.kind === 'drone' ? 'drone' : 'photo',
      name: picture.name,
      takenOn: picture.facts?.takenOn ?? null,
      metresPerPixel: picture.kind === 'drone' ? (picture.facts?.metresPerUnit ?? null) : null,
      placeRead: picture.facts?.centre != null,
      laid: own.laid,
      pieces,
    };
  }
  return { kind: 'waiting' };
}

/** The picture a roof is drawn on, kept so a newer one is told apart; `null` on the bare grid. */
export function stampOf(picture: StudioPicture): PictureStamp | null {
  if (picture.kind === 'sky') return { source: picture.source, takenOn: picture.takenOn };
  if (picture.kind === 'own') return { source: 'own', takenOn: picture.takenOn };
  return null;
}

/** The picture a roof drawn now is traced on. */
export function tracedOnOf(picture: StudioPicture): PictureChoice {
  return picture.kind === 'sky' || picture.kind === 'own' ? picture.kind : 'none';
}

/** Whether the reader may change the design now, and if not, whose turn it is. */
export function editingOf(
  canEdit: boolean | null,
  saving: StudioSaveState,
  turn: Turn,
  opened: boolean,
): StudioEditing {
  if (canEdit === null) return { kind: 'opening' };
  const shut = saving.kind === 'closed' || saving.kind === 'refused' || turn.kind === 'closed';
  if (!canEdit || shut) return { kind: 'view-only', editor: null };
  if (saving.kind === 'turn-held') return { kind: 'view-only', editor: saving.editor };
  if (turn.kind === 'theirs') return { kind: 'view-only', editor: turn.editor };
  if (turn.kind === 'unknown' || !opened) return { kind: 'opening' };
  return { kind: 'editor' };
}

/**
 * The turn to edit: taken on opening, renewed while open, given back on leaving. A turn that comes
 * free after another person held it reads the design again, as its last editor left it.
 */
/**
 * Whose turn it is after one ask: the reader's, another person's, or no one's on a closed lead,
 * which opens the studio view-only. `null` when no answer came: the turn stays as it was, and the
 * next renewal asks again.
 */
async function turnTaken(ask: () => Promise<EditTurnWire>): Promise<Turn | null> {
  try {
    const answer = await ask();
    return answer === null || answer.mine
      ? { kind: 'mine' }
      : { kind: 'theirs', editor: answer.editor };
  } catch (error) {
    return error instanceof DesignActRefusedError ? { kind: 'closed' } : null;
  }
}

export function useEditTurn(
  canEdit: boolean,
  designId: string,
  queue: StudioSaveQueue,
  readAgain: () => unknown,
): Turn {
  const repositories = useRepositories();
  const [turn, setTurn] = useState<Turn>({ kind: 'unknown' });
  useEffect(() => {
    if (!canEdit) return;
    let live = true;
    let held: Turn['kind'] = 'unknown';
    const take = async () => {
      const next = await turnTaken(() => repositories.studio.takeEditTurn(designId));
      if (!live || next === null) return;
      if (held === 'theirs' && next.kind === 'mine') void readAgain();
      held = next.kind;
      setTurn(next);
    };
    void take();
    const renew = setInterval(() => void take(), EDIT_TURN_RENEW_SECONDS * MS_PER_SECOND);
    return () => {
      live = false;
      clearInterval(renew);
      // A save still out or waiting keeps the turn: it is handed back once the queue settles.
      void queue
        .settled()
        .then(() => repositories.studio.giveEditTurn(designId))
        .catch(() => undefined);
    };
  }, [canEdit, repositories, designId, queue, readAgain]);
  return turn;
}

/** A change that waits goes when the connection returns, and is tried again while it waits. */
export function useSaveRetries(queue: StudioSaveQueue, saving: StudioSaveState): void {
  useEffect(() => onlineManager.subscribe((online) => online && void queue.flush()), [queue]);
  useEffect(() => {
    if (saving.kind !== 'offline' && saving.kind !== 'failed') return;
    const again = setTimeout(() => void queue.flush(), RETRY_MS);
    return () => clearTimeout(again);
  }, [saving, queue]);
}

/**
 * The design's document as the studio holds it: read once for the opening, its history of every
 * change since, and the one queue that saves each change. The sky picture is read beside it,
 * fetched for this opening and dropped with it — never kept (`T-M05-002a`).
 */
export function useStudioDocument(designId: string, ready: boolean) {
  const repositories = useRepositories();
  const tenantId = useTenantId();
  const designKey = queryKeys.studio.design(tenantId, designId);
  const documentQuery = useQuery({
    queryKey: [...designKey, 'document'],
    queryFn: ({ signal }) => repositories.studio.document(designId, signal),
    enabled: tenantId !== '' && ready,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
  const skyQuery = useQuery({
    queryKey: [...designKey, 'sky-picture'],
    queryFn: ({ signal }) => repositories.studio.skyPicture(designId, signal),
    enabled: tenantId !== '' && ready,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });

  const [history, setHistory] = useState<History<StudioDocument> | null>(null);
  const latest = useRef(history);
  latest.current = history;
  const [saving, setSaving] = useState<StudioSaveState>({ kind: 'saved' });
  const queue = useMemo(
    () =>
      new StudioSaveQueue({
        send: (baseVersion, document, opening) =>
          repositories.studio.saveDocument(designId, {
            baseVersion,
            // The wire's lists are plain arrays; the studio holds them read-only.
            document: {
              ...document,
              roofs: document.roofs.map(({ sides, ...roof }) => {
                const lists = { corners: [...roof.corners], edges: [...roof.edges] };
                return sides === undefined
                  ? { ...roof, ...lists }
                  : { ...roof, ...lists, sides: [...sides] };
              }),
            },
            opening,
          }),
        online: () => onlineManager.isOnline(),
        changed: setSaving,
      }),
    [repositories, designId],
  );

  // A document read — the first, or the one "Open theirs" asks for — starts the history and the queue.
  const { data: stored } = documentQuery;
  useEffect(() => {
    if (stored === undefined) return;
    setHistory(historyOf(stored.document));
    queue.start(stored.version);
  }, [stored, queue]);
  return { documentQuery, skyQuery, history, latest, setHistory, saving, queue };
}

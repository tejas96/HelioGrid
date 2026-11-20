'use client';
import {
  type History,
  historyAfter,
  historyRedone,
  historyUndone,
  type MeasurementSystem,
  OPENING_VIEW,
  type PictureChoice,
  pictureNewerThanDrawn,
  type ScaleBar,
  type StepPlace,
  type StudioDocument,
  type StudioView,
  type SunPosition,
  scaleBarOf,
  sceneSunAt,
  shownPicture,
  stepRail,
  type ViewPlace,
  viewsOffered,
} from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { readOf } from './read';
import {
  editingOf,
  pictureOf,
  type StudioEditing,
  type StudioPicture,
  skyReadOf,
  useEditTurn,
  useSaveRetries,
  useStudioDocument,
} from './studio-document-state';
import type { StudioSaveState } from './studio-save-queue';
import { type DesignRead, useDesignScreen } from './use-design-screen';
import { useSession } from './use-session';

export type { StudioEditing, StudioPicture } from './studio-document-state';
export type { StudioSaveState } from './studio-save-queue';

export interface StudioMoves {
  pickPicture(choice: PictureChoice): void;
  undo(): void;
  redo(): void;
  chooseUnits(system: MeasurementSystem): void;
  /** After someone saved first: the design as they left it, read again. */
  openTheirs(): void;
  /** A change that waits, sent now. */
  retry(): void;
  /** The "Picture updated · check the outline" note, seen. */
  pictureChecked(): void;
  /** The camera's view of the model: the top, the 3D view or a side. */
  see(view: StudioView): void;
  /** The three pictures shown or put away. */
  showPictures(open: boolean): void;
}

export interface StudioScreen {
  readonly read: DesignRead;
  /** `null` until the document is read. */
  readonly document: StudioDocument | null;
  readonly picture: StudioPicture;
  /** The sky picture is newer than the one the roof was drawn on, and the note is not seen yet. */
  readonly pictureUpdated: boolean;
  readonly editing: StudioEditing;
  readonly saving: StudioSaveState;
  readonly units: MeasurementSystem;
  readonly rail: readonly StepPlace[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** How the model is seen now; the studio opens on the flat top view. */
  readonly view: StudioView;
  /** The views on offer, each open or waiting with its reason. */
  readonly views: readonly ViewPlace[];
  /** The map's scale bar at the ground one screen pixel covers now, in the reader's units. */
  scaleBar(metresPerPixel: number, maxPixels: number): ScaleBar | null;
  /** The three pictures are open to pick from. */
  readonly picturesOpen: boolean;
  /** The sun the scene is lit by: the real sun for the site now, or its noon after dark. */
  readonly sun: SunPosition | null;
  readonly moves: StudioMoves;
}

/**
 * The studio's canvas (`T-M05-002a`): the design, its document and the sky picture under it; each
 * change saved the moment it is made, one editor at a time, Undo and Redo through every change
 * since the design opened; the reader's metres or feet.
 */
export function useStudioScreen(designId: string): StudioScreen {
  const session = useSession();
  const { read } = useDesignScreen(designId);
  const ready = read.kind === 'ready';
  const canEdit = ready && read.value.canEdit;

  const { documentQuery, skyQuery, history, latest, setHistory, saving, queue } = useStudioDocument(
    designId,
    ready,
  );
  const [pictureSeen, setPictureSeen] = useState(false);
  const [view, setView] = useState<StudioView>(OPENING_VIEW);
  /** No roof can be drawn yet: the rail and the views wait for one. */
  const roofClosed = false;
  const views = viewsOffered(roofClosed);
  const units = session.user?.unitPreference ?? 'metric';
  const [picturesOpen, setPicturesOpen] = useState(false);
  const pin = ready ? read.value.site.pin : null;
  // The sun is read once for the opening: the scene does not move with the clock.
  const sun = useMemo(() => (pin === null ? null : sceneSunAt(pin, Date.now())), [pin]);

  const refetchDocument = documentQuery.refetch;
  const turn = useEditTurn(canEdit, designId, queue, refetchDocument);
  useSaveRetries(queue, saving);

  const editing = editingOf(ready ? canEdit : null, saving, turn, history !== null);
  const editable = editing.kind === 'editor' && saving.kind !== 'saved-first';

  const change = (next: History<StudioDocument>) => {
    if (!editable || next === latest.current) return;
    latest.current = next;
    setHistory(next);
    queue.put(next.present);
  };

  const document = history?.present ?? null;
  const skyRead = readOf(skyQuery);
  const sky = skyReadOf(skyRead);
  const picture = pictureOf(shownPicture(document?.picture ?? null, sky), skyRead);

  return {
    read,
    document,
    picture,
    pictureUpdated:
      !pictureSeen &&
      sky.kind === 'ready' &&
      pictureNewerThanDrawn(document?.drawnOn ?? null, sky.takenOn),
    editing,
    saving,
    units,
    rail: stepRail(roofClosed),
    view,
    views,
    scaleBar: (metresPerPixel, maxPixels) => scaleBarOf(metresPerPixel, units, maxPixels),
    picturesOpen,
    sun,
    canUndo: editable && (history?.past.length ?? 0) > 0,
    canRedo: editable && (history?.future.length ?? 0) > 0,
    moves: {
      pickPicture: (choice) => {
        const at = latest.current;
        if (at === null || at.present.picture === choice) return;
        change(historyAfter(at, { ...at.present, picture: choice }));
      },
      undo: () => {
        if (latest.current !== null) change(historyUndone(latest.current));
      },
      redo: () => {
        if (latest.current !== null) change(historyRedone(latest.current));
      },
      chooseUnits: (system) => void session.setUnitPreference(system),
      openTheirs: () => void refetchDocument(),
      retry: () => void queue.flush(),
      pictureChecked: () => setPictureSeen(true),
      // A view that waits for a roof is not taken, whoever asks for it.
      see: (next) => {
        if (views.some((place) => place.view === next && place.lock === null)) setView(next);
      },
      showPictures: setPicturesOpen,
    },
  };
}

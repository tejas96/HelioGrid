'use client';
import {
  type FocusParts,
  type FormatPack,
  focusOf,
  type GroundBox,
  type History,
  historyAfter,
  historyRedone,
  historyUndone,
  type MeasurementSystem,
  OPENING_VIEW,
  type PictureChoice,
  pictureNewerThanDrawn,
  type RoofHeightShown,
  type RoofSheetView,
  roofsBox,
  type StepPlace,
  type StudioDocument,
  type StudioView,
  type SunPosition,
  sceneSunAt,
  shownPicture,
  stepRail,
  type ViewPlace,
  viewsOffered,
} from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { readOf } from './read';
import { arrivalOf, framedWithCard, useSizeCardOpens } from './size-card';
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
import { studioBack, undoRedoOf } from './studio-undo-back';
import { type DesignRead, useDesignScreen } from './use-design-screen';
import { type RoofSheetMoves, type RoofSheetState, useRoofSheet } from './use-roof-sheet';
import { type RoofMoves, type RoofStepView, useRoofStep } from './use-roof-step';
import { useSession } from './use-session';

export type { StudioEditing, StudioPicture } from './studio-document-state';
export type { StudioSaveState } from './studio-save-queue';
export type { RoofMoves, RoofStepView, SizeCardView } from './use-roof-step';

export interface StudioMoves extends RoofMoves, RoofSheetMoves {
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
  /** The phone's system back (`studioBack`): `false` with nothing open to close. */
  back(): boolean;
}

export interface StudioScreen extends RoofStepView, RoofSheetState {
  readonly read: DesignRead;
  /** `null` until the document is read. */
  readonly document: StudioDocument | null;
  readonly picture: StudioPicture;
  /** The sky picture is newer than the one the roof was drawn on, and the note is not seen yet. */
  readonly pictureUpdated: boolean;
  readonly editing: StudioEditing;
  readonly saving: StudioSaveState;
  /** A change waits, not sent: no connection, or the api did not save it. Leaving loses it. */
  readonly unsent: boolean;
  readonly units: MeasurementSystem;
  readonly rail: readonly StepPlace[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** How the model is seen now; the studio opens on the flat top view. */
  readonly view: StudioView;
  /** The views on offer, each open or waiting with its reason. */
  readonly views: readonly ViewPlace[];
  /** The three pictures are open to pick from. */
  readonly picturesOpen: boolean;
  /** The sun the scene is lit by: the real sun for the site now, or its noon after dark. */
  readonly sun: SunPosition | null;
  /** The ground the design's roofs cover, which the camera frames; `null` before a roof. */
  readonly fit: GroundBox | null;
  /** The 3D switch is marked new until the 3D view is first seen. */
  readonly offer3d: boolean;
  /** Which parts show for the job in hand, on a phone-width screen or a wider one (focus mode). */
  focus(phone: boolean): FocusParts;
  readonly moves: StudioMoves;
}

/** The roof whose sheet is open stands at the height in hand, and the camera frames it alone. */
function withSheet(
  heights: readonly RoofHeightShown[],
  fit: GroundBox | null,
  roofSheet: RoofSheetView | null,
  document: StudioDocument | null,
): { heights: readonly RoofHeightShown[]; fit: GroundBox | null } {
  const open = roofSheet === null ? undefined : document?.roofs[roofSheet.roof];
  if (roofSheet === null || open === undefined) return { heights, fit };
  return {
    heights: heights.map((height, i) => (i === roofSheet.roof ? roofSheet.height : height)),
    fit: roofsBox([open]),
  };
}

/**
 * The studio's canvas (`T-M05-002a`): the design, its document and the sky picture under it; each
 * change saved the moment it is made, one editor at a time, Undo and Redo through every change
 * since the design opened; the reader's metres or feet.
 */
export function useStudioScreen(designId: string, formats: FormatPack): StudioScreen {
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
  const units = session.user?.unitPreference ?? 'metric';
  const [seen3d, setSeen3d] = useState(false);
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
  /** The views and the rail wait for a roof that stands. */
  const roofClosed = (document?.roofs.length ?? 0) > 0;
  const views = viewsOffered(roofClosed);
  const fit = useMemo(() => roofsBox(document?.roofs ?? []), [document]);

  const roof = useRoofStep({
    document,
    latest,
    change,
    editable,
    units,
    picture,
    helpersOff: session.user?.studioHelpersOff ?? [],
    setHelpersOff: (off) => void session.setStudioPicks({ studioHelpersOff: off }),
    helpersRefused: session.refusedPreferences.includes('studio'),
    storeyHeightM: formats.storeyHeightM,
    typedStart: { length: formats.typedRoofLengthM, width: formats.typedRoofWidthM },
    numberEntry: session.user?.numberEntry ?? 'slider',
    setNumberEntry: (entry) => void session.setStudioPicks({ numberEntry: entry }),
  });
  const { step, act } = roof;
  const { roofStep } = roof.view;

  useSizeCardOpens(arrivalOf(document, picture, editing, editable, view), roof.moves.typeSize);
  const sheet = useRoofSheet({
    document,
    latest,
    change,
    editable,
    storeyHeightM: formats.storeyHeightM,
    units,
    outline: (index, metres) => {
      setView('top');
      act({ kind: 'pick_roof', roof: index, metres });
    },
  });
  const { roofSheet } = sheet.state;

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
    unsent: saving.kind === 'offline' || saving.kind === 'failed',
    units,
    rail: stepRail(roofClosed),
    view,
    views,
    ...roof.view,
    ...sheet.state,
    ...withSheet(
      roof.view.heights,
      framedWithCard(fit, document, roof.view.sizeCard),
      roofSheet,
      document,
    ),
    offer3d: roofClosed && !seen3d,
    picturesOpen,
    sun,
    ...undoRedoOf(editable, roofStep, history),
    focus: (phone) =>
      focusOf({
        job: roofSheet === null ? roof.view.job : 'sheet',
        view,
        phone,
        canEdit: editable,
        hasRoof: roofClosed,
        saveFailed: saving.kind === 'failed' || saving.kind === 'refused',
      }),
    moves: {
      ...roof.moves,
      ...sheet.moves,
      pickPicture: (choice) => {
        const at = latest.current;
        if (at === null || at.present.picture === choice) return;
        change(historyAfter(at, { ...at.present, picture: choice }));
      },
      // While drawing, Undo takes the last corner off; with a length or a drag in hand, it puts
      // that back first.
      undo: () => {
        // A height in hand is put back first, as a length or a drag is.
        if (sheet.moves.dropHeight()) return;
        const now = step.current.kind;
        const left = step.current.kind === 'idle' && Boolean(step.current.left);
        if (now === 'drawing' || left) act({ kind: 'undo_corner' });
        else if (now === 'sizing' || now === 'dragging' || now === 'typing')
          act({ kind: 'cancel' });
        else if (latest.current !== null) {
          act({ kind: 'history', undone: true });
          change(historyUndone(latest.current));
        }
      },
      redo: () => {
        if (step.current.kind === 'idle' && latest.current !== null) {
          act({ kind: 'history', undone: false });
          change(historyRedone(latest.current));
        }
      },
      chooseUnits: (system) => void session.setUnitPreference(system),
      openTheirs: () => void refetchDocument(),
      retry: () => void queue.flush(),
      pictureChecked: () => setPictureSeen(true),
      // A view that waits for a roof is not taken, whoever asks for it.
      see: (next) => {
        if (!views.some((place) => place.view === next && place.lock === null)) return;
        // A new roof is drawn, or typed, in the top view only: leaving it drops the draft.
        const held = step.current.kind;
        if (next !== 'top' && (held === 'drawing' || held === 'typing')) act({ kind: 'cancel' });
        if (next === '3d') setSeen3d(true);
        // A roof's sheet is the 3D view's: the top view keeps its height and closes it.
        if (next === 'top') void sheet.moves.done();
        setView(next);
      },
      // Drawing happens in the top view only: the camera flies there first.
      draw: () => {
        setView('top');
        roof.moves.draw();
      },
      showPictures: setPicturesOpen,
      back: () =>
        studioBack({
          picturesOpen,
          closePictures: () => setPicturesOpen(false),
          sheetOpen: roofSheet !== null,
          closeSheet: () => void sheet.moves.done(),
          step: step.current,
          act,
        }),
    },
  };
}

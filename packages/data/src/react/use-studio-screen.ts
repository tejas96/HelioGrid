'use client';
import {
  type FocusParts,
  type FormatPack,
  focusOf,
  type GroundBox,
  groundRoofHeightM,
  type History,
  historyAfter,
  type MeasurementSystem,
  OPENING_VIEW,
  type PictureChoice,
  pictureUpdatedOver,
  roofsBox,
  roofsWithSheet,
  type StepPlace,
  type StudioDocument,
  type StudioView,
  type SunPosition,
  sceneSunAt,
  stepRail,
  type ViewPlace,
  viewsOffered,
} from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { planOutlinesOf } from './own-picture-view';
import { readOf } from './read';
import { arrivalOf, framedWithCard, useSizeCardOpens } from './size-card';
import {
  editingOf,
  type SkyFacts,
  type StudioEditing,
  type StudioPicture,
  skyFactsOf,
  useEditTurn,
  useSaveRetries,
  useStudioDocument,
} from './studio-document-state';
import type { StudioSaveState } from './studio-save-queue';
import { historyStep, studioBack, undoRedoOf } from './studio-undo-back';
import { useStudioPicture } from './use-design-picture';
import { type DesignRead, useDesignScreen } from './use-design-screen';
import {
  type OwnPictureMoves,
  type OwnPictureView,
  useOwnPictureScreen,
} from './use-own-picture-screen';
import { type RoofSheetMoves, type RoofSheetState, useRoofSheet } from './use-roof-sheet';
import { type RoofMoves, type RoofStepView, useRoofStep } from './use-roof-step';
import { useSession } from './use-session';

export type { SkyFacts, StudioEditing, StudioPicture } from './studio-document-state';
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
  readonly own: OwnPictureView; // Your picture and the plan (`T-M05-002d`).
  /** The picture the roofs were drawn on is newer now, and the note is not seen yet (board 5.1). */
  readonly pictureUpdated: boolean;
  /** The sky picture's sharpness and date, shown or not; `null` while unread or where none. */
  readonly skyFacts: SkyFacts | null;
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
  readonly ownMoves: OwnPictureMoves;
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

  const turn = useEditTurn(canEdit, designId, queue, documentQuery.refetch);
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
  const { sky, picture } = useStudioPicture(designId, document, readOf(skyQuery));
  const own = useOwnPictureScreen({ designId, document, picture, latest, change, editable });
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
    startHeightM: groundRoofHeightM(formats),
    typedStart: { length: formats.typedRoofLengthM, width: formats.typedRoofWidthM },
    numberEntry: session.user?.numberEntry ?? 'slider',
    setNumberEntry: (entry) => void session.setStudioPicks({ numberEntry: entry }),
    planOutlines: planOutlinesOf(own.view.plan),
  });
  const { step, act } = roof;
  const { roofStep } = roof.view;

  useSizeCardOpens(arrivalOf(document, picture, editing, editable, view), roof.moves.typeSize);
  const sheet = useRoofSheet({
    document,
    latest,
    change,
    editable,
    startHeightM: groundRoofHeightM(formats),
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
    own: own.view,
    ownMoves: own.moves,
    pictureUpdated:
      !pictureSeen &&
      pictureUpdatedOver(
        document?.drawnOn ?? null,
        sky.kind === 'ready' ? sky.takenOn : null,
        picture.kind === 'own' ? picture.takenOn : null,
      ),
    skyFacts: skyFactsOf(readOf(skyQuery)),
    editing,
    saving,
    unsent: saving.kind === 'offline' || saving.kind === 'failed',
    units,
    rail: stepRail(roofClosed),
    view,
    views,
    ...roof.view,
    ...sheet.state,
    ...roofsWithSheet(
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
        job: roofSheet !== null ? 'sheet' : own.view.cardOpen ? 'picture' : roof.view.job,
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
          const back = historyStep(latest.current, true);
          act({ kind: 'history', undone: true, change: back.change });
          change(back.next);
        }
      },
      redo: () => {
        if (step.current.kind === 'idle' && latest.current !== null) {
          const on = historyStep(latest.current, false);
          act({ kind: 'history', undone: false, change: on.change });
          change(on.next);
        }
      },
      chooseUnits: (system) => void session.setUnitPreference(system),
      openTheirs: () => void documentQuery.refetch(),
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

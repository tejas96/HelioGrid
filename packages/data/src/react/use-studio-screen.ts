'use client';
import {
  type FormatPack,
  focusOf,
  groundRoofHeightM,
  type History,
  historyAfter,
  OPENING_VIEW,
  pictureUpdatedOver,
  roofFactsOf,
  roofsBox,
  roofsWithSheet,
  type StudioDocument,
  type StudioView,
  stepRail,
  studioJobOf,
  viewsOffered,
} from '@heliogrid/domain';
import { useMemo, useRef, useState } from 'react';
import { planOutlinesOf } from './own-picture-view';
import { readOf } from './read';
import { closingOf, roofPlaceMoves } from './roof-place-moves';
import { type RoofModelSeen, sheetHeightsWith, useRoofModel } from './roof-scene-view';
import { arrivalOf, framedWithCard, useSizeCardOpens } from './size-card';
import {
  editingOf,
  skyFactsOf,
  useEditTurn,
  useSaveRetries,
  useStudioDocument,
} from './studio-document-state';
import { framedForFaces, studioFacesMoves } from './studio-faces-moves';
import { heldViewOf } from './studio-held-view';
import type { StudioScreen } from './studio-screen-view';
import { studioBack, undoRedoMoves, undoRedoOf, useUndoSlots } from './studio-undo-back';
import { useStudioPicture } from './use-design-picture';
import { useDesignScreen } from './use-design-screen';
import { useOwnPictureScreen } from './use-own-picture-screen';
import { useRoofStep } from './use-roof-step';
import { useRoofsPanel } from './use-roofs-panel';
import { useSession } from './use-session';
import { useSiteHeights } from './use-site-data';
import { useStudioSheet } from './use-studio-sheet';
import { useStudioStairs } from './use-studio-stairs';
import { useSunBar } from './use-sun-bar';

/**
 * The studio's canvas (`T-M05-002a`): the design, its document and the sky picture under it; each
 * change saved the moment it is made, one editor at a time, Undo and Redo through every change
 * since the design opened; the reader's metres or feet.
 */
export function useStudioScreen(designId: string, formats: FormatPack): StudioScreen {
  const session = useSession();
  const { read } = useDesignScreen(designId);
  const ready = read.kind === 'ready';
  const opened = ready ? read.value : null;
  const canEdit = opened?.canEdit === true;

  const opening = useStudioDocument(designId, ready);
  const { documentQuery, skyQuery, history, latest, setHistory, saving, queue } = opening;
  const [pictureSeen, setPictureSeen] = useState(false);
  const [view, setView] = useState<StudioView>(OPENING_VIEW);
  const units = session.user?.unitPreference ?? 'metric';
  const [seen3d, setSeen3d] = useState(false);
  const [picturesOpen, setPicturesOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const pin = opened === null ? null : opened.site.pin;
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

  const facts = useMemo(() => roofFactsOf(formats), [formats]);
  const site = useSiteHeights({ ...opening, designId, ready, facts, change, pin });
  const sun = useSunBar({ pin, read: site.read, see: (n) => see(n), zone: formats.timeZone });
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
    facts,
    typedStart: { length: formats.typedRoofLengthM, width: formats.typedRoofWidthM },
    planOutlines: planOutlinesOf(own.view.plan),
    closingOf: closingOf(facts, opened?.subject.siteRoof, pin),
    siteTargets: site.targets,
  });
  const { step, act } = roof;
  const { roofStep } = roof.view;

  useSizeCardOpens(arrivalOf(document, picture, editing, editable, view), roof.moves.typeSize);
  // A tap reads the model drawn, which is built after the sheet: it is read when the tap comes.
  const seen = useRef<RoofModelSeen['hitAt']>(() => null);
  const sheet = useStudioSheet({
    document,
    latest,
    change,
    act,
    editable,
    facts,
    units,
    pin,
    ...sheetHeightsWith(facts, roof.magnetNow, site),
    hitAt: (at, beside, open) => seen.current(at, beside, open),
    magnetOn: roof.magnetNow,
  });
  const { roofSheet, numberInHand } = sheet.state;
  const numbers = roof.numbersNow(roofSheet, sheet.state.sheetPart);
  const { shown } = roof.view;
  const stairs = useStudioStairs({
    latest,
    change,
    editable,
    magnetOn: roof.magnetNow,
    // Outside: the sheet closes, and the next tap on an edge in the top view places the stairs.
    toTop: () => {
      const closed = sheet.moves.done();
      if (closed) setView('top');
      return closed;
    },
  });
  const { hitAt, ...model } = useRoofModel(
    shown,
    facts,
    roofSheet,
    pin,
    sheet.side,
    numberInHand,
    stairs.inHand,
    sheet.state.heightHeld,
    sheet.face,
  );
  seen.current = hitAt;
  const stairsMoment = stairs.seen(model);
  const place = roofPlaceMoves({ latest, step, act, facts });
  // Drawing happens in the top view only: the camera flies there first. A roof's sheet is the 3D
  // view's: its height is kept and it closes, as when the top view is picked; a height that is
  // refused keeps the sheet, and nothing is drawn.
  const draw = () => {
    if (!sheet.moves.done()) return;
    setView('top');
    roof.moves.draw();
  };
  const faces = studioFacesMoves({
    latest,
    change,
    editable,
    step,
    act,
    closeSheet: sheet.moves.done,
    toTop: () => setView('top'),
    startFaces: roof.startFaces,
    pickShape: sheet.moves.pickShape,
    sheet: roofSheet,
  });
  const panel = useRoofsPanel({
    document,
    facts,
    drawing: roofStep.kind === 'drawing',
    sheet: roofSheet,
    bar: roof.view.bar,
    act,
    draw,
    stopDrawing: roof.moves.cancel,
    openSheet: sheet.moves.openRoof,
    closeSheet: sheet.moves.done,
    copyRoof: place.copyRoof,
    deleteRoof: place.deleteRoofAt,
  });

  const slots = useUndoSlots(editable, roofStep, history);
  // A view that waits for a roof is not taken, whoever asks for it.
  const see = (next: StudioView) => {
    if (!views.some((place) => place.view === next && place.lock === null)) return;
    // A new roof is drawn, or typed, in the top view only: leaving it drops the draft.
    const held = step.current.kind;
    if (next !== 'top' && (held === 'drawing' || held === 'typing')) act({ kind: 'cancel' });
    if (next === '3d') setSeen3d(true);
    // A roof's sheet stays open in either view: its height in hand is kept first. A height
    // that is refused keeps the view, with its reason showing.
    if (!sheet.viewing(next)) return;
    setView(next);
  };
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
    site,
    editing,
    saving,
    unsent: saving.kind === 'offline' || saving.kind === 'failed',
    units,
    rail: stepRail(roofClosed),
    view,
    views,
    ...roof.view,
    ...sheet.state,
    ...model,
    ...stairs.view,
    stairsMoment,
    ...panel.view,
    numberEntry: numbers.numberEntry,
    ...roofsWithSheet(
      roof.view.heights,
      framedWithCard(framedForFaces(fit, document, roofStep), document, roof.view.sizeCard),
      roofSheet,
      document,
      model.scene.levels,
    ),
    offer3d: roofClosed && !seen3d,
    heldView: heldViewOf(fit, roofStep, panel.view.panel),
    picturesOpen,
    viewOpen,
    ...sun.view,
    ...undoRedoOf(editable, roofStep, history),
    focus: (phone) =>
      focusOf({
        job: studioJobOf(roof.view.job, {
          roofs: panel.view.panel.open === 'roofs' || panel.view.panel.open === 'picker',
          sheet: roofSheet !== null,
          picture: own.view.cardOpen,
          menu: phone && (picturesOpen || viewOpen), // beside its button nothing else moves
        }),
        view,
        phone,
        canEdit: editable,
        hasRoof: roofClosed,
        saveFailed: saving.kind === 'failed' || saving.kind === 'refused',
        slots,
      }),
    moves: {
      ...roof.moves,
      ...sheet.moves,
      ...place,
      ...panel.moves,
      ...stairs.moves,
      ...sun.moves,
      chooseNumberEntry: numbers.chooseNumberEntry,
      pickPicture: (choice) => {
        const at = latest.current;
        if (at === null || at.present.picture === choice) return;
        change(historyAfter(at, { ...at.present, picture: choice }));
      },
      ...undoRedoMoves({ dropInHand: sheet.dropInHand, step, act, walk: faces.walk }),
      drawFaces: faces.drawFaces,
      pickShape: faces.pickShape,
      chooseUnits: (system) => void session.setUnitPreference(system),
      openTheirs: () => void documentQuery.refetch(),
      retry: () => void queue.flush(),
      pictureChecked: () => setPictureSeen(true),
      see,
      draw,
      showPictures: setPicturesOpen,
      showView: setViewOpen,
      back: () =>
        // Esc while placing the stairs stops it first; the question stays.
        stairs.moves.stopPlacingStairs() ||
        studioBack({
          panelOpen: panel.view.panel.open !== 'none',
          closePanel: panel.moves.closePanel,
          picturesOpen,
          closePictures: () => setPicturesOpen(false),
          viewOpen,
          closeView: () => setViewOpen(false),
          sheetOpen: roofSheet !== null,
          // A side's sheet and a face's go back to the roof's; the roof's sheet closes.
          closeSheet: sheet.back,
          step: step.current,
          act,
        }),
    },
  };
}

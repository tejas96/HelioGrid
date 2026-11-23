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
  sceneSunAt,
  stepRail,
  viewsOffered,
} from '@heliogrid/domain';
import { useMemo, useState } from 'react';
import { planOutlinesOf } from './own-picture-view';
import { readOf } from './read';
import { closePlacingOf, roofPlaceMoves } from './roof-place-moves';
import { heightPullWith, useRoofModel } from './roof-scene-view';
import { arrivalOf, framedWithCard, useSizeCardOpens } from './size-card';
import {
  editingOf,
  skyFactsOf,
  useEditTurn,
  useSaveRetries,
  useStudioDocument,
} from './studio-document-state';
import type { StudioScreen } from './studio-screen-view';
import { historyStep, studioBack, undoRedoOf } from './studio-undo-back';
import { useStudioPicture } from './use-design-picture';
import { useDesignScreen } from './use-design-screen';
import { useOwnPictureScreen } from './use-own-picture-screen';
import { useRoofSheet } from './use-roof-sheet';
import { useRoofStep } from './use-roof-step';
import { useSession } from './use-session';

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

  const { documentQuery, skyQuery, history, latest, setHistory, saving, queue } = useStudioDocument(
    designId,
    ready,
  );
  const [pictureSeen, setPictureSeen] = useState(false);
  const [view, setView] = useState<StudioView>(OPENING_VIEW);
  const units = session.user?.unitPreference ?? 'metric';
  const [seen3d, setSeen3d] = useState(false);
  const [picturesOpen, setPicturesOpen] = useState(false);
  const pin = opened === null ? null : opened.site.pin;
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

  const facts = useMemo(() => roofFactsOf(formats), [formats]);
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
    numberEntry: session.user?.numberEntry ?? 'slider',
    setNumberEntry: (entry) => void session.setStudioPicks({ numberEntry: entry }),
    planOutlines: planOutlinesOf(own.view.plan),
    placingOf: closePlacingOf(facts, opened?.subject.siteRoof),
  });
  const { step, act } = roof;
  const { roofStep } = roof.view;

  useSizeCardOpens(arrivalOf(document, picture, editing, editable, view), roof.moves.typeSize);
  const sheet = useRoofSheet({
    document,
    latest,
    change,
    editable,
    facts,
    units,
    pullOf: heightPullWith(facts, roof.magnetNow),
    outline: (index, metres) => {
      setView('top');
      act({ kind: 'pick_roof', roof: index, metres });
    },
  });
  const { roofSheet } = sheet.state;
  const { shown } = roof.view;
  const model = useRoofModel(shown, facts, roofSheet, pin);

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
    ...model,
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
      ...roofPlaceMoves({ latest, step, act, facts }),
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
        // A roof's sheet is the 3D view's: the top view keeps its height and closes it. A height
        // that is refused keeps the sheet and the view, with its reason showing.
        if (next === 'top' && !sheet.moves.done()) return;
        setView(next);
      },
      // Drawing happens in the top view only: the camera flies there first. A roof's sheet is the
      // 3D view's: its height is kept and it closes, as when the top view is picked; a height
      // that is refused keeps the sheet, and nothing is drawn.
      draw: () => {
        if (!sheet.moves.done()) return;
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

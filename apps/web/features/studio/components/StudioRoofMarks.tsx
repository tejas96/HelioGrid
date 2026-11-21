'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import {
  type DraftView,
  type MeasurementSystem,
  STOREY_HEIGHT_M,
  type StudioView,
} from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import { type Ref, type RefObject, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useRoofPress } from '../hooks/use-roof-press';
import { placeRoofMarks, pointText } from './roof-marks-place';
import type { StudioDrive } from './StudioCameraRig';
import { StudioDraftMarks } from './StudioDraftMarks';
import { StudioRoofControls } from './StudioRoofControls';
import type { RoofMarksHandle, RoofRise, ScreenOf } from './StudioRoofs';

type Tag = { text: TranslatedText; bad: boolean; at: string };

/** The tag beside the spot under the pointer while drawing: its snap, or why it cannot go there. */
function draftTag(draft: DraftView, words: StudioCanvasWords, shown: RoofWordsShown): Tag | null {
  if (draft.spot === null) return null;
  const at = pointText(draft.spot.point);
  const refusal = draft.spotRefusal;
  if (refusal === 'would_cross') return { text: words.tagCross, bad: true, at };
  if (refusal === 'would_overlap') return { text: words.tagOver, bad: true, at };
  if (refusal !== null) return { text: words.drawRefusal(refusal).title, bad: true, at };
  const snap = draft.spot.snap;
  return snap === null ? null : { text: words.snap(snap, shown), bad: false, at };
}

/** The tag beside the spot in hand: what it snapped to, or why it cannot go there. */
function tagOf(
  studio: StudioScreen,
  words: StudioCanvasWords,
  shown: RoofWordsShown,
  aiming: boolean,
): Tag | null {
  const { draft, roofStep } = studio;
  if (draft !== null) return aiming ? null : draftTag(draft, words, shown);
  if (roofStep.kind !== 'dragging' || studio.dragTagAt === null) return null;
  const at = pointText(studio.dragTagAt);
  const { fault, snap } = roofStep.drag;
  if (fault === 'would_cross') return { text: words.tagCross, bad: true, at };
  if (fault === 'would_overlap') return { text: words.tagOver, bad: true, at };
  if (roofStep.grip.kind === 'turn') {
    return { text: words.tagTurned(Math.round(roofStep.degrees)), bad: false, at };
  }
  return snap === null ? null : { text: words.snap(snap, shown), bad: false, at };
}

/**
 * The marks on the roofs (`T-M05-002`, part b), page elements the camera keeps on the model: each
 * roof's line and controls, the draft while drawing, the tag beside the spot in hand, and the one
 * small celebration when a roof closes. Every control here works in the top view and in 3D.
 */
export function StudioRoofMarks({
  handle,
  studio,
  view,
  units,
  words,
  drive,
  rise,
  aiming,
}: {
  handle: Ref<RoofMarksHandle>;
  studio: StudioScreen;
  view: StudioView;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  drive: RefObject<StudioDrive | null>;
  rise: RoofRise;
  /** A finger aims a corner: its loupe shows the live length, so the page does not. */
  aiming: boolean;
}) {
  const format = useFormat();
  const layer = useRef<HTMLDivElement>(null);
  const lastPlace = useRef<ScreenOf | null>(null);
  const handlesOf = useRef(studio.handlesOf);
  handlesOf.current = studio.handlesOf;
  const place = (screenOf: ScreenOf) => {
    lastPlace.current = screenOf;
    if (layer.current !== null) {
      placeRoofMarks(layer.current, screenOf, (roof, gap) => handlesOf.current(roof, gap));
    }
  };
  useImperativeHandle(handle, () => ({ place }));
  // Marks that change between two frames — a new corner, a label's new length — take their place
  // before the page is painted.
  useLayoutEffect(() => {
    if (lastPlace.current !== null) place(lastPlace.current);
  });
  const press = useRoofPress(drive, rise);
  const shown: RoofWordsShown = {
    length: (metres) => format.roofLength(metres, units, false),
    height: format.roofLength(STOREY_HEIGHT_M, units, false),
  };
  const { roofStep: step, draft, roofMarks } = studio;
  const onTop = view !== 'top';
  const drawing = step.kind === 'drawing';
  const tag = tagOf(studio, words, shown, aiming);
  const before =
    step.kind === 'dragging' && step.drag.fault !== null ? step.base.roofs[step.grip.roof] : null;
  const closedJust = step.kind === 'idle' && step.said?.kind === 'closed' ? roofMarks.at(-1) : null;

  return (
    <div ref={layer} className="hg-roof-marks" data-view={view}>
      <svg className="hg-roof-lines" aria-hidden="true">
        {roofMarks.map((roof) => {
          const pts = roof.corners.map(pointText).join(';');
          return (
            <g key={roof.id} data-quiet={drawing}>
              {onTop ? null : <path className="hg-roof-fill" data-pts={pts} data-closed="true" />}
              <path className="hg-roof-halo" data-pts={pts} data-closed="true" data-top={onTop} />
              <path className="hg-roof-line" data-pts={pts} data-closed="true" data-top={onTop} />
            </g>
          );
        })}
        {before == null ? null : (
          <path
            className="hg-roof-before"
            data-bad="true"
            data-pts={before.corners.map(pointText).join(';')}
            data-closed="true"
            data-top={onTop}
          />
        )}
      </svg>
      {roofMarks.map((roof, index) => (
        <StudioRoofControls
          key={roof.id}
          roof={roof}
          index={index}
          studio={studio}
          onTop={onTop}
          units={units}
          words={words}
          press={press}
        />
      ))}
      {draft === null ? null : (
        <StudioDraftMarks
          draft={draft}
          units={units}
          words={words}
          aiming={aiming}
          onClose={studio.moves.close}
        />
      )}
      {tag === null ? null : (
        <span className="hg-roof-at" data-at={tag.at} data-top={onTop}>
          <span className="hg-roof-tag" data-tone={tag.bad ? 'bad' : undefined} role="status">
            {tag.text}
          </span>
        </span>
      )}
      {closedJust == null ? null : (
        <span key={closedJust.id} className="hg-roof-at" data-at={pointText(closedJust.middle)}>
          <span className="hg-roof-ring" />
        </span>
      )}
    </div>
  );
}

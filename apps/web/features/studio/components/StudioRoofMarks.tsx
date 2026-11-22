'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { HeldCircle, MeasurementSystem, StudioView } from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';
import { type FocusAfter, useFormat } from '@heliogrid/ui';
import {
  type Ref,
  type RefObject,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useRoofPress } from '../hooks/use-roof-press';
import { placeLabels } from './roof-labels-place';
import { placeRoofMarks, pointText } from './roof-marks-place';
import { roofWordsShown } from './roof-words-shown';
import type { StudioDrive } from './StudioCameraRig';
import { StudioDraftMarks } from './StudioDraftMarks';
import { StudioRoofEdit } from './StudioRoofEdit';
import { edgeAt, type Revealed, StudioRoofLengths } from './StudioRoofLengths';
import type { RoofMarksHandle, ScreenOf } from './StudioRoofs';
import { StudioRoofTops } from './StudioRoofTops';
import { StudioSizePreview } from './StudioSizePreview';

type Tag = { text: TranslatedText; bad: boolean; at: string };

/** The tag while drawing: beside the spot, or — a tap refused with no pointer over the map, a
 * finger lifted — by the last corner, where the edge would have started. */
function draftTagOf(
  studio: StudioScreen,
  words: StudioCanvasWords,
  shown: RoofWordsShown,
  aiming: boolean,
): Tag | null {
  const { draft, roofStep } = studio;
  if (draft === null || roofStep.kind !== 'drawing') return null;
  const last = draft.corners.at(-1);
  if (draft.spot === null && roofStep.refused !== null && last !== undefined) {
    const tag = words.spotTag({ refusal: roofStep.refused, snap: null, angle: null }, shown);
    return tag === null ? null : { ...tag, at: pointText(last) };
  }
  if (aiming || draft.spot === null) return null;
  const { point, snap } = draft.spot;
  const tag = words.spotTag({ refusal: draft.spotRefusal, snap, angle: draft.angle }, shown);
  return tag === null ? null : { ...tag, at: pointText(point) };
}

/** The tag beside the spot or the drag in hand, where it is: the words are the catalog's choice. */
function tagOf(
  studio: StudioScreen,
  words: StudioCanvasWords,
  shown: RoofWordsShown,
  aiming: boolean,
): Tag | null {
  const { draft, roofStep } = studio;
  if (draft !== null) return draftTagOf(studio, words, shown, aiming);
  if (roofStep.kind !== 'dragging' || studio.dragTagAt === null) return null;
  const { fault, snap } = roofStep.drag;
  const tag = words.dragTag(
    { fault, snap, grip: roofStep.grip.kind, degrees: roofStep.degrees },
    shown,
  );
  return tag === null ? null : { ...tag, at: pointText(studio.dragTagAt) };
}

/** A held length's circle as a closed line of ground points, fine enough to read as round. */
const CIRCLE_STEPS = 72;
function circlePoints({ centre, metres }: HeldCircle): string {
  return Array.from({ length: CIRCLE_STEPS }, (_, i) => {
    const turn = (i / CIRCLE_STEPS) * 2 * Math.PI;
    return pointText({
      east: centre.east + metres * Math.cos(turn),
      north: centre.north + metres * Math.sin(turn),
    });
  }).join(';');
}

/** How far each way a guide runs from its point, in metres: past every edge of the map. */
const GUIDE_REACH_M = 400;

/**
 * Each roof's line, red and dashed for a drag that would be refused; the roof as it stood under a
 * move, a turn or a refused drag; the circle a held length keeps a dragged corner on; and the
 * magnet's guides, dashed right across the map, so they show past a finger.
 */
function RoofLines({ studio, drawing }: { studio: StudioScreen; drawing: boolean }) {
  const step = studio.roofStep;
  const bad = step.kind === 'dragging' && step.drag.fault !== null ? step.grip.roof : null;
  return (
    <svg className="hg-roof-lines" aria-hidden="true">
      {studio.roofMarks.map((roof, index) => {
        const pts = roof.corners.map(pointText).join(';');
        return (
          <g key={roof.id} data-quiet={drawing}>
            <path className="hg-roof-halo" data-pts={pts} data-closed="true" />
            <path
              className="hg-roof-line"
              data-pts={pts}
              data-closed="true"
              data-bad={bad === index}
            />
          </g>
        );
      })}
      {studio.dragBefore === null ? null : (
        <path
          className="hg-roof-before"
          data-pts={studio.dragBefore.map(pointText).join(';')}
          data-closed="true"
        />
      )}
      {studio.guides.map(({ through, way }) => {
        const from = pointText({
          east: through.east - way.east * GUIDE_REACH_M,
          north: through.north - way.north * GUIDE_REACH_M,
        });
        const to = pointText({
          east: through.east + way.east * GUIDE_REACH_M,
          north: through.north + way.north * GUIDE_REACH_M,
        });
        return <path key={`${from};${to}`} className="hg-roof-guide" data-pts={`${from};${to}`} />;
      })}
      {studio.heldCircle === null ? null : (
        <path
          className="hg-roof-held"
          data-pts={circlePoints(studio.heldCircle)}
          data-closed="true"
        />
      )}
    </svg>
  );
}

/**
 * The marks on the roofs (`T-M05-002`, part b), page elements the camera keeps on the model, in the
 * top view only: each roof's line, the draft while drawing, the tag beside the spot in hand, and
 * the one small celebration when a roof closes. The 3D view shows the roofs themselves.
 */
export function StudioRoofMarks({
  handle,
  studio,
  view,
  units,
  words,
  aiming,
  lengths,
  handles,
  drive,
  onAim,
  onCrowded,
  map,
}: {
  handle: Ref<RoofMarksHandle>;
  studio: StudioScreen;
  view: StudioView;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** A finger aims a corner: its loupe shows the live length and the tag, so the page does not. */
  aiming: boolean;
  /** Focus mode: the roofs' lengths show, or only the draft's while drawing, or none. */
  lengths: 'all' | 'draft' | 'hidden';
  /** Focus mode: every roof's corners and handles, or only the roof the job holds. */
  handles: 'picked' | 'hidden';
  /** The camera, which tells a drag on a mark where on the ground it is. */
  drive: RefObject<StudioDrive | null>;
  /** A finger's drag on a mark shows the loupe. */
  onAim: (at: { x: number; y: number } | null) => void;
  /** Told when the corner held becomes crowded on the screen, or stops being. */
  onCrowded: (crowded: boolean) => void;
  /** The map, where focus goes when a control here leaves with what it acted on. */
  map: FocusAfter;
}) {
  const format = useFormat();
  const press = useRoofPress(drive, onAim);
  const layer = useRef<HTMLDivElement>(null);
  const lastPlace = useRef<ScreenOf | null>(null);
  const wasCrowded = useRef(false);
  const crowdedTold = useRef(onCrowded);
  crowdedTold.current = onCrowded;
  const handlesOf = useRef(studio.handlesOf);
  handlesOf.current = studio.handlesOf;
  const layout = useRef(studio.layoutLabels);
  layout.current = studio.layoutLabels;
  const place = (screenOf: ScreenOf) => {
    lastPlace.current = screenOf;
    if (layer.current !== null) {
      layer.current.dataset.placed = 'true';
      const crowded = placeRoofMarks(
        layer.current,
        screenOf,
        (roof, gap) => handlesOf.current(roof, gap),
        layout.current,
      );
      if (crowded !== wasCrowded.current) {
        wasCrowded.current = crowded;
        crowdedTold.current(crowded);
      }
      placeLabels(layer.current, screenOf, layout.current);
    }
  };
  // biome-ignore lint/plugin: which given-way length a tap brought back is the page's own passing state
  const [revealed, setRevealed] = useState<Revealed>(null);
  useImperativeHandle(handle, () => ({
    place,
    revealAt: (x, y) => setRevealed(layer.current === null ? null : edgeAt(layer.current, x, y)),
  }));
  // Marks that change between two frames — a new corner, a label's new length — take their place
  // before the page is painted.
  useLayoutEffect(() => {
    if (lastPlace.current !== null) place(lastPlace.current);
  });
  const shown = roofWordsShown(format, units);
  const { roofStep: step, draft, roofMarks } = studio;
  if (view !== 'top') {
    return (
      <div ref={layer} className="hg-roof-marks" data-view={view}>
        <StudioRoofTops studio={studio} words={words} units={units} />
      </div>
    );
  }
  const drawing = step.kind === 'drawing';
  const tag = tagOf(studio, words, shown, aiming);
  const editable = studio.editing.kind === 'editor';
  // Corners show on every roof while looking; in a job, only on the roof it holds.
  const editsOn = (index: number) =>
    editable && !drawing && (handles !== 'hidden' || index === studio.handlesRoof);
  const closedJust = step.kind === 'idle' && step.said?.kind === 'closed' ? roofMarks.at(-1) : null;
  // A corner removed shrinks away where it stood, once, as its edges join.
  const gone = step.kind === 'idle' && step.said?.kind === 'corner_removed' ? step.said : null;

  return (
    <div ref={layer} className="hg-roof-marks" data-view={view}>
      <RoofLines studio={studio} drawing={drawing} />
      {lengths === 'all' ? (
        <StudioRoofLengths
          roofs={roofMarks}
          studio={studio}
          units={units}
          words={words}
          revealed={revealed}
        />
      ) : null}
      {roofMarks.map((roof, index) =>
        editsOn(index) ? (
          <StudioRoofEdit
            key={roof.id}
            roof={roof}
            index={index}
            studio={studio}
            words={words}
            press={press}
            picked={index === studio.handlesRoof}
            afterRemove={map}
          />
        ) : null,
      )}
      {studio.sizeCard === null ? null : <StudioSizePreview card={studio.sizeCard} units={units} />}
      {draft === null ? null : (
        <StudioDraftMarks
          draft={draft}
          units={units}
          words={words}
          aiming={aiming}
          onClose={studio.moves.closeAsDrawn}
          onOverFirst={studio.moves.hover}
        />
      )}
      {tag === null ? null : (
        <span className="hg-roof-at" data-at={tag.at} data-tag="true">
          <span className="hg-roof-tag" data-tone={tag.bad ? 'bad' : undefined} role="status">
            {tag.text}
          </span>
        </span>
      )}
      {gone === null ? null : (
        <span key={pointText(gone.at)} className="hg-roof-at" data-at={pointText(gone.at)}>
          <span className="hg-roof-dot hg-roof-dot-gone" />
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

'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { DraftView, MeasurementSystem, StudioView } from '@heliogrid/domain';
import type { RoofWordsShown, StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import { type Ref, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { placeRoofMarks, pointText } from './roof-marks-place';
import { StudioDraftMarks } from './StudioDraftMarks';
import type { RoofMarksHandle, ScreenOf } from './StudioRoofs';

type Tag = { text: TranslatedText; bad: boolean; at: string };

/**
 * The tag beside the spot under the pointer while drawing: its snap, why it cannot go there, or —
 * when nothing snapped — the angle it makes, so a wall that is truly 87° is seen to be.
 */
function draftTag(draft: DraftView, words: StudioCanvasWords, shown: RoofWordsShown): Tag | null {
  if (draft.spot === null) return null;
  const at = pointText(draft.spot.point);
  const refusal = draft.spotRefusal;
  if (refusal === 'would_cross') return { text: words.tagCross, bad: true, at };
  if (refusal === 'would_overlap') return { text: words.tagOver, bad: true, at };
  if (refusal !== null) return { text: words.drawRefusal(refusal).title, bad: true, at };
  const snap = draft.spot.snap;
  if (snap !== null) return { text: words.snap(snap, shown), bad: false, at };
  return draft.angle === null ? null : { text: words.angle(draft.angle), bad: false, at };
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
}: {
  handle: Ref<RoofMarksHandle>;
  studio: StudioScreen;
  view: StudioView;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** A finger aims a corner: its loupe shows the live length and the tag, so the page does not. */
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
  const shown: RoofWordsShown = {
    length: (metres) => format.roofLength(metres, units, false),
    height: format.roofHeight(format.pack.storeyHeightM, units),
  };
  const { roofStep: step, draft, roofMarks } = studio;
  if (view !== 'top') return <div ref={layer} className="hg-roof-marks" data-view={view} />;
  const drawing = step.kind === 'drawing';
  const tag = draft === null || aiming ? null : draftTag(draft, words, shown);
  const closedJust = step.kind === 'idle' && step.said?.kind === 'closed' ? roofMarks.at(-1) : null;

  return (
    <div ref={layer} className="hg-roof-marks" data-view={view}>
      <svg className="hg-roof-lines" aria-hidden="true">
        {roofMarks.map((roof) => {
          const pts = roof.corners.map(pointText).join(';');
          return (
            <g key={roof.id} data-quiet={drawing}>
              <path className="hg-roof-halo" data-pts={pts} data-closed="true" />
              <path className="hg-roof-line" data-pts={pts} data-closed="true" />
            </g>
          );
        })}
      </svg>
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
        <span className="hg-roof-at" data-at={tag.at}>
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

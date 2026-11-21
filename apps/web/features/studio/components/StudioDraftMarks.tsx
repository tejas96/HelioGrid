'use client';
import type { DraftView, MeasurementSystem } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, useFormat } from '@heliogrid/ui';
import { pointText } from './roof-marks-place';
import { StudioLengthLabel } from './StudioLengthLabel';

/**
 * The roof being drawn (`T-M05-002`, part b), in the top view: its corners and edges with their
 * lengths, the ghost corner, the spot under the pointer with the line to it and its live length,
 * and the first corner, which closes the shape. The lines are the marks layer's.
 */
export function StudioDraftMarks({
  draft,
  units,
  words,
  aiming,
  onClose,
}: {
  draft: DraftView;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** A finger aims with the loupe, which shows the live length: the page does not. */
  aiming: boolean;
  onClose: () => void;
}) {
  const format = useFormat();
  const inside = draft.ghost ?? draft.spot?.point ?? draft.corners[0];
  const insideText = inside === undefined ? '' : pointText(inside);
  const last = draft.corners.at(-1);
  const outline = draft.corners.map(pointText).join(';');
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        <path className="hg-roof-halo" data-pts={outline} />
        <path className="hg-roof-line" data-pts={outline} />
        {draft.stretch !== null ? (
          <>
            <path
              className="hg-roof-halo"
              data-pts={`${pointText(draft.stretch.from)};${pointText(draft.stretch.to)}`}
            />
            <path
              className="hg-roof-stretch"
              data-bad={draft.spotRefusal !== null}
              data-pts={`${pointText(draft.stretch.from)};${pointText(draft.stretch.to)}`}
            />
          </>
        ) : null}
        {draft.spot?.snap?.kind === 'lines_up' && draft.corners[draft.spot.snap.corner] ? (
          <path
            className="hg-roof-guide"
            data-pts={`${pointText(draft.corners[draft.spot.snap.corner] as (typeof draft.corners)[number])};${pointText(draft.spot.point)}`}
          />
        ) : null}
        {draft.ghost !== null && last !== undefined && draft.corners[0] !== undefined ? (
          <path
            className="hg-roof-ghost"
            data-pts={`${pointText(last)};${pointText(draft.ghost)};${pointText(draft.corners[0])}`}
          />
        ) : null}
      </svg>
      <div className="hg-roof-on">
        {draft.corners.map((corner, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a corner is its place in the draft
          <span key={`d${i}`} className="hg-roof-at" data-at={pointText(corner)}>
            {i === 0 && draft.canClose ? (
              <Pressable
                className="hg-roof-hit"
                accessibilityLabel={words.cornerFirst}
                ripple="none"
                onPress={onClose}
              >
                <span className="hg-roof-dot" data-first="true" />
              </Pressable>
            ) : (
              <span className="hg-roof-dot" />
            )}
          </span>
        ))}
        {draft.edges.map((edge, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: an edge is its place in the draft
            key={`e${i}`}
            className="hg-roof-at"
            data-edge={`${pointText(edge.from)}|${pointText(edge.to)}|${insideText}`}
          >
            <StudioLengthLabel text={format.roofLength(edge.metres, units, true)} kind="traced" />
          </span>
        ))}
        {draft.ghost !== null ? (
          <span className="hg-roof-at" data-at={pointText(draft.ghost)}>
            <span className="hg-roof-dot" data-ghost="true" />
          </span>
        ) : null}
        {draft.spot !== null ? (
          <span className="hg-roof-at" data-at={pointText(draft.spot.point)}>
            <span className="hg-roof-dot" data-next="true" data-bad={draft.spotRefusal !== null} />
          </span>
        ) : null}
        {draft.stretch !== null && !aiming ? (
          <span
            className="hg-roof-at"
            data-edge={`${pointText(draft.stretch.from)}|${pointText(draft.stretch.to)}|${insideText}`}
          >
            <StudioLengthLabel
              text={format.roofLength(draft.stretch.metres, units, true)}
              kind="traced"
              live
            />
          </span>
        ) : null}
      </div>
    </>
  );
}

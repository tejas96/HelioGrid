'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, useFormat } from '@heliogrid/ui';
import { Fragment } from 'react';
import { pointText } from './roof-marks-place';

/**
 * One roof's sides in the top view (`T-M05-002`, part e), inside the roofs' drawing: solid where a
 * side has a wall, dashed where it has none, split exactly where another roof takes the side; the
 * picked roof glows; a short line runs down each sloped face, and an Any-shape roof's faces drawn
 * by hand show as they are drawn. A roof with no marks yet — the
 * kernel's answer a frame behind — keeps its plain line.
 */
export function RoofSideLines({
  studio,
  index,
  bad,
}: {
  studio: StudioScreen;
  index: number;
  /** The drag in hand would be refused: the roof is drawn red and dashed, whole. */
  bad: boolean;
}) {
  const roof = studio.roofMarks[index];
  const mark = studio.topMarks[index];
  if (roof === undefined) return null;
  const pts = roof.corners.map(pointText).join(';');
  const picked = studio.handlesRoof === index;
  if (mark === undefined || bad) {
    return <path className="hg-roof-line" data-pts={pts} data-closed="true" data-bad={bad} />;
  }
  return (
    <>
      {/* A dark line under the sides keeps them seen on any picture; under the picked roof, its glow. */}
      <path className="hg-roof-under" data-pts={pts} data-closed="true" data-picked={picked} />
      <path
        className="hg-roof-fill"
        data-pts={pts}
        data-closed="true"
        data-kind={mark.kind}
        data-picked={picked}
      />
      {mark.sides.flatMap((stretches, side) =>
        stretches.map((stretch, i) => (
          <path
            // biome-ignore lint/suspicious/noArrayIndexKey: a stretch is its place on its side
            key={`${side}-${i}`}
            className="hg-roof-side"
            data-pts={`${pointText(stretch.from)};${pointText(stretch.to)}`}
            data-wall={stretch.wall}
            data-picked={picked}
            data-check={mark.sticksOutM > 0}
          />
        )),
      )}
      {/* The setback line: in from the parapet, round what stands on the roof (board 7.1). */}
      {mark.setback.map((ring) => (
        <path
          key={ring.map(pointText).join(';')}
          className="hg-roof-setback"
          data-pts={ring.map(pointText).join(';')}
          data-closed="true"
        />
      ))}
      {/* An Any-shape roof's faces drawn by hand, each its own ring (board 5.10). */}
      {mark.faces.map((ring) => {
        const line = ring.map(pointText).join(';');
        return <path key={line} className="hg-roof-face" data-pts={line} data-closed="true" />;
      })}
      {mark.slopes.map((slope) => {
        const line = `${pointText(slope.from)};${pointText(slope.to)}`;
        return (
          <g key={line}>
            <path className="hg-roof-slope-shade" data-pts={line} />
            <path className="hg-roof-slope" data-pts={line} markerEnd="url(#hg-roof-slope-tip)" />
          </g>
        );
      })}
    </>
  );
}

/** The arrow's tip for a slope's line, drawn once in the roofs' drawing. */
export function RoofSlopeTip() {
  return (
    <defs>
      <marker
        id="hg-roof-slope-tip"
        viewBox="0 0 8 8"
        refX="6"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path className="hg-roof-slope-tip" d="M1 1 7 4 1 7" />
      </marker>
    </defs>
  );
}

/**
 * The marks on the roofs that are not lines (`T-M05-002`, part e): "+3 m" on a roof that stands on
 * another and the tag on one that sticks out past its roof. A side's wall is added or taken off in
 * 3D and in the roof's sheet, never here: sides meet too close at a corner to tell apart by a tap.
 */
export function StudioRoofTopMarks({
  studio,
  words,
  units,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
}) {
  const format = useFormat();
  const picked = studio.handlesRoof;
  const step = studio.roofStep;
  // Each roof is a keyboard stop for an editor looking at the top view, nothing in hand; while the
  // plan is picked its own handles take the keys.
  const keys =
    studio.editing.kind === 'editor' && step.kind === 'idle' && studio.own.plan?.picked !== true;
  return (
    <>
      {studio.topMarks.map((mark, index) => {
        const roof = studio.roofMarks[index];
        if (roof === undefined) return null;
        return (
          <Fragment key={roof.id}>
            {/* A keyboard's way to each roof: Tab reaches it and Enter picks it. A tap on the map
                picks as it did: this stop takes no pointer. */}
            {keys ? (
              <span className="hg-roof-at" data-at={pointText(roof.middle)}>
                <Pressable
                  className="hg-roof-key"
                  accessibilityLabel={words.pickRoof(mark.name)}
                  accessibilityState={{ selected: picked === index }}
                  ripple="none"
                  onPress={() => studio.moves.pickRoof(index)}
                >
                  <span className="hg-roof-key-ring" aria-hidden="true" />
                </Pressable>
              </span>
            ) : null}
            {mark.aboveM === null ? null : (
              <span className="hg-roof-at" data-at={pointText(roof.middle)}>
                <span className="hg-roof-above">
                  {words.above(format.roofHeight(mark.aboveM, units))}
                </span>
              </span>
            )}
            {mark.lowAgainst === null ? null : (
              <span className="hg-roof-at" data-at={pointText(mark.lowAgainst.at)} data-tag="true">
                <span className="hg-roof-tag" data-tone="check">
                  {words.lowAgainst(mark.lowAgainst.roof)}
                </span>
              </span>
            )}
            {mark.sticksOutAt === null ? null : (
              <span className="hg-roof-at" data-at={pointText(mark.sticksOutAt)} data-tag="true">
                <span className="hg-roof-tag" data-tone="check">
                  {words.sticksOutBy(format.roofLength(mark.sticksOutM, units, false))}
                </span>
              </span>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

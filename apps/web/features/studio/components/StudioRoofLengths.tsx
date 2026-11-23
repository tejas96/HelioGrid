'use client';
import { type StudioScreen, useRepeatPress } from '@heliogrid/data/react';
import type { EdgeView, MeasurementSystem, RoofMarksView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { Pressable, ShellGlyph, useFormat } from '@heliogrid/ui';
import { useRef } from 'react';
import { pointText } from './roof-marks-place';
import { StudioLengthLabel } from './StudioLengthLabel';

/** An edge a person tapped to see its length again, after the length gave way. */
export type Revealed = { readonly roof: number; readonly edge: number } | null;

/**
 * The edge under a tap on the page, from the edges' tap bands; `null` off every edge. The bands
 * take no pointer of their own, so a pan or a zoom that starts on an edge still moves the map.
 */
export function edgeAt(layer: HTMLElement, x: number, y: number): Revealed {
  const box = layer.getBoundingClientRect();
  for (const band of layer.querySelectorAll<SVGPathElement>('path.hg-roof-edge-tap')) {
    // An SVGPoint, not a DOMPoint: Android's web view before Chrome 134 refuses any other.
    const point = band.ownerSVGElement?.createSVGPoint();
    if (point === undefined) continue;
    point.x = x - box.left;
    point.y = y - box.top;
    if (band.isPointInStroke(point)) {
      return { roof: Number(band.dataset.tapRoof), edge: Number(band.dataset.tapEdge) };
    }
  }
  return null;
}

/** The length in hand: its number between − and +, which step and repeat while held. */
function SteppedLength({
  text,
  trust,
  studio,
  words,
}: {
  text: string;
  trust: string;
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const repeat = useRepeatPress();
  // A press by pointer steps at once and repeats while held; its click is then not a second step.
  // A key's press is the click alone.
  const byPointer = useRef(false);
  const step = (by: 1 | -1) => (
    <Pressable
      className="hg-roof-hit"
      accessibilityLabel={by === 1 ? words.lengthLonger : words.lengthShorter}
      disabled={by === 1 ? studio.stepOff.more : studio.stepOff.less}
      ripple="none"
      onPress={() => {
        if (byPointer.current) byPointer.current = false;
        else studio.moves.stepLength(by);
      }}
    >
      <span
        className="hg-roof-step-act"
        onPointerDown={() => {
          byPointer.current = true;
          repeat.start(() => studio.moves.stepLength(by));
        }}
        onPointerUp={repeat.stop}
        onPointerLeave={repeat.stop}
      >
        <ShellGlyph name={by === 1 ? 'plus' : 'minus'} size="xs" tone="current" />
      </span>
    </Pressable>
  );
  return (
    <span
      className="hg-roof-len hg-roof-step"
      data-kind={trust}
      // A key's press is never a pointer's: a step that went off under the finger left no click
      // to clear the mark, and the next key would be lost.
      onKeyDownCapture={() => {
        byPointer.current = false;
      }}
    >
      {step(-1)}
      <span className="hg-roof-len-num">{text}</span>
      {trust === 'measured' ? <ShellGlyph name="check" size="xs" tone="current" /> : null}
      {step(1)}
    </span>
  );
}

/** One edge's length: its label, or — in hand — its number between − and +. */
function EdgeLength({
  edge,
  roof,
  index,
  studio,
  units,
  words,
  revealed,
}: {
  edge: EdgeView;
  roof: number;
  index: number;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** A tap on its edge brought it back after it gave way. */
  revealed: boolean;
}) {
  const format = useFormat();
  const step = studio.roofStep;
  const editable = studio.editing.kind === 'editor';
  const live =
    step.kind === 'dragging' && (step.grip.kind === 'corner' || step.grip.kind === 'plus');
  const text = format.roofLength(edge.metres, units, edge.about);
  const inHand = step.kind === 'sizing' && step.roof === roof && step.edge === index;
  const open =
    editable && step.kind !== 'drawing' ? () => studio.moves.pickLength(roof, index) : null;
  return (
    <span
      className="hg-roof-at hg-roof-label"
      data-label={roof}
      data-from={pointText(edge.from)}
      data-to={pointText(edge.to)}
      data-trust={edge.trust}
      data-pinned={inHand || revealed}
      data-level={inHand}
      // Away until the placer first lays it: never a frame at the screen's corner.
      data-unseen="true"
    >
      {inHand ? (
        <SteppedLength text={text} trust={edge.trust} studio={studio} words={words} />
      ) : (
        <StudioLengthLabel
          text={text}
          kind={edge.trust}
          pulse={edge.pulse && editable && step.kind === 'idle'}
          live={live}
          label={editable ? words.edgeLength(index + 1, text) : null}
          onOpen={open}
        />
      )}
    </span>
  );
}

/**
 * Every edge's length on the design's roofs (`T-M05-002`, part b), in the top view: "~" and no
 * outline from the picture, an outline when set, a tick when measured. The mark placer lays each
 * along its edge, outside the roof, never upside down, out past every corner's touch target; where
 * they touch, picture lengths give way and show again on a tap of their edge. A tap opens the
 * length field; the length in hand wears − and +.
 */
export function StudioRoofLengths({
  roofs,
  studio,
  units,
  words,
  revealed,
}: {
  roofs: readonly RoofMarksView[];
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** The edge a tap on the map last landed on: its length shows even where it gave way. */
  revealed: Revealed;
}) {
  return (
    <>
      <svg className="hg-roof-lines hg-roof-edge-taps" aria-hidden="true">
        {roofs.flatMap((roof, index) =>
          roof.edges.map((edge, i) => (
            <path
              // biome-ignore lint/suspicious/noArrayIndexKey: an edge is its place in the roof
              key={`tap${index}-${i}`}
              className="hg-roof-edge-tap"
              data-tap-roof={index}
              data-tap-edge={i}
              data-pts={`${pointText(edge.from)};${pointText(edge.to)}`}
            />
          )),
        )}
      </svg>
      {roofs.map((roof, index) => (
        <span
          key={`pts${roof.id}`}
          className="hg-roof-shape"
          data-roof={index}
          data-pts={roof.corners.map(pointText).join(';')}
          hidden
        />
      ))}
      {roofs.flatMap((roof, index) =>
        roof.edges.map((edge, i) => (
          <EdgeLength
            // biome-ignore lint/suspicious/noArrayIndexKey: an edge is its place in the roof; a length set or measured is drawn anew, its tick drawing in
            key={`len${index}-${i}-${edge.trust}`}
            edge={edge}
            roof={index}
            index={i}
            studio={studio}
            units={units}
            words={words}
            revealed={revealed !== null && revealed.roof === index && revealed.edge === i}
          />
        )),
      )}
    </>
  );
}

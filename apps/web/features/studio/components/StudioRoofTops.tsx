'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofName } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { useFormat } from '@heliogrid/ui';
import { pointText } from './roof-marks-place';
import { Crossings, DragArrow, LitSide, RidgeArrow } from './StudioRoofArrows';

/**
 * The open roof's own height arrow: a drag up or down changes its height, the walls follow; let
 * go, it is kept. Up and Down step it by a key.
 */
function HeightArrow({
  studio,
  words,
  units,
  name,
  middle,
  metres,
  top,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  /** What the roof is called, for the arrow's spoken name. */
  name: RoofName;
  middle: string;
  /** The roof's own height, which the arrow changes and shows. */
  metres: number;
  /** The roof's top above the ground, where the arrow stands. */
  top: number;
}) {
  const format = useFormat();
  const { moves } = studio;
  return (
    <DragArrow
      kind="roof"
      label={words.heightArrow(name)}
      value={format.roofHeight(metres, units)}
      at={middle}
      top={top}
      onGrab={moves.grabHeight}
      // The magnet's reach is 0.1 m, or 8 pixels where that is more: the hook caps it.
      onDrag={(risenM, reachM) => moves.dragHeight(risenM, reachM)}
      onKeep={() => moves.keepHeight()}
      onStep={moves.stepHeight}
    />
  );
}

/** The open roof's own mark: its height arrow, or on a side's sheet that side lit. */
function OpenRoofMarks({
  studio,
  words,
  units,
  index,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
  index: number;
}) {
  const roof = studio.roofMarks[index];
  if (roof === undefined) return null;
  // A side's sheet shows its own wall's arrow; the roof's shows its height and its ridge.
  if (studio.sheetPart.kind === 'side') {
    return <LitSide studio={studio} marks={roof} units={units} words={words} />;
  }
  // A hole has no height of its own to drag: it is open down to the floor below.
  if (studio.roofSheet?.hasHeight === false) return null;
  return (
    <HeightArrow
      studio={studio}
      words={words}
      units={units}
      name={studio.topMarks[index]?.name ?? { kind: 'roof', number: index + 1 }}
      middle={pointText(roof.middle)}
      metres={studio.heights[index]?.metres ?? 0}
      // A roof on another stands on that roof: its marks sit at its top above the ground.
      top={studio.scene.levels[index]?.topM ?? 0}
    />
  );
}

/**
 * The marks on the roofs in 3D (`T-M05-002`, part b): none on a roof at rest — a tap on the roof
 * itself opens its sheet, and the Roofs list opens it from the keyboard; the open roof wears a
 * blue ring, a soft fill and the blue arrow with its height. No outline, no length, no corner, no
 * handle.
 */
export function StudioRoofTops({
  studio,
  words,
  units,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  units: MeasurementSystem;
}) {
  const format = useFormat();
  const open = studio.roofSheet?.roof ?? null;
  const editable = studio.editing.kind === 'editor';
  // The height in hand pulled level with something: a line across the model there, and its name.
  const pull = studio.heightPull;
  const level =
    pull === null ? null : words.heightLevel(pull.to, format.roofHeight(pull.levelM, units));
  return (
    <>
      <svg className="hg-roof-lines" aria-hidden="true">
        {pull === null ? null : (
          <path
            className="hg-roof-level"
            data-pts={pull.line.map(pointText).join(';')}
            data-top={pull.levelM}
          />
        )}
        {studio.roofMarks.map((roof, index) =>
          index === open ? (
            <g key={roof.id}>
              <path
                className="hg-roof-picked-fill"
                data-pts={roof.corners.map(pointText).join(';')}
                data-closed="true"
                data-top={studio.scene.levels[index]?.topM ?? 0}
              />
              <path
                className="hg-roof-picked-ring"
                data-pts={roof.corners.map(pointText).join(';')}
                data-closed="true"
                data-top={studio.scene.levels[index]?.topM ?? 0}
              />
            </g>
          ) : null,
        )}
      </svg>
      {pull === null || level === null || pull.line[0] === undefined ? null : (
        <span
          className="hg-roof-at"
          data-at={pointText(pull.line[0])}
          data-top={pull.levelM}
          data-tag="true"
        >
          <span className="hg-roof-tag" data-tone="level" role="status">
            {level}
          </span>
        </span>
      )}
      {open === null || !editable ? null : (
        <OpenRoofMarks studio={studio} words={words} units={units} index={open} />
      )}
      <RidgeArrow studio={studio} units={units} words={words} />
      <Crossings studio={studio} words={words} />
    </>
  );
}

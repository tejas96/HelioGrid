'use client';
import type { RoofSheetRows, RoofSheetView } from '@heliogrid/domain';
import { Button, Pressable, SegmentedControl, Switch, useFormat } from '@heliogrid/ui';
import { useRef, useState } from 'react';
import { StudioFacesRow } from './StudioFaceRows';
import { StudioKindChips } from './StudioKindChips';
import { StudioShapePicture } from './StudioShapePicture';
import { HeightRow } from './StudioSheetHeight';
import { NumberRow, type SheetFacts, SheetRow } from './StudioSheetRow';
import { StudioStairsRow } from './StudioStairsRow';

type ShapeRow = NonNullable<RoofSheetRows['shape']>;

/** The shapes as pictures: the first five, and More shapes for the rest. */
function ShapeTiles({ facts, shape }: { facts: SheetFacts; shape: ShapeRow }) {
  const { studio, words } = facts;
  const now = shape.is;
  // biome-ignore lint/plugin: whether More shapes is open is this tile set's own look
  const [more, setMore] = useState(shape.isLater);
  const shapes = more ? [...shape.first, ...shape.later] : shape.first;
  return (
    <>
      <fieldset className="hg-material-tiles" aria-label={words.rowShape}>
        {shapes.map((shape) => (
          <Pressable
            key={shape}
            className="hg-material-tile"
            accessibilityLabel={words.shape(shape)}
            accessibilityState={{ selected: shape === now }}
            onPress={() => studio.moves.pickShape(shape)}
          >
            <StudioShapePicture shape={shape} />
            <span className="hg-material-tile-name">{words.shape(shape)}</span>
          </Pressable>
        ))}
      </fieldset>
      <span className="hg-sheet-reset">
        <Button variant="ghost" size="md" onClick={() => setMore(!more)}>
          {more ? words.fewerShapes : words.moreShapes}
        </Button>
      </span>
    </>
  );
}

/**
 * A sloped roof's Slope row, the way it runs down — once it has one — and a low side against a
 * taller roof's wall.
 */
function SlopeRows({ facts, rows }: { facts: SheetFacts; rows: RoofSheetRows }) {
  const { units, words } = facts;
  const format = useFormat();
  const { slope, shape } = rows;
  if (slope === null) return null;
  const lower = shape?.is === 'mansard' || shape?.is === 'gambrel';
  const ridge = slope.ridgeAboveM > 0 ? format.roofHeight(slope.ridgeAboveM, units) : null;
  return (
    <>
      <NumberRow
        facts={facts}
        shown={slope.number}
        label={words.rowNumber('slope', lower)}
        waits={slope.waits}
      />
      {slope.way === null ? null : (
        <p className="hg-sheet-line">{words.slopeWay(slope.way, ridge)}</p>
      )}
      {slope.lowAgainst === null ? null : (
        <p className="hg-sheet-line" data-waits="true">
          {words.lowAgainst(slope.lowAgainst)}
        </p>
      )}
    </>
  );
}

type ParapetRow = NonNullable<RoofSheetRows['parapet']>;

/**
 * The Parapet row: its switch on the row's own line, so a parapet all round is one tap once the
 * sheet is open (E115). While a wall stands, everything about it shows under the switch in one
 * box — what it is built as first, as it decides the rows under it, then its height, a wall's
 * thickness and where the lengths were measured; with no wall, nothing about one shows. Switched
 * on, the box scrolls into view. A reader sees the same rows with their values.
 */
function ParapetRows({ facts, parapet }: { facts: SheetFacts; parapet: ParapetRow }) {
  const { studio, words } = facts;
  const editable = studio.editing.kind === 'editor';
  // The switch was just turned on: the box it opens scrolls into view once it stands.
  const turnedOn = useRef(false);
  // Switched on where no wall can stand (every side a seam): nothing opens, so nothing scrolls later.
  if (!parapet.walls) turnedOn.current = false;
  const value = words.parapetValue(parapet.allRound, parapet.apart);
  return (
    <>
      {editable ? (
        <div className="hg-sheet-row">
          <div className="hg-sheet-row-head">
            <span className="hg-sheet-row-label">{words.rowParapet}</span>
            <span className="hg-sheet-row-value">{value}</span>
            <Switch
              checked={parapet.allRound}
              ariaLabel={words.parapetAllRound}
              onChange={(on) => {
                turnedOn.current = on;
                studio.moves.setParapetAllRound(on);
              }}
            />
          </div>
        </div>
      ) : (
        <SheetRow facts={facts} rowKey="parapet" label={words.rowParapet} value={value} />
      )}
      {parapet.apart === null ? null : (
        <p className="hg-sheet-line">{words.parapetApart(parapet.allRound, parapet.apart)}</p>
      )}
      {parapet.walls ? (
        <div
          className="hg-sheet-parapet"
          ref={(box) => {
            if (box === null || !turnedOn.current) return;
            turnedOn.current = false;
            box.scrollIntoView({ block: 'nearest' });
          }}
        >
          <ParapetBuiltRow facts={facts} parapet={parapet} />
          <NumberRow
            facts={facts}
            shown={parapet.height}
            label={words.rowNumber('parapet_height')}
            waits={parapet.waits}
          />
          {parapet.thickness === null ? null : (
            <NumberRow
              facts={facts}
              shown={parapet.thickness}
              label={words.rowNumber('thickness')}
            />
          )}
          <MeasuredRow facts={facts} parapet={parapet} />
        </div>
      ) : null}
    </>
  );
}

/** Wall or railing: a railing has no thickness to set, so its row goes. */
function ParapetBuiltRow({ facts, parapet }: { facts: SheetFacts; parapet: ParapetRow }) {
  const { studio, words } = facts;
  const editable = studio.editing.kind === 'editor';
  return (
    <div className="hg-sheet-row">
      <div className="hg-sheet-row-head">
        <span className="hg-sheet-row-label">{words.builtTitle}</span>
        {editable ? null : <span className="hg-sheet-row-value">{words.built(parapet.build)}</span>}
      </div>
      {editable ? (
        <SegmentedControl
          ariaLabel={words.builtTitle}
          fill
          value={parapet.build}
          options={[
            { value: 'wall', label: words.built('wall') },
            { value: 'railing', label: words.built('railing') },
          ]}
          onChange={(build) =>
            studio.moves.setParapetBuilt(build === 'railing' ? 'railing' : 'wall')
          }
        />
      ) : null}
    </div>
  );
}

/** Where the roof's lengths were taped: outside the parapet, or inside it. */
function MeasuredRow({ facts, parapet }: { facts: SheetFacts; parapet: ParapetRow }) {
  const { studio, words } = facts;
  const editable = studio.editing.kind === 'editor';
  return (
    <div className="hg-sheet-row">
      <div className="hg-sheet-row-head">
        <span className="hg-sheet-row-label">{words.measuredTitle}</span>
        {editable ? null : (
          <span className="hg-sheet-row-value">{words.measured(parapet.measured)}</span>
        )}
      </div>
      {editable ? (
        <SegmentedControl
          ariaLabel={words.measuredTitle}
          fill
          value={parapet.measured}
          options={[
            { value: 'outside', label: words.measured('outside') },
            { value: 'inside', label: words.measured('inside') },
          ]}
          onChange={(to) => studio.moves.setLengthsMeasured(to === 'inside' ? 'inside' : 'outside')}
        />
      ) : null}
    </div>
  );
}

/** Every row of a roof's sheet that this roof has a use for, in the board's order. */
export function StudioSheetRows({
  facts,
  rows,
  sheet,
}: {
  facts: SheetFacts;
  rows: RoofSheetRows;
  sheet: RoofSheetView;
}) {
  const { studio, words } = facts;
  const { moves } = studio;
  const { kind, material, shape, parapet } = rows;
  return (
    <>
      {kind === null ? null : (
        <SheetRow
          facts={facts}
          rowKey="kind"
          label={words.rowKind}
          value={words.kindWord(kind.is)}
          waits={kind.waits}
        >
          <StudioKindChips
            name={words.rowKind}
            chips={[kind.is, ...kind.choices.filter((each) => each !== kind.is)].map((choice) => ({
              choice,
              lit: choice === kind.is,
              label: words.kindWord(choice),
            }))}
            onChoose={(choice) => {
              if (choice !== 'join' && choice !== 'cut_to_edge') moves.makeKind(choice);
            }}
          />
        </SheetRow>
      )}
      {material === null ? null : (
        <SheetRow
          facts={facts}
          rowKey="material"
          label={words.rowMadeOfTitle}
          value={words.rowMaterial(material)}
          waits={!material.confirmed}
          onOpen={() => moves.openMaterial(rows.roof, 'sheet')}
        />
      )}
      {shape === null ? null : (
        <SheetRow facts={facts} rowKey="shape" label={words.rowShape} value={words.shape(shape.is)}>
          <ShapeTiles facts={facts} shape={shape} />
        </SheetRow>
      )}
      <StudioFacesRow facts={facts} rows={rows} />
      <HeightRow facts={facts} rows={rows} sheet={sheet} />
      <SlopeRows facts={facts} rows={rows} />
      {rows.extras.map((shown) => (
        <NumberRow key={shown.key} facts={facts} shown={shown} label={words.rowNumber(shown.key)} />
      ))}
      {rows.overhang === null ? null : (
        <NumberRow facts={facts} shown={rows.overhang} label={words.rowNumber('overhang')} />
      )}
      {rows.setback === null ? null : (
        <NumberRow facts={facts} shown={rows.setback} label={words.rowNumber('setback')} />
      )}
      {parapet === null ? null : <ParapetRows facts={facts} parapet={parapet} />}
      <StudioStairsRow facts={facts} room={rows.roof} row={rows.stairs} />
    </>
  );
}

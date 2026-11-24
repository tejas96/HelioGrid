'use client';
import type { RoofSheetRows, RoofSheetView } from '@heliogrid/domain';
import { Button, Pressable, Switch, useFormat } from '@heliogrid/ui';
import { useState } from 'react';
import { StudioFacesRow } from './StudioFaceRows';
import { StudioKindChips } from './StudioKindChips';
import { StudioShapePicture } from './StudioShapePicture';
import { HeightRow } from './StudioSheetHeight';
import { NumberRow, type SheetFacts, SheetRow } from './StudioSheetRow';
import { StudioStairsRow } from './StudioStairsRow';
import { numberShownBy } from './sheet-number-shown';

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
 * sheet is open (E115); while it is on, its height is the row under it. A reader sees the value.
 */
function ParapetRows({ facts, parapet }: { facts: SheetFacts; parapet: ParapetRow }) {
  const { studio, units, words } = facts;
  const text = numberShownBy(useFormat(), units);
  const value = words.parapetValue(parapet.allRound, text(parapet.height));
  if (studio.editing.kind !== 'editor') {
    return (
      <SheetRow
        facts={facts}
        rowKey="parapet"
        label={words.rowParapet}
        value={value}
        waits={parapet.waits}
      />
    );
  }
  return (
    <>
      <div className="hg-sheet-row">
        <div className="hg-sheet-row-head">
          <span className="hg-sheet-row-label">{words.rowParapet}</span>
          <span className="hg-sheet-row-value">{value}</span>
          <Switch
            checked={parapet.allRound}
            ariaLabel={words.parapetAllRound}
            onChange={studio.moves.setParapetAllRound}
          />
        </div>
      </div>
      {parapet.allRound ? (
        <NumberRow
          facts={facts}
          shown={parapet.height}
          label={words.rowNumber('parapet_height')}
          waits={parapet.waits}
        />
      ) : null}
    </>
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
  const { studio, units, words } = facts;
  const format = useFormat();
  const { moves } = studio;
  const text = numberShownBy(format, units);
  const { kind, material, shape, parapet, details } = rows;
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
      {parapet === null ? null : <ParapetRows facts={facts} parapet={parapet} />}
      {rows.setback === null ? null : (
        <NumberRow facts={facts} shown={rows.setback} label={words.rowNumber('setback')} />
      )}
      <StudioStairsRow facts={facts} room={rows.roof} row={rows.stairs} />
      {details === null ? null : (
        <SheetRow
          facts={facts}
          rowKey="details"
          label={words.rowDetails}
          value={words.detailsValue(text(details.thickness), details.measured)}
          onOpen={moves.openDetails}
        />
      )}
    </>
  );
}

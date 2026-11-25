'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofRow } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import {
  IconButton,
  Pressable,
  SegmentedControl,
  ShellGlyph,
  type ShellGlyphName,
  useFormat,
} from '@heliogrid/ui';
import { type RefObject, useEffect, useId, useRef } from 'react';
import { usePressAway } from '../hooks/use-press-away';
import { ROOF_KIND_GLYPH } from './roof-kind-glyph';
import { StudioPanelHead } from './StudioPanelHead';

/** A row's picture: what the roof is; a building that is not the main roof is drawn as one more. */
function glyphOf(row: RoofRow): ShellGlyphName {
  return row.kind === 'building' && row.sits.kind !== 'main'
    ? 'building'
    : ROOF_KIND_GLYPH[row.kind];
}

/**
 * One roof's row: what it is, its name, what it is made of, where it sits, its area, its acts. A
 * tap anywhere but Copy and Delete opens the roof's sheet, where what it is made of is changed: a
 * type's own tap here would reach over the name, and a first tap would open the wrong sheet.
 */
function RoofsRow({
  row,
  lit,
  editable,
  studio,
  units,
  words,
  branch,
}: {
  row: RoofRow;
  /** Where a row that stands on a roof sits in that roof's branch: `last` ends the tree's line. */
  branch: 'mid' | 'last' | null;
  lit: boolean;
  editable: boolean;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const { moves } = studio;
  const { material } = row;
  const made = material === null ? null : words.rowMaterial(material);
  return (
    <li className="hg-roofs-row" data-lit={lit} data-roof={row.roof} data-branch={branch ?? 'none'}>
      {/* The row's own press lies under its words; only the acts are pressed over it. */}
      <Pressable
        className="hg-roofs-row-pick"
        accessibilityLabel={row.waits ? words.rowWaiting(row.name) : words.rowName(row.name)}
        accessibilityState={{ selected: lit }}
        onPress={() => moves.pickRow(row.roof)}
      />
      <span className="hg-roofs-row-glyph" data-waits={row.waits} aria-hidden>
        <ShellGlyph name={glyphOf(row)} size="sm" />
      </span>
      <span className="hg-roofs-row-words">
        <span className="hg-roofs-row-name">{words.rowName(row.name)}</span>
        <span className="hg-roofs-row-sub">
          {material === null || made === null ? null : (
            <span className="hg-roofs-row-made" data-waits={!material.confirmed}>
              {made}
            </span>
          )}
          <span className="hg-roofs-row-sits">
            {words.rowSits(row.sits, (metres) => format.roofHeight(metres, units))}
          </span>
        </span>
      </span>
      <span className="hg-roofs-row-area">{format.area(row.areaM2, units)}</span>
      {editable ? (
        <span className="hg-roofs-row-acts">
          <IconButton
            label={words.rowCopy(row.name)}
            variant="ghost"
            onClick={() => moves.copyRow(row.roof)}
          >
            <ShellGlyph name="copy" size="sm" />
          </IconButton>
          <IconButton
            label={words.rowDelete(row.name)}
            variant="ghost"
            onClick={() => moves.deleteRow(row.roof)}
          >
            <ShellGlyph name="trash" size="sm" />
          </IconButton>
        </span>
      ) : null}
    </li>
  );
}

/**
 * Roofs, the one sheet that holds every roof (`T-M05-002`, part e): from the foot on a phone, at
 * the right under the head on a desktop. Its head counts the roofs and their area, every spot once.
 * A row per roof, and what stands on a roof right under it on the same left edge. A row picks its
 * roof and opens its sheet in the list's place; what a roof is made of opens the picker; Copy and
 * Delete are on each row. A person who may only view sees the same rows with nothing to change.
 * Metres or feet sits at the end of its title, for anyone, editor or not: it is the person's own
 * pick, the one the View menu holds, so a flip there shows here and on every device.
 */
export function StudioRoofsList({
  footRef,
  studio,
  units,
  words,
}: {
  /** Roofs holds the foot, in the bar's place: the camera frames above it. */
  footRef: RefObject<HTMLDivElement | null> | null;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const format = useFormat();
  const panel = useRef<HTMLDivElement>(null);
  const title = useId();
  const { roofList, litRow, moves } = studio;
  usePressAway(panel, true, moves.closePanel, '.hg-studio-roofs-button');
  // Roofs opened lands focus on its lit row, else on its head: a keyboard starts there.
  useEffect(() => {
    const row = panel.current?.querySelector<HTMLElement>('[data-lit="true"] .hg-roofs-row-pick');
    row?.scrollIntoView({ block: 'nearest' });
    (row ?? panel.current?.querySelector<HTMLElement>('.hg-studio-panel-title'))?.focus();
  }, []);
  return (
    <div
      ref={(node) => {
        panel.current = node;
        if (footRef !== null) footRef.current = node;
      }}
      className="hg-studio-glass hg-roofs-panel"
      role="dialog"
      aria-label={words.roofsName}
    >
      <StudioPanelHead
        id={title}
        title={words.roofsHead(roofList.count, format.area(roofList.areaM2, units))}
        closeLabel={words.roofsClose}
        onClose={moves.closePanel}
      >
        <span className="hg-roofs-units">
          <SegmentedControl
            ariaLabel={words.units}
            value={units}
            options={[
              { value: 'metric', label: words.unitMetres },
              { value: 'imperial', label: words.unitFeet },
            ]}
            onChange={(next) => moves.chooseUnits(next === 'imperial' ? 'imperial' : 'metric')}
          />
        </span>
      </StudioPanelHead>
      <ul className="hg-roofs-rows">
        {roofList.rows.map((row, at) => (
          <RoofsRow
            key={row.roof}
            row={row}
            branch={!row.child ? null : roofList.rows[at + 1]?.child ? 'mid' : 'last'}
            lit={row.roof === litRow}
            editable={studio.editing.kind === 'editor'}
            studio={studio}
            units={units}
            words={words}
          />
        ))}
      </ul>
    </div>
  );
}

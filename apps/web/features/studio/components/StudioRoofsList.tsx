'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofRow } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { IconButton, Pressable, ShellGlyph, type ShellGlyphName, useFormat } from '@heliogrid/ui';
import { type RefObject, useEffect, useRef } from 'react';
import { usePressAway } from '../hooks/use-press-away';
import { ROOF_KIND_GLYPH } from './roof-kind-glyph';

/** A row's picture: what the roof is; a building that is not the main roof is drawn as one more. */
function glyphOf(row: RoofRow): ShellGlyphName {
  return row.kind === 'building' && row.sits.kind !== 'main'
    ? 'building'
    : ROOF_KIND_GLYPH[row.kind];
}

/** One roof's row: what it is, its name, what it is made of, where it sits, its area, its acts. */
function RoofsRow({
  row,
  lit,
  editable,
  studio,
  units,
  words,
}: {
  row: RoofRow;
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
    <li className="hg-roofs-row" data-lit={lit} data-roof={row.roof}>
      {/* The row's own press lies under its words; the material and the acts are pressed over it. */}
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
              {/* Its press is laid over the word, 44 px high, so the word starts where the name does. */}
              {editable ? (
                <Pressable
                  className="hg-roofs-row-made-press"
                  accessibilityLabel={words.rowMadeOf(row.name, material)}
                  onPress={() => moves.openMaterial(row.roof, 'roofs')}
                />
              ) : null}
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
  const { roofList, litRow, moves } = studio;
  usePressAway(panel, true, moves.closePanel, '.hg-studio-roofs-button');
  // Roofs opened lands focus on its lit row, else on its head: a keyboard starts there.
  useEffect(() => {
    const row = panel.current?.querySelector<HTMLElement>('[data-lit="true"] .hg-roofs-row-pick');
    row?.scrollIntoView({ block: 'nearest' });
    (row ?? panel.current?.querySelector<HTMLElement>('.hg-roofs-title'))?.focus();
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
      <div className="hg-roofs-head">
        <span className="hg-roofs-title" tabIndex={-1}>
          {words.roofsHead(roofList.count, format.area(roofList.areaM2, units))}
        </span>
        <IconButton label={words.roofsClose} variant="ghost" onClick={moves.closePanel}>
          <ShellGlyph name="close" size="sm" />
        </IconButton>
      </div>
      <ul className="hg-roofs-rows">
        {roofList.rows.map((row) => (
          <RoofsRow
            key={row.roof}
            row={row}
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

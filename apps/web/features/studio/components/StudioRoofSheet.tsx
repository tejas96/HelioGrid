'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofSheetRows, RoofSheetView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import {
  Button,
  type FocusAfter,
  IconButton,
  landFocusOn,
  ShellGlyph,
  useFormat,
} from '@heliogrid/ui';
import { type KeyboardEvent, type Ref, useEffect, useRef } from 'react';
import { MagnetSwitch } from './StudioBarPills';
import { StudioSheetRows } from './StudioSheetRows';
import { StudioDetailsRows, StudioSideRows } from './StudioSideSheet';

/**
 * A roof's sheet (`T-M05-002`, part e, board section 6): one row per value — what it is, what it
 * is made of, its shape, its height, its slope and the shape's own numbers, its parapet, its
 * setback and the parapet's details. A side tapped on the model shows its own sheet in the roof's
 * place, and Parapet details is its own short sheet; Back returns to the roof's. On a phone it
 * opens from the foot in the bar's place; on a desktop at the right, under the head. Delete sits at
 * the start of the foot, away from × and Done. A reader sees the values and no control.
 */
export function StudioRoofSheet({
  footRef,
  sideRef,
  sheet,
  studio,
  units,
  words,
  map,
  phone,
}: {
  /** On a phone the sheet takes the bar's place at the foot: the camera frames above it. */
  footRef: Ref<HTMLDivElement>;
  /** On a desktop it stands at the right: the model keeps the room left of it. */
  sideRef: Ref<HTMLDivElement>;
  sheet: RoofSheetView;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** The map, where focus goes when the sheet closes. */
  map: FocusAfter;
  phone: boolean;
}) {
  const format = useFormat();
  const { moves, sheetRows: rows, sideRows: side, sheetPart: part } = studio;
  const title = useRef<HTMLSpanElement>(null);
  // A sheet opened lands focus on its title, so a keyboard or a screen reader starts there.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each roof or side opened is a new place to land
  useEffect(() => {
    title.current?.focus();
  }, [sheet.roof, part]);
  if (rows === null) return null;
  const facts = { studio, units, words, phone };
  const heading = headingOf(studio, rows, words, (metres) => format.roofHeight(metres, units));
  const back = backOf(studio);
  const waits = part.kind === 'side' ? (side?.waits ?? false) : rows.waits;
  const close = () => {
    moves.closeRoof();
    landFocusOn(map);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    // Esc goes back one sheet, as the phone's back does; on the roof's own sheet it closes.
    if (part.kind !== 'roof') moves.backToRoof();
    else close();
  };
  const pill = <MagnetPill studio={studio} words={words} phone={phone} />;
  if (phone && studio.arrowHeld) return pill;
  return (
    <>
      {pill}
      <div
        ref={phone ? footRef : sideRef}
        className="hg-studio-glass hg-roof-sheet"
        data-room={phone ? 'phone' : 'desktop'}
        data-part={part.kind}
        role="dialog"
        aria-label={heading.title}
        onKeyDown={onKeyDown}
      >
        <div className="hg-roof-sheet-head">
          {back === null ? null : (
            <IconButton label={words.sheetBack} variant="ghost" onClick={back}>
              <ShellGlyph name="chevron-left" size="md" />
            </IconButton>
          )}
          <span className="hg-roof-sheet-names">
            <span ref={title} className="hg-roof-sheet-title hg-focus-target" tabIndex={-1}>
              {heading.title}
            </span>
            <span className="hg-roof-sheet-line">{heading.line}</span>
            {part.kind === 'roof' ? (
              <span className="hg-roof-sheet-area">{format.area(rows.areaM2, units)}</span>
            ) : null}
          </span>
          <span className="hg-roof-sheet-close">
            <IconButton label={words.sheetClose} variant="ghost" onClick={close}>
              <ShellGlyph name="close" size="md" />
            </IconButton>
          </span>
        </div>
        {/* A side's sheet, Parapet details or the roof's: each slides in when it takes the place. */}
        <div
          key={part.kind === 'side' ? `side-${part.side}` : part.kind}
          className="hg-roof-sheet-rows"
          data-part={part.kind}
        >
          {part.kind === 'side' && side !== null ? (
            <StudioSideRows facts={facts} side={side} />
          ) : part.kind === 'details' ? (
            <StudioDetailsRows facts={facts} rows={rows} />
          ) : (
            <StudioSheetRows facts={facts} rows={rows} sheet={sheet} />
          )}
          {waits ? (
            <p className="hg-sheet-check">
              <span className="hg-sheet-dot" aria-hidden="true" />
              {words.checkOnSite}
            </p>
          ) : null}
        </div>
        <SheetFoot
          studio={studio}
          rows={rows}
          words={words}
          onDone={() => {
            if (moves.done()) landFocusOn(map);
          }}
          onDelete={() => {
            moves.deleteRoofAt(rows.roof);
            landFocusOn(map);
          }}
        />
      </div>
    </>
  );
}

/** The sheet's head: the roof's name and where it sits, a side's way, or Parapet details. */
function headingOf(
  studio: StudioScreen,
  rows: RoofSheetRows,
  words: StudioCanvasWords,
  heightOf: (metres: number) => string,
): { title: TranslatedText; line: TranslatedText } {
  const name = words.sheetRoof(rows.name);
  const { sheetPart: part, sideRows: side } = studio;
  if (part.kind === 'side' && side !== null) {
    return { title: words.thisSide, line: words.sideOf(side.name, side.faces) };
  }
  if (part.kind === 'details') return { title: words.rowDetails, line: name };
  return { title: name, line: words.rowSits(rows.sits, heightOf) };
}

/** Back: a side's sheet and Parapet details to the roof's; a sheet opened from Roofs, to Roofs. */
function backOf(studio: StudioScreen): (() => void) | null {
  if (studio.sheetPart.kind !== 'roof') return studio.moves.backToRoof;
  return studio.sheetFromRoofs ? studio.moves.backToRoofs : null;
}

/** Delete at the start of the foot, on the roof's own sheet; Done at its end. A reader has neither. */
function SheetFoot({
  studio,
  rows,
  words,
  onDone,
  onDelete,
}: {
  studio: StudioScreen;
  rows: RoofSheetRows;
  words: StudioCanvasWords;
  onDone: () => void;
  onDelete: () => void;
}) {
  if (studio.editing.kind !== 'editor') return null;
  return (
    <div className="hg-roof-sheet-acts">
      {studio.sheetPart.kind === 'roof' ? (
        <IconButton label={words.rowDelete(rows.name)} variant="ghost" onClick={onDelete}>
          <ShellGlyph name="trash" size="md" tone="danger" />
        </IconButton>
      ) : null}
      <Button
        variant="primary"
        size="md"
        onClick={onDone}
        icon={<ShellGlyph name="check" size="sm" />}
      >
        {words.sheetDone}
      </Button>
    </div>
  );
}

/**
 * The magnet's pill in 3D: while an arrow is held on a phone the sheet steps aside for it (board
 * 10.1); on a desktop, where the foot is free, it stands there with the sheet open.
 */
function MagnetPill({
  studio,
  words,
  phone,
}: {
  studio: StudioScreen;
  words: StudioCanvasWords;
  phone: boolean;
}) {
  if (studio.editing.kind !== 'editor' || (phone && !studio.arrowHeld)) return null;
  return (
    <div className="hg-studio-glass hg-studio-bar" data-kind="pill" data-beside-sheet={!phone}>
      <span className="hg-studio-bar-acts">
        <MagnetSwitch studio={studio} words={words} />
      </span>
    </div>
  );
}

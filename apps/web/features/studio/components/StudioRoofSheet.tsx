'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofSheetView } from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  type FocusAfter,
  IconButton,
  landFocusOn,
  ProvenanceTier,
  ShellGlyph,
  Slider,
  useFormat,
} from '@heliogrid/ui';
import { type KeyboardEvent, type Ref, useEffect, useRef } from 'react';
import { roofWordsShown } from './roof-words-shown';
import { StudioEntryBoxes } from './StudioEntryBoxes';

/** The height row's controls: the slider first, or the box; the hint and Reset under them. */
function HeightControls({
  sheet,
  studio,
  units,
  words,
}: {
  sheet: RoofSheetView;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { moves } = studio;
  const { height, slide } = sheet;
  const outside = height.metres < slide.min || height.metres > slide.max;
  const typing = studio.numberEntry === 'box' || outside;
  const byPerson = height.setBy === 'person';
  return (
    <>
      {typing && studio.heightEntry !== null ? (
        <StudioEntryBoxes
          entry={studio.heightEntry}
          units={units}
          label={words.heightLabel}
          focusRequest={sheet.roof + 1}
          onEntry={moves.typeHeight}
          words={words}
        />
      ) : (
        <Slider
          value={height.metres}
          min={slide.min}
          max={slide.max}
          step={slide.step}
          mark={sheet.systemMetres}
          label={words.heightLabel}
          labelSpokenOnly
          format={(metres) => format.roofHeight(metres, units)}
          words={sliderWords(t)}
          onInput={moves.slideHeight}
          onCommit={() => moves.keepHeight()}
        />
      )}
      {studio.heightRefusal === null ? null : (
        <span className="hg-roof-sheet-refused" role="alert">
          <ShellGlyph name="alert-circle" size="sm" />
          {words.heightRefusal(studio.heightRefusal, roofWordsShown(format, units).heightOf)}
        </span>
      )}
      <span className="hg-roof-sheet-hint">
        {words.heightHint(byPerson)}
        {byPerson ? (
          <Button variant="ghost" size="sm" onClick={moves.resetHeight}>
            {words.heightReset(format.roofHeight(sheet.systemMetres, units))}
          </Button>
        ) : null}
      </span>
    </>
  );
}

/**
 * A roof's sheet in 3D (`T-M05-002`, part b): opened by a tap on the roof — on a phone a short
 * sheet across the foot, on a desktop a card in the bar's place. It holds what 3D is for: the
 * height, by the slider (the system's height ticked on it), a small switch to a box, Reset, Edit
 * outline in 2D and Done. A reader's sheet shows the same values with no control.
 */
export function StudioRoofSheet({
  sheetRef,
  sheet,
  studio,
  units,
  words,
  map,
}: {
  sheetRef: Ref<HTMLDivElement>;
  sheet: RoofSheetView;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** The map, where focus goes when the sheet closes. */
  map: FocusAfter;
}) {
  const format = useFormat();
  const { moves } = studio;
  const title = useRef<HTMLSpanElement>(null);
  // A sheet opened lands focus on its title, so a keyboard or a screen reader starts there.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each roof opened is a new place to land
  useEffect(() => {
    title.current?.focus();
  }, [sheet.roof]);
  const closed = () => {
    moves.closeRoof();
    return true;
  };
  /** An act that closes the sheet sends focus on to the map; one refused leaves it here. */
  const closing = (act: () => boolean) => () => {
    if (act() !== false) landFocusOn(map);
  };
  const editable = studio.editing.kind === 'editor';
  const typing = studio.numberEntry === 'box';
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') closing(closed)();
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) moves.keepHeight();
  };
  return (
    <div
      ref={sheetRef}
      className="hg-studio-glass hg-roof-sheet"
      role="dialog"
      aria-label={words.sheetRoof(sheet.roof + 1)}
      onKeyDown={onKeyDown}
    >
      <div className="hg-roof-sheet-head">
        <span ref={title} className="hg-roof-sheet-title" tabIndex={-1}>
          {words.sheetRoof(sheet.roof + 1)}
        </span>
        <span className="hg-roof-sheet-area">{format.area(sheet.area, units)}</span>
        <ProvenanceTier tier={sheet.areaTier} />
        <span className="hg-roof-sheet-close">
          <IconButton label={words.sheetClose} variant="ghost" onClick={closing(closed)}>
            <ShellGlyph name="close" size="md" />
          </IconButton>
        </span>
      </div>
      <div className="hg-roof-sheet-row">
        <span className="hg-roof-sheet-label">{words.heightLabel}</span>
        <span className="hg-roof-sheet-value">{format.roofHeight(sheet.height.metres, units)}</span>
        <ProvenanceTier tier={sheet.height.tier} />
        {editable ? (
          <span className="hg-roof-sheet-switch">
            <IconButton
              label={typing ? words.slideHeight : words.typeHeight}
              variant="ghost"
              pressed={typing}
              onClick={() => moves.chooseNumberEntry(typing ? 'slider' : 'box')}
            >
              <ShellGlyph name="keyboard" size="md" />
            </IconButton>
          </span>
        ) : null}
      </div>
      {editable ? (
        <>
          <HeightControls sheet={sheet} studio={studio} units={units} words={words} />
          <div className="hg-roof-sheet-acts">
            <Button
              variant="secondary"
              size="md"
              onClick={closing(moves.editOutline)}
              icon={<ShellGlyph name="pencil" size="sm" />}
            >
              {words.editOutline}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={closing(moves.done)}
              icon={<ShellGlyph name="check" size="sm" />}
            >
              {words.sheetDone}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

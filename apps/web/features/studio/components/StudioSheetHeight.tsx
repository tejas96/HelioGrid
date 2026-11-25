'use client';
import type { RoofSheetRows, RoofSheetView } from '@heliogrid/domain';
import { sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, ShellGlyph, Slider, useFormat } from '@heliogrid/ui';
import { roofWordsShown } from './roof-words-shown';
import { StudioEntryBoxes } from './StudioEntryBoxes';
import { NumberHead } from './StudioSheetNumber';
import { type SheetFacts, SheetRow } from './StudioSheetRow';
import { boxOnDigit } from './slider-digit';

/** The height: the slider marked with the floors, − and + a floor each; a box to type it. */
export function HeightRow({
  facts,
  rows,
  sheet,
}: {
  facts: SheetFacts;
  rows: RoofSheetRows;
  sheet: RoofSheetView;
}) {
  const { studio, units, words } = facts;
  const t = useTranslate();
  const format = useFormat();
  const { moves } = studio;
  const label = words.rowHeight(rows.height.from);
  const metres = sheet.height.metres;
  const typing = studio.numberEntry === 'box' || sheet.outside;
  const height = format.roofHeight(metres, units);
  const on = rows.height.floor;
  const value = on === null ? height : words.heightOnFloor(height, words.floor(on.floor));
  const head = (
    <NumberHead
      value={value}
      name={label}
      numberKey="height"
      outside={sheet.outside}
      studio={studio}
      words={words}
    />
  );
  // A digit typed on the slider opens the box holding it (G027), and the focus goes to it.
  const onKeyDown = boxOnDigit(typing, (digit) => {
    moves.chooseNumberEntry('box');
    moves.startNumber('height', null);
    moves.typeHeight({ main: digit, inches: '', measured: false });
  });
  return (
    <SheetRow facts={facts} rowKey="height" label={label} value={value} always openValue={head}>
      <fieldset className="hg-sheet-number" aria-label={label} onKeyDown={onKeyDown}>
        {typing && studio.heightEntry !== null ? (
          <StudioEntryBoxes
            entry={studio.heightEntry}
            units={units}
            label={label}
            focusRequest={studio.numberStarted?.key === 'height' ? sheet.roof + 1 : 0}
            onEntry={moves.typeHeight}
            words={words}
          />
        ) : (
          <Slider
            value={metres}
            min={sheet.slide.min}
            max={sheet.slide.max}
            step={sheet.slide.step}
            mark={sheet.systemMetres}
            ticks={rows.height.ticks.map((tick) => ({
              value: tick.metres,
              ...(tick.named ? { label: words.floor(tick.floor) } : {}),
            }))}
            label={label}
            labelSpokenOnly
            format={(at) => format.roofHeight(at, units)}
            words={sliderWords(t)}
            onInput={moves.slideHeight}
            onCommit={() => moves.keepHeight()}
          />
        )}
        {studio.heightRefusal === null ? null : (
          <span className="hg-roof-sheet-refused" role="alert">
            <ShellGlyph name="alert-circle" size="sm" />
            {words.heightRefusal(
              studio.heightRefusal,
              roofWordsShown(format, units, studio.startHeightM, studio.topMarks).heightOf,
            )}
          </span>
        )}
        {sheet.height.setBy === 'person' ? (
          <span className="hg-sheet-reset">
            <Button variant="ghost" size="md" onClick={moves.resetHeight}>
              {words.reset(format.roofHeight(sheet.systemMetres, units))}
            </Button>
          </span>
        ) : null}
      </fieldset>
    </SheetRow>
  );
}

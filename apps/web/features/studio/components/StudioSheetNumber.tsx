'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { SheetRowKey, StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofNumberShown } from '@heliogrid/domain';
import { numberFieldWords, type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import {
  Button,
  IconButton,
  NumberField,
  ShellGlyph,
  Slider,
  type SliderTick,
  useFormat,
} from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { numberShownBy } from './sheet-number-shown';
import { boxOnDigit } from './slider-digit';

/**
 * One number of a roof's sheet or a side's (`T-M05-002`, *Values*): the slider first, with − and
 * + and the studio's value ticked on its track; a small switch turns it into a box to type, and
 * back; a value a person set carries its reset. A reader sees the value alone.
 */
export function StudioSheetNumber({
  shown,
  name,
  studio,
  units,
  words,
  onSide = false,
  onFace = false,
  ticks,
  withHead = true,
  onSlide,
  onKeep,
  onSet,
  onReset,
}: {
  shown: RoofNumberShown;
  /** The row's name: the slider's and the box's spoken name. */
  name: TranslatedText;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  /** A side's own number: its reset goes back to the roof's. */
  onSide?: boolean;
  /** A face drawn by hand's own slope: its reset goes back to the roof's slope. */
  onFace?: boolean;
  /** Named points on the track: the height's floors. */
  ticks?: readonly SliderTick[];
  onSlide: (value: number) => void;
  onKeep: () => void;
  onSet: (value: number) => void;
  onReset: () => void;
  /** Its value and its keyboard switch over the slider; off where the row's own line holds them. */
  withHead?: boolean;
}) {
  const t = useTranslate();
  const text = numberShownBy(useFormat(), units);
  const typing = studio.numberEntry === 'box' || shown.outside;
  const editable = studio.editing.kind === 'editor';
  const onKeyDown = boxOnDigit(typing, (digit) => {
    studio.moves.chooseNumberEntry('box');
    studio.moves.startNumber(shown.key, digit);
  });
  return (
    <fieldset className="hg-sheet-number" aria-label={name} onKeyDown={onKeyDown}>
      {withHead ? (
        <div className="hg-sheet-number-head">
          <NumberHead
            value={text(shown)}
            name={name}
            numberKey={shown.key}
            outside={shown.outside}
            studio={studio}
            words={words}
          />
        </div>
      ) : null}
      {!editable ? null : typing ? (
        <NumberBox shown={shown} name={name} studio={studio} onSet={onSet} />
      ) : (
        <Slider
          value={shown.value}
          min={shown.slide.min}
          max={shown.slide.max}
          step={shown.slide.step}
          mark={shown.system}
          label={name}
          labelSpokenOnly
          format={(value) => text({ unit: shown.unit, value })}
          words={sliderWords(t)}
          onInput={onSlide}
          onCommit={onKeep}
          {...(ticks === undefined ? {} : { ticks })}
        />
      )}
      {editable && shown.byPerson ? (
        <span className="hg-sheet-reset">
          <Button variant="ghost" size="md" onClick={onReset}>
            {resetWords(words, text({ ...shown, value: shown.system }), onSide, onFace)}
          </Button>
        </span>
      ) : null}
    </fieldset>
  );
}

/**
 * A number's box to type it in. Turned to typing here, it takes the focus; by a digit typed on its
 * slider, it opens holding that digit (G027).
 */
function NumberBox({
  shown,
  name,
  studio,
  onSet,
}: {
  shown: RoofNumberShown;
  name: TranslatedText;
  studio: StudioScreen;
  onSet: (value: number) => void;
}) {
  const t = useTranslate();
  const typed = studio.numberTyped(shown);
  const started = studio.numberStarted?.key === shown.key ? studio.numberStarted : null;
  return (
    <NumberField
      label={name}
      labelSpokenOnly
      value={typed.value}
      min={typed.min}
      max={typed.max}
      step={typed.step}
      unit={typed.unit}
      density="functional"
      words={numberFieldWords(t)}
      {...(started === null ? {} : { focusRequest: 1 })}
      {...(started?.digit == null ? {} : { startDraft: started.digit })}
      onCommit={(value) => onSet(typed.back(value))}
    />
  );
}

/** The reset's words: back to the roof's slope for a face, the roof's for a side, else the studio's. */
function resetWords(words: StudioCanvasWords, value: string, onSide: boolean, onFace: boolean) {
  return onFace ? words.resetFace(value) : words.reset(value, onSide);
}

/** A number's value, large, and the small switch that turns its slider into a box and back. */
export function NumberHead({
  value,
  name,
  numberKey,
  outside,
  studio,
  words,
}: {
  value: ReactNode;
  name: TranslatedText;
  /** The row whose number it is: turned to typing, its box takes the focus. */
  numberKey: SheetRowKey;
  /** Past the slider's ends: only the box shows it, and the switch rests there. */
  outside: boolean;
  studio: StudioScreen;
  words: StudioCanvasWords;
}) {
  const typing = studio.numberEntry === 'box' || outside;
  return (
    <>
      <span className="hg-sheet-number-value">{value}</span>
      {studio.editing.kind === 'editor' ? (
        <IconButton
          label={typing ? words.slideIt(name) : words.typeIt(name)}
          variant="ghost"
          pressed={typing}
          disabled={outside}
          onClick={() => {
            studio.moves.chooseNumberEntry(typing ? 'slider' : 'box');
            if (!typing) studio.moves.startNumber(numberKey, null);
          }}
        >
          <ShellGlyph name="keyboard" size="md" />
        </IconButton>
      ) : null}
    </>
  );
}

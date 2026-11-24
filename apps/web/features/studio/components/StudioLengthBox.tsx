'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { MeasurementSystem, RoofStepState } from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, IconButton, ShellGlyph, Slider, Switch, useFormat } from '@heliogrid/ui';
import type { KeyboardEvent } from 'react';
import { StudioEntryBoxes } from './StudioEntryBoxes';
import { digitOnSlider } from './slider-digit';

type Sizing = Extract<RoofStepState, { kind: 'sizing' }>;

/** Each edge opened, and each switch to the box, gives the box a new focus number. */
const FOCUS_PER_ROOF = 1_000;

/**
 * The length field (`T-M05-002`, part b): opened by a tap on a length, at the top. A slider first —
 * no keyboard comes up — with − and + either side and the picture's length marked on its track;
 * a small switch beside the value turns it into a box to type, and the pick follows the person to
 * every device. On a desktop a digit typed while the slider has focus switches to the box by
 * itself. Set or Enter keeps the length as one change; × or Esc puts the old one back. A value far
 * off the picture asks once, here, before it is used.
 */
export function StudioLengthBox({
  sizing,
  studio,
  units,
  words,
}: {
  sizing: Sizing;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
}) {
  const t = useTranslate();
  const format = useFormat();
  const { moves, lengthBox, numberEntry } = studio;
  const { entry } = sizing;
  if (lengthBox === null) return null;
  const { traced, typed, first, slide } = lengthBox;
  const metres = typed ?? traced;
  // A length outside the slider's ends is typed: the slider would cut it to an end, so its switch
  // rests until the length is back between them.
  const outside = metres < slide.min || metres > slide.max;
  const typing = numberEntry === 'box' || outside;
  const refused = studio.bar?.kind === 'roofs' && studio.bar.live !== null;
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      moves.setLength();
      return;
    }
    // A digit typed on the slider: the person wants to type. The box opens with that digit.
    const digit = digitOnSlider(event);
    if (!typing && digit !== null) {
      event.preventDefault();
      moves.chooseNumberEntry('box');
      moves.typeLength({ ...entry, main: digit, inches: '' });
    }
  };
  return (
    <form
      className="hg-studio-glass hg-length-box"
      aria-label={words.lengthLabel}
      onSubmit={(event) => event.preventDefault()}
      onKeyDown={onKeyDown}
    >
      <div className="hg-length-box-head">
        <span className="hg-length-box-title">
          <span className="hg-length-box-label">{words.lengthTitle}</span>
          <span className="hg-length-box-value">{format.roofLength(metres, units, false)}</span>
        </span>
        <IconButton
          label={typing ? words.slideLength : words.typeLength}
          variant="ghost"
          pressed={typing}
          disabled={outside}
          onClick={() => moves.chooseNumberEntry(typing ? 'slider' : 'box')}
        >
          <ShellGlyph name="keyboard" size="md" />
        </IconButton>
        <IconButton label={words.closeLength} variant="ghost" onClick={moves.cancel}>
          <ShellGlyph name="close" size="md" />
        </IconButton>
      </div>
      {typing ? (
        <StudioEntryBoxes
          entry={entry}
          units={units}
          label={words.lengthLabel}
          focusRequest={sizing.roof * FOCUS_PER_ROOF + sizing.edge + 1}
          onEntry={moves.typeLength}
          words={words}
        />
      ) : (
        <Slider
          value={metres}
          min={slide.min}
          max={slide.max}
          step={slide.step}
          mark={slide.mark}
          label={words.lengthTitle}
          labelSpokenOnly
          format={(value) => format.roofLength(value, units, false)}
          words={sliderWords(t)}
          // Input alone: a commit on a thumb touched and let go would round the picture's exact
          // length to the step and move the edge.
          onInput={moves.slideLength}
        />
      )}
      <div className="hg-length-box-row">
        <span className="hg-length-box-switch">
          <Switch
            label={words.measuredOnSite}
            checked={entry.measured}
            toggleAt="start"
            onChange={(measured) => moves.typeLength({ ...entry, measured })}
          />
        </span>
        <Button
          variant="primary"
          size="md"
          onClick={moves.setLength}
          disabled={refused}
          icon={<ShellGlyph name="check" size="sm" />}
        >
          {words.setLength}
        </Button>
      </div>
      {sizing.asking && typed !== null ? (
        <div className="hg-length-box-ask" role="alert">
          <span className="hg-length-box-ask-words">
            <ShellGlyph name="alert-circle" size="sm" />
            <span>
              {words.lengthAsk(
                // "About" is the sentence's own word: the length drops its "~".
                format.roofLength(traced, units, true).replace(/^~/, ''),
                format.roofLength(typed, units, false),
              )}
            </span>
          </span>
          <span className="hg-length-box-ask-acts">
            <Button variant="secondary" size="sm" onClick={() => moves.confirmLength(false)}>
              {words.lengthChange}
            </Button>
            <Button variant="primary" size="sm" onClick={() => moves.confirmLength(true)}>
              {words.lengthUse(format.roofLength(typed, units, false))}
            </Button>
          </span>
        </div>
      ) : (
        <span className="hg-length-box-hint">
          {words.lengthHint(first, typing ? null : format.fineLength(slide.step, units))}
        </span>
      )}
    </form>
  );
}

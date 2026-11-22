'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { SizeCardView, StudioScreen } from '@heliogrid/data/react';
import { LENGTH_MAX_M, LENGTH_MIN_M, type MeasurementSystem } from '@heliogrid/domain';
import { type StudioCanvasWords, sliderWords } from '@heliogrid/i18n';
import { useTranslate } from '@heliogrid/i18n/react';
import { Button, IconButton, Input, ShellGlyph, Slider, useFormat } from '@heliogrid/ui';
import type { KeyboardEvent } from 'react';
import { roofWordsShown } from './roof-words-shown';
import { StudioEntryBoxes } from './StudioEntryBoxes';

const ONE_DIGIT = /^[0-9]$/;
type Which = 'length' | 'width';

/** One number of the card, on one row: its word, then the slider and its value, or the boxes. */
function SizeRow({
  which,
  card,
  studio,
  units,
  words,
  typing,
  first,
}: {
  which: Which;
  card: SizeCardView;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  typing: boolean;
  first: boolean;
}) {
  const t = useTranslate();
  const format = useFormat();
  const label = which === 'length' ? words.sizeLength : words.sizeWidth;
  const metres = which === 'length' ? card.lengthM : card.widthM;
  const entry = which === 'length' ? card.length : card.width;
  const value = metres ?? card.slide.min;
  return (
    <div className="hg-size-row" data-typing={typing}>
      <span className="hg-length-box-label">{label}</span>
      {typing ? (
        <StudioEntryBoxes
          entry={entry}
          units={units}
          label={label}
          focusRequest={first ? 1 : 0}
          onEntry={(next) => studio.moves.typeSizeEntry(which, next)}
          words={words}
        />
      ) : (
        <>
          <Slider
            value={Math.min(Math.max(value, card.slide.min), card.slide.max)}
            min={card.slide.min}
            max={card.slide.max}
            step={card.slide.step}
            label={label}
            labelSpokenOnly
            format={(next) => format.roofLength(next, units, false)}
            words={sliderWords(t)}
            onInput={(next) => studio.moves.slideSize(which, next)}
          />
          <span className="hg-length-box-value">
            {metres === null ? '' : format.roofLength(metres, units, false)}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Type the size (`T-M05-002`, part c): a rectangle's length and width, sliders first, in the
 * length box's place. The keyboard switch turns them into boxes — on a desktop in metres one box
 * takes both, `13.2x8.6`. Place roof is the foot's pill; on a phone with the boxes open the
 * keyboard covers the foot, so it sits here instead, never in both places. × or Esc places nothing.
 */
export function StudioSizeCard({
  card,
  studio,
  units,
  words,
  phone,
}: {
  card: SizeCardView;
  studio: StudioScreen;
  units: MeasurementSystem;
  words: StudioCanvasWords;
  phone: boolean;
}) {
  const format = useFormat();
  const { moves } = studio;
  const { boxes, outside } = card;
  // On a desktop in metres the boxes are one box that takes both numbers (`13.2x8.6`).
  const pairBox = !phone && units === 'metric';
  const onePair = boxes && pairBox;
  const refusal: TranslatedText | null =
    card.refusal === null
      ? null
      : words.sizeRefusal(card.refusal, roofWordsShown(format, units), LENGTH_MIN_M, LENGTH_MAX_M);
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      moves.cancel();
      return;
    }
    // Enter places the roof from a slider or a box; on a button it is that button's own press.
    if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      moves.placeRoof();
      return;
    }
    // A digit typed on a slider: the person wants to type. The boxes open with that digit.
    const target = event.target;
    const onSlider = target instanceof HTMLInputElement && target.type === 'range';
    if (!boxes && onSlider && ONE_DIGIT.test(event.key)) {
      event.preventDefault();
      moves.chooseNumberEntry('box');
      if (pairBox) {
        moves.typeSizePair(event.key);
        return;
      }
      const which: Which = target.closest('[data-which="width"]') === null ? 'length' : 'width';
      moves.typeSizeEntry(which, { main: event.key, inches: '', measured: false });
    }
  };
  const pairText =
    card.pair ??
    (card.lengthM === null && card.widthM === null ? '' : `${card.length.main}x${card.width.main}`);
  return (
    <form
      className="hg-studio-glass hg-length-box hg-size-card"
      aria-label={words.sizeTitle}
      onSubmit={(event) => event.preventDefault()}
      onKeyDown={onKeyDown}
    >
      <div className="hg-length-box-head">
        <span className="hg-length-box-title">
          <span className="hg-size-title">{words.sizeTitle}</span>
        </span>
        <IconButton
          label={boxes ? words.sizeSlideIt : words.sizeTypeIt}
          variant="ghost"
          pressed={boxes}
          disabled={outside}
          onClick={() => moves.chooseNumberEntry(boxes ? 'slider' : 'box')}
        >
          <ShellGlyph name="keyboard" size="md" />
        </IconButton>
        <IconButton label={words.sizeClose} variant="ghost" onClick={moves.cancel}>
          <ShellGlyph name="close" size="md" />
        </IconButton>
      </div>
      {onePair ? (
        <div className="hg-size-row" data-typing="true">
          <span className="hg-length-box-label">{words.sizePair}</span>
          <span className="hg-length-box-well">
            <Input
              label={words.sizePair}
              labelSpokenOnly
              mono
              density="functional"
              value={pairText}
              focusRequest={1}
              onChange={moves.typeSizePair}
              trailing={words.unitMetres}
            />
          </span>
        </div>
      ) : (
        (['length', 'width'] as const).map((which) => (
          <div key={which} data-which={which}>
            <SizeRow
              which={which}
              card={card}
              studio={studio}
              units={units}
              words={words}
              typing={boxes}
              first={which === 'length'}
            />
          </div>
        ))
      )}
      {phone && boxes ? (
        <div className="hg-length-box-row hg-size-act">
          <Button
            variant="primary"
            size="md"
            disabled={!card.placeable}
            onClick={moves.placeRoof}
            icon={<ShellGlyph name="check" size="sm" />}
          >
            {words.placeRoof}
          </Button>
        </div>
      ) : null}
      {refusal === null ? null : (
        <span className="hg-size-refusal" role="alert">
          <ShellGlyph name="alert-circle" size="sm" />
          <span>{refusal}</span>
        </span>
      )}
    </form>
  );
}

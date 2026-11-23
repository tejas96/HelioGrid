'use client';
import type { StudioScreen } from '@heliogrid/data/react';
import type { RoofBar } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import { theme } from '@heliogrid/theme';
import { Button, IconButton, ShellGlyph, Text } from '@heliogrid/ui';
import { picturePillOf } from './StudioPicturePills';

/** The round tools in the bar take the tool columns' size. */
export const BAR_TOOL = theme.layout['button-h-md'];

interface PillFacts {
  readonly studio: StudioScreen;
  readonly words: StudioCanvasWords;
}

/** The magnet: pressed while on. One tap turns it off for every corner, drawn or dragged. */
export function MagnetSwitch({ studio, words }: PillFacts) {
  return (
    <span className="hg-studio-magnet">
      <IconButton
        label={words.magnet}
        size={BAR_TOOL}
        pressed={studio.magnet}
        onClick={studio.moves.toggleMagnet}
      >
        <ShellGlyph name="magnet" size="md" tone="current" />
      </IconButton>
    </span>
  );
}

/** A save of the magnet's pick the server refused: said beside the switch, with a retry. */
export function MagnetRefused({ studio, words }: PillFacts) {
  if (!studio.magnetRefused) return null;
  return (
    <span className="hg-studio-pill-refused" role="alert">
      {words.magnetNotSaved}
      <Button variant="secondary" size="sm" onClick={studio.moves.retryMagnet}>
        {words.tryAgain}
      </Button>
    </span>
  );
}

/**
 * The foot while drawing: one slim pill, no sentence, so the map keeps its room — the magnet, and
 * Close shape once the shape can close. A refusal is the tag by the line, and is read out here.
 */
export function DrawPill({
  bar,
  studio,
  words,
}: PillFacts & { bar: Extract<RoofBar, { kind: 'drawing' }> }) {
  const refusal = bar.refused === null ? null : words.drawRefusal(bar.refused);
  return (
    <>
      <MagnetSwitch studio={studio} words={words} />
      {/* Before the first corner, typing the size is one tap away; the first corner takes it away. */}
      {bar.hint ? (
        <Button variant="secondary" size="md" onClick={studio.moves.typeSize}>
          {words.typeSize}
        </Button>
      ) : null}
      {bar.canClose ? (
        <Button
          variant="primary"
          size="md"
          icon={<ShellGlyph name="check" size="sm" />}
          onClick={studio.moves.close}
        >
          {words.closeShape}
        </Button>
      ) : null}
      <MagnetRefused studio={studio} words={words} />
      <span role="status" className="hg-studio-pill-status">
        {refusal === null ? null : <Text spokenOnly>{`${refusal.title}. ${refusal.line}`}</Text>}
      </span>
    </>
  );
}

/** Type the size: Place roof alone, off while the card cannot place its roof. */
export function TypingPill({ studio, words }: PillFacts) {
  return (
    <Button
      variant="primary"
      size="md"
      disabled={studio.sizeCard?.placeable !== true}
      icon={<ShellGlyph name="check" size="sm" />}
      onClick={studio.moves.placeRoof}
    >
      {words.placeRoof}
    </Button>
  );
}

/**
 * The pill the foot shows instead of the bar, for an editor in the top view: while drawing or while
 * the size card is open; `null` when the bar shows. On a phone with the
 * card's boxes open the keyboard covers the foot, so Place roof is the card's and the foot is empty.
 */
export function pillOf(
  studio: StudioScreen,
  words: StudioCanvasWords,
  off: boolean,
  phone: boolean,
) {
  const { bar } = studio;
  if (off || studio.editing.kind !== 'editor') return null;
  const picture = picturePillOf(studio, words);
  if (picture !== null) return picture;
  if (bar?.kind === 'drawing') return <DrawPill bar={bar} studio={studio} words={words} />;
  if (bar?.kind === 'typing') {
    return phone && studio.sizeCard?.boxes ? null : <TypingPill studio={studio} words={words} />;
  }
  return null;
}

/** Before the first corner, one line says what to do; the first tap takes it away. */
export function DrawHint({ studio, words }: PillFacts) {
  return studio.bar?.kind === 'drawing' && studio.bar.hint ? (
    <p className="hg-studio-glass hg-studio-hint">{words.drawHint}</p>
  ) : null;
}

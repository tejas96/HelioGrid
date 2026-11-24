'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { StudioEditing, StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, RoofBar, StudioView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import type { ShellGlyphName, useFormat } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { roofsMoment } from './roof-bar-status';
import { roofWordsShown } from './roof-words-shown';
import { MagnetRefused, MagnetSwitch } from './StudioBarPills';
import { StudioKindChips } from './StudioKindChips';

export interface BarAct {
  readonly key: string;
  readonly label: TranslatedText;
  readonly icon?: ShellGlyphName;
  /** The glyph after the words: the next step's ›. */
  readonly iconRight?: ShellGlyphName;
  /** The bar's main act is primary; one beside it is secondary. */
  readonly secondary?: boolean;
  /** The act is not built yet: it keeps its look, and a tap says so. */
  readonly coming?: TranslatedText;
  readonly onPress?: () => void;
}

/**
 * What the bar shows. A card: its mark, title, sentence and chips. Slim: a moment's words, when
 * there is one, and the next step — never a roof's name, area or count, which Roofs holds.
 */
export interface BarView {
  readonly slim: boolean;
  readonly mark: ShellGlyphName;
  readonly title: ReactNode;
  /** The card's sentence, or the slim bar's moment; `null` with nothing to say. */
  readonly status: TranslatedText | null;
  readonly bad: boolean;
  readonly tools?: ReactNode;
  /** The chips under the sentence: a new roof's likely kinds. */
  readonly chips?: ReactNode;
  readonly acts: readonly BarAct[];
}

export interface BarFacts {
  readonly studio: StudioScreen;
  readonly view: StudioView;
  readonly units: MeasurementSystem;
  readonly words: StudioCanvasWords;
  readonly format: ReturnType<typeof useFormat>;
  /** The corner held is crowded by another on the screen. */
  readonly crowded: boolean;
  /** The reader may change the design. */
  readonly editable: boolean;
  readonly part: FocusParts['bottomBar'];
  /** Focus mode's magnet: shown while drawing, `picked` with a roof picked. */
  readonly magnetPart: FocusParts['magnet'];
}

/**
 * The stairs' moment in the bar, at rest with nothing else to say (board 7), drawn from the
 * studio's `stairsMoment`: the line to tap an edge, the line while the mark moves, the card that
 * asks with Skip and Place, or the line that a drag moves a guess.
 */
function stairsBar(
  bar: Extract<RoofBar, { kind: 'roofs' }>,
  facts: BarFacts,
  next: BarAct,
): BarView | null {
  const { studio, words } = facts;
  const moment = studio.stairsMoment;
  const quiet = bar.said === null && bar.live === null && !bar.sizing && bar.picked === null;
  if (moment === null || !quiet || facts.view !== 'top') return null;
  if (moment === 'ask') {
    return {
      slim: false,
      mark: 'steps',
      title: words.stairsAskTitle,
      status: words.stairsAskStatus,
      bad: false,
      acts: [
        { key: 'skip', label: words.stairsSkip, secondary: true, onPress: studio.moves.skipStairs },
        { key: 'place', label: words.stairsPlace, onPress: studio.moves.placeStairs },
      ],
    };
  }
  return {
    slim: true,
    mark: 'check',
    title: null,
    status: words.stairsLine(moment),
    bad: false,
    acts: [next],
  };
}

/**
 * With a roof: the next step, and a moment's words. A roof just closed is a card for that moment —
 * what it became, why, and the chips that fix a wrong guess.
 */
function roofsBar(bar: Extract<RoofBar, { kind: 'roofs' }>, facts: BarFacts): BarView {
  const { words, format, units, studio, view } = facts;
  const shown = roofWordsShown(format, units, studio.startHeightM);
  const line = view === 'top' ? studio.kindLine : null;
  const kind = line === null ? null : words.kindLine(line, shown);
  // A roof picked: the magnet for the drags to come.
  const magnet = facts.editable && bar.picked !== null && facts.magnetPart === 'picked';
  // The step after the roofs is the next part's: it keeps its look, and a tap says it is coming.
  const next: BarAct = {
    key: 'next',
    label: words.nextObjects,
    iconRight: 'chevron-right',
    coming: words.stepComing,
  };
  const stairs = kind === null ? stairsBar(bar, facts, next) : null;
  if (stairs !== null) return stairs;
  return {
    slim: kind === null,
    mark: bar.bad ? 'alert-circle' : 'check',
    title: kind?.title ?? null,
    status: kind?.status ?? roofsMoment(bar, facts, shown),
    bad: bar.bad,
    tools:
      magnet || studio.magnetRefused ? (
        <>
          {magnet ? <MagnetSwitch studio={studio} words={words} /> : null}
          <MagnetRefused studio={studio} words={words} />
        </>
      ) : null,
    chips:
      kind === null ? null : (
        <StudioKindChips
          name={kind.chipsName}
          chips={kind.chips}
          onChoose={studio.moves.chooseKind}
        />
      ),
    acts: [next],
  };
}

/** Before a roof: the site's name and where it is; with no picture, typing the size. */
function startBar(name: TranslatedText, place: string | null, facts: BarFacts): BarView {
  const { words, studio, format, units } = facts;
  const { picture, bar } = studio;
  const noPicture = picture.kind === 'none';
  // The last roof just deleted: the bar says so, and Undo brings it back.
  const said = bar?.kind === 'start' ? bar.said : null;
  const why = noPicture ? words.noPictureWhy(picture.reason) : words.roofNotSetUp(place);
  const deleted =
    said === null
      ? null
      : words.roofLine(said, false, roofWordsShown(format, units, studio.startHeightM));
  return {
    slim: false,
    mark: noPicture ? 'ruler' : 'pencil',
    title: name,
    status: deleted ?? why,
    bad: false,
    // The pencil is the one door to drawing (E042): the bar keeps no second one. With no picture,
    // typing the size is the way the pencil does not offer.
    acts: noPicture ? [{ key: 'type', label: words.typeSize, onPress: studio.moves.typeSize }] : [],
  };
}

/** A reader who may not change the design: the same words, with nothing to press. */
function readOnly(view: BarView): BarView {
  return { ...view, mark: 'eye', tools: null, chips: null, acts: [] };
}

/** The bar for the studio as it stands: before a roof, with roofs, for a reader, in focus mode. */
export function barViewOf(
  name: TranslatedText,
  place: string | null,
  editing: StudioEditing,
  facts: BarFacts,
): BarView {
  const { studio, words } = facts;
  const { bar } = studio;
  let shown = bar?.kind === 'roofs' ? roofsBar(bar, facts) : startBar(name, place, facts);
  // Your picture's line (`T-M05-002d`): what to do next with it, or what an act just did. Before a
  // roof the pencil and the outlines are the way in, so the bar holds no act of its own.
  const say = studio.own.say;
  if (say !== null) {
    shown = { ...shown, status: words.ownSay(say), acts: bar?.kind === 'roofs' ? shown.acts : [] };
  }
  if (editing.kind !== 'editor') shown = readOnly(shown);
  // Focus mode's status alone: the words, with nothing to press.
  if (facts.part === 'status') shown = { ...shown, acts: [], tools: null, chips: null };
  return shown;
}

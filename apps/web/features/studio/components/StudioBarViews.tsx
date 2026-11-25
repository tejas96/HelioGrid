'use client';
import type { TranslatedText } from '@heliogrid/contracts';
import type { PassingMessage, StudioEditing, StudioScreen } from '@heliogrid/data/react';
import type { FocusParts, MeasurementSystem, RoofBar, StudioView } from '@heliogrid/domain';
import type { StudioCanvasWords } from '@heliogrid/i18n';
import type { useFormat } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { roofsMoment } from './roof-bar-status';
import { roofWordsShown } from './roof-words-shown';
import { StudioKindChips } from './StudioKindChips';

/** The message's one act, when it has its own: an act already on the screen is never repeated. */
export interface BarAct {
  readonly label: TranslatedText;
  readonly onPress: () => void;
}

/**
 * The one message the bar shows (`T-M05-002`): a sign by its tone, its line, a title and chips
 * when it asks a choice, its one act, and × — which also does what closing means for it (Skip the
 * stairs, the picture checked). An info line with nothing to press goes by itself.
 */
export interface BarView extends PassingMessage {
  readonly title: ReactNode | null;
  readonly line: TranslatedText | null;
  readonly chips: ReactNode | null;
  readonly act: BarAct | null;
  /** What × does besides hiding the message; `null` when it only hides it. */
  readonly onClose: (() => void) | null;
  /** ×'s spoken name when it does more than close (Skip); `null`: Close. */
  readonly closeLabel: TranslatedText | null;
}

export interface BarFacts {
  readonly studio: StudioScreen;
  readonly view: StudioView;
  readonly units: MeasurementSystem;
  readonly words: StudioCanvasWords;
  readonly format: ReturnType<typeof useFormat>;
  /** The corner held is crowded by another on the screen. */
  readonly crowded: boolean;
  /** Focus mode's bar: the message whole, its words alone, or none. */
  readonly part: FocusParts['bottomBar'];
}

type Candidate = Pick<BarView, 'tone' | 'line'> &
  Partial<Pick<BarView, 'title' | 'chips' | 'act' | 'onClose' | 'closeLabel'>> & {
    /** `false`: a line that holds a job in hand, or waits to be read, never goes by itself. */
    readonly fades?: boolean;
  };

/**
 * Each thing said is a new object from the studio, so the same words said again — the same
 * refusal after × — are a new message and show again.
 */
const SAID_AT = new WeakMap<object, number>();
let saidCount = 0;

function saidId(said: object | null): number {
  if (said === null) return 0;
  const known = SAID_AT.get(said);
  if (known !== undefined) return known;
  saidCount += 1;
  SAID_AT.set(said, saidCount);
  return saidCount;
}

function message(tag: string, candidate: Candidate): BarView {
  const act = candidate.act ?? null;
  const chips = candidate.chips ?? null;
  return {
    key: `${tag}:${String(candidate.title ?? '')}:${String(candidate.line ?? '')}`,
    tone: candidate.tone,
    title: candidate.title ?? null,
    line: candidate.line,
    chips,
    act,
    onClose: candidate.onClose ?? null,
    closeLabel: candidate.closeLabel ?? null,
    asks: act !== null || chips !== null,
    stays: candidate.fades === false,
  };
}

/** The stairs' moment, at rest with nothing else to say (board 7): the ask, or a line. */
function stairsMessage(bar: Extract<RoofBar, { kind: 'roofs' }>, facts: BarFacts): BarView | null {
  const { studio, words } = facts;
  const moment = studio.stairsMoment;
  const quiet = bar.said === null && bar.live === null && !bar.sizing && bar.picked === null;
  if (moment === null || !quiet || facts.view !== 'top') return null;
  if (moment === 'ask') {
    return message('stairs', {
      tone: 'info',
      title: words.stairsAskTitle,
      line: words.stairsAskStatus,
      act: { label: words.stairsPlace, onPress: studio.moves.placeStairs },
      // Closing the question is the Skip it held.
      onClose: studio.moves.skipStairs,
      closeLabel: words.stairsSkip,
    });
  }
  // Tapping an edge and moving the mark are a job in hand; a guessed place is said and goes.
  return message('stairs', {
    tone: 'info',
    line: words.stairsLine(moment),
    fades: moment === 'guessed',
  });
}

/** With a roof: a roof just closed is a card with its kind and chips; else a moment's words. */
function roofsMessage(bar: Extract<RoofBar, { kind: 'roofs' }>, facts: BarFacts): BarView | null {
  const { words, format, units, studio, view } = facts;
  const shown = roofWordsShown(format, units, studio.startHeightM, studio.topMarks);
  const line = view === 'top' ? studio.kindLine : null;
  const kind = line === null ? null : words.kindLine(line, shown);
  if (kind !== null) {
    return message('kind', {
      tone: 'info',
      title: kind.title,
      line: kind.status,
      chips: (
        <StudioKindChips
          name={kind.chipsName}
          chips={kind.chips}
          onChoose={studio.moves.chooseKind}
        />
      ),
    });
  }
  const stairs = stairsMessage(bar, facts);
  if (stairs !== null) return stairs;
  const moment = roofsMoment(bar, facts, shown);
  if (moment === null) return null;
  // A refusal, live or just said, is an error; it stays while it holds. A drag, or a length in the
  // box, is a job in hand: its line stays while it lasts.
  const inHand = bar.live !== null || bar.sizing || studio.roofStep.kind === 'dragging';
  return message(`roofs-${saidId(bar.said)}`, {
    tone: bar.bad || bar.live !== null ? 'error' : 'info',
    line: moment,
    fades: !inHand && !bar.bad,
  });
}

/** Before a roof: nothing to say, unless there is no picture or the last roof was just deleted. */
function startMessage(facts: BarFacts): BarView | null {
  const { words, studio, format, units } = facts;
  const { picture, bar } = studio;
  const said = bar?.kind === 'start' ? bar.said : null;
  if (said !== null) {
    const deleted = words.roofLine(
      said,
      false,
      roofWordsShown(format, units, studio.startHeightM, studio.topMarks),
    );
    if (deleted !== null) return message(`start-${saidId(said)}`, { tone: 'info', line: deleted });
  }
  if (picture.kind !== 'none') return null;
  // The pencil is the one door to drawing (E042); with no picture, typing the size is the way in.
  return message('no-picture', {
    tone: picture.reason === 'picked' ? 'info' : 'warning',
    line: words.noPictureWhy(picture.reason),
    act: { label: words.typeSize, onPress: studio.moves.typeSize },
  });
}

/** The notes that were over the canvas: someone saved first, the lead is closed, a newer picture. */
function noteMessages(facts: BarFacts): BarView[] {
  const { studio, words, format } = facts;
  const { saving, moves } = studio;
  const notes: BarView[] = [];
  if (saving.kind === 'saved-first') {
    notes.push(
      message('saved-first', {
        tone: 'warning',
        line: words.savedFirst(saving.savedBy?.name ?? null, format.clockAt(saving.savedAt)),
        act: { label: words.openTheirs, onPress: moves.openTheirs },
      }),
    );
  }
  if (saving.kind === 'closed') {
    notes.push(message('closed', { tone: 'warning', line: words.closed }));
  }
  if (studio.pictureUpdated) {
    // Closing it is the Checked it held.
    notes.push(
      message('picture-updated', {
        tone: 'info',
        line: words.pictureUpdated,
        onClose: moves.pictureChecked,
        fades: false,
      }),
    );
  }
  if (studio.magnetRefused) {
    notes.push(
      message('magnet', {
        tone: 'error',
        line: words.magnetNotSaved,
        act: { label: words.tryAgain, onPress: moves.retryMagnet },
      }),
    );
  }
  return notes;
}

/** A reader who may not change the design, or focus mode's words alone: nothing to press. */
function wordsOnly(messages: readonly BarView[]): BarView[] {
  return messages.map((shown) => ({
    ...shown,
    act: null,
    chips: null,
    onClose: null,
    closeLabel: null,
    asks: false,
  }));
}

/**
 * The messages for the studio as it stands — none when there is nothing to say, and then the bar
 * is not there; the bar shows the worst. A reader who may not change the design, and focus mode's
 * words alone, get the words with nothing to press.
 */
export function barMessagesOf(editing: StudioEditing, facts: BarFacts): BarView[] {
  const { studio, words } = facts;
  if (facts.part === 'hidden') return [];
  const { bar } = studio;
  const own = studio.own.say === null ? null : words.ownSay(studio.own.say);
  const moment =
    own !== null
      ? message('own', { tone: 'info', line: own, fades: false })
      : bar?.kind === 'roofs'
        ? roofsMessage(bar, facts)
        : startMessage(facts);
  const messages = [...noteMessages(facts), ...(moment === null ? [] : [moment])];
  if (editing.kind === 'editor' && facts.part !== 'status') return messages;
  return wordsOnly(messages);
}

/**
 * While a job holds the foot (drawing, the size card, a roof's sheet), only what must not wait is
 * said, above it: someone saved first, the lead is closed, a pick that did not save.
 */
export function alertMessagesOf(editing: StudioEditing, facts: BarFacts): BarView[] {
  const alerts = noteMessages(facts).filter((shown) => shown.tone !== 'info');
  return editing.kind === 'editor' ? alerts : wordsOnly(alerts);
}

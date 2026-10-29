import type { TranslatedText } from '@heliogrid/contracts';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';
import type { ChartFrameProps, ChartWords } from './Charts.types';
import { chartProvenanceFacts, type ProvenanceFacts } from './chart-provenance';

/** The surface state a frame is in. `unavailable` is neutral and never grows a retry. */
export type ChartSurfaceState = SurfaceState;

export type ChartNoteTone = 'warning' | 'neutral';

export interface ChartNote {
  title: TranslatedText;
  message?: TranslatedText;
  tone: ChartNoteTone;
}

type ChartNoteWords = Pick<
  ChartFrameProps,
  'emptyTitle' | 'emptyMessage' | 'insufficientMessage' | 'errorTitle' | 'errorMessage'
>;

interface ChartNoteInput extends ChartNoteWords {
  state: ChartSurfaceState;
  insufficient: boolean;
  words: ChartWords;
}

/**
 * The one place error / empty / not-enough-data resolve to words: the chart's own, else the
 * frame's `words`. `error` is the only tone that carries the warning tint — and the only one
 * that may offer a retry.
 */
export function chartNote(input: ChartNoteInput): ChartNote | null {
  const { words } = input;
  if (input.state === 'error') {
    return {
      title: input.errorTitle ?? words.errorTitle,
      message: input.errorMessage ?? words.errorMessage,
      tone: 'warning',
    };
  }
  if (input.state === 'empty') {
    return {
      title: input.emptyTitle ?? words.emptyTitle,
      message: input.emptyMessage,
      tone: 'neutral',
    };
  }
  if (input.insufficient) {
    return {
      title: words.insufficientTitle,
      message: input.insufficientMessage ?? words.insufficientMessage,
      tone: 'neutral',
    };
  }
  return null;
}

/** The frame read once for both platforms: what it draws around the plot, and when. */
export interface ChartFrameReading {
  state: ChartSurfaceState;
  onRetry: (() => void) | undefined;
  /** One provenance line under the headline value — word first, dot second (F8-07). */
  facts: ProvenanceFacts | null;
  stateNote: ChartNote | null;
  hasCaption: boolean;
  /** The legend shows only beside a drawn plot: no state note, and not while loading. */
  showsLegend: boolean;
}

export function chartFrameReading({
  read,
  provenance,
  standing,
  source,
  projection,
  note,
  insufficient = false,
  words,
  emptyTitle,
  emptyMessage,
  insufficientMessage,
  errorTitle,
  errorMessage,
  overline,
  title,
  value,
  action,
  legend,
}: ChartFrameProps): ChartFrameReading {
  const state = surfaceStateOf(read);
  const stateNote = chartNote({
    state,
    insufficient,
    words,
    emptyTitle,
    emptyMessage,
    insufficientMessage,
    errorTitle,
    errorMessage,
  });
  return {
    state,
    onRetry: retryOf(read),
    facts: chartProvenanceFacts({ provenance, standing, source, projection, note }),
    stateNote,
    hasCaption: Boolean(overline) || Boolean(title) || Boolean(value) || Boolean(action),
    showsLegend: Boolean(legend) && stateNote === null && state !== 'loading',
  };
}

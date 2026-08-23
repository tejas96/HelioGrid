import type { ChartFrameProps } from './Charts.types';

/** The surface state a frame is in. `unavailable` is neutral and never grows a retry. */
export type ChartSurfaceState = NonNullable<ChartFrameProps['state']>;

export type ChartNoteTone = 'warning' | 'neutral';

export interface ChartNote {
  title: string;
  message?: string;
  tone: ChartNoteTone;
}

/* Copy the reference implementation fixes in the component rather than on a prop. Anything a
   caller can change is a prop on ChartFrameProps and is defaulted at the destructure. */
export const CHART_INSUFFICIENT_TITLE = 'Not enough data';
export const CHART_RETRY_LABEL = 'Try again';
export const CHART_LOADING_LABEL = 'Loading chart';
/* ChartFrame's unavailable copy, handed to `<UnavailableNote variant="region">`. The design
   system's `charts/Charts.d.ts.txt` contract declares NO prop for it — its JSX takes an
   `unavailableTitle`, but the published typings do not, and the typings are what this repo ports
   against (docs/17 §6) — so it is not overridable here. Adding the prop would be widening past
   the contract, not restoring it; see the port notes. */
export const CHART_UNAVAILABLE_TITLE = 'Not available for this scope';

/** Defaults ChartFrame applies; the reference implementation sets them at the destructure. */
export const CHART_EMPTY_TITLE = 'No data yet';
export const CHART_INSUFFICIENT_MESSAGE =
  'Not enough data to show a trend — this needs at least two periods.';
export const CHART_ERROR_TITLE = "Couldn't load this chart";
export const CHART_ERROR_MESSAGE =
  'Tap Try again. If it keeps failing, tell your admin what you were doing.';

interface ChartNoteInput {
  state: ChartSurfaceState;
  insufficient: boolean;
  emptyTitle: string;
  emptyMessage?: string;
  insufficientMessage: string;
  errorTitle: string;
  errorMessage: string;
}

/**
 * The one place error / empty / not-enough-data resolve to words. `error` is the only tone that
 * carries the warning tint — and the only one that may offer a retry.
 */
export function chartNote(input: ChartNoteInput): ChartNote | null {
  if (input.state === 'error') {
    return { title: input.errorTitle, message: input.errorMessage, tone: 'warning' };
  }
  if (input.state === 'empty') {
    return { title: input.emptyTitle, message: input.emptyMessage, tone: 'neutral' };
  }
  if (input.insufficient) {
    return {
      title: CHART_INSUFFICIENT_TITLE,
      message: input.insufficientMessage,
      tone: 'neutral',
    };
  }
  return null;
}

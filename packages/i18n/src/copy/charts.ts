/**
 * The charts' own words (`packages/ui`'s `ChartWords`): what a chart frame says while it loads,
 * when it has nothing or too little to plot, when its read failed, and the names its plots carry
 * when the chart has no title — authored once for every chart, in three languages (`F3-07`).
 */
import type { Translator } from '../runtime';
import { SHELL } from './shell';
import { SIGN_IN } from './sign-in';

export const CHARTS = {
  loading: /*i18n*/ { id: 'Loading chart' },
  emptyTitle: /*i18n*/ { id: 'No data yet' },
  insufficientTitle: /*i18n*/ { id: 'Not enough data' },
  insufficientMessage: /*i18n*/ {
    id: 'Not enough data to show a trend — this needs at least two periods.',
  },
  unavailableTitle: /*i18n*/ { id: 'Not available for this scope' },
  errorTitle: /*i18n*/ { id: "Couldn't load this chart" },
  errorMessage: SHELL.keepsFailing,
  funnelInsufficient: /*i18n*/ { id: 'A funnel needs at least two stages with recorded values.' },
  donutInsufficient: /*i18n*/ {
    id: 'Nothing to split yet — this needs at least one recorded value.',
  },
  lineChart: /*i18n*/ { id: 'Line chart' },
  donutChart: /*i18n*/ { id: 'Donut chart' },
  carriedForward: /*i18n*/ { id: '{percent}% carried forward' },
} as const;

/** Every word a chart draws or speaks of its own, in the reader's language. */
export function chartWords(t: Translator['t']) {
  return {
    loading: t(CHARTS.loading),
    emptyTitle: t(CHARTS.emptyTitle),
    insufficientTitle: t(CHARTS.insufficientTitle),
    insufficientMessage: t(CHARTS.insufficientMessage),
    unavailableTitle: t(CHARTS.unavailableTitle),
    errorTitle: t(CHARTS.errorTitle),
    errorMessage: t(CHARTS.errorMessage),
    retry: t(SIGN_IN.tryAgain),
    funnelInsufficient: t(CHARTS.funnelInsufficient),
    donutInsufficient: t(CHARTS.donutInsufficient),
    lineChart: t(CHARTS.lineChart),
    donutChart: t(CHARTS.donutChart),
    carriedForward: (percent: number) => t(CHARTS.carriedForward, { percent }),
  };
}

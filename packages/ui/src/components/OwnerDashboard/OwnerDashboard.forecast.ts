import type { Forecast, TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import type { OwnerDashboardWords } from './OwnerDashboard.types';

/** How many stages take a hue of their own before the hues repeat: the chart's first three. */
export const FORECAST_HUES = 3;

/** One stage of the forecast as both halves draw it (`T-M13-007`). */
export interface ForecastRow {
  readonly key: string;
  readonly name: TranslatedText;
  /** How many proposals, what they are worth, and the market's likelihood — one line. */
  readonly line: TranslatedText;
  /** What the stage is expected to bring, as a headline amount. */
  readonly expected: string;
  /** Its share of the split bar: the server's own expected figure, as a weight. */
  readonly weight: number;
  /** Which of the chart's hues marks it, 0 first. */
  readonly hue: number;
}

/**
 * The forecast's rows, read from the server's answer (`F4-04`): every figure is the server's, only
 * printed here — the weighted pipeline is never worked out on a device.
 */
export function forecastRowsOf(
  forecast: Forecast,
  words: Pick<OwnerDashboardWords, 'forecastStage' | 'forecastStageLine'>,
  format: MarketFormat,
): readonly ForecastRow[] {
  /* Each column's amounts share one form: a paisa in one keeps it in all, never rounded. */
  const totals = forecast.stages.map((stage) => stage.total);
  const expected = forecast.stages.map((stage) => stage.expected);
  return forecast.stages.map((stage, index) => ({
    key: stage.stage,
    name: words.forecastStage(stage.stage),
    line: words.forecastStageLine(
      stage.count,
      format.moneyPlain(stage.total, totals),
      // The server's percent ("30.00") printed as a number a person reads: "30".
      format.number(Number(stage.likelihoodPercent)),
    ),
    expected: format.moneyPlain(stage.expected, expected),
    weight: Math.max(0, Number(stage.expected)),
    hue: index % FORECAST_HUES,
  }));
}

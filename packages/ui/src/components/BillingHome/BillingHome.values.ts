import type { TranslatedText } from '@heliogrid/contracts';
import { plain } from '../BillingStrip/BillingStrip.values';
import type { BillingFact, BillingNeedRow } from './BillingHome.types';

export { figure, figured, plain } from '../BillingStrip/BillingStrip.values';

export function fact(key: string, label: TranslatedText, value: string): BillingFact {
  return { key, label, value: plain(value), under: null };
}

/** A `Needs you` row whose figure is a date: no chip, no line. */
export function dateRow(key: string, title: TranslatedText, date: string): BillingNeedRow {
  return { key, title, chip: null, figure: plain(date), line: null };
}

/**
 * The format layer — `pack.formats` values (`F1-21`) and the four single rendering
 * implementations that consume them (`F3-19`): money, non-money numbers, dates and times,
 * measurements, plus phone display from the same pack key.
 *
 * There is exactly one of each, product-wide. A surface that needs a formatted value imports
 * from here; it never composes its own, and `packages/ui` consumes these rather than restating
 * them (`docs/engineering/architecture.md` §2 — `ui` may import `domain`).
 */

export { formatDate, formatMonthYear, formatTime, monthNames, weekdayNames } from './datetime';
export {
  formatLength,
  PROCUREMENT_SYSTEM,
  resolveMeasurementSystem,
} from './measurement';
export { formatCompactMoney, formatMoney, type MoneyOptions, moneySymbol } from './money';
export {
  formatCompact,
  formatNumber,
  isRenderableNumber,
  type Numberish,
  type NumberOptions,
  parseNumber,
} from './number';
export type {
  CompactStep,
  FormatPack,
  MeasurementSystem,
  PhoneFormats,
} from './pack';
export { IN_FORMATS } from './pack';
export { formatPhone, nationalNumber, type PhoneOptions } from './phone';

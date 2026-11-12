import type { LeadPostponeDays, LostReason } from '@heliogrid/domain';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { ISODate } from '../DatePicker/DatePicker.types';
import type { HueTileProps } from '../HueTile/HueTile.types';
import type { LeadPostponeSpan } from './LeadActSheet.parts.types';

/** The postponed row's chips, in the order they are offered. */
export const POSTPONE_SPANS: readonly LeadPostponeSpan[] = ['week', 'month', 'threeMonths', 'pick'];

/**
 * Each reason's glyph on its tint, so the seven tiles are told apart at a glance; the words beside
 * each say what it is. A category hue marks a kind; *Not interested* takes the danger tone because
 * it stops the calls for six months.
 */
export const LOST_REASON_LOOK: Record<
  LostReason,
  { readonly glyph: ShellGlyphName; readonly hue: HueTileProps['hue'] }
> = {
  price: { glyph: 'wallet', hue: 'warning' },
  chose_competitor: { glyph: 'scales', hue: 'plum' },
  postponed: { glyph: 'calendar-clock', hue: 'accent' },
  not_reachable: { glyph: 'phone', hue: 'neutral' },
  roof_unsuitable: { glyph: 'house', hue: 'ocean' },
  financing_failed: { glyph: 'credit-card', hue: 'teal' },
  not_interested: { glyph: 'minus-circle', hue: 'danger' },
};

/**
 * The day a loss comes back on: only a postponed one has a day — a span's, or the one picked — and
 * the send waits until it has it.
 */
export function resurfaceOnOf(
  reason: LostReason | null,
  span: LeadPostponeSpan | null,
  picked: ISODate | null,
  postpone: LeadPostponeDays,
): ISODate | null {
  if (reason !== 'postponed' || span === null) return null;
  return span === 'pick' ? picked : postpone[span];
}

/** Whether the form holds what Mark lost needs: a reason, and for *Postponed* its day. */
export function lostReady(reason: LostReason | null, resurfaceOn: ISODate | null): boolean {
  return reason !== null && (reason !== 'postponed' || resurfaceOn !== null);
}

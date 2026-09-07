/**
 * `F1-21`, `F1-48` — the market's holiday calendar, and the one rule for combining it with the
 * tenant's own.
 *
 * **India declares NONE** (`Q88`). TCCCPR states no holiday rule and no row of the suite names a
 * date, so a platform-authored list would be dates we invented sitting on a statutory floor — and
 * one a tenant could never remove, because `F1-17` lets tenant configuration only NARROW a floor.
 * Every IN holiday is the tenant's own working calendar (`M01-59`). The accepted consequence is
 * stated rather than compensated for: a tenant that configures nothing is dialled on 15 August.
 *
 * An empty calendar is an AUTHORED value, not a missing one — the same posture `F1-62`a takes to
 * the IN messaging window — so nothing downstream waits on it.
 */

/**
 * A calendar date, `YYYY-MM-DD`. It carries no zone on purpose: a holiday is a DAY, and `F1-10`
 * puts the comparison on the tenant's clock, which the caller holding the tenant applies.
 */
export type CalendarDate = string;

/**
 * The days in force for a tenant (`F1-17`, `M01-59`). The tenant's list is ADDED to the market's
 * and never subtracted from it: extra holidays narrow calling availability, which is the one
 * direction a floor allows. There is no argument for removing a market day, so this function has
 * no way to express one — the same shape `calling/window.ts` gives the calling hours.
 *
 * Sorted, and duplicates collapse: a tenant that re-declares a market holiday changes nothing.
 */
export function holidaysInForce(
  market: readonly CalendarDate[],
  tenantAdded: readonly CalendarDate[],
): readonly CalendarDate[] {
  return [...new Set([...market, ...tenantAdded])].sort();
}

/** Whether this day is a holiday for this tenant — the read `M07`'s lane-2 gate makes. */
export function isHoliday(inForce: readonly CalendarDate[], date: CalendarDate): boolean {
  return inForce.includes(date);
}

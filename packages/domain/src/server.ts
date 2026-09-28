/**
 * @heliogrid/domain/server — the money computations, for the server alone (`F4-04`).
 *
 * `F4-04`: every money figure is computed server-side; no device computes, assigns or finalises
 * one. The index is what every screen bundles, so a function that works out a NEW figure lives
 * here instead, and dependency-cruiser's `devices-never-compute-money` refuses this entry to every
 * package a device bundles. Their TYPES stay on the index: a screen renders what the server sent.
 *
 * Belongs here: a function that computes a money figure — even one that returns only a verdict
 * about it — and a business-identifier formatter when one is written. Never here: a pack, a
 * formatter, a reducer, anything a screen needs.
 */

export { applyRate } from './money/basis-points';
export { reconcileMinorUnits, resolvePayable } from './money/equation';
export { amountForQuantity, sumMinorUnits } from './money/minor-units';
export { tenMonthYearly } from './pricing/book';
export { clearsCogsFloor, metersBelowCogsFloor } from './pricing/cogs';
export { subsidyAmount } from './subsidy/amount';
export { taxBreakdown } from './tax/breakdown';

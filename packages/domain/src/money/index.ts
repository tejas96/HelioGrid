/**
 * Market-generic money (`F1-07`): an amount is a whole number of the document currency's minor
 * unit, a rate is whole basis points, and one function applies the second to the first.
 */
export { applyRate, type BasisPoints, basisPoints, type Share } from './basis-points';
export { type MinorUnits, minorUnits, sumMinorUnits } from './minor-units';

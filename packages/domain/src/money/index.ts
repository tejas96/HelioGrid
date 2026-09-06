/**
 * Market-generic money (`F1-07`): an amount is a whole number of the document currency's minor
 * unit, a rate is whole basis points, and money rounds only where this slice rounds it.
 */
export { applyRate, type BasisPoints, basisPoints, type Share } from './basis-points';
export { amountForQuantity, type MinorUnits, minorUnits, sumMinorUnits } from './minor-units';

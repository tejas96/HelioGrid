import {
  basisPoints,
  type MinorUnits,
  minorUnits,
  type ProposalMoney,
  type TrancheLine,
} from '@heliogrid/domain';
import {
  figure,
  MARGIN,
  NET_COST,
  PAYABLE,
  PRE_TAX,
  rupees,
  SUBSIDY,
  TAX,
} from './proposal-document-figures';

/**
 * The sample deal's payment plans and its money block, in the shape the server computes them
 * (`ProposalMoney`): a case changes one fact of it, as one edit in the builder would.
 */
export const TRANCHES: readonly TrancheLine[] = [
  { label: 'Advance', share: basisPoints(1000), dueOnStage: 'won' },
  { label: 'Material', share: basisPoints(6000), dueOnStage: 'dispatched' },
  { label: 'Installation', share: basisPoints(2000), dueOnStage: 'installation' },
  { label: 'Handover', share: basisPoints(1000), dueOnStage: 'commissioned' },
];

/** A plan that leaves 12% unallocated: the money block then states no amounts. */
export const TRANCHES_SHORT: readonly TrancheLine[] = [
  { label: 'Advance', share: basisPoints(1000), dueOnStage: 'won' },
  { label: 'Material', share: basisPoints(5800), dueOnStage: 'dispatched' },
  { label: 'Installation', share: basisPoints(2000), dueOnStage: 'installation' },
];

/** A plan in long Devanagari names, as a Hindi or Marathi company types them. */
export const TRANCHES_LONG: readonly TrancheLine[] = [
  { label: 'करार झाल्यावर लगेच भरायची आगाऊ रक्कम', share: basisPoints(1250), dueOnStage: 'won' },
  {
    label: 'साहित्य आपल्या जागेवर पोहोचण्यापूर्वी',
    share: basisPoints(6250),
    dueOnStage: 'dispatched',
  },
  { label: 'बसवणी पूर्ण झाल्यावर', share: basisPoints(2500), dueOnStage: 'commissioned' },
];

const amountsOf = (payable: MinorUnits, tranches: readonly TrancheLine[]) =>
  tranches.map((tranche) => ({
    ...tranche,
    amount: minorUnits(Math.round((payable * tranche.share) / 10_000)),
  }));

/** The money block, as the server computes it for the sample; a case changes one fact of it. */
export function moneyOf(
  kase: 'drawn' | 'owner' | 'belowZero' | 'noTax' = 'drawn',
  tranches: readonly TrancheLine[] = TRANCHES,
): ProposalMoney {
  const payable = kase === 'belowZero' ? rupees(-4000) : PAYABLE;
  const taxed = kase !== 'noTax';
  const whole = tranches.reduce((sum, tranche) => sum + tranche.share, 0) === 10_000;
  return {
    currency: 'INR',
    equation: {
      lines: [],
      gross: payable,
      deductions: minorUnits(0),
      payable,
      zeroOrBelow: false,
      unresolved: [],
      reconciliation: null,
      payableStandsUp: true,
    },
    taxes: taxed ? [{ code: 'GST', amount: TAX }] : [],
    preTax: PRE_TAX,
    discount: minorUnits(0),
    taxAmount: taxed ? TAX : minorUnits(0),
    payable,
    payableAtOrBelowZero: payable <= 0,
    incentiveOffered: true,
    incentive: { scheme: 'pm_surya_ghar', amount: SUBSIDY, paidTo: 'customer' },
    netCost: NET_COST,
    margin: kase === 'owner' ? { amount: MARGIN, share: 2000, belowCost: false } : null,
    perKw: rupees(63525),
    tranches: whole && payable > 0 ? amountsOf(payable, tranches) : null,
    figures: {
      payable: figure(payable, 'assumed'),
      taxAmount: figure(taxed ? TAX : minorUnits(0), 'assumed'),
      discount: null,
      incentive: figure(SUBSIDY, 'assumed'),
      netCost: figure(NET_COST, 'assumed'),
      perKw: figure(rupees(63525), 'assumed'),
      margin: kase === 'owner' ? figure(MARGIN, 'assumed') : null,
    },
  };
}

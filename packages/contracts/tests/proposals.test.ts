import { PROPOSAL_STEPS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { apiContract } from '../src/index';
import { editProposalSchema } from '../src/proposals/acts';
import { proposalFieldSetSchema, proposalFieldsEditSchema } from '../src/proposals/field-set';
import { proposalMoneySchema } from '../src/proposals/money';
import { routesOf } from './support/routes';

const ROUTES = routesOf(apiContract);
const PUBLIC_LINK_ROUTES = ROUTES.filter(({ name }) => name.startsWith('customerLinkPublic.'));

describe('the customer’s side of the link is public and carries no person in its address (F5-21, F5-77)', () => {
  it('finds the public link routes', () => {
    expect(PUBLIC_LINK_ROUTES.length).toBeGreaterThan(0);
  });

  it.each(PUBLIC_LINK_ROUTES)(
    '$name declares no 401: the token is the whole authority',
    ({ route }) => {
      expect(Object.keys(route.responses)).not.toContain('401');
    },
  );

  it.each(PUBLIC_LINK_ROUTES)(
    '$name names only a token, a file or a version in its path',
    ({ route }) => {
      const segments = (route.path.match(/:[A-Za-z]\w*/g) ?? []).map((segment) => segment.slice(1));
      expect(
        segments.filter((segment) => !['token', 'fileId', 'versionId'].includes(segment)),
      ).toEqual([]);
    },
  );
});

describe('a commit carries whole steps on the revision it was typed on (M06-25)', () => {
  const AT = '2026-11-13T10:00:00.000Z';

  it('the field set holds one key per step that has fields of its own', () => {
    // Step 10 holds none: the client's facts are the lead's (`T-M06-012`).
    const own = PROPOSAL_STEPS.filter((step) => step !== 'client').length;
    expect(Object.keys(proposalFieldSetSchema.shape)).toHaveLength(own);
  });

  it.each([
    ['one step alone', { bank: { includeInProposal: false } }, true],
    ['no step at all', {}, true],
    ['a step that does not exist', { roof: { tilt: 12 } }, false],
    ['half a step', { bank: {} }, false],
  ])('%s', (_, fields, taken) => {
    expect(proposalFieldsEditSchema.safeParse(fields).success).toBe(taken);
  });

  it.each([
    ['with its revision', { revision: 3, capturedAt: AT }, true],
    ['without one', { capturedAt: AT }, false],
    ['with a negative one', { revision: -1, capturedAt: AT }, false],
  ])('an edit %s', (_, body, taken) => {
    expect(editProposalSchema.safeParse(body).success).toBe(taken);
  });

  it('an edit never carries the customer’s phone: it is the customer’s identity (T-M06-032)', () => {
    const body = { revision: 0, capturedAt: AT, deal: { clientPhone: '+919876543210' } };
    expect(editProposalSchema.safeParse(body).success).toBe(false);
  });
});

describe('a discount past the price is stated on the wire, never taxed below zero (M06-36)', () => {
  const figure = (amount: string) => ({ amount, tier: 'assumed', standing: null, freshness: null });
  const pastThePrice = (taxAmount: string) => ({
    currencyCode: 'INR',
    equation: [
      { key: 'system', label: 'System', amount: '175000.00', kind: 'add' },
      { key: 'discount', label: 'Discount', amount: '200000.00', kind: 'deduct' },
      { key: 'tax', label: 'GST', amount: '0.00', kind: 'add' },
    ],
    taxes: [{ code: 'CGST', amount: '0.00' }],
    preTax: '-25000.00',
    discount: '200000.00',
    taxAmount,
    payable: figure('-25000.00'),
    payableAtOrBelowZero: true,
    incentiveOffered: false,
    incentive: null,
    netCost: figure('-25000.00'),
    perKw: null,
    tranches: null,
  });

  it.each([
    ['a zero tax and a negative payable', '0.00', true],
    ['a tax below zero', '-2225.00', false],
  ])('%s', (_, taxAmount, taken) => {
    expect(proposalMoneySchema.safeParse(pastThePrice(taxAmount)).success).toBe(taken);
  });
});

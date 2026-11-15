import {
  customerShortNameOf,
  type DealSegment,
  type ProposalVersionSnapshot,
  shareTextOf,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { proposalBlockWords } from './proposal-document';
import { blockFacts, type ProposalPageInput } from './proposal-document-pages';

/** The document's blocks as the BUILDER words them (`T-M06-002`): the same facts, said to the person building. */
type T = Translator['t'];

/**
 * The blocks' words in the builder's voice (`T-M06-002`): the same facts the document's pages read,
 * said to the person building — *Anil pays you*.
 */
export function proposalBuilderBlockWords(t: T, input: ProposalPageInput) {
  return proposalBlockWords(t, { ...blockFacts(t, input), voice: 'builder' });
}

/** What a draft's blocks are worded over while it has no price yet, and so no value set. */
export interface ProposalDraftBlocksInput
  extends Pick<ProposalPageInput, 'format' | 'taxName' | 'schemeName'> {
  readonly fields: ProposalVersionSnapshot['fields'];
  readonly customerName: string;
  readonly segment: DealSegment | null;
  readonly companyName: string;
}

/**
 * The blocks' words in the builder's voice for a draft with no price typed: only what its steps
 * hold — no basis line and no source, since no figure stands yet for either to qualify.
 */
export function proposalDraftBlockWords(t: T, input: ProposalDraftBlocksInput) {
  const { fields, format } = input;
  const tariff = fields.financials.tariffPerKwh;
  return proposalBlockWords(t, {
    voice: 'builder',
    customerName: customerShortNameOf(input.customerName, input.segment),
    companyName: input.companyName,
    taxName: input.taxName,
    schemeName: input.schemeName,
    numberText: format.number,
    tariffText: tariff === null ? '' : format.amount(tariff),
    tariffRiseText: `${shareTextOf(fields.financials.tariffRise)}%`,
    emiRateText: fields.system.emi === null ? '' : `${shareTextOf(fields.system.emi.rate)}%`,
    emiMonths: 0,
    splitParts: fields.payment.tranches.length,
    proposalType: fields.company.proposalType,
  });
}

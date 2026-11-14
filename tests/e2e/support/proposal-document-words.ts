import {
  formatMinorUnits,
  formatNumber,
  formatPhone,
  IN_FORMATS,
  type ProposalVersionSnapshot,
} from '@heliogrid/domain';
import {
  disclosureLine,
  energySourceLabel,
  type ProposalVoice,
  proposalBlockWords,
  proposalPageWords,
  type Translator,
} from '@heliogrid/i18n';
import { COMPANY, CUSTOMER, TAX_NAME, VERSION } from './proposal-document-sample';

export const SEASON = 'Monsoon';

/** The India pack's format, as a screen's hook hands it to the words. */
export const format = {
  number: (value: number) => formatNumber(IN_FORMATS, value),
  amount: (value: Parameters<typeof formatMinorUnits>[1]) => formatMinorUnits(IN_FORMATS, value),
  phone: (e164: string) => formatPhone(IN_FORMATS, e164),
};

/** The scheme's name is the pack's own key in India: `DCR`. */
const schemeName = (scheme: string): string => scheme;

/**
 * The blocks' words for the sample deal in one voice, as a builder's hook builds them. The story
 * draws with them and a spec reads them, so neither types a word.
 */
export function blockWordsOf(
  t: Translator['t'],
  voice: ProposalVoice,
  snapshot: ProposalVersionSnapshot,
) {
  const source = snapshot.generation?.source ?? null;
  return proposalBlockWords(t, {
    voice,
    customerName: CUSTOMER.split(' ')[0] ?? CUSTOMER,
    companyName: COMPANY,
    taxName: TAX_NAME,
    schemeName,
    numberText: format.number,
    basis: disclosureLine(t, 'indicative-basis'),
    energySource: source === null ? undefined : energySourceLabel(t, source),
    energyPlace: snapshot.deal.area?.district ?? undefined,
    seasonName: SEASON,
    tariffText: '₹9.50',
    tariffRiseText: '3%',
    emiRateText: '9.5%',
    emiMonths: 60,
    splitParts: snapshot.fields.payment.tranches.length,
    proposalType: snapshot.fields.company.proposalType,
  });
}

/** The document's words for a version, as the document's hook builds them from the snapshot. */
export function pageWordsOf(t: Translator['t'], snapshot: ProposalVersionSnapshot, draft = false) {
  return proposalPageWords(t, {
    snapshot,
    version: draft ? undefined : VERSION,
    format,
    taxName: TAX_NAME,
    seasonName: SEASON,
    schemeName,
  });
}

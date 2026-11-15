import {
  type BankDetails,
  basisLineOf,
  type CompanyIdentity,
  type Freshness,
  freshnessOf,
  type MarketPack,
  minorUnits,
  PROPOSAL_BASIS_WITHOUT_DESIGN,
  PROPOSAL_ENGINES,
  type ProposalCompanyFacts,
  type ProposalDealFacts,
  type ProposalFieldSet,
  type ProposalMoneyLineKey,
  type ProposalSection,
  pagesPrinted,
  placeOfRegistration,
  type RichTextValue,
  systemMonthlyKwh,
  type TaxRegistration,
  termsValidityDays,
  type UiLanguage,
  yearlyKwh,
} from '@heliogrid/domain';
import { proposalEmi, proposalMoney, proposalSavings } from '@heliogrid/domain/server';
import type { LiveDocument } from './document-wire';

/*
 * A proposal's one value set, assembled (`M06-41`, `F5-38`, `T-M06-024`): the field set, the
 * lead's and the company's facts and the pack go in; the figures every surface prints come out,
 * each worked out by domain — nothing here multiplies a rate. A draft is assembled on every read; a
 * version stores what Generate assembled and never assembles again.
 */

/** Figures worked out on this very read: current by construction, and said so by the one function that may. */
export function computedNow(): Freshness {
  return freshnessOf(
    { engines: PROPOSAL_ENGINES },
    { engines: PROPOSAL_ENGINES, recomputeInFlight: false },
  );
}

/** The company as a document prints it, read from the settings in force (`T-M06-013`). */
export interface CompanyNow {
  readonly identity: CompanyIdentity;
  readonly taxRegistrations: readonly TaxRegistration[];
  readonly brandColour: string | null;
  /** The EPC Owner's sign-in number — the company's contact fact until it sets its own (`M06-07`). */
  readonly phoneE164: string | null;
}

export interface AssemblyInput {
  readonly fields: ProposalFieldSet;
  readonly deal: ProposalDealFacts;
  readonly company: CompanyNow;
  readonly pack: MarketPack;
  readonly sectionsIncluded: readonly ProposalSection[];
  readonly lineLabels: Readonly<Record<ProposalMoneyLineKey, string>>;
  readonly language: UiLanguage;
  /** The platform's default terms in each launch language — what the validity is read against. */
  readonly platformTerms: readonly RichTextValue[];
  readonly preparedBy: { readonly name: string; readonly phoneE164: string | null };
  /** `null` freezes the figures as a record, as Generate does. */
  readonly freshness: Freshness | null;
}

/** What the money block reads of the company: whether it is registered, and where (`T-M06-024`). */
export function companyFactsOf(company: CompanyNow, pack: MarketPack): ProposalCompanyFacts {
  const [registration] = company.taxRegistrations;
  return {
    taxRegistered: registration !== undefined,
    supplierPlace: registration === undefined ? null : placeOfRegistration(pack.tax, registration),
    hasBankDetails: company.identity.bankDetails !== null,
    hasLogo: company.identity.logoFileId !== null,
  };
}

/** The bank details this proposal prints: the company's, unless the step switched them off (`M06-17`). */
function bankPrinted(fields: ProposalFieldSet, company: CompanyNow): BankDetails | null {
  return fields.bank.includeInProposal ? company.identity.bankDetails : null;
}

export function assemble(input: AssemblyInput): LiveDocument {
  const { fields, deal, company, pack, freshness } = input;
  const money = proposalMoney({
    scheme: pack,
    subsidy: pack.subsidy,
    fields,
    deal,
    company: companyFactsOf(company, pack),
    lineLabels: input.lineLabels,
    freshness,
  });
  const monthlyKwh = systemMonthlyKwh(fields.performance, fields.system.capacityKw);
  const { tariffPerKwh } = fields.financials;
  const incentive = money?.incentive ?? null;
  const savings =
    money === null || monthlyKwh === null || tariffPerKwh === null
      ? null
      : proposalSavings({
          formats: pack.formats,
          monthlyKwh,
          source: fields.performance.source,
          financials: { ...fields.financials, tariffPerKwh },
          monthlyBill: deal.monthlyBill,
          exportRatePerKwh: pack.formats.proposal?.exportRatePerKwh ?? minorUnits(0),
          netCost: money.netCost,
          incentive:
            incentive !== null && incentive.paidTo === 'customer' ? incentive.amount : null,
          freshness,
        });
  const [taxRegistration = null] = company.taxRegistrations;
  return {
    fields,
    deal,
    company: {
      name: company.identity.companyName,
      phoneE164: company.phoneE164,
      email: null,
      website: null,
      address: company.identity.address,
      logoFileId: company.identity.logoFileId,
      taxRegistration,
      bankDetails: bankPrinted(fields, company),
      brandColour: company.brandColour,
    },
    money,
    generation:
      monthlyKwh === null
        ? null
        : {
            monthlyKwh,
            yearlyKwh: yearlyKwh(monthlyKwh),
            source: fields.performance.source,
            grain: fields.performance.grain,
          },
    savings,
    emi:
      fields.system.emi === null || money === null
        ? null
        : proposalEmi(pack.formats, money.payable, fields.system.emi, freshness),
    pages: pagesPrinted(input.sectionsIncluded),
    basisLine: basisLineOf(PROPOSAL_BASIS_WITHOUT_DESIGN),
    validityDays: termsValidityDays(fields.terms, input.platformTerms),
    language: input.language,
    preparedBy: input.preparedBy,
  };
}

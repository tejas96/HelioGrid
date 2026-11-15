import type { BankDetails, TaxRegistration } from '../commerce/effective-settings';
import type { AreaGrain } from '../format/areas';
import type { BasisLine } from '../format/disclosure';
import type { EnergySource } from '../format/energy-source';
import type { UiLanguage } from '../format/languages';
import type { MonthlyFigures, ProposalDealFacts, ProposalFieldSet } from './field-set';
import type { ProposalMoney } from './money';
import type { ProposalEmi, ProposalSavings } from './projections';
import type { ProposalPage } from './steps';

/**
 * What one generated version holds for ever (`M06-42`, `M06-43`): the eleven-step field set, the
 * lead's and the company's facts as they stood at Generate, and the one computed value set every
 * surface prints. Written once and never edited — a later change makes a new version.
 */

/** The company's facts as the version printed them (`T-M06-013`): live until Generate, frozen here. */
export interface FrozenCompanyFacts {
  readonly name: string;
  readonly phoneE164: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly address: string | null;
  readonly logoFileId: string | null;
  readonly taxRegistration: TaxRegistration | null;
  /** `null` where the company has none, or this proposal does not print them (`M06-17`). */
  readonly bankDetails: BankDetails | null;
  readonly brandColour: string | null;
}

/** The generation a version states, with the source that fed it (`F8-08`). */
export interface FrozenGeneration {
  readonly monthlyKwh: MonthlyFigures;
  readonly yearlyKwh: number;
  readonly source: EnergySource | null;
  readonly grain: AreaGrain | null;
}

export interface ProposalVersionSnapshot {
  readonly fields: ProposalFieldSet;
  readonly deal: ProposalDealFacts;
  readonly company: FrozenCompanyFacts;
  readonly money: ProposalMoney;
  readonly generation: FrozenGeneration | null;
  readonly savings: ProposalSavings | null;
  readonly emi: ProposalEmi | null;
  /** The pages this version prints, in order (`pagesPrinted`). */
  readonly pages: readonly ProposalPage[];
  /** The line that names the document's basis (`basisLineOf`); `null` for a roof measured on site. */
  readonly basisLine: BasisLine | null;
  /** The days the terms state (`termsValidityDays`), frozen at Generate; `null` for a company's own words. */
  readonly validityDays: number | null;
  /** The document's language: the customer's, else the company's default (`T-M06-017`). */
  readonly language: UiLanguage;
  /** Who generated it — the cover's "Prepared by". */
  readonly preparedBy: { readonly name: string; readonly phoneE164: string | null };
}

/**
 * A draft's value set as it stands, before a price is typed: a version's facts with the money
 * absent, so the cover can draw the picture, the customer and the system line (`M06-51`) while no
 * figure exists. Only the cover reads it; every other page needs the money (`ProposalVersionSnapshot`).
 */
export type ProposalDraftValueSet = Omit<ProposalVersionSnapshot, 'money'> & {
  readonly money: ProposalMoney | null;
};

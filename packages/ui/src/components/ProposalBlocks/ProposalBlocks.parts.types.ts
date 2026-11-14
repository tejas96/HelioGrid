import type { TranslatedText } from '@heliogrid/contracts';
import type { ComponentCategory, ComponentLine, ProjectChainStage } from '@heliogrid/domain';

/**
 * The blocks' own words, built in `packages/i18n` (`proposalBlockWords`) for one voice: the person
 * building (`app`) or the customer (`paper`, `link`). A figure arrives as the text the server sent,
 * so a sentence never joins a number to a word itself.
 */

export interface ProposalPriceWords {
  /** `Your investment`, or `{customer} pays you` to the person building. */
  readonly overline: TranslatedText;
  readonly aboveZero: TranslatedText;
  /** `Includes GST {amount}` — the tax's name is the market pack's. */
  readonly includesTax: (amount: string) => TranslatedText;
  /** The line a company registered for no tax prints in its place. */
  readonly noTax: TranslatedText;
  readonly discount: (amount: string) => TranslatedText;
  readonly perKw: (amount: string) => TranslatedText;
  /** The incentive tile's name, and the net cost's. */
  readonly incentive: TranslatedText;
  readonly netCost: TranslatedText;
  readonly margin: (amount: string, percent: string) => TranslatedText;
  readonly loss: (amount: string, percent: string) => TranslatedText;
  readonly onlyYou: TranslatedText;
  /**
   * The basis line the document carries, verbatim (`F8-20`, `F8-22`) — printed in the reading flow
   * for the customer. Absent where the document carries none.
   */
  readonly basis?: TranslatedText;
}

export interface ProposalGenerationWords {
  readonly overline: TranslatedText;
  /** The annual figure's unit — `kWh a year`. */
  readonly perYear: TranslatedText;
  /**
   * The energy source label (`F8-08`), with its place where the caller adds one. Absent where no
   * source fed the figures — a person typed them, and their tier says so.
   */
  readonly source?: TranslatedText;
  /** The chart's spoken name — `Generation by month, highest in {month}`. */
  readonly chart: (peakMonth: string) => TranslatedText;
  /** The line under the bars — `About {units} units a month. …`. */
  readonly average: (units: string) => TranslatedText;
}

export interface ProposalSavingsWords {
  readonly overline: TranslatedText;
  /** The hero figure's unit — `a month`. */
  readonly perMonth: TranslatedText;
  readonly billToday: TranslatedText;
  readonly billWithSolar: TranslatedText;
  /** The curve's spoken name — `Savings pass the net cost after {years} years`. */
  readonly chart: (years: string) => TranslatedText;
  /** Its name where the savings never reach the net cost within the horizon. */
  readonly chartNoPayback: TranslatedText;
  /** The dashed line's label — `Net cost {amount}`. */
  readonly netCost: (amount: string) => TranslatedText;
  readonly firstYear: TranslatedText;
  readonly lastYear: (years: number) => TranslatedText;
  /** `{years} years`, over `to pay for itself`. */
  readonly paybackValue: (years: string) => TranslatedText;
  readonly paybackLabel: TranslatedText;
  /** The horizon's whole saving, as the market compacts it, over `saved in {years} years`. */
  readonly lifetimeLabel: (years: number) => TranslatedText;
  readonly yearlyLabel: TranslatedText;
  /** The projection's word and its assumptions (`F8-23`), as the caller states them. */
  readonly projection: TranslatedText;
}

export interface ProposalEmiWords {
  /** Under the instalment — `a month for {years} years`. */
  readonly monthlyLabel: (months: number) => TranslatedText;
  readonly savingLabel: TranslatedText;
  /** The projection's word and its assumptions, and that it is no offer (`M06-40`, `F5-42`). */
  readonly projection: TranslatedText;
}

export interface ProposalSplitWords {
  readonly overline: TranslatedText;
  readonly under: (percent: string) => TranslatedText;
  readonly over: (percent: string) => TranslatedText;
  /** The bar's spoken name. */
  readonly chart: TranslatedText;
  /** When a part falls due, said to the customer — `On signing`. */
  readonly due: (stage: ProjectChainStage) => TranslatedText;
}

export interface ProposalPartsWords {
  /** A category's name — `Solar panels`. */
  readonly kind: (category: ComponentCategory) => TranslatedText;
  /** How many, in words — `6 panels`, `1 unit`. */
  readonly count: (category: ComponentCategory, count: number) => TranslatedText;
  /** What prints for a line — its specification and warranty; `null` where it holds neither. */
  // biome-ignore lint/plugin/copy-prop-type: a line's own facts joined — its figures with their units, the company's words for the rest
  readonly detail: (line: ComponentLine) => string | null;
  /** A certification scheme's name, as the market pack words it — `DCR`. */
  // biome-ignore lint/plugin/copy-prop-type: a scheme's name, as the market pack words it
  readonly scheme: (scheme: string) => string;
  /** Between two brands of one kind — `or`. */
  readonly or: TranslatedText;
  /** `app`: an empty kind's line — `Pick a brand`. */
  readonly pick: TranslatedText;
  /** `paper`: an empty kind's line while the draft is previewed. */
  readonly notPicked: TranslatedText;
  /** What a press on a kind's tile does, spoken — `Pick {kind}`. */
  readonly pickKind: (kind: TranslatedText) => TranslatedText;
}

export interface ProposalTimelineWords {
  /** How long a step takes — `3 days`. */
  readonly days: (days: number) => TranslatedText;
}

export interface ProposalTrackRecordWords {
  readonly installedKw: TranslatedText;
  readonly customers: TranslatedText;
  readonly cities: TranslatedText;
}

export interface ProposalCompanyWords {
  readonly proposalOverline: TranslatedText;
  /** A draft's place for the number. */
  readonly draft: TranslatedText;
  /** How the customer takes the system — owns it, or pays for its power. */
  readonly type: TranslatedText;
}

export interface ProposalTermsWords {
  /** The words a logo block reads while the company has no logo — `RichTextView`'s own slot. */
  readonly logoLabel: TranslatedText;
}

export interface ProposalBankWords {
  /** The account number's lead-in — `A/c`. */
  readonly account: (accountNumber: string) => TranslatedText;
  /** `Saved · not printed`. */
  readonly notPrinted: TranslatedText;
}

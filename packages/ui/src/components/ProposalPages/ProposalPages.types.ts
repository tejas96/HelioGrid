import type { ProvenanceTier, TranslatedText } from '@heliogrid/contracts';
import type {
  ProposalDraftValueSet,
  ProposalPage,
  ProposalVersionSnapshot,
} from '@heliogrid/domain';
import type {
  ProposalBankWords,
  ProposalEmiWords,
  ProposalGenerationWords,
  ProposalPartsWords,
  ProposalPriceWords,
  ProposalSavingsWords,
  ProposalSplitWords,
  ProposalTermsWords,
  ProposalTimelineWords,
  ProposalTrackRecordWords,
} from '../ProposalBlocks/ProposalBlocks.parts.types';

/** The page's design size, px at 96 dpi: A4 portrait. A page is drawn at this size and scaled whole. */
export const PROPOSAL_PAGE_SIZE = { width: 794, height: 1123 } as const;

/**
 * What a page prints that the version's snapshot does not hold as it prints: the server's number,
 * the date in the reader's format, and the addresses of the two stored files.
 */
export interface ProposalPageFacts {
  /** The server's number; absent on a draft, which reads `Draft`. */
  readonly number?: string;
  /** The document's date, as the reader's format prints it. */
  readonly dateText: string;
  /** The company's logo; absent where it has none — the mark is then its initials. */
  readonly logoSrc?: string;
  /** The company's own cover photo, where the version's cover is the company's own. */
  readonly coverSrc?: string;
  /** How the generation figures were produced (`F8-02`): the source's fill, or a person's own. */
  readonly generationTier: ProvenanceTier;
}

/** The blocks' words in the customer's voice, as `packages/i18n` builds them for a document. */
export interface ProposalDocumentBlockWords {
  readonly price: ProposalPriceWords;
  readonly generation: ProposalGenerationWords;
  readonly savings: ProposalSavingsWords;
  readonly emi: ProposalEmiWords;
  readonly split: ProposalSplitWords;
  readonly parts: ProposalPartsWords;
  readonly record: ProposalTrackRecordWords;
  readonly timeline: ProposalTimelineWords;
  readonly terms: ProposalTermsWords;
  readonly bank: ProposalBankWords;
}

/**
 * The pages' own words (`proposalPageWords`). Every sentence that states a fact is a slot template
 * over the version's own facts (`M06-52`); a line whose fact is absent arrives absent and is left
 * out.
 */
export interface ProposalPagesWords {
  readonly blocks: ProposalDocumentBlockWords;
  /** A page's head, opposite the company — `Proposal · v1`. */
  readonly head: TranslatedText;
  /** A page's foot — the customer, and who to call. Absent where no person is named: the name alone. */
  readonly foot?: TranslatedText;
  /** A page's spoken name — `Page {n} of {count}: {title}`. */
  readonly pageName: (title: TranslatedText, page: number, count: number) => TranslatedText;
  readonly titles: Readonly<Record<ProposalPage, TranslatedText>>;
  readonly cover: {
    /** `Solar proposal for`. */
    readonly over: TranslatedText;
    /** A draft's place for the number. */
    readonly draft: TranslatedText;
    /** The one line for the system — its size, its type and where it goes; absent until it has a size. */
    readonly system?: TranslatedText;
    readonly payableLabel: TranslatedText;
    /** `{amount} kWh`, over `clean power each year`. */
    readonly generationValue: (amount: string) => TranslatedText;
    readonly generationLabel: TranslatedText;
    /** `{years} years`, over `to pay for itself`. */
    readonly paybackValue: (years: string) => TranslatedText;
    readonly paybackLabel: TranslatedText;
    /** `Prepared by {person} · {phone}`; absent where no person is named. */
    readonly preparedBy?: TranslatedText;
    /** The validity the terms state — `Valid for 30 days`; absent where they state none. */
    readonly validity?: TranslatedText;
  };
  /** The system page's lead — its size, type and panel count, and how two brands read. */
  readonly systemLead?: TranslatedText;
  /** The timeline page's lead — how long the work takes. */
  readonly timelineLead?: TranslatedText;
  /** `Included in this price`, and its lines — each a fact of this version. */
  readonly included: TranslatedText;
  readonly includedLines: readonly TranslatedText[];
  /** The bank page's lead while the account prints, and its line while it does not. */
  readonly bankLead: TranslatedText;
  readonly bankAbsent: TranslatedText;
  /** The closing card — `Thank you, {name}.` and who to call. */
  readonly thanks: TranslatedText;
  readonly questions?: TranslatedText;
}

export interface ProposalPageProps {
  /** Which page to draw. */
  page: ProposalPage;
  /**
   * Which of the page's sheets, from 0 — only the terms run over more than one (`M06-15`), as the
   * domain's page plan (`proposalSheetsOf`) cuts them. Absent: the first.
   */
  part?: number;
  /**
   * One version's facts, as the server froze them — the one value set the stage, the preview, the
   * document, the PDF and the customer's page all draw (`F5-38`). Its own `pages` are the pages it
   * prints, and a page's number counts within them. A draft is read the same way.
   */
  snapshot: ProposalVersionSnapshot;
  facts: ProposalPageFacts;
  words: ProposalPagesWords;
  /** Held at rest, with nothing arriving — a print, or a thumbnail in a wall of pages. */
  still?: boolean;
}

/** The words the cover says — a draft's cover is drawn before the document's other words exist. */
export interface ProposalCoverWords {
  readonly cover: ProposalPagesWords['cover'];
  readonly pageName: ProposalPagesWords['pageName'];
  readonly titles: Pick<ProposalPagesWords['titles'], 'cover'>;
}

/**
 * The cover (`M06-51`), which a draft draws from step 1: its value set may hold no money yet, and
 * then the figures on glass are left out, the glass with them, while the picture, the customer and
 * the system line show. A version's snapshot is one such value set.
 */
export interface ProposalCoverProps extends Pick<ProposalPageProps, 'facts' | 'still'> {
  page: 'cover';
  snapshot: ProposalDraftValueSet;
  words: ProposalCoverWords;
}

/** A page to draw: any page of a version, or a draft's cover before its price is typed. */
export type AnyProposalPageProps = ProposalPageProps | ProposalCoverProps;

export type ScaledProposalPageProps = AnyProposalPageProps & {
  /** The width the page is fitted to, px or dp; its height follows the paper's ratio. */
  width: number;
};

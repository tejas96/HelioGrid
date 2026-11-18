import type { DesignWire, LeadProposals, TranslatedText } from '@heliogrid/contracts';
import type { LeadDetailSection, Read } from '@heliogrid/domain';
import type { ReactNode } from 'react';

/** One task as the Tasks section draws it (`M07-05`). */
export interface LeadTaskRow {
  readonly id: string;
  /** What it asks — its kind's word, or a custom task's own words. */
  readonly title: TranslatedText;
  /** When it is due, in the reader's words — "Today 11:30". */
  readonly due: TranslatedText;
  /** Derived from the due moment (`isOverdue`); drawn as glyph, word and tint. */
  readonly overdue: boolean;
  readonly done: boolean;
}

/** One fact of the site beside its address — "Sanctioned load · 5 kW". */
export interface LeadSiteFactLine {
  readonly key: string;
  readonly label: TranslatedText;
  readonly value: TranslatedText;
}

/** What the Site section shows: the address — confirmed once a visit is booked — and the supply. */
export interface LeadSitePanelFacts {
  /** A fact as typed; null with no fact draws the named gap. */
  readonly address: string | null;
  readonly confirmed: boolean;
  readonly facts: readonly LeadSiteFactLine[];
}

/** The booked visit as the Site section names it. */
export interface LeadSiteVisit {
  /** "Fri 14 Nov, 10:00 · Rajesh Jadhav". */
  readonly line: TranslatedText;
  /** Reschedule a no-show (`M02-48`). */
  readonly onReschedule: () => void;
  /** Copy the visit confirmation (`M02-47`). */
  readonly onConfirmation: () => void;
}

/** Every word the sections say, built in `@heliogrid/i18n` (`leadSectionsWords`). */
export interface LeadSectionsWords {
  readonly tabs: Readonly<Record<LeadDetailSection, TranslatedText>>;
  /** The tab list's name — "Lead sections". */
  readonly tabsLabel: TranslatedText;
  /** The Site section's overline, and its named gap until a visit is booked. */
  readonly site: TranslatedText;
  readonly siteGap: TranslatedText;
  readonly confirmed: TranslatedText;
  readonly reschedule: TranslatedText;
  readonly confirmation: TranslatedText;
  /** Proposals on an api built before them: their count, or their named gap and why. */
  readonly proposals: (count: number) => TranslatedText;
  readonly noProposal: TranslatedText;
  readonly proposalsLine: TranslatedText;
  /** The lead's files: their gap and what they are for, the add, and how their read went. */
  readonly noFiles: TranslatedText;
  readonly filesLine: TranslatedText;
  readonly addFile: TranslatedText;
  /** "Adding Electricity bill.pdf" — the pick going up, by its own name. */
  readonly addingFile: (name: string) => TranslatedText;
  /** "Electricity bill.pdf was not added to the lead." — the pick that came back undone. */
  readonly fileNotAdded: (name: string) => TranslatedText;
  /** Why a pick never went up — the file says what a lead takes, so a retry is never offered. */
  readonly fileRefused: Readonly<Record<LeadFileRefusal, (name: string) => TranslatedText>>;
  readonly chooseAnother: TranslatedText;
  readonly loadingFiles: TranslatedText;
  readonly filesFailed: TranslatedText;
  readonly filesFailedLine: TranslatedText;
  readonly retry: TranslatedText;
  readonly noTasks: TranslatedText;
  readonly addCallBack: TranslatedText;
  readonly overdue: TranslatedText;
  readonly doneMark: TranslatedText;
  /** A row's acts, spoken with the task's words. */
  readonly markDone: (task: TranslatedText) => TranslatedText;
  readonly reopen: (task: TranslatedText) => TranslatedText;
}

/** A task's act: which task is out, and which came back undone with why. */
export interface LeadTaskActs {
  readonly onDone: (taskId: string) => void;
  readonly onReopen: (taskId: string) => void;
  readonly onAddCallBack: () => void;
  readonly pendingId: string | null;
  readonly failure: { readonly taskId: string; readonly reason: TranslatedText } | null;
}

/** One file on the lead as the Files section lists it. */
export interface LeadFileRow {
  readonly id: string;
  readonly fileId: string;
  /** The file's own name, as its picker gave it: a fact, never translated. */
  readonly name: string;
  /** "Added by Asha Patil · 10 Nov". */
  readonly line: TranslatedText;
}

/** The pick going up, or the one that came back undone, by its own name. */
export interface LeadFilePending {
  /** The file's own name, as its picker gave it: a fact, never translated. */
  readonly name: string;
  readonly failed: boolean;
  /** Why the pick never went up; `null` for one that went up or came back undone. */
  readonly refused: LeadFileRefusal | null;
}

/** Bigger than a lead takes, or a type it does not take. */
export type LeadFileRefusal = 'too-large' | 'type-not-taken';

/**
 * The Files section (`M02-32`): the files, oldest first, each opened with a tap; the add — absent
 * for a reader who may not add one — inert while a pick goes up; and the pick's own line.
 */
export interface LeadFilesPanel {
  readonly read: Read<readonly LeadFileRow[]>;
  readonly onAdd: (() => void) | null;
  readonly pending: LeadFilePending | null;
  /** Sends the pick that came back undone again. */
  readonly onRetry: () => void;
  readonly onOpen: (fileId: string) => void;
}

/** One proposal on the lead, as the server sends it. */
export type LeadProposal = LeadProposals['items'][number];

/** The Proposals section's words (`T-M06-001`, `T-M06-031`) — `leadProposalsWords`, by shape. */
export interface LeadProposalsWords {
  readonly noneTitle: TranslatedText;
  /** "Build one for Anil in about a minute." */
  readonly noneLine: TranslatedText;
  readonly create: TranslatedText;
  readonly draftTitle: TranslatedText;
  /** The ring's figure — `7/11` — and what a screen reader says for it. */
  // biome-ignore lint/plugin/copy-prop-type: a figure, two counts and a stroke
  readonly ringValue: (complete: number, of: number) => string;
  readonly ringName: (complete: number, of: number) => TranslatedText;
  readonly continue: TranslatedText;
  /** "PRP-0042 · v1". */
  readonly numbered: (number: string, version: number | null) => TranslatedText;
  /** A proposal's second line: its size, its price, and when it was saved or who made it. */
  readonly line: (proposal: LeadProposal) => TranslatedText;
  readonly standing: (standing: string) => TranslatedText;
  /** "Two proposals for one customer" and "Keep one. A person withdraws the other." */
  readonly twoTitle: TranslatedText;
  readonly twoLine: TranslatedText;
  readonly withdraw: TranslatedText;
  /** Withdraw's spoken name with the proposal's number. */
  readonly withdrawNamed: (number: string | null) => TranslatedText;
  /** A closed lead: what it is marked as, and that reopening it brings proposals back. */
  readonly closedTitle: TranslatedText;
  readonly closedLine: TranslatedText;
  readonly reopenLead: TranslatedText;
  /** Another lead of this customer holds a live proposal (`M06-58`). */
  readonly siblingLine: (number: string | null) => TranslatedText;
  readonly openSibling: TranslatedText;
}

/**
 * The Proposals section (`M06-02`, `M06-25`, `M06-58`): one of five states — none (the empty scene
 * and *Create proposal*), a draft (the n/11 ring and *Continue*), one proposal (number, version,
 * standing), two live proposals (the warning and *Withdraw* on each), and a closed lead (*Reopen
 * lead*, no create).
 */
export interface LeadProposalsPanel {
  /** The section as the server sends it; what the reader may do rides in it. */
  readonly section: LeadProposals;
  /** The lead is lost, disqualified or junk: no proposal is made on it until it is reopened. */
  readonly closed: boolean;
  readonly words: LeadProposalsWords;
  readonly onCreate: () => void;
  readonly onContinue: (proposalId: string) => void;
  readonly onOpen: (proposalId: string) => void;
  /** Opens the Withdraw sheet for one proposal. */
  readonly onWithdraw: (proposalId: string) => void;
  /** Absent for a reader who may not reopen the lead. */
  readonly onReopenLead: (() => void) | null;
  readonly onOpenSibling: () => void;
}

/** One design on the lead, as the server sends it. */
export type LeadDesign = DesignWire;

/** The Designs section's words (`T-M05-001`) — `leadDesignsWords`, by shape. */
export interface LeadDesignsWords {
  readonly noneTitle: TranslatedText;
  /** "Start a design for this roof. The address and the connection come from this lead." */
  readonly noneLine: TranslatedText;
  readonly create: TranslatedText;
  /** "Design 2". */
  readonly named: (design: LeadDesign) => TranslatedText;
  /** A status the app knows by its word, and one a newer server learned by a plain fallback. */
  readonly status: (status: string) => TranslatedText;
  readonly recommended: TranslatedText;
  /** The card's cover and its facts until the design holds panels. */
  readonly noPanels: TranslatedText;
  /** The cover's placeholder until the studio draws a model — "3D preview coming soon". */
  readonly preview: TranslatedText;
  /** "Asha Patil · 2 days ago" — "You" for the reader's own. */
  readonly line: (design: LeadDesign) => TranslatedText;
  readonly continue: TranslatedText;
  readonly view: TranslatedText;
  /** A card's spoken names, each with the design's own: "Open Design 2", "More for Design 2". */
  readonly openNamed: (design: LeadDesign) => TranslatedText;
  readonly moreNamed: (design: LeadDesign) => TranslatedText;
  readonly copy: TranslatedText;
  readonly recommend: TranslatedText;
  readonly unrecommend: TranslatedText;
  /** "You can view these designs. You cannot change them." */
  readonly viewOnly: TranslatedText;
  /** A closed lead: what it is marked as, and that reopening it brings designs back. */
  readonly closedLine: TranslatedText;
  readonly loading: TranslatedText;
  /** *Create design* is out, said where it was pressed — "Creating the design". */
  readonly creating: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedLine: TranslatedText;
  readonly retry: TranslatedText;
}

/**
 * The Designs section (`T-M05-001`): the lead's designs as cards, newest change first, or the
 * empty scene with *Create design*. A reader without the design grant opens a card to view it and
 * is offered nothing else; a closed lead takes no new design. Every act — a create, a copy, the
 * recommended mark — waits for its answer, and one that came back undone says so here.
 */
export interface LeadDesignsPanel {
  readonly read: Read<readonly LeadDesign[]>;
  /** The reader holds the design grant. */
  readonly canDesign: boolean;
  /** The lead is lost, disqualified or junk: no design is made on it until it is reopened. */
  readonly closed: boolean;
  readonly words: LeadDesignsWords;
  readonly onCreate: () => void;
  readonly onOpen: (designId: string) => void;
  readonly onCopy: (designId: string) => void;
  readonly onRecommend: (designId: string, recommended: boolean) => void;
  /** An act is out: every act is inert until it answers. */
  readonly busy: boolean;
  /** The act that came back undone, with the sentence saying why. */
  readonly failure: TranslatedText | null;
  /** *Create design* itself is out — never a copy or a recommend: the dock says so where it is pressed. */
  readonly creating: boolean;
  /** *Create design* itself came back undone, with the sentence saying why. */
  readonly createFailure: TranslatedText | null;
}

/**
 * The lead's six sections as tabs (`M02-32`): Timeline, Site, Designs, Proposals, Tasks and Files,
 * each with its count where it has one. The timeline is the caller's `LeadTimeline`; the site is
 * its address — confirmed by a booked visit — and its supply, else its named gap; designs are the
 * lead's design cards; tasks are
 * the open ones with their due time and overdue mark, each done or reopened in place; files are
 * the lead's papers, each opened with a tap, and a new one added.
 */
export interface LeadSectionsProps {
  readonly section: LeadDetailSection;
  readonly onSection: (section: LeadDetailSection) => void;
  readonly counts: Readonly<Record<LeadDetailSection, number | null>>;
  readonly timeline: ReactNode;
  readonly site: LeadSitePanelFacts;
  readonly visit: LeadSiteVisit | null;
  readonly tasks: readonly LeadTaskRow[];
  readonly taskActs: LeadTaskActs;
  readonly files: LeadFilesPanel;
  readonly designs: LeadDesignsPanel;
  /** The Proposals section; absent on an api built before proposals, which draws the count alone. */
  readonly proposals?: LeadProposalsPanel;
  readonly words: LeadSectionsWords;
}

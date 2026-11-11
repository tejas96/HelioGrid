import type { TranslatedText } from '@heliogrid/contracts';
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
  /** Designs and proposals arrive with their modules: their count, or their named gap and why. */
  readonly designs: (count: number) => TranslatedText;
  readonly noDesign: TranslatedText;
  readonly designsLine: TranslatedText;
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
}

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

/**
 * The lead's six sections as tabs (`M02-32`): Timeline, Site, Designs, Proposals, Tasks and Files,
 * each with its count where it has one. The timeline is the caller's `LeadTimeline`; the site is
 * the confirmed booking address, else its named gap; designs and proposals say none yet; tasks are
 * the open ones with their due time and overdue mark, each done or reopened in place; files are
 * the lead's papers, each opened with a tap, and a new one added.
 */
export interface LeadSectionsProps {
  readonly section: LeadDetailSection;
  readonly onSection: (section: LeadDetailSection) => void;
  readonly counts: Readonly<Record<LeadDetailSection, number | null>>;
  readonly timeline: ReactNode;
  /** The confirmed address — a fact; null draws the gap. */
  readonly siteAddress: string | null;
  readonly visit: LeadSiteVisit | null;
  readonly tasks: readonly LeadTaskRow[];
  readonly taskActs: LeadTaskActs;
  readonly files: LeadFilesPanel;
  readonly words: LeadSectionsWords;
}

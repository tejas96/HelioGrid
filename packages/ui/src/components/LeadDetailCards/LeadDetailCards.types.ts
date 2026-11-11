import type { LeadDetail, LeadFile, TranslatedText } from '@heliogrid/contracts';
import type { LeadDetailSection, LeadDetailView, Read } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { LeadContactRowWords } from '../LeadContactsCard/LeadContactsCard.logic';
import type {
  LeadContactsCardProps,
  LeadContactsCardWords,
} from '../LeadContactsCard/LeadContactsCard.types';
import type { LeadTaskRowWords } from '../LeadSections/LeadSections.logic';
import type { LeadSectionsWords } from '../LeadSections/LeadSections.types';

/** The sheets these cards open; the screen's `acts.open` takes them among its others. */
export type LeadDetailCardsSheet =
  | { readonly kind: 'contact'; readonly contactId: string | null }
  | { readonly kind: 'visit' | 'callBack' }
  | { readonly kind: 'message'; readonly template: 'visit_confirmation' };

/**
 * What the cards read and press on the lead's screen; `useLeadDetailScreen` satisfies it.
 * `Failure` is an act that came back undone, as the screen hands it and `words.failure` says it.
 */
export interface LeadDetailCardsScreen<Failure> {
  readonly section: LeadDetailSection;
  setSection(section: LeadDetailSection): void;
  readonly acts: { open(sheet: LeadDetailCardsSheet): void };
  readonly contacts: {
    /** The row whose primary is being named; `undefined` when none is. */
    readonly primaryPending: string | null | undefined;
    setPrimary(contactId: string | null): void;
    readonly doNotCall: boolean;
    /** Flips from the value last asked for, never from what a switch hands back. */
    toggleDoNotCall(): void;
    readonly language: string | null;
    setLanguage(language: string | null): void;
    readonly callingPending: boolean;
    /** A calling fact or a primary that came back undone. */
    readonly cardFailure: Failure | null;
  };
  readonly tasks: {
    done(taskId: string): void;
    reopen(taskId: string): void;
    /** The task whose act is out. */
    readonly pendingId: string | null;
    readonly failure: { readonly taskId: string; readonly failure: Failure } | null;
  };
  readonly files: {
    readonly read: Read<readonly LeadFile[]>;
    /** The reader may add a file to the lead. */
    readonly canAdd: boolean;
    readonly uploading: boolean;
    readonly uploadFailed: boolean;
    /** The last pick's own name. */
    readonly picked: string | null;
    retryUpload(): void;
  };
}

/** A day and a time, already formatted on the tenant's clock: facts a line puts in its places. */
export interface LeadDayAndTime {
  readonly day: string;
  readonly time: string;
}

/** The booked visit's facts, formatted, as its line names them. */
export interface LeadVisitLineFacts extends LeadDayAndTime {
  /** The surveyor's name as the company typed it. */
  readonly surveyor: string;
}

/** A file's line facts: who added it, and the day, formatted on the tenant's clock. */
export interface LeadFileLineFacts {
  readonly name: string;
  readonly day: string;
}

/** Every word the cards say, built in `@heliogrid/i18n` (`leadDetailCardsWords`). */
export interface LeadDetailCardsWords<Failure> {
  readonly contacts: LeadContactsCardWords;
  readonly sections: LeadSectionsWords;
  /** The interface languages, each by its own name. */
  readonly languages: LeadContactsCardProps['language']['options'];
  readonly role: LeadContactRowWords['role'];
  readonly taskTitle: LeadTaskRowWords['title'];
  /** "Due Fri 14 Nov, 11:30" — the day and time formatted on the tenant's clock. */
  readonly taskDue: (when: LeadDayAndTime) => TranslatedText;
  /** "Fri 14 Nov, 10:00 · Rajesh Jadhav" — the booked visit. */
  readonly visitLine: (visit: LeadVisitLineFacts) => TranslatedText;
  /** "Added by Asha Patil · 10 Nov" — a file on the lead. */
  readonly fileLine: (file: LeadFileLineFacts) => TranslatedText;
  /** Why an act came back undone, said where the person acted. */
  readonly failure: (failure: Failure) => TranslatedText;
}

/**
 * **Who to reach and what has happened** on Lead Detail (`SCR-M02-04`, `M02-32`, `M02-34`,
 * `M02-37`), both platforms: the contacts with the calling facts, and the six sections — the
 * timeline, the site, designs, proposals, tasks and files. What they read and press is
 * `useLeadDetailScreen`'s; the screen supplies its timeline, its dialler and its file chooser.
 */
export interface LeadDetailCardsProps<Failure> {
  readonly screen: LeadDetailCardsScreen<Failure>;
  readonly view: LeadDetailView;
  /** The booked visit as the lead was read; null until one is booked. */
  readonly visit: LeadDetail['visit'];
  /** The Timeline section: the lead's `LeadTimeline`, read by the screen's hook. */
  readonly timeline: ReactNode;
  readonly onDial: (phoneE164: string) => void;
  /** The device's own chooser for a file to add — or the pick that came back undone, sent again. */
  readonly onAddFile: () => void;
  /** A file of the lead, opened where the device opens one. */
  readonly onOpenFile: (fileId: string) => void;
  /**
   * Which card leads: the contacts above the sections in one column, or the sections first where
   * they head the desktop's second column.
   */
  readonly first: 'contacts' | 'sections';
  readonly words: LeadDetailCardsWords<Failure>;
}

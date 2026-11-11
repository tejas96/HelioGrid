import type { ProjectFile, ProjectJob, ProjectStep, TranslatedText } from '@heliogrid/contracts';
import type { ProjectFileSlot, Read } from '@heliogrid/domain';

/**
 * The installer's job words — `@heliogrid/i18n`'s `installerJobWords`, by shape. Nothing here is
 * commercial, and nothing may become so (`M08-43`).
 */
export interface InstallerJobWords {
  readonly title: TranslatedText;
  /** Under the title: whose job it is, and whose crew — the job alone while no crew is known. */
  readonly summary: (job: string, crew: string | null) => TranslatedText;
  readonly none: TranslatedText;
  readonly noneLine: TranslatedText;
  readonly gettingIn: TranslatedText;
  /** The job has no access note yet. */
  readonly noAccessNote: TranslatedText;
  readonly directions: TranslatedText;
  readonly callSite: TranslatedText;
  /** The call, by the customer's first name where the job names them. */
  readonly call: (name: string | null) => TranslatedText;
  readonly crew: TranslatedText;
  readonly steps: TranslatedText;
  /** "3 of 6 · a photo each" — ticked steps of all. */
  readonly stepsCount: (ticked: number, total: number) => TranslatedText;
  /** "3 of 6" — ticked steps of all, and steps with a photo of all. */
  readonly count: (done: number, total: number) => TranslatedText;
  readonly photoAndTick: TranslatedText;
  /** A step's own photo act. */
  readonly photo: TranslatedText;
  /** Who ticked a step and when — "Ravi · 10:12". */
  readonly tickedBy: (name: string, time: string) => TranslatedText;
  /** Who did the work, where someone else did — "Done by Suresh". */
  readonly doneByWho: (name: string) => TranslatedText;
  /** A photo that did not reach the project, as its act — the toast's *Not sent · Retry*. */
  readonly notSent: TranslatedText;
  /** A step's photo that did not reach the project, said on its row. */
  readonly photoNotSent: TranslatedText;
  /** The row's own act that sends it again. */
  readonly retryPhoto: TranslatedText;
  /** Each row act as a screen reader hears it — the act, then its step's name. */
  readonly photoAndTickStep: (step: TranslatedText) => TranslatedText;
  readonly photoStep: (step: TranslatedText) => TranslatedText;
  readonly retryPhotoStep: (step: TranslatedText) => TranslatedText;
  /** The photos the job expects — one per step (`M08-45`). */
  readonly photosTitle: TranslatedText;
  readonly photosNeed: TranslatedText;
  readonly doneBy: TranslatedText;
  readonly otherJobs: TranslatedText;
  readonly step: (step: string) => TranslatedText;
  readonly stage: (stage: string) => TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/** A job's step: its tick, and its photos once the project's read has landed — `null` before. */
export type InstallerStep = ProjectJob['steps'][number] & {
  readonly files: ProjectStep['files'] | null;
};

/** What the job's project read adds once it lands: each step's photos, and who is on the crew. */
export interface InstallerJobSite {
  /** The project read — the job's own id; a read of another job is not this one's. */
  readonly id: string;
  readonly steps: readonly ProjectStep[];
  readonly crew: readonly { readonly userId: string; readonly name: string }[];
}

/** Where a photo goes on the project — `useProjectScreen`'s place, by shape. */
export interface InstallerPhotoPlace {
  readonly slot: ProjectFileSlot;
  readonly slotKey: string | null;
}

/**
 * The installer's job home (`SCR-M08-05`, `M08-45`): today's assigned job under its title — the
 * customer's name or the site as the job gives it, and the crew — the one hero, how to get in and
 * the way there; its steps with progress ("3 of 6", never a % bar), each a tile that says done, a
 * photo not sent, or to do, with who ticked it and when, and the next step's *Photo and tick*;
 * the photos the job still expects; the other assigned jobs to switch to. Nothing else — and never a price, discount, tranche, margin or
 * customer value, whoever is looking (`M08-43`). Built for one hand in the sun: every act is a
 * 44 px target and every state is a glyph and a word.
 */
export interface InstallerJobProps {
  /** The installer's assigned live jobs; empty when none is dispatched to them. */
  readonly read: Read<readonly ProjectJob[]>;
  /** The job on screen: the one chosen, else the first. */
  readonly jobId: string | null;
  readonly onChoose: (jobId: string) => void;
  /** The chosen job's project once read — the detail, by shape; null while it is out. */
  readonly site: InstallerJobSite | null;
  readonly words: InstallerJobWords;
  /** Opens the way to the job's place; drawn only where the job names one. */
  readonly onDirections: (job: ProjectJob) => void;
  readonly onCall: (job: ProjectJob) => void;
  /** Ticks a step, with who did the work where it was someone else. */
  readonly onTick: (step: string, doneBy: string | null) => void;
  readonly onUntick: (step: string) => void;
  /** Takes or chooses a photo for a step — the screen picks it and puts it on the project. */
  readonly onPhoto: (step: string) => void;
  /**
   * *Photo and tick*: takes the step's photo, and ticks the step once the photo is on the project
   * — with who did the work where it was someone else. Absent, the step's act is its photo alone
   * and its tile ticks it.
   */
  readonly onPhotoAndTick?: (step: string, doneBy: string | null) => void;
  /** Sends again the photo that did not reach the project. */
  readonly onRetryPhoto: (step: string) => void;
  /** Opens a step's photo — the evidence the manager and the crew look back at (`M08-45`). */
  readonly onOpenFile: (file: ProjectFile) => void;
  /** A tick is out: every tick waits for its answer. */
  readonly sending: boolean;
  /** The place whose photo is uploading, and the one whose upload came back undone. */
  readonly uploading: InstallerPhotoPlace | null;
  readonly uploadFailed: InstallerPhotoPlace | null;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

/** The steps and the photos the job expects, for the job on screen. */
export interface InstallerStepsProps extends InstallerJobProps {
  readonly steps: readonly InstallerStep[];
}

/** The photos the job expects — one per step — each a glyph and its step's word. */
export interface InstallerPhotosProps {
  readonly words: InstallerJobWords;
  readonly steps: readonly InstallerStep[];
  /** The project's read has landed, so each step's photos are known; until then the block waits. */
  readonly known: boolean;
}

/** The installer's other assigned jobs, each a row that puts it on screen. */
export interface InstallerOtherJobsProps {
  readonly words: InstallerJobWords;
  readonly others: readonly ProjectJob[];
  readonly onChoose: (jobId: string) => void;
}

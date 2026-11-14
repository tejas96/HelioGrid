import type { TranslatedText } from '@heliogrid/contracts';
import type {
  CoverPictureKey,
  DefaultsPart,
  ProposalPage,
  ProposalVersionSnapshot,
  Read,
  TimelinePhase,
} from '@heliogrid/domain';
import type { ReactNode, Ref } from 'react';
import type { FocusAfter, FocusHandle } from '../../primitives/FocusAfter';
import type { ProposalBuilderWords } from '../ProposalBuilder/ProposalBuilder.types';
import type { ProposalPageFacts, ProposalPagesWords } from '../ProposalPages/ProposalPages.types';
import type { PhaseSheetWords } from '../ProposalPartSheets/ProposalPartSheets.types';
import type {
  BankStepView,
  PaymentStepView,
  StepFact,
  TermsStepView,
  TimelineStepView,
  TrackRecordStepView,
} from '../ProposalSteps/ProposalSteps.types';
import type {
  PaymentStepWords,
  ProposalStepWords,
} from '../ProposalSteps/ProposalSteps.words.types';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/**
 * Proposal defaults (`SCR-M01-19`, `T-M01-030`): what every new proposal starts with, set on the
 * parts the builder is made of. Seven parts in one rail on the builder's own frame; the stage shows
 * the page that part feeds, drawn by the document's renderer over a sample customer; and each
 * part's editor is the builder step's own — never a second one. Both halves draw this one contract
 * (Law 7). The apps own the breadcrumb, the phase editor's surface, the plan editor, the two
 * confirms, the image chooser and the leave guard.
 */

/** Which part is in view (*Look · Track record · Pages · Timeline · Payment · Terms · Bank*). */
export type DefaultsPartName = DefaultsPart;

/** One part's two names: the short word on the rail and the title in words. */
export interface DefaultsPartWords {
  readonly title: TranslatedText;
  readonly heading: TranslatedText;
}

/** Every word the page draws itself; `@heliogrid/i18n`'s `proposalDefaultsWords` writes them. */
export interface ProposalDefaultsWords extends OverlayCloseWords {
  /** The frame's own words, said for a settings page: *Done* where the builder says *Generate*. */
  readonly frame: ProposalBuilderWords;
  /** The page's name — *Proposal defaults*. */
  readonly title: TranslatedText;
  /** What a change never reaches — *Proposals already sent keep what they were sent with.* */
  readonly note: TranslatedText;
  /** *The page your customer gets · sample customer*. */
  readonly stage: TranslatedText;
  /** The phone's peek and its preview sheet — *The page your customer gets*. */
  readonly peek: TranslatedText;
  readonly parts: Readonly<Record<DefaultsPartName, DefaultsPartWords>>;
  readonly pageName: Readonly<Record<ProposalPage, TranslatedText>>;
  /** One line of what a page holds — *The picture, the customer and three key figures*. */
  readonly pageWhat: Readonly<Record<ProposalPage, TranslatedText>>;
  /** *3 · About us* under a page on the wall. */
  pageAt(at: number, name: TranslatedText): TranslatedText;
  /** *Off · About us*. */
  pageOff(name: TranslatedText): TranslatedText;
  /** *8 of 9 pages print*. */
  pagesPrint(printing: number, of: number): TranslatedText;
  /** A page's switch, spoken — *Print About us*. */
  printPage(name: TranslatedText): TranslatedText;
  /** A page with no switch — *Always*. */
  readonly always: TranslatedText;
  readonly pagesHint: TranslatedText;
  readonly coverPicture: TranslatedText;
  /** *Fills the first page*. */
  readonly coverPictureTag: TranslatedText;
  readonly ownPhoto: TranslatedText;
  readonly ownPhotoLine: TranslatedText;
  readonly lookHint: TranslatedText;
  readonly loading: TranslatedText;
  readonly unread: TranslatedText;
  readonly unreadLine: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly save: TranslatedText;
  readonly discard: TranslatedText;
  readonly consequence: TranslatedText;
  readonly saveFailed: TranslatedText;
  readonly saveFailedBody: TranslatedText;
}

/** One of the platform's cover pictures as *Look* offers it. */
export interface DefaultsCoverChoice {
  readonly key: CoverPictureKey;
  readonly name: TranslatedText;
  /** One line of what the picture shows — *A terrace system on a city home*. */
  readonly line: TranslatedText;
}

/** *Look*: the picture every new proposal's cover starts with, and where the brand comes from. */
export interface DefaultsLookView {
  readonly covers: readonly DefaultsCoverChoice[];
  /** The picture in force: one of the platform's, or the company's own photo. */
  readonly chosen: CoverPictureKey | 'own';
  onCover(key: CoverPictureKey): void;
  /** The company's own photo: its address once one is held, and the device's chooser. */
  readonly own: {
    readonly src?: string;
    /** The photo is being stored. */
    readonly storing: boolean;
    /** The photo was refused or did not store; said under the tile. */
    readonly error?: TranslatedText;
    /** Opens the platform's own image chooser; pressed again, it replaces the photo. */
    onChoose(): void;
    /** Makes the held photo the cover again; absent while none is held. */
    onUse?(): void;
  };
  /** The brand colour and logo, read-only: they are Branding's (`T-M01-030`). */
  readonly brand: StepFact & {
    onOpen(): void;
    /** The company's mark in its own colour, once the page is read: the row's swatch. */
    readonly mark?: BrandMark;
  };
}

/** The company as its mark draws it: the name it is drawn from, its colour and its logo. */
export interface BrandMark {
  readonly name: string;
  /** `#RRGGBB`; `null` draws the neutral mark — no colour is saved. */
  readonly colour: string | null;
  readonly logo?: string;
}

/** One page's row in *Pages*. */
export interface DefaultsPageRow {
  readonly page: ProposalPage;
  /** The page prints; a page with no switch always does. */
  readonly on: boolean;
  /** The cover, the price page and the terms carry no switch (`T-M06-017`). */
  readonly always: boolean;
}

export interface DefaultsPagesView {
  readonly rows: readonly DefaultsPageRow[];
  /** Flips the page from what the draft holds (`packages/data`'s toggle trap). */
  onToggle(page: ProposalPage): void;
}

/**
 * *Payment*: the company's named plans as chips, the one every new proposal starts with marked, and
 * that plan as the customer reads it. A plan's parts are changed in the editor Payment terms
 * already uses (`SCR-M01-20`), which checks that they add up — never typed here a second way.
 */
/**
 * *Payment* (`T-M01-030`, `d-defaults-payment`): step 7's own part — the plans as chips, each part
 * of the default plan a row with − and +, *Add a part* and *Reset* — over the company's default
 * plan, held on the page and sent by its one *Save*. *New plan* opens the Payment terms editor.
 */
export interface DefaultsPaymentView
  extends Omit<PaymentStepView, 'step' | 'split' | 'onOpen' | 'words'> {
  readonly words: PaymentStepWords & {
    /** The plan's save did not land: said in the part, the parts kept. */
    readonly planFailed: { readonly title: TranslatedText; readonly line: TranslatedText };
  };
  /** A plan is being made the default: the chips wait. */
  readonly changing: boolean;
  readonly failed: boolean;
}

/** The document the stage, the peek, the wall and the thumbnails draw: the company's defaults over a sample deal. */
export interface DefaultsSample {
  readonly snapshot: ProposalVersionSnapshot;
  readonly facts: ProposalPageFacts;
  readonly words: ProposalPagesWords;
}

/** The act bar while a change is held; absent at rest. */
export interface DefaultsAct {
  readonly saving: boolean;
  onSave(): void;
  onDiscard(): void;
}

export interface ProposalTemplateSettingsProps {
  /** The desktop form: the caller reads its own room and says which. */
  readonly wide: boolean;
  readonly words: ProposalDefaultsWords;
  /** The builder steps' shared words (`proposalStepWords`). */
  readonly shared: ProposalStepWords;
  /** The page's reads. Until ready the editor draws its loading bars; failed, its retry. */
  readonly read: Read<unknown>;
  readonly part: DefaultsPartName;
  onPart(part: DefaultsPartName): void;
  /** The page's breadcrumb — a `PageTrail` (*Settings › Proposal defaults*). */
  readonly trail: ReactNode;
  /** *Saved and in force · …*, or *Not saved yet* while a change is held. */
  readonly standing: TranslatedText;
  /** The sample document; `null` until the page is read. */
  readonly sample: DefaultsSample | null;
  readonly look: DefaultsLookView;
  readonly record: Omit<TrackRecordStepView, 'step'>;
  readonly pages: DefaultsPagesView;
  readonly timeline: Omit<TimelineStepView, 'step'>;
  readonly payment: DefaultsPaymentView;
  readonly terms: Omit<TermsStepView, 'step'>;
  readonly bank: Omit<BankStepView, 'step'>;
  /** The save did not land: the danger banner above the act bar. */
  readonly saveFailed: boolean;
  /** What stops a save as the draft stands — the terms always print, so they hold a line. */
  readonly refusal?: TranslatedText;
  /** Any change is held: *Save* and *Discard* stand in the editor until it is saved or dropped. */
  readonly act?: DefaultsAct;
  /** *Done* and the breadcrumb's way back: leaves for Settings. */
  onDone(): void;
  /** The phone's eye and its peek: the page, or the wall, in a sheet the screen holds open. */
  readonly previewOpen: boolean;
  onPreview(open: boolean): void;
  /** The device's safe areas, dp; the phone app passes its own (`ProposalBuilder`). */
  readonly safe?: { readonly top: number; readonly bottom: number };
  readonly titleRef?: Ref<FocusHandle>;
  /** Where focus lands once *Try again* has gone: the part's title, which stays while it reloads. */
  readonly focusAfter: FocusAfter;
}

/** *Delete {phase}?* (m19-n7): closable and dismissible — keeping the phase is the safe answer. */
export interface TemplatePhaseDeleteProps {
  /** The phase asked about; `null` keeps the confirm closed. */
  readonly phase: string | null;
  readonly closeLabel: TranslatedText;
  readonly words: {
    deleteTitle(phase: string): TranslatedText;
    readonly deleteBody: TranslatedText;
    readonly deleteConfirm: TranslatedText;
    readonly keep: TranslatedText;
  };
  onDelete(): void;
  onKeep(): void;
}

/**
 * What Proposal defaults opens over itself (`SCR-M01-19` m19-g, m19-n7, m19-n10, `T-M01-030`): the
 * builder's own phase sheet — never a second editor — with no length asked, since a template's
 * step has none; the delete ask; and the ask before leaving a held change. Every act lands in the
 * page's draft only.
 */
export interface ProposalTemplateOverlaysProps {
  readonly overlays: {
    /** The phase the sheet holds: one of the list's by its key, a new one, or none open. */
    readonly phaseOpen:
      | { readonly key: number; readonly phase: TimelinePhase }
      | { readonly key: null }
      | null;
    // biome-ignore lint/plugin/copy-prop-type: a fact — the phase's name as the company wrote it
    readonly deleteAsked: { readonly title: string } | null;
    savePhase(key: number | null, phase: TimelinePhase): void;
    closePhase(): void;
    confirmDelete(): void;
    closeDelete(): void;
  };
  /** The builder's phase sheet's words, its title counting the phase open. */
  readonly phaseWords: PhaseSheetWords;
  readonly words: TemplatePhaseDeleteProps['words'] & {
    readonly leaveTitle: TranslatedText;
    readonly leaveConfirm: TranslatedText;
    readonly keepEditing: TranslatedText;
  };
  /** What leaving drops, said for the defaults. */
  readonly leaveBody: TranslatedText;
  readonly closeLabel: TranslatedText;
  readonly leave: { readonly asking: boolean; stay(): void; leave(): void };
}

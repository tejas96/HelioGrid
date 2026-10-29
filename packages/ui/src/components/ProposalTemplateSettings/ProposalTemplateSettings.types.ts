import type { CoverCount, Read, TemplatePart } from '@heliogrid/domain';
import type { BrandingDocumentFacts } from '../BrandingSettings/BrandingSettings.types';
import type {
  LanguageContentState,
  LanguageSwitcherWords,
} from '../LanguageSwitcher/LanguageSwitcher.types';
import type { RichTextValue, RichTextWords } from '../RichText/RichText.types';

/**
 * The Proposal template page body (`SCR-M01-19`): the document the customer opens, one part being
 * edited, and the two rows to the single write-points it names. Both halves draw this one contract
 * (Law 7). The apps own the shell, the act bar's place on the phone, the phase editor's surface,
 * the full-size reader, the two confirms and the leave guard.
 */

/** Which part's fields the editor shows (*Cover · Sections · Terms · Timeline*). */
export type TemplatePartName = TemplatePart;

/** The three counts the cover prints; only the kW figure carries a tier (`F8-01`). */
export type TemplateCoverCount = CoverCount;

/** Whose a part is: HelioGrid's draws its `ValueSource` line and *Write our own*. */
export type TemplateOrigin = 'platform' | 'own';

/** Every word the page draws; `@heliogrid/i18n`'s `proposalTemplateWords` writes them. */
export interface ProposalTemplateSettingsWords {
  readonly intro: string;
  readonly stage: string;
  readonly stageCaption: string;
  readonly openFullSize: string;
  readonly editor: string;
  readonly edit: string;
  readonly cover: string;
  readonly sections: string;
  readonly terms: string;
  readonly timeline: string;
  readonly language: string;
  readonly languageNoun: string;
  /** What the strip counts in a language — the parts of the template it holds. */
  readonly partsNoun: string;
  readonly document: string;
  readonly documentName: string;
  /** The document's ruled name (`F3-11`), stated as content, never a greyed field. */
  readonly proposal: string;
  readonly about: string;
  readonly declaredByYou: string;
  readonly alwaysPrints: string;
  readonly projectPhases: string;
  readonly phasesNoun: string;
  readonly addPhase: string;
  readonly phaseCap: string;
  readonly brandingRow: string;
  readonly brandingFrom: string;
  readonly bankRow: string;
  readonly pageEnd: string;
  readonly teachTitle: string;
  readonly teachBody: string;
  readonly writeOwn: string;
  readonly loadingPreview: string;
  readonly loading: string;
  readonly notSaved: string;
  readonly consequence: string;
  readonly save: string;
  readonly discard: string;
  readonly saveFailed: string;
  readonly saveFailedBody: string;
  readonly sectionsTitle: string;
  readonly termsTitle: string;
  readonly sampleCustomer: string;
  readonly sampleCustomerPlace: string;
  readonly counts: Readonly<Record<TemplateCoverCount, string>>;
  readonly platform: Readonly<
    Record<
      TemplatePartName,
      { readonly layer: string; readonly source: string; readonly field: string }
    >
  >;
  sectionsPrint(printing: number, of: number): string;
  /** *Terms in English* — the language named as the strip names it. */
  termsIn(language: string): string;
  /** *≈ 3 pages*, under the terms editor; nothing at zero. */
  pages(count: number): string;
  editPhase(phase: string): string;
  /** The cover logo's spoken name — *{company} logo*. */
  logoAlt(company: string): string;
  readonly richText: RichTextWords;
  readonly languageSwitcher: LanguageSwitcherWords;
}

/** A language in a part's strip (`LanguageSwitcher`, `labelHidden`): named in itself, written or not. */
export interface TemplateLanguage {
  readonly code: string;
  readonly label: string;
  readonly state: LanguageContentState;
}

/** The strip a part draws once it is the tenant's own; a HelioGrid's part draws none. */
export interface TemplateLanguageStrip {
  readonly languages: readonly TemplateLanguage[];
  readonly value: string;
  onChange(code: string): void;
}

export interface TemplateCoverPart {
  readonly origin: TemplateOrigin;
  readonly strip: TemplateLanguageStrip;
  /** The *About* text in the strip's language. */
  readonly about: string;
  readonly aboutError?: string;
  onAbout(text: string): void;
  readonly counts: Readonly<Record<TemplateCoverCount, number | null>>;
  onCount(count: TemplateCoverCount, value: number | null): void;
}

/** One section row in the document's order; the floor row draws a lock and *Always prints*, no switch. */
export interface TemplateSectionRow {
  readonly key: string;
  readonly title: string;
  readonly about: string;
  readonly on: boolean;
  readonly floor: boolean;
}

export interface TemplateSectionsPart {
  readonly origin: TemplateOrigin;
  readonly rows: readonly TemplateSectionRow[];
  readonly printing: number;
  readonly of: number;
  /** Flips the section from what the draft holds (`packages/data`'s toggle trap). */
  onToggle(key: string): void;
}

export interface TemplateTermsPart {
  readonly origin: TemplateOrigin;
  readonly strip: TemplateLanguageStrip;
  /** The strip's language's name, for *Terms in …*. */
  readonly languageName: string;
  readonly value: RichTextValue;
  readonly error?: string;
  onChange(value: RichTextValue): void;
}

/** A phase row: its name and sentence in the reader's language, and the key it moves by. */
export interface TemplatePhaseRow {
  readonly key: number;
  readonly title: string;
  readonly note: string;
}

export interface TemplateTimelinePart {
  readonly origin: TemplateOrigin;
  readonly phases: readonly TemplatePhaseRow[];
  /** At `TIMELINE_PHASE_LIMIT`: *Add a phase* gives way to the cap's line. */
  readonly atCap: boolean;
  onMove(from: number, to: number): void;
  /** Asks first — the app's delete confirm; the delete lands only on save. */
  onDelete(key: number): void;
  onEdit(key: number): void;
  onAdd(): void;
}

/** The act bar while a change is held; `null` at rest. */
export interface TemplateAct {
  readonly saving: boolean;
  onSave(): void;
  onDiscard(): void;
}

/** What the stage's document prints beyond the cover facts: the section list and the terms. */
export interface TemplateDocument {
  readonly facts: BrandingDocumentFacts;
  readonly colour: string | null;
  readonly sections: readonly { readonly label: string; readonly included: boolean }[];
  readonly terms: RichTextValue;
  /** The sample's number and date, as the app formats them; the customer is the words' sample. */
  readonly docNumber: string;
  readonly docDate: string;
}

export interface ProposalTemplateSettingsProps {
  readonly words: ProposalTemplateSettingsWords;
  /**
   * The page's reads. Until ready, the stage's loading form and the editor's bars (m19-n1); a read
   * with no answer is the screen's own page, never drawn here.
   */
  readonly read: Read<unknown>;
  /** The page's title; a phone whose bar holds the title passes none. */
  readonly title?: string;
  /** *Saved and in force · …*; absent while loading and while never saved. */
  readonly standing?: string;
  readonly part: TemplatePartName;
  onPart(part: TemplatePartName): void;
  readonly document: TemplateDocument;
  /** The stage reads *Not saved yet*: the proposal-template record differs from what is saved. */
  readonly unsaved: boolean;
  /**
   * Any change is held, the timeline's included: the page end gives way to the act bar, which a
   * phone draws in the shell's foot rather than through `act`.
   */
  readonly held: boolean;
  /** Every part is HelioGrid's: the teaching banner between the stage and the editor (m19-n2). */
  readonly teaching: boolean;
  onWriteOwn(part: TemplatePartName): void;
  readonly cover: TemplateCoverPart;
  readonly sections: TemplateSectionsPart;
  readonly terms: TemplateTermsPart;
  readonly timeline: TemplateTimelinePart;
  /** *{bank} · from Business profile*, or its *not added yet* line. */
  readonly bankLine: string;
  onOpenBranding(): void;
  onOpenProfile(): void;
  onOpenFullSize(): void;
  /** The save did not land: the danger banner above the act bar (m19-n4). */
  readonly saveFailed: boolean;
  /**
   * The act bar while a change is held. At width it is the editor card's foot; below it, the
   * page's sticky foot. A phone whose shell holds the bar in the nav's place passes none and draws
   * `FormActionBar` (and the failure banner over it) there itself.
   */
  readonly act?: TemplateAct;
}

/** The phase editor's body (m19-g, m19-l): the strip, *Phase name*, *What happens in this phase*. */
export interface TemplatePhaseFieldsProps {
  readonly words: {
    readonly language: string;
    readonly languageNoun: string;
    readonly partsNoun: string;
    readonly phaseName: string;
    readonly phaseWhat: string;
    readonly languageSwitcher: LanguageSwitcherWords;
  };
  readonly strip: TemplateLanguageStrip;
  readonly name: string;
  readonly what: string;
  readonly nameError?: string;
  readonly whatError?: string;
  onName(text: string): void;
  onWhat(text: string): void;
}

/**
 * The phase editor (m19-g, m19-l): a sheet over the list on the phone and below the panel width, a
 * non-modal side panel at width. Its body is `TemplatePhaseFields`; the flow is `usePhaseEditor`'s.
 */
export interface TemplatePhaseEditorProps {
  readonly open: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly closeLabel: string;
  readonly words: TemplatePhaseFieldsProps['words'] & {
    readonly cancel: string;
    /** *Save phase*, or *Add phase* for a new one. */
    readonly act: string;
  };
  readonly fields: Omit<TemplatePhaseFieldsProps, 'words'>;
  onClose(): void;
  onSave(): void;
}

/** *Delete {phase}?* (m19-n7): closable and dismissible — keeping the phase is the safe answer. */
export interface TemplatePhaseDeleteProps {
  /** The phase asked about; `null` keeps the confirm closed. */
  readonly phase: string | null;
  readonly closeLabel: string;
  readonly words: {
    deleteTitle(phase: string): string;
    readonly deleteBody: string;
    readonly deleteConfirm: string;
    readonly keep: string;
  };
  onDelete(): void;
  onKeep(): void;
}

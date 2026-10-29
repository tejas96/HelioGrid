import type { TranslatedText } from '@heliogrid/contracts';
import type { CoverCount, Read, TemplatePart } from '@heliogrid/domain';
import type { BrandingDocumentFacts } from '../BrandingSettings/BrandingSettings.types';
import type {
  LanguageContentState,
  LanguageSwitcherWords,
} from '../LanguageSwitcher/LanguageSwitcher.types';
import type { NumberFieldWords } from '../NumberField/NumberField.types';
import type { ReorderListWords } from '../ReorderList/ReorderList.types';
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
  readonly intro: TranslatedText;
  readonly stage: TranslatedText;
  readonly stageCaption: TranslatedText;
  readonly openFullSize: TranslatedText;
  readonly editor: TranslatedText;
  readonly edit: TranslatedText;
  readonly cover: TranslatedText;
  readonly sections: TranslatedText;
  readonly terms: TranslatedText;
  readonly timeline: TranslatedText;
  readonly language: TranslatedText;
  readonly languageNoun: TranslatedText;
  /** What the strip counts in a language — the parts of the template it holds. */
  readonly partsNoun: TranslatedText;
  readonly document: TranslatedText;
  readonly documentName: TranslatedText;
  /** The document's ruled name (`F3-11`), stated as content, never a greyed field. */
  readonly proposal: TranslatedText;
  readonly about: TranslatedText;
  readonly declaredByYou: TranslatedText;
  readonly alwaysPrints: TranslatedText;
  readonly projectPhases: TranslatedText;
  readonly phasesNoun: TranslatedText;
  readonly addPhase: TranslatedText;
  readonly phaseCap: TranslatedText;
  readonly brandingRow: TranslatedText;
  readonly brandingFrom: TranslatedText;
  readonly bankRow: TranslatedText;
  readonly pageEnd: TranslatedText;
  readonly teachTitle: TranslatedText;
  readonly teachBody: TranslatedText;
  readonly writeOwn: TranslatedText;
  readonly loadingPreview: TranslatedText;
  readonly loading: TranslatedText;
  readonly notSaved: TranslatedText;
  readonly consequence: TranslatedText;
  readonly save: TranslatedText;
  readonly discard: TranslatedText;
  readonly saveFailed: TranslatedText;
  readonly saveFailedBody: TranslatedText;
  readonly sectionsTitle: TranslatedText;
  readonly termsTitle: TranslatedText;
  readonly sampleCustomer: TranslatedText;
  readonly sampleCustomerPlace: TranslatedText;
  readonly counts: Readonly<Record<TemplateCoverCount, TranslatedText>>;
  readonly platform: Readonly<
    Record<
      TemplatePartName,
      {
        readonly layer: TranslatedText;
        readonly source: TranslatedText;
        readonly field: TranslatedText;
      }
    >
  >;
  sectionsPrint(printing: number, of: number): TranslatedText;
  /** *Terms in English* — the language named as the strip names it. */
  termsIn(language: string): TranslatedText;
  /** *≈ 3 pages*, under the terms editor; nothing at zero. */
  pages(count: number): TranslatedText;
  editPhase(phase: string): TranslatedText;
  /** The cover logo's spoken name — *{company} logo*. */
  logoAlt(company: string): TranslatedText;
  readonly richText: RichTextWords;
  readonly languageSwitcher: LanguageSwitcherWords;
  /** The phases' list says these itself (`reorderListWords`). */
  readonly reorderList: ReorderListWords;
  /** A cover count's field says these itself (`numberFieldWords`). */
  readonly numberField: NumberFieldWords;
}

/** A language in a part's strip (`LanguageSwitcher`, `labelHidden`): named in itself, written or not. */
export interface TemplateLanguage {
  readonly code: string;
  readonly label: TranslatedText;
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
  readonly aboutError?: TranslatedText;
  onAbout(text: string): void;
  readonly counts: Readonly<Record<TemplateCoverCount, number | null>>;
  onCount(count: TemplateCoverCount, value: number | null): void;
}

/** One section row in the document's order; the floor row draws a lock and *Always prints*, no switch. */
export interface TemplateSectionRow {
  readonly key: string;
  readonly title: TranslatedText;
  readonly about: TranslatedText;
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
  readonly error?: TranslatedText;
  onChange(value: RichTextValue): void;
}

/** A phase row: its name and sentence in the reader's language, and the key it moves by. */
export interface TemplatePhaseRow {
  readonly key: number;
  /** The phase's name as the company wrote it. */
  // biome-ignore lint/plugin/copy-prop-type: the phase's name as the company wrote it
  readonly title: string;
  // biome-ignore lint/plugin/copy-prop-type: the phase's note as the company wrote it
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
  readonly sections: readonly { readonly label: TranslatedText; readonly included: boolean }[];
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
  readonly title?: TranslatedText;
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
  readonly bankLine: TranslatedText;
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
    readonly language: TranslatedText;
    readonly languageNoun: TranslatedText;
    readonly partsNoun: TranslatedText;
    readonly phaseName: TranslatedText;
    readonly phaseWhat: TranslatedText;
    readonly languageSwitcher: LanguageSwitcherWords;
  };
  readonly strip: TemplateLanguageStrip;
  readonly name: string;
  readonly what: string;
  readonly nameError?: TranslatedText;
  readonly whatError?: TranslatedText;
  onName(text: string): void;
  onWhat(text: string): void;
}

/**
 * The phase editor (m19-g, m19-l): a sheet over the list on the phone and below the panel width, a
 * non-modal side panel at width. Its body is `TemplatePhaseFields`; the flow is `usePhaseEditor`'s.
 */
export interface TemplatePhaseEditorProps {
  readonly open: boolean;
  /** *New phase*, or the phase's name as the company wrote it. */
  // biome-ignore lint/plugin/copy-prop-type: New phase, or the phase's name as the company wrote it
  readonly title: string;
  readonly subtitle: TranslatedText;
  readonly closeLabel: TranslatedText;
  readonly words: TemplatePhaseFieldsProps['words'] & {
    readonly cancel: TranslatedText;
    /** *Save phase*, or *Add phase* for a new one. */
    readonly act: TranslatedText;
  };
  readonly fields: Omit<TemplatePhaseFieldsProps, 'words'>;
  onClose(): void;
  onSave(): void;
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

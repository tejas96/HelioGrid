import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { BrandColorFieldWords } from '../BrandColorField/BrandColorField.types';
import type { DocumentLetterhead } from '../DocumentPreview/DocumentPreview.types';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/** Which customer surface the stage shows (`SCR-M01-18`, *Proposal · Link page*). */
export type BrandingPreview = 'proposal' | 'link';

/** Which part's fields the editor shows (*Logo · Colour · Letterhead*). */
export type BrandingPart = 'logo' | 'colour' | 'letterhead';

/** Every word the page draws; `@heliogrid/i18n`'s `brandingWords` and `brandColourFieldWords` write them. */
export interface BrandingSettingsWords {
  readonly preview: TranslatedText;
  readonly proposal: TranslatedText;
  readonly linkPage: TranslatedText;
  readonly edit: TranslatedText;
  readonly logo: TranslatedText;
  readonly colour: TranslatedText;
  readonly letterhead: TranslatedText;
  readonly openFullSize: TranslatedText;
  /** The stage's name at width (*What your customers get*). */
  readonly stage: TranslatedText;
  /** The editor card's name at width (*Edit your branding*). */
  readonly editor: TranslatedText;
  readonly addLogo: TranslatedText;
  readonly limits: TranslatedText;
  readonly replace: TranslatedText;
  readonly remove: TranslatedText;
  readonly logoAlt: TranslatedText;
  /** The logo's image did not load: said in its place, the logo itself still saved. */
  readonly logoUnavailable: TranslatedText;
  readonly profileRow: TranslatedText;
  readonly profileRowFrom: TranslatedText;
  readonly sentKeep: TranslatedText;
  readonly tagline: TranslatedText;
  readonly lines: TranslatedText;
  readonly linesPlaceholder: TranslatedText;
  readonly linesHint: TranslatedText;
  readonly footerNote: TranslatedText;
  readonly loadingCover: TranslatedText;
  readonly loading: TranslatedText;
  readonly notSaved: TranslatedText;
  readonly save: TranslatedText;
  readonly discard: TranslatedText;
  readonly saveFailed: TranslatedText;
  readonly retry: TranslatedText;
  /** The cover's title in ink (*Proposal*): the document prints no word it is not handed. */
  readonly documentTitle: TranslatedText;
  readonly linkPreview: {
    readonly ready: TranslatedText;
    readonly awaiting: TranslatedText;
    readonly accept: TranslatedText;
    readonly ask: TranslatedText;
  };
  readonly colourField: BrandColorFieldWords;
}

/** The tenant's own facts the cover and the link page print — no sample value (`T-M01-029`). */
export interface BrandingDocumentFacts {
  readonly companyName: string;
  /** The stored or chosen logo, drawn on white; absent → the company name alone. */
  readonly logoSrc?: string;
  readonly taxId?: string;
  // biome-ignore lint/plugin/copy-prop-type: the market pack's name for the tax id, not the catalog's
  readonly taxIdLabel?: string;
  readonly address?: string;
  readonly letterhead: DocumentLetterhead;
}

/** The editor's letterhead fields as typed, and each field's refusal (`letterheadRefusalWords`). */
export interface BrandingLetterheadFields {
  readonly tagline: string;
  readonly lines: string;
  // biome-ignore lint/plugin/copy-prop-type: the footer note as the company types it
  readonly footerNote: string;
  readonly taglineError?: TranslatedText;
  readonly linesError?: TranslatedText;
  readonly footerNoteError?: TranslatedText;
  onTagline(text: string): void;
  onLines(text: string): void;
  onFooterNote(text: string): void;
}

/** The act bar's state while a change is held; `null` at rest. */
export interface BrandingAct {
  readonly saving: boolean;
  onSave(): void;
  onDiscard(): void;
}

export interface BrandingSettingsProps {
  readonly words: BrandingSettingsWords;
  /**
   * The page's reads. Until ready, the stage's loading form and the editor's bars (s18-j); a read
   * with no answer is the screen's own page, never drawn here.
   */
  readonly read: Read<unknown>;
  /** The page's title, drawn above the standing line; a phone whose bar holds the title passes none. */
  readonly title?: TranslatedText;
  /** What is in force and since when (`brandingStandingLine`); absent while loading. */
  readonly standing?: string;
  readonly preview: BrandingPreview;
  onPreview(preview: BrandingPreview): void;
  readonly part: BrandingPart;
  onPart(part: BrandingPart): void;
  readonly document: BrandingDocumentFacts;
  /** The stage reads *Not saved yet*: the previews draw a change not yet saved. */
  readonly unsaved: boolean;
  /** The save did not land: the banner's body in the shared failure words, with *Retry*. */
  readonly saveFailure?: string;
  onRetry(): void;
  /** The logo part: a picture while one is held, and the last refusal's words (s18-p). */
  readonly logoRefusal?: string;
  /** A file chosen or dropped, as the device handed it over. */
  onChooseLogo(picked: PickedFile): void;
  /** A finger's way to choose: the app opens the system's picker (the phone has no drop). */
  onPickLogo?: () => void;
  onRemoveLogo(): void;
  /** The draft's colour, which the field and both previews draw; `null` is the platform's near-black. */
  readonly colour: string | null;
  onColour(hex: string): void;
  readonly letterheadFields: BrandingLetterheadFields;
  onOpenFullSize(): void;
  onOpenProfile(): void;
  /**
   * The act bar while a change is held. At width it is the editor card's foot; below it, the page's
   * sticky foot. A phone whose shell holds the bar in the pill's place passes none and draws
   * `FormActionBar` there itself.
   */
  readonly act?: BrandingAct;
}

/** The customer's link page as it will open (`SCR-M01-18`, *Link page*): the stage's and a full-size view's. */
export interface BrandingLinkPageProps {
  readonly words: Pick<BrandingSettingsWords, 'linkPreview' | 'logoAlt' | 'logoUnavailable'>;
  readonly document: BrandingDocumentFacts;
  readonly colour: string | null;
  /** Fills its window at width (`d18-h`); at 375 it keeps the board's own height. */
  readonly fullHeight?: boolean;
}

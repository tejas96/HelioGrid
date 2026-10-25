import type { BrandColorFieldWords } from '../BrandColorField/BrandColorField.types';
import type { DocumentLetterhead } from '../DocumentPreview/DocumentPreview.types';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/** Which customer surface the stage shows (`SCR-M01-18`, *Proposal · Link page*). */
export type BrandingPreview = 'proposal' | 'link';

/** Which part's fields the editor shows (*Logo · Colour · Letterhead*). */
export type BrandingPart = 'logo' | 'colour' | 'letterhead';

/** Every word the page draws; `@heliogrid/i18n`'s `brandingWords` and `brandColourFieldWords` write them. */
export interface BrandingSettingsWords {
  readonly preview: string;
  readonly proposal: string;
  readonly linkPage: string;
  readonly edit: string;
  readonly logo: string;
  readonly colour: string;
  readonly letterhead: string;
  readonly openFullSize: string;
  /** The stage's name at width (*What your customers get*). */
  readonly stage: string;
  /** The editor card's name at width (*Edit your branding*). */
  readonly editor: string;
  readonly addLogo: string;
  readonly limits: string;
  readonly replace: string;
  readonly remove: string;
  readonly logoAlt: string;
  /** The logo's image did not load: said in its place, the logo itself still saved. */
  readonly logoUnavailable: string;
  readonly profileRow: string;
  readonly profileRowFrom: string;
  readonly sentKeep: string;
  readonly tagline: string;
  readonly lines: string;
  readonly linesPlaceholder: string;
  readonly linesHint: string;
  readonly footerNote: string;
  readonly loadingCover: string;
  readonly loading: string;
  readonly notSaved: string;
  readonly save: string;
  readonly discard: string;
  readonly saveFailed: string;
  readonly retry: string;
  /** The cover's title in ink (*Proposal*): the document prints no word it is not handed. */
  readonly documentTitle: string;
  readonly linkPreview: {
    readonly ready: string;
    readonly awaiting: string;
    readonly accept: string;
    readonly ask: string;
  };
  readonly colourField: BrandColorFieldWords;
}

/** The tenant's own facts the cover and the link page print — no sample value (`T-M01-029`). */
export interface BrandingDocumentFacts {
  readonly companyName: string;
  /** The stored or chosen logo, drawn on white; absent → the company name alone. */
  readonly logoSrc?: string;
  readonly taxId?: string;
  readonly taxIdLabel?: string;
  readonly address?: string;
  readonly letterhead: DocumentLetterhead;
}

/** The editor's letterhead fields as typed, and each field's refusal (`letterheadRefusalWords`). */
export interface BrandingLetterheadFields {
  readonly tagline: string;
  readonly lines: string;
  readonly footerNote: string;
  readonly taglineError?: string;
  readonly linesError?: string;
  readonly footerNoteError?: string;
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
  /** The reads are out: the stage's loading form and the editor's bars (s18-j). */
  readonly loading: boolean;
  /** The page's title, drawn above the standing line; a phone whose bar holds the title passes none. */
  readonly title?: string;
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

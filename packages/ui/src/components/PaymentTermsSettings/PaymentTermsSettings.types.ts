import type { TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { BrandingDocumentFacts } from '../BrandingSettings/BrandingSettings.types';
import type { DocumentTranche } from '../DocumentPreview/DocumentPreview.types';

/**
 * The Payment terms page body (`SCR-M01-20`): the list of templates as cards that show their
 * split, the editor's body and foot, and the stage picker. Both halves draw this one contract
 * (Law 7). The apps own the shell, where the editor stands (a sheet at 375, a card beside the
 * list at 1536), the picker's place, the confirms and the leave ask.
 */

/** Every word the page draws; `@heliogrid/i18n`'s `paymentTermsWords` writes them. */
export interface PaymentTermsSettingsWords {
  readonly yourTerms: TranslatedText;
  readonly archivedTitle: TranslatedText;
  readonly addTerms: TranslatedText;
  readonly defaultMark: TranslatedText;
  readonly platformStandard: TranslatedText;
  readonly closing: TranslatedText;
  readonly archivedCaption: TranslatedText;
  readonly restore: TranslatedText;
  readonly nothingArchived: TranslatedText;
  readonly loading: TranslatedText;
  readonly unreadTitle: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly seededTitle: TranslatedText;
  readonly seededBody: TranslatedText;
  readonly termsName: TranslatedText;
  readonly previewCaption: TranslatedText;
  readonly sampleContract: TranslatedText;
  readonly eachAmount: TranslatedText;
  readonly schedule: TranslatedText;
  readonly noSchedule: TranslatedText;
  readonly name: TranslatedText;
  readonly share: TranslatedText;
  readonly shareRange: TranslatedText;
  readonly trancheNameNeeded: TranslatedText;
  readonly termsNameNeeded: TranslatedText;
  readonly newTerms: TranslatedText;
  readonly notSaved: TranslatedText;
  readonly addTranche: TranslatedText;
  readonly cap: TranslatedText;
  readonly makeDefault: TranslatedText;
  readonly isDefault: TranslatedText;
  readonly archive: TranslatedText;
  readonly allocation: TranslatedText;
  readonly save: TranslatedText;
  readonly cancel: TranslatedText;
  readonly saveFailedTitle: TranslatedText;
  readonly saveFailedBody: TranslatedText;
  readonly skippableMark: TranslatedText;
  readonly skippableRule: TranslatedText;
  readonly canBeSkipped: TranslatedText;
  readonly skipRule: TranslatedText;
  readonly done: TranslatedText;
  readonly pickerTitle: TranslatedText;
  archivedCount(count: number): TranslatedText;
  /** *Add a tranche* names the line it adds by its number. */
  newTranche(number: number): TranslatedText;
  /** A card's spoken name: its name as the company wrote it, *{name}, default* on the default. */
  // biome-ignore lint/plugin/copy-prop-type: the template's name as the company wrote it, or a sentence about it
  cardLabel(name: string, isDefault: boolean): string;
  split(name: string): TranslatedText;
  dueAt(stage: string): TranslatedText;
  nameOf(tranche: string): TranslatedText;
  shareOf(tranche: string): TranslatedText;
  remove(tranche: string): TranslatedText;
  restoreName(name: string): TranslatedText;
  edit(name: string): TranslatedText;
  backTo(name: string): TranslatedText;
  whenDue(tranche: string): TranslatedText;
  /** *{tranche} · {share}%* — the picker's overline and a stage's pill (owner ruling Q1 A). */
  trancheShare(tranche: string, share: string): TranslatedText;
  /** The letterhead logo's spoken name — *{company} logo*. */
  logoAlt(company: string): TranslatedText;
}

/** One part of a card's split: the share and the stage it falls due at. */
export interface PaymentTermsSplitPart {
  /** The tranche's name as the company wrote it. */
  // biome-ignore lint/plugin/copy-prop-type: the tranche's name as the company wrote it
  readonly label: string;
  readonly share: number;
  readonly stage: string;
}

/** A template's card. An archived one draws *Restore* and opens nothing. */
export interface PaymentTermsCardView {
  readonly id: string;
  readonly name: string;
  /** The card's spoken name — its name as written, *{name}, default* on the default. */
  // biome-ignore lint/plugin/copy-prop-type: the template's name as the company wrote it
  readonly label: string;
  readonly isDefault: boolean;
  readonly platformStandard: boolean;
  readonly selected: boolean;
  readonly parts: readonly PaymentTermsSplitPart[];
}

export interface PaymentTermsListProps {
  readonly words: PaymentTermsSettingsWords;
  /** The list's read: its bars until it came; failed, the banner stands in the cards' place, with no head buttons. */
  readonly read: Read<unknown>;
  /** The page's own title (1536); a phone or a 375 page whose bar holds the title passes none. */
  readonly title?: TranslatedText;
  /** *Saved and in force · …* or *Added when your account was created · not changed since*. */
  readonly savedLine?: TranslatedText;
  /** Only the two given splits exist: the teaching banner above the cards. */
  readonly teaching: boolean;
  /** The archived view is shown (the archive button pressed). */
  readonly archived: boolean;
  readonly archivedCount: number;
  readonly cards: readonly PaymentTermsCardView[];
  /** Two columns of cards (1536). */
  readonly columns: 1 | 2;
  /**
   * What stands beside the list under the title — the 1536 editor card (m20-g): the page becomes
   * the board's pair, the list in its first column. A phone passes none; its editor is a sheet.
   */
  readonly aside?: ReactNode;
  onOpen(id: string): void;
  onAdd(): void;
  onToggleArchived(): void;
  onRestore(id: string): void;
}

/** One tranche line of the editor. */
export interface PaymentTermsLineView {
  readonly key: number;
  readonly name: string;
  readonly nameError?: TranslatedText;
  /** The share as a percent, absent while empty. */
  readonly share?: number;
  readonly shareError?: TranslatedText;
  /** The stage's label as the pack says it. */
  readonly stage: string;
  /** The stage is one a project may skip: the binding warns in words. */
  readonly skippable: boolean;
}

/** The schedule the editor's top shows: the saved lines, then the edit once it is whole. */
export interface PaymentTermsPreviewView {
  /** The api's amounts are out; `PreviewFrame` shows its loading. */
  readonly loading: boolean;
  /** The sample contract, formatted in the tenant's money; absent until the api answers. */
  readonly contract?: string;
  readonly tranches: readonly DocumentTranche[];
  /** What the band reads with no schedule yet (a new template before its first whole edit). */
  readonly empty: boolean;
}

/** The letterhead the preview draws — the tenant's branding, as Proposal template draws it. */
export interface PaymentTermsLetterhead {
  readonly facts: BrandingDocumentFacts;
  readonly colour: string | null;
}

export interface PaymentTermsEditorProps {
  readonly words: PaymentTermsSettingsWords;
  readonly letterhead: PaymentTermsLetterhead;
  readonly preview: PaymentTermsPreviewView;
  /** The preview stage's height on this surface: 150 in the sheet, 220 in the 1536 card. */
  readonly previewHeight: number;
  /** The name field, drawn for new terms only (`standing` `new`). */
  readonly name: string;
  readonly nameError?: TranslatedText;
  onName(name: string): void;
  readonly lines: readonly PaymentTermsLineView[];
  readonly canAdd: boolean;
  readonly canRemove: boolean;
  onLineName(key: number, name: string): void;
  onLineShare(key: number, share: number): void;
  onRemove(key: number): void;
  onPickStage(key: number): void;
  onAdd(): void;
  /** `default`: the fact in words and no *Archive*; `new`: neither act; `other`: both acts. */
  readonly standing: 'default' | 'other' | 'new';
  onMakeDefault(): void;
  onArchive(): void;
  /** The act on its way: its button reads busy. */
  readonly acting: 'make-default' | 'archive' | null;
}

export interface PaymentTermsFootProps {
  readonly words: PaymentTermsSettingsWords;
  // biome-ignore lint/plugin/copy-prop-type: the tranche's name as the company wrote it
  readonly parts: readonly { readonly label: string; readonly value: number }[];
  readonly state: 'under' | 'met' | 'over';
  /** The meter's line — `allocationSentence`. */
  readonly sentence: TranslatedText;
  /** Why *Save terms* is refused — `allocationRefusal`; absent when the split is whole. */
  readonly refusal?: string;
  readonly saving: boolean;
  readonly saveFailed: boolean;
  /** The api's own words when the save was refused for another reason (a conflict). */
  readonly saveFailedBody?: string;
  onSave(): void;
  onCancel(): void;
}

/** A stage in the picker. */
export interface PaymentTermsStageView {
  readonly id: string;
  /** The market pack's name for the stage, in the reader's language — a pack's word, not the catalog's. */
  // biome-ignore lint/plugin/copy-prop-type: the market pack's name for the stage
  readonly label: string;
  readonly short: string;
  readonly glyph: ShellGlyphName;
  readonly skippable: boolean;
  /** The tranches due here, worded *{tranche} · {share}%*; `mine` is the one being picked. */
  readonly pills: readonly {
    readonly key: number;
    readonly text: TranslatedText;
    readonly mine: boolean;
  }[];
}

export interface PaymentTermsPickerProps {
  readonly words: PaymentTermsSettingsWords;
  /** The group's name — *When is {tranche} due?*. */
  readonly label: TranslatedText;
  readonly stages: readonly PaymentTermsStageView[];
  readonly value: string;
  onChange(stage: string): void;
}

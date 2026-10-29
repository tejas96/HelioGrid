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
  readonly yourTerms: string;
  readonly archivedTitle: string;
  readonly addTerms: string;
  readonly defaultMark: string;
  readonly platformStandard: string;
  readonly closing: string;
  readonly archivedCaption: string;
  readonly restore: string;
  readonly nothingArchived: string;
  readonly loading: string;
  readonly unreadTitle: string;
  readonly tryAgain: string;
  readonly seededTitle: string;
  readonly seededBody: string;
  readonly termsName: string;
  readonly previewCaption: string;
  readonly sampleContract: string;
  readonly eachAmount: string;
  readonly schedule: string;
  readonly noSchedule: string;
  readonly name: string;
  readonly share: string;
  readonly shareRange: string;
  readonly trancheNameNeeded: string;
  readonly termsNameNeeded: string;
  readonly newTerms: string;
  readonly notSaved: string;
  readonly addTranche: string;
  readonly cap: string;
  readonly makeDefault: string;
  readonly isDefault: string;
  readonly archive: string;
  readonly allocation: string;
  readonly save: string;
  readonly cancel: string;
  readonly saveFailedTitle: string;
  readonly saveFailedBody: string;
  readonly skippableMark: string;
  readonly skippableRule: string;
  readonly canBeSkipped: string;
  readonly skipRule: string;
  readonly done: string;
  readonly pickerTitle: string;
  archivedCount(count: number): string;
  /** *Add a tranche* names the line it adds by its number. */
  newTranche(number: number): string;
  /** A card's spoken name: *{name}, default* on the default. */
  cardLabel(name: string, isDefault: boolean): string;
  split(name: string): string;
  dueAt(stage: string): string;
  nameOf(tranche: string): string;
  shareOf(tranche: string): string;
  remove(tranche: string): string;
  restoreName(name: string): string;
  edit(name: string): string;
  backTo(name: string): string;
  whenDue(tranche: string): string;
  /** *{tranche} · {share}%* — the picker's overline and a stage's pill (owner ruling Q1 A). */
  trancheShare(tranche: string, share: string): string;
  /** The letterhead logo's spoken name — *{company} logo*. */
  logoAlt(company: string): string;
}

/** One part of a card's split: the share and the stage it falls due at. */
export interface PaymentTermsSplitPart {
  readonly label: string;
  readonly share: number;
  readonly stage: string;
}

/** A template's card. An archived one draws *Restore* and opens nothing. */
export interface PaymentTermsCardView {
  readonly id: string;
  readonly name: string;
  /** The card's spoken name — *{name}, default* on the default. */
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
  readonly title?: string;
  /** *Saved and in force · …* or *Added when your account was created · not changed since*. */
  readonly savedLine?: string;
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
  readonly nameError?: string;
  /** The share as a percent, absent while empty. */
  readonly share?: number;
  readonly shareError?: string;
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
  readonly nameError?: string;
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
  readonly parts: readonly { readonly label: string; readonly value: number }[];
  readonly state: 'under' | 'met' | 'over';
  /** The meter's line — `allocationSentence`. */
  readonly sentence: string;
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
  readonly label: string;
  readonly short: string;
  readonly glyph: ShellGlyphName;
  readonly skippable: boolean;
  /** The tranches due here, worded *{tranche} · {share}%*; `mine` is the one being picked. */
  readonly pills: readonly {
    readonly key: number;
    readonly text: string;
    readonly mine: boolean;
  }[];
}

export interface PaymentTermsPickerProps {
  readonly words: PaymentTermsSettingsWords;
  /** The group's name — *When is {tranche} due?*. */
  readonly label: string;
  readonly stages: readonly PaymentTermsStageView[];
  readonly value: string;
  onChange(stage: string): void;
}

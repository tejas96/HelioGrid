import type { TranslatedText } from '@heliogrid/contracts';
import type { ComponentCategory, ComponentLine, ProposalPhase } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { NumberFieldWords } from '../NumberField/NumberField.types';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/**
 * Step 8's sheets and step 6's one sheet (`M06-27`–`M06-29`, `M06-12`, `T-M06-008`, `T-M06-010`):
 * pick the brands of one kind, edit what prints for one brand, add a part that is not listed, and
 * edit one timeline step. Each is a sheet with a way out, so its fields report as typed and the
 * sheet's own act commits them; none of them ever leaves the step.
 */

/** One brand the picker offers: a catalog item, or one of the company's saved parts. */
export interface PartOption {
  /** The item's or the saved part's id; `onToggle` answers it. */
  readonly key: string;
  /** A fact: a brand's name, never translated */
  readonly brand: string;
  /** biome-ignore lint/plugin/copy-prop-type: a fact — the item's own specification and warranty */
  readonly line: string;
  /** The certification mark, as the pack names its scheme — `DCR`; absent where it holds none. */
  readonly mark?: string;
  readonly picked: boolean;
}

export interface PartPickerWords extends OverlayCloseWords {
  /** The kind's name, the sheet's title — `Panels`. */
  readonly title: TranslatedText;
  readonly search: TranslatedText;
  readonly clearSearch: TranslatedText;
  /** `Up to 3 brands. Remove one to add another.` */
  readonly full: TranslatedText;
  /** Nothing matches the search. */
  readonly none: TranslatedText;
  /** Nothing is saved for this kind yet, and no search is typed — `No cable saved yet. Add the one you use.` */
  readonly empty: TranslatedText;
  /** `Edit what prints for Waaree`. */
  readonly edit: (brand: string) => TranslatedText;
  /** The incentive path's rule for this kind, where it binds one; absent elsewhere. */
  readonly scheme?: TranslatedText;
  /** `Add a new panel`, and where it is saved. */
  readonly add: TranslatedText;
  readonly addLine: TranslatedText;
  /** `Done`, or `Done · 2 picked`. */
  readonly done: TranslatedText;
  readonly loading: TranslatedText;
  /** *Show more*, under a kind with more saved parts than one page. */
  readonly showMore: TranslatedText;
}

export interface ProposalPartPickerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: PartPickerWords;
  /** The options after the search; `null` while they are being read. */
  readonly options: readonly PartOption[] | null;
  readonly search: string;
  readonly onSearch: (search: string) => void;
  /** The section holds its three brands: an unpicked option is inert, and the sheet says why. */
  readonly full: boolean;
  readonly onToggle: (key: string) => void;
  /** Opens the edit sheet for a picked brand. */
  readonly onEdit: (key: string) => void;
  /** Absent for a viewer who may not add a part: the row is then not drawn (`M06-28`). */
  readonly onAdd?: () => void;
  /** Why the server refused the last pick — a fourth brand; said where the person picked (`F8-36`). */
  readonly refusal?: TranslatedText | null;
  /**
   * The kind's saved parts are read a page at a time: *Show more* reads the next, and draws the
   * shipped loading row while it is out. Absent once the last page is in.
   */
  readonly more?: { readonly loading: boolean; readonly onMore: () => void };
}

/** What the edit sheet holds for one brand: its count where the kind carries one, and what prints. */
export type PartEditDraft = ComponentLine;

export interface PartEditWords extends OverlayCloseWords {
  /** `Waaree on this proposal`. */
  readonly title: TranslatedText;
  readonly brandFixed: TranslatedText;
  readonly number: NumberFieldWords;
  /** A field's name, by the key the kind's print facts hold it under. */
  readonly fields: Readonly<Record<string, TranslatedText>>;
  /** A closed field's options, by field then value — the panel types, the chemistries. */
  readonly options: Readonly<Record<string, Readonly<Record<string, TranslatedText>>>>;
  /** What a closed field shows before a pick, and its list's close. */
  readonly choose: TranslatedText;
  readonly description: TranslatedText;
  readonly descriptionCount: (count: number, max: number) => TranslatedText;
  /** `A change here stays on this proposal. Your catalog does not change.` */
  readonly staysHere: TranslatedText;
  readonly done: TranslatedText;
}

export interface ProposalPartEditProps {
  readonly open: boolean;
  /** Closing returns to the picker: the caller says where. */
  readonly onClose: () => void;
  readonly words: PartEditWords;
  /** The line being edited; `null` while the sheet is closed. */
  readonly line: PartEditDraft | null;
  /** The sheet's act: the line as the person left it. */
  readonly onDone: (line: PartEditDraft) => void;
}

/** A part typed in the flow (`M06-28`): saved to the catalog or the parts list, and picked in place. */
export interface PartAddDraft {
  readonly brand: string;
  readonly specification: string;
  readonly warranty: string;
  /** Where the kind's scheme applies: the part holds its certification. */
  readonly certified: boolean;
}

export interface PartAddWords extends OverlayCloseWords {
  /** `New panel`. */
  readonly title: TranslatedText;
  readonly brand: TranslatedText;
  readonly brandMissing: TranslatedText;
  readonly specification: TranslatedText;
  readonly specificationMissing: TranslatedText;
  readonly warranty: TranslatedText;
  /** The certification row, where the kind's scheme applies — `DCR panel`. */
  readonly certified?: { readonly title: TranslatedText; readonly line: TranslatedText };
  readonly yes: TranslatedText;
  readonly no: TranslatedText;
  /** The spreadsheet row, for a holder of the catalog right alone. */
  readonly sheet: TranslatedText;
  readonly sheetLine: TranslatedText;
  /** `Save and pick it`, and where it is saved. */
  readonly save: TranslatedText;
  readonly saveLine: TranslatedText;
  /** Why a save was refused: the part is already listed (`T-M06-034`). */
  readonly duplicate: TranslatedText;
}

export interface ProposalPartAddProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: PartAddWords;
  readonly category: ComponentCategory;
  readonly saving: boolean;
  /** Why the save was refused, when no field says it — a part of that brand and specification is already listed. */
  readonly failure?: TranslatedText;
  /** The fields the server refused: each says so at the field, until it is typed again. */
  readonly refused?: readonly ('brand' | 'specification')[];
  readonly onSave: (part: PartAddDraft) => void;
  /** Present only for a holder of the catalog right (`M01-39`). */
  readonly onSpreadsheet?: () => void;
}

export interface PhaseSheetWords extends OverlayCloseWords {
  /** `Step 3`. */
  readonly title: TranslatedText;
  readonly name: TranslatedText;
  readonly description: TranslatedText;
  readonly duration: TranslatedText;
  readonly days: TranslatedText;
  readonly count: (count: number, max: number) => TranslatedText;
  readonly number: NumberFieldWords;
  readonly done: TranslatedText;
}

/**
 * One timeline step as the sheet edits it. A proposal's step has its length; a template's step
 * (Proposal defaults, `T-M01-030`) has none — its `durationDays` is absent and no length is asked.
 */
export type SheetPhase = Omit<ProposalPhase, 'durationDays'> & {
  readonly durationDays?: ProposalPhase['durationDays'];
};

export interface ProposalPhaseSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: PhaseSheetWords;
  /** The phase being edited; `null` while the sheet is closed. */
  readonly phase: SheetPhase | null;
  /**
   * The step must say what happens before it is kept — a template's step prints only its name and
   * its sentence (`SCR-M01-19`). A proposal's step may go without one.
   */
  readonly needsSentence?: boolean;
  readonly onDone: (phase: SheetPhase) => void;
}

/** One payment part as its sheet edits it: its name, and the stage it falls due on. */
export interface PaymentPartDraft {
  /** biome-ignore lint/plugin/copy-prop-type: a fact — the company's own name for the part */
  readonly label: string;
  /** A chain stage's key — `material_ordered`. */
  readonly dueOnStage: string;
}

export interface PaymentPartSheetWords extends OverlayCloseWords {
  /** `Part 3`, or `New part`. */
  readonly title: TranslatedText;
  readonly name: TranslatedText;
  /** `Falls due`. */
  readonly due: TranslatedText;
  /** The stage list's placeholder and its accessible name. */
  readonly choose: TranslatedText;
  readonly hint: TranslatedText;
  readonly count: (count: number, max: number) => TranslatedText;
  readonly done: TranslatedText;
}

/**
 * One payment part (`M06-13`, `T-M06-009`): its name and the stage it falls due on — offered only
 * from the stages this segment's projects visit, which the caller decides.
 */
export interface ProposalPaymentPartSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: PaymentPartSheetWords;
  /** The part being edited; `null` while the sheet is closed. */
  readonly part: PaymentPartDraft | null;
  /** The stages on offer, each with the words the document prints for it — `Before dispatch`. */
  readonly stages: readonly { readonly value: string; readonly label: TranslatedText }[];
  readonly onDone: (part: PaymentPartDraft) => void;
}

/**
 * A part sheet's frame (`PartSheetFrame`): its title and close, its fields, and *Done* in the
 * sheet's own foot, as every shipped sheet with a main act draws it.
 */
export interface PartSheetFrameProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: {
    readonly closeLabel: TranslatedText;
    readonly title: TranslatedText;
    readonly done: TranslatedText;
  };
  /** *Done*, while the sheet holds a draft; `null` draws no foot. */
  readonly done: { readonly disabled: boolean; readonly press: () => void } | null;
  readonly children: ReactNode;
}

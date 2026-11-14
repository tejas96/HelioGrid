import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BankDetails,
  ComponentCategory,
  ProposalPage,
  ProposalPhase,
  Read,
} from '@heliogrid/domain';
import type { ReactNode, RefObject } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import type { CheckSaid } from '../ProposalCheck/ProposalCheck.logic';
import type { ProposalCheckWords } from '../ProposalCheck/ProposalCheck.types';
import type { ProposalPageFacts } from '../ProposalPages/ProposalPages.types';
import type { PartChoiceFact } from '../ProposalPartSheets/ProposalPartSheets.logic';
import type {
  PartAddDraft,
  PartAddWords,
  PartEditDraft,
  PartEditWords,
  PartPickerWords,
  PaymentPartDraft,
  PaymentPartSheetWords,
  PhaseSheetWords,
} from '../ProposalPartSheets/ProposalPartSheets.types';
import type { ProposalReadyWords } from '../ProposalReady/ProposalReady.types';
import type { FieldMarks, StepNotice } from '../ProposalSteps/ProposalSteps.shared.types';
import type { ProposalStepWords } from '../ProposalSteps/ProposalSteps.words.types';
import type { ProposalStepModel, ProposalStepSaid } from '../ProposalSteps/step-view.types';
import type { BuilderDrawnInput } from './builder-drawn';
import type {
  BuilderSave,
  ProposalBuilderWords,
  ProposalStepListWords,
} from './ProposalBuilder.types';

type DrawnFrame = BuilderDrawnInput['frame'];
type DrawnSaid = BuilderDrawnInput['said'];

/** The frame's facts as the view model assembles them, by shape. */
export interface BuilderViewFrame extends DrawnFrame {
  readonly current: string;
  readonly quick: boolean;
  readonly page: ProposalPage;
  readonly pages: readonly ProposalPage[];
  readonly pageAt: number | null;
  readonly save: BuilderSave | null;
  readonly toFix: number;
  readonly recomputing: boolean;
  readonly customerName: string;
}

/** The PDF after Generate: asked for by a press, made by the server. */
interface MadeFile {
  /** `idle`, `making`, `made` — the model's own words for where the file stands. */
  readonly kind: string;
  /** Present once it is `made`. */
  readonly download?: { readonly url: string };
}

/**
 * The builder's view model (`useProposalBuilderScreen`), by shape — this package reads no `data`.
 * Each press is declared as a method: the model's own keys (a step, a stage) arrive back as given.
 */
export interface ProposalBuilderViewModel {
  readonly detail: {
    readonly document: { readonly company: { readonly bankDetails: BankDetails | null } };
    readonly rights: {
      readonly addsParts: boolean;
      readonly managesParts: boolean;
      readonly managesBilling: boolean;
    };
  } | null;
  readonly pageFacts: ProposalPageFacts | null;
  readonly moved: { readonly to: { readonly name: string } | null; reload(): void } | null;
  readonly stepsOpen: boolean;
  openSteps(): void;
  closeSteps(): void;
  readonly previewOpen: boolean;
  openPreview(): void;
  closePreview(): void;
  goStepByKey(key: string): void;
  toggleQuick(): void;
  close(): void;
  openCheck(): void;
  readonly check: {
    readonly open: boolean;
    readonly generating: boolean;
    readonly changeNote: { readonly text: string; type(text: string): void } | null;
    fix(step: string): void;
    generate(): void;
    close(): void;
  };
  readonly parts: {
    readonly category: ComponentCategory | null;
    /** A panel, an inverter or a battery is a catalog item: the platform's own add form opens. */
    readonly catalogKind: string | null;
    readonly choices: Read<readonly PartChoiceFact[]>;
    readonly search: string;
    setSearch(search: string): void;
    readonly full: boolean;
    /** More saved parts of this kind than the pages read so far. */
    readonly hasMore: boolean;
    readonly loadingMore: boolean;
    loadMore(): void;
    toggle(key: string): void;
    readonly editing: PartEditDraft | null;
    edit(key: string): void;
    saveEdit(line: PartEditDraft): void;
    closeEdit(): void;
    readonly adding: boolean;
    openAdd(): void;
    closeAdd(): void;
    add(part: PartAddDraft): void;
    readonly addPending: boolean;
    readonly addFailed: boolean;
    /** Why the last add was not taken: the fields it names, and the failure (`packages/data`'s). */
    readonly addRefusal: {
      readonly fields: readonly string[];
      readonly failure: { readonly kind: string };
    } | null;
    close(): void;
  };
  readonly phase: {
    readonly phase: ProposalPhase;
    done(phase: ProposalPhase): void;
    close(): void;
  } | null;
  readonly paymentPart: {
    readonly part: PaymentPartDraft;
    readonly stages: readonly string[];
    done(part: PaymentPartDraft): void;
    close(): void;
  } | null;
  readonly ready: {
    readonly made: { readonly number: string };
    readonly pdf: {
      readonly file: MadeFile;
      /** Opens the file for a tap: at once while its address lives, else once a fresh one comes. */
      get(open: (url: string) => void): void;
    };
    share(): void;
    back(): void;
  } | null;
}

/** Everything the builder says (`packages/i18n`'s `proposalBuilderViewSaid`), by shape. */
export interface ProposalBuilderViewSaid<Step extends ProposalStepModel = ProposalStepModel>
  extends DrawnSaid {
  readonly words: ProposalBuilderWords & {
    readonly title: TranslatedText;
    readonly status: TranslatedText;
    /** `What Anil sees`. */
    readonly whatSees: TranslatedText;
    readonly pageWaits: TranslatedText;
    readonly updating: TranslatedText;
  };
  readonly screenWords: { readonly customerLine: TranslatedText; readonly reload: TranslatedText };
  readonly shared: ProposalStepWords & { moved(person: string): Omit<StepNotice, 'act'> };
  readonly list: ProposalStepListWords;
  readonly pageLine: TranslatedText | null;
  /** The cover's `Page 1 of 9 · Cover`, for a step whose own page waits for a price. */
  readonly coverLine: TranslatedText;
  readonly payable: { readonly label: TranslatedText; readonly text: string } | null;
  saidOf(step: Step, termsEstimate?: { pages: number; chars: number }): ProposalStepSaid;
  readonly blocks: DrawnSaid['blocks'] & {
    readonly split: { due(stage: string): TranslatedText };
  };
  readonly sheets: {
    readonly picker: PartPickerWords;
    readonly edit: PartEditWords;
    readonly add: PartAddWords;
    readonly phase: PhaseSheetWords;
    readonly payment: PaymentPartSheetWords;
  };
  readonly check: CheckSaid & { readonly words: ProposalCheckWords };
  /** The fields the step in view marks once Generate was asked for (`T-M06-022`). */
  readonly marks: FieldMarks;
  readonly ready: ProposalReadyWords | null;
}

/**
 * **The proposal builder once its draft is read** (`SCR-M06-02`…`SCR-M06-13`), both platforms: the
 * frame with the step in view, every sheet it opens, and the screen after Generate. It composes
 * parts that carry their own web and phone halves; what differs by platform arrives as a fact.
 */
export interface ProposalBuilderViewProps<Step extends ProposalStepModel = ProposalStepModel> {
  readonly screen: ProposalBuilderViewModel;
  readonly ready: { readonly frame: BuilderViewFrame; readonly step: Step };
  readonly said: ProposalBuilderViewSaid<NoInfer<Step>>;
  /** The desktop form: the caller reads its own room and says which. */
  readonly wide: boolean;
  /** The width a page may take, px — the frame's own on the web, the window less its gutters on a phone. */
  readonly room: number;
  /** The device's safe areas, dp, from the app's own reader; a browser reads its own. */
  readonly safe?: { readonly top: number; readonly bottom: number };
  readonly titleRef: RefObject<FocusHandle | null>;
  /**
   * The catalog's own add form (and its spreadsheet import) for a panel, an inverter or a battery —
   * the platform's panel or sheet; drawn while `screen.parts.catalogKind` names one.
   */
  readonly catalogAdd: ReactNode;
  /** *See plans* at the plan's limit, for a viewer who may change the plan. */
  readonly onPlans: () => void;
  /**
   * Opens the made PDF the platform's way — a tab, the phone's viewer. Called for Ready's *Download
   * PDF* tap alone (`MadeFileRead.get`), never because a fresh address was read.
   */
  readonly onOpenFile: (url: string) => void;
}

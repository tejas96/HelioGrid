import type { TranslatedText } from '@heliogrid/contracts';
import type { StepStanding } from '@heliogrid/domain';
import type { ReactNode, Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.icons';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/**
 * The builder's frame (`M06-21`, `M06-24`, `T-M06-002`): a focus screen with no app sidebar and no
 * bottom bar. On a phone — an icon bar (close, the `n of N · title` capsule that opens every step,
 * the preview eye), one track segment per step, the large title with the save state, the step, and a
 * floating dock. On a desktop — the top bar, one labelled rail of every step, the page the customer
 * gets on a stage, and the step in a card with Back, the payable and Next in its foot.
 *
 * It holds no step of its own: Proposal defaults mounts the same frame over its seven parts
 * (`T-M01-030`). Navigation never waits on a step being complete (`M06-22`), so nothing here is
 * ever disabled but Back on the first step.
 */

/** One step as the frame draws it. */
export interface BuilderStep {
  /** The caller's own key for the step; `onStep` answers it. */
  readonly key: string;
  /** The short word the rail and the capsule show — `System`. */
  readonly title: TranslatedText;
  /** The step's title in words — `System and price`. */
  readonly heading: TranslatedText;
  /** One line of what the step holds, on the list of every step — `3 kW · ₹1,90,575`. */
  readonly summary?: TranslatedText;
  readonly glyph: ShellGlyphName;
  /** Done, filled from the company's defaults, or to do — a mark and a word, never colour alone. */
  readonly standing: StepStanding;
  /** Quick mode hides it: the list still offers it, quietly, and opening it leaves Quick mode. */
  readonly quiet?: boolean;
}

/** What the draft's last commit came to (`M06-25`, `T-M06-023`); `null` while the step is not read. */
export type BuilderSave =
  | { readonly kind: 'saved' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'unsaved'; readonly count: number }
  | { readonly kind: 'offline' }
  | { readonly kind: 'conflict' };

/** The desktop stage: the document page the current step feeds, and where it sits in the document. */
export interface BuilderStage {
  /** `What Anil sees`. */
  readonly caption: TranslatedText;
  /** `Page 6 of 9 · Price and payment`, or that the page is left out of the PDF; `null` with no page. */
  readonly pageLine: TranslatedText | null;
  /**
   * The page itself — a `ScaledProposalPage`; the stage only frames it. `null` while no price is
   * typed: a page states no figure it lacks, so the stage says what draws it instead (`waits`).
   */
  readonly page: ReactNode | null;
  /** `Anil’s pages appear once the price is typed in System.` — said where `page` can be `null`. */
  readonly waits?: TranslatedText;
  /** A key that changes with the page shown, so the page enters once per page. */
  readonly pageKey: string;
  /** How many pages print, and which one this is (zero-based); `null` where this page is left out. */
  readonly pages: number;
  readonly at: number | null;
}

/** The Quick switch (`M06-18`); absent where the frame has no Quick mode. */
export interface BuilderQuick {
  readonly on: boolean;
  readonly onChange: (on: boolean) => void;
}

/**
 * The frame over a settings page's parts instead of a draft's steps (Proposal defaults,
 * `T-M01-030`): the page's own head in the builder's place. Desktop — the breadcrumb where the
 * close button and title stand, a note beside the act, and each rail node wearing its part's glyph.
 * Phone — back in the icon bar, the page's name held still in the capsule, and the parts as one
 * scrolling row where the track stands. Parts carry no standing, so none is drawn.
 */
export interface BuilderPartsHead {
  /** The page's breadcrumb — a `PageTrail`. */
  readonly trail: ReactNode;
  /** The line beside the desktop act — what a change never reaches. */
  readonly note: TranslatedText;
}

export interface ProposalBuilderWords {
  /** The close button — `Close and keep the draft`. */
  readonly close: TranslatedText;
  /** The capsule's spoken name — `All steps: 3 of 11, System`. */
  readonly openSteps: (at: number, total: number, title: TranslatedText) => TranslatedText;
  /** The capsule's count — `3 of 11`. */
  readonly count: (at: number, total: number) => TranslatedText;
  /** The eye — `See what Anil sees`. */
  readonly preview: TranslatedText;
  /** The track and the rail, spoken — `Steps`. */
  readonly steps: TranslatedText;
  /** A rail step, spoken with its standing — `System, to do`. */
  readonly spokenStep: (title: TranslatedText, standing: StepStanding) => TranslatedText;
  /** The desktop card's overline — `Step 3 of 11`. */
  readonly stepOf: (at: number, total: number) => TranslatedText;
  readonly back: TranslatedText;
  /** `Next · Generation`. */
  readonly next: (title: TranslatedText) => TranslatedText;
  /** The last step's act — `Generate proposal`. */
  readonly last: TranslatedText;
  /** The last step's act while something stops it — `Generate · 2 to fix`. It still opens the check. */
  readonly lastToFix: (count: number) => TranslatedText;
  /** The desktop top bar's act — `Generate`. */
  readonly generate: TranslatedText;
  /** The Quick switch's word — `Quick`. */
  readonly quick: TranslatedText;
  readonly saved: TranslatedText;
  readonly saving: TranslatedText;
  /** `1 field not saved`. */
  readonly unsaved: (count: number) => TranslatedText;
  /** `No connection — your typing stays here`. */
  readonly offline: TranslatedText;
  /** `Changed on another device — reload`. */
  readonly conflict: TranslatedText;
}

export interface ProposalBuilderProps {
  /** The desktop form: the caller reads its own room and says which. */
  readonly wide: boolean;
  readonly words: ProposalBuilderWords;
  /** The steps presented, in order — Quick mode presents four. */
  readonly steps: readonly BuilderStep[];
  /** The key of the step in view. */
  readonly current: string;
  /** The desktop title — `Proposal for Anil Sharma`. */
  readonly title: TranslatedText;
  /** The desktop status word — `Draft`. */
  readonly status: TranslatedText;
  /** The phone's line under the title — `Anil Sharma · Pune`. */
  readonly customerLine: TranslatedText;
  readonly save: BuilderSave | null;
  readonly quick?: BuilderQuick;
  /** The desktop foot's figure — `Anil pays` over the server's own text; absent while none is known. */
  readonly payable?: { readonly label: TranslatedText; readonly text: string };
  /** How many things stop Generate; the last act says so and still opens the check. */
  readonly toFix?: number;
  /** The desktop stage; the phone draws none. */
  readonly stage?: BuilderStage;
  /** A settings page's parts, not a draft's steps: the frame draws that page's head (`T-M01-030`). */
  readonly parts?: BuilderPartsHead;
  readonly onStep: (key: string) => void;
  readonly onClose: () => void;
  /** Next on the last step and the top bar's Generate: opens the check, never a dead button. */
  readonly onGenerate: () => void;
  /** The capsule: opens the list of every step. */
  readonly onOpenSteps: () => void;
  /** The eye; the phone alone draws it. */
  readonly onPreview?: () => void;
  /**
   * The device's safe areas, dp, from the app's own reader: the phone app keeps its icon bar under
   * the status bar and its dock above the home indicator by them. A browser reads its own
   * (`env(safe-area-inset-*)`), so the web half takes none.
   */
  readonly safe?: { readonly top: number; readonly bottom: number };
  /** A handle on the step's title: where focus lands when a step's own retry has gone. */
  readonly titleRef?: Ref<FocusHandle>;
  /** The step in view. */
  readonly children: ReactNode;
}

export interface ProposalStepListWords extends OverlayCloseWords {
  /** `All steps`. */
  readonly title: TranslatedText;
  readonly quickLabel: TranslatedText;
  readonly quickLine: TranslatedText;
  readonly standing: Readonly<Record<StepStanding, TranslatedText>>;
  readonly generate: TranslatedText;
  /** The line under the act: any order, or that Quick mode runs the same checks. */
  readonly note: TranslatedText;
}

/** The list of every step (`M06-24`): the Quick switch, a row per step, and Generate. */
export interface ProposalStepListProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: ProposalStepListWords;
  /** EVERY step, the ones Quick mode hides included (`quiet`). */
  readonly steps: readonly BuilderStep[];
  readonly current: string;
  readonly onStep: (key: string) => void;
  readonly quick?: BuilderQuick;
  readonly onGenerate: () => void;
}

/** `See the customer's page` (`T-M06-015`): the page the step in view feeds, as the customer gets it. */
export interface ProposalPreviewSheetProps extends OverlayCloseWords {
  readonly open: boolean;
  readonly onClose: () => void;
  /** `What Anil sees`. */
  readonly title: TranslatedText;
  /** A `ScaledProposalPage`. */
  readonly page: ReactNode;
  /** `Page 6 of 9 · Price and payment`. */
  readonly pageLine: TranslatedText;
}

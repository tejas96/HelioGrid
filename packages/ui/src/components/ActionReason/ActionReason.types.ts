import type { ReactElement, ReactNode } from 'react';
import type { ExplainerTriggerProps } from '../Explainer/Explainer.types';

/**
 * A reason may be a plain sentence, a spec, or a ready node. Sentence case, states the fix:
 * "Draw a roof first", "Choose a panel first", not "Invalid state".
 */
export interface ActionReasonSpec {
  reason?: ReactNode;
  /** The host sets this and points the control's `aria-describedby` at it. */
  id?: string;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * **Why this control is off — stated beside it, in words, permanently.** Sixteen P0 rows across
 * eleven screens (`MS4-15`, `MS8-07`, `M05-53`, `MS2-21`, `MS4-20`, `SCR-MS-07`) ask for the same
 * sentence in the same place, and the system had five `disabled` flags and no reason slot anywhere.
 *
 * **This is the precondition answer, one of three.** The control is present, it is off, and the
 * reason names something the reader can go and do — so the reason **expires**. Where the act is
 * *absent* because it is someone else's to take, it is `ScopeNote`; where it is absent because a
 * statute or a market pack forbids it to everyone, permanently, it is `ComplianceFloor`. None of
 * the three is interchangeable: a disabled control advertises a capability, which is exactly what a
 * permission boundary must not do, and promising *"not yet"* about a statute is worse still.
 *
 * **Where it renders — the slot rule, declared per host so five hosts cannot answer it five ways:**
 * - **`Button` / `IconButton`** — in the `Explainer` bubble above the control, which a tap, click,
 *   focus or hover opens (`ReasonExplainer`); nothing is drawn under the control.
 * - **`MenuItem`** — the second line of the item, under the label. `meta` keeps its own job.
 * - **`SelectOption`** — the second line of the listbox row, under the option label.
 * - **`OptionCardItem`** — its own line under `description`, never *inside* it.
 *
 * **The treatment.** The word carries the meaning; a barred-circle glyph is the second channel
 * (`F7-12`). Neutral — never a warning tint, because a precondition is not a fault. The words take
 * `--text-secondary`, never `--text-disabled`: the control may be grey, the sentence explaining it
 * is not.
 *
 * **The mechanical ruling that comes with it.** A `disabled` element leaves the tab order, so a
 * keyboard user cannot reach it and `aria-describedby` on it is never announced. A control given a
 * `disabledReason` is therefore rendered `aria-disabled` and **stays focusable**, with activation
 * suppressed by the host. A `disabled` with no reason keeps the native attribute.
 */
export type ActionReasonProps = ActionReasonSpec;

/**
 * What a host's control is handed by `ReasonExplainer`: the ask's trigger props, plus the sentence
 * for a screen reader while the bubble is shut.
 */
export interface ReasonTriggerProps extends ExplainerTriggerProps {
  /** Web: the id of the visually hidden sentence, the control's `aria-describedby`. */
  describedBy: string;
  /**
   * Native: the sentence as words, which the control speaks after its name — React Native has no
   * off-screen text node to describe it by. Absent when the reason is not plain words.
   */
  spokenReason?: string;
}

/**
 * **The reason in the Explainer** — what `Button` and `IconButton` run their `disabledReason`
 * through. The host's control becomes the `Explainer`'s trigger, so a tap opens the sentence in a
 * bubble above it; the sentence also stays, visually hidden, under `id`, so the control is described
 * by it while the bubble is shut.
 */
export interface ReasonExplainerProps {
  spec?: ReactNode | ActionReasonSpec;
  /** The hidden sentence's id — the host's own `useId()`. */
  id: string;
  /** Holds the bubble open or shut; unset lets a tap open it. */
  open?: boolean;
  /** Keeps a full-width control full width. */
  block?: boolean;
  children: (triggerProps: ReasonTriggerProps) => ReactElement;
}

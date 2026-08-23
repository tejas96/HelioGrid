/** Never more than three marks on one screen (M01-16). The cap is enforced, not advisory. */
export const MAX_STEPS = 3;

/**
 * What a mark points at. Platform-neutral: the web half accepts a ref, an element or a CSS
 * selector, the native half a ref to the anchored view. Each half narrows it at runtime, and an
 * anchor it cannot resolve draws nothing rather than pointing at nothing.
 */
export type CoachMarkAnchor = string | object;

export interface CoachMarkStep {
  /**
   * The live control this mark points at. Omit for an unanchored mark, which parks at the bottom
   * of the screen rather than pointing at nothing.
   */
  anchor?: CoachMarkAnchor;
  /**
   * Position inside this scrolling container instead of the viewport (studio canvas, phone shell,
   * detail panel). Ref, element or selector; must be positioned.
   */
  within?: CoachMarkAnchor;
  title: string;
  body?: string;
  placement?: 'auto' | 'top' | 'bottom';
  nextLabel?: string;
}

/**
 * One persistent mark anchored to a live control. Escape dismisses; the screen stays usable.
 *
 * **It is not a tour.** No backdrop, no scrim, no focus trap, no full-screen slide — `MS1-08` says
 * coach marks *replace* the decorative tutorial banner, and `M01-16` says *never a carousel*. The
 * mark anchors to the real control, rings it with the system's own 2px accent ring, and the screen
 * underneath stays fully usable.
 */
export interface CoachMarkProps extends CoachMarkStep {
  open?: boolean;
  step?: number;
  total?: number;
  /** Ring inset around the anchor. The ring is the system's 2px accent ring — there is no scrim. */
  padding?: number;
  width?: number;
  dismissLabel?: string;
  onNext?: () => void;
  /** Dismissing is forever ("shown once") — pair it with `useCoachMarks().dismiss`. */
  onDismiss?: () => void;
  /** Fired when an anchored mark can't find its anchor. A sequence uses this to skip the step. */
  onAnchorMissing?: () => void;
  /**
   * Moves focus to the mark so a keyboard user finds it. It does NOT trap focus — this is guidance
   * over a working screen, not a dialog.
   */
  autoFocus?: boolean;
  ring?: boolean;
}

/**
 * An ordered run of at most three marks (search → confirm → next). Steps whose anchor isn't on
 * this screen are resolved out before the run starts, so it opens on the first mark it can anchor
 * and the counter numbers only the marks that will be shown.
 */
export interface CoachMarkSequenceProps {
  /** Ordered. Sliced to MAX_STEPS — never a carousel, never a modal tour. */
  steps: CoachMarkStep[];
  open?: boolean;
  within?: CoachMarkAnchor;
  onDismiss?: () => void;
  onFinish?: () => void;
  autoFocus?: boolean;
}

/** Per-screen first-run state, persisted under its own key and nothing else. */
export interface CoachMarksState {
  open: boolean;
  seen: boolean;
  /** Records the dismissal under `hg.coachmark.<id>` — shown once, dismissed forever. */
  dismiss: () => void;
  /** Reopens on demand. This is what the Help menu calls (MS1-08). */
  replay: () => void;
}

export interface CoachMarksOptions {
  enabled?: boolean;
}

/** The one storage key shape. Only ever this component's own key, never anything else's. */
export function coachMarkKey(id: string): string {
  return `hg.coachmark.${id}`;
}

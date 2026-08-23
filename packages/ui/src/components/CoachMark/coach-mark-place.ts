/** The anchor's live geometry, in whichever coordinate space the mark is drawn in. */
export interface CoachMarkRect {
  /** Position inside `within` when there is one, in the viewport otherwise. */
  top: number;
  left: number;
  width: number;
  height: number;
  /** The viewport-relative top, which is what a fixed/overlay card is measured against. */
  vTop: number;
  /** The box the mark is confined to: the container's client size, or the viewport's. */
  bw: number;
  bh: number;
  /** True when the mark is positioned inside a scrolling container rather than the viewport. */
  box: boolean;
}

export interface CoachMarkViewport {
  width: number;
  height: number;
}

export interface PlacedCoachMark {
  top: number;
  left: number;
  side: 'top' | 'bottom';
  arrowX: number;
}

export const COACH_MARK_GAP = 14;
/** What the card is assumed to be before it has been measured once. */
export const COACH_MARK_FALLBACK_HEIGHT = 160;

/**
 * Where the card goes, and which way its arrow points. Shared by both halves so a mark sits in the
 * same place relative to its anchor on either platform: it prefers below, flips above only when
 * below does not fit, and is clamped inside its box so a mark near an edge is never half off it.
 */
export function placeCoachMark(
  rect: CoachMarkRect,
  cardWidth: number,
  cardHeight: number,
  placement: 'auto' | 'top' | 'bottom',
  viewport: CoachMarkViewport,
): PlacedCoachMark {
  const scoped = rect.box;
  const fitsBelow = scoped
    ? rect.top + rect.height + COACH_MARK_GAP + cardHeight <= rect.bh - 8
    : rect.vTop + rect.height + COACH_MARK_GAP + cardHeight <= viewport.height - 12;
  const fitsAbove = scoped
    ? rect.top - COACH_MARK_GAP - cardHeight >= 8
    : rect.vTop - COACH_MARK_GAP - cardHeight >= 12;
  const side = placement !== 'auto' ? placement : fitsBelow || !fitsAbove ? 'bottom' : 'top';
  const edge = (scoped ? rect.bw : viewport.width) - cardWidth - 12;
  const floor = (scoped ? rect.bh : viewport.height) - cardHeight - 12;
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - cardWidth / 2),
    Math.max(12, edge),
  );
  const top = Math.min(
    Math.max(
      8,
      side === 'bottom'
        ? rect.top + rect.height + COACH_MARK_GAP
        : rect.top - cardHeight - COACH_MARK_GAP,
    ),
    Math.max(8, floor),
  );
  return {
    top,
    left,
    side,
    arrowX: Math.min(Math.max(18, rect.left + rect.width / 2 - left), cardWidth - 18),
  };
}

export interface CoachMarkCounter {
  /** How many marks the run will actually show, capped at MAX_STEPS. */
  steps: number;
  /** "Step 2 of 3", or nothing when there is only one mark — a counter of one is noise. */
  counter: string | null;
  isLast: boolean;
}

/**
 * The counter numbers ONLY the marks that will be shown, which is why it is computed from the run
 * rather than from the caller's array: "step 2 of 2" as the first and only mark would be a lie.
 */
export function coachMarkCounter(
  total: number | undefined,
  step: number | undefined,
  cap: number,
): CoachMarkCounter {
  const steps = total === undefined ? 0 : Math.min(total, cap);
  return {
    steps,
    counter: steps > 1 && step !== undefined ? `Step ${step} of ${steps}` : null,
    isLast: total === undefined || step === steps,
  };
}

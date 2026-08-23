import type { ProvenanceStanding, ProvenanceTierSpec } from '../Provenance/Provenance.types';
import type { SurfaceState } from '../UnavailableNote/UnavailableNote.types';

/** The billing situations `SCR-M12-04` sits inside, plus the ordinary case. */
export type UsageBillingState =
  | 'ok'
  | 'overage-accruing'
  | 'tracked-seats-accruing'
  | 'cap-reached-grace'
  | 'creations-paused';

/**
 * The billing states plus **the shared surface states the component used to lack.**
 *
 * `loading`, `error` and `unavailable` are the system's `SurfaceState` names and mean here exactly
 * what they mean everywhere else; `ready` is accepted as a synonym of this component's own `ok`, so
 * a screen threading one `state` through several surfaces needs no translation. **`empty` is
 * deliberately not in the union**: zero consumption is a real, resolved figure with a real
 * denominator, not an absence, and a meter that read "empty" would be hiding a number `BM-27`
 * requires it to show.
 *
 * The non-reporting states are mutually exclusive with the billing ones and are **checked in that
 * order**: `error` and `unavailable` first (in both there is definitionally no value, so the
 * documented call passes no `value`), then `loading`/unresolved, then the billing states.
 */
export type UsageState =
  | UsageBillingState
  | 'ready'
  | Extract<SurfaceState, 'loading' | 'error' | 'unavailable'>;

export interface UsageMeterProps {
  /** What is metered — "Proposal sends", "AI designs", "Tracked seats". */
  label: string;
  /**
   * Consumption so far. May exceed `limit`: overage accrues visibly (`M12-35`).
   *
   * **A non-finite or missing value renders as unresolved**, whatever the caller passed — the
   * label, a shimmer in the figure's footprint and the period, and no numeral. There is no default
   * of 0, because a zero presented as a rollup is the failure `SCR-M12-04` names.
   */
  value?: number;
  /**
   * The bundle's allowance — the denominator (`BM-27`). **Defaults to `null`, not 0.** A meter with
   * no positive limit is **unmetered**, not zero-capped: it renders the count alone, with no
   * " of ", **no track**, and one line saying there is no bundle to measure against. Overage, the
   * threshold tick and the percentage all derive from a rate, so none is drawn without one.
   */
  limit?: number | null;
  unit?: string;
  /** The billing period these numbers belong to — "1–31 Aug 2026". BM-27 requires it. */
  period?: string;
  /**
   * Provenance tier for the number (N7 / F8-01) — rendered as a visible word beside the period.
   * **Open vocabulary**: M12-34 reserves "measured" for engineering and survey data and forbids it
   * on this screen, so pass this screen's own word — `"Actual usage"`.
   */
  provenance?: ProvenanceTierSpec;
  /** How far the figure can be relied on as final. See `Provenance`. */
  standing?: ProvenanceStanding;
  /** The bundle this consumption is shown against — "Growth bundle" (BM-27). */
  bundleName?: string;
  /** Default `"ok"` (`"ready"` is accepted as its synonym). See `UsageState` for the precedence. */
  state?: UsageState;
  /** Warning threshold, drawn as a tick on the track. Default 80 (BM-34). */
  thresholdPercent?: number;
  /** Days left in the 7-day grace window. Used by `cap-reached-grace` (M12-30). */
  graceDaysLeft?: number;
  note?: string;
  /** The unmetered line's words. Say the commercial rule if you know it — "Billed per send". */
  noLimitNote?: string;
  /** The unresolved line's words, shown beside the period while `loading`. */
  loadingNote?: string;
  /** `error`'s sentence. It never quotes a figure, not even the last good one. */
  errorMessage?: string;
  /** Draws the retry under `error`. No other state offers one. */
  onRetry?: () => void;
  /** `unavailable`: this meter does not apply to this plan. No bar, no figure, no retry. */
  unavailableTitle?: string;
  unavailableMessage?: string;
  density?: 'expressive' | 'functional';
}

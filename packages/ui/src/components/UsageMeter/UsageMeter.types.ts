import type { TranslatedText } from '@heliogrid/contracts';
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

/**
 * Every word the meter composes itself, in the reader's language — `@heliogrid/i18n`'s
 * `usageMeterWords(t)`. The figures in them arrive formatted by the market's pack, and `bundle` is
 * the caller's `bundleName` where there is one.
 */
export interface UsageMeterWords {
  /** The unmetered line, unless `noLimitNote` replaces it. */
  noLimit: TranslatedText;
  /** The unresolved line beside the period, unless `loadingNote` replaces it. */
  loading: TranslatedText;
  /** `error`'s sentence, unless `errorMessage` replaces it. It never quotes a figure. */
  error: TranslatedText;
  /** `unavailable`'s title, unless `unavailableTitle` replaces it. */
  unavailable: TranslatedText;
  /** After the strong figure — *of 200 sends*. */
  ofLimit: (limit: string, unit?: string) => TranslatedText;
  /** The track's name with its period — *Proposal sends, 1–31 Aug 2026*. */
  named: (label: string, period: string) => TranslatedText;
  /** The track's spoken value — *142 of 200 sends*, with *, 12 beyond the bundle* past the limit. */
  valueText: (value: string, limit: string, unit?: string, overage?: string) => TranslatedText;
  /** A meter still being read, named — *Proposal sends, 1–31 Aug 2026, not resolved yet*. */
  unresolvedName: (label: string, period?: string) => TranslatedText;
  /** The threshold tick's title — *80% warning threshold*. */
  threshold: (percent: number) => TranslatedText;
  /** `creations-paused` with a limit — the cap was reached and the grace period has ended. */
  paused: TranslatedText;
  /** `creations-paused` with no limit — new creations are blocked on this plan. */
  pausedOnPlan: TranslatedText;
  /** `cap-reached-grace` — with the days of grace left where they are known. */
  capReached: (graceDaysLeft?: number) => TranslatedText;
  /** `overage-accruing` — how far beyond the bundle, billed as overage. */
  overage: (overage: string, unit?: string, bundle?: string) => TranslatedText;
  /** `tracked-seats-accruing` — how far beyond the bundle, billed per seat. */
  trackedSeats: (overage: string, bundle?: string) => TranslatedText;
  /** At or past the threshold while `ok` — *82% of the bundle used.* */
  nearing: (percent: number, bundle?: string) => TranslatedText;
}

export interface UsageMeterProps {
  /** What is metered — "Proposal sends", "AI designs", "Tracked seats". */
  label: TranslatedText;
  /** The meter's own words — `usageMeterWords(t)`. */
  words: UsageMeterWords;
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
  /** What is counted — *sends*, *seats*. */
  unit?: TranslatedText;
  /** The billing period these numbers belong to — "1–31 Aug 2026". BM-27 requires it. */
  period?: string;
  /**
   * Provenance tier for the number (N7 / F8-01) — rendered as a visible word beside the period.
   * One of the four (`F8-03`). M12-34 forbids the word "measured" on the usage screen, and this
   * component has no slot yet for that screen's own word (`docs/tasks/UI.md`).
   */
  provenance?: ProvenanceTierSpec;
  /** How far the figure can be relied on as final. See `Provenance`. */
  standing?: ProvenanceStanding;
  /** The bundle this consumption is shown against — "Growth bundle" (BM-27). */
  bundleName?: TranslatedText;
  /** Default `"ok"` (`"ready"` is accepted as its synonym). See `UsageState` for the precedence. */
  state?: UsageState;
  /** Warning threshold, drawn as a tick on the track. Default 80 (BM-34). */
  thresholdPercent?: number;
  /** Days left in the 7-day grace window. Used by `cap-reached-grace` (M12-30). */
  graceDaysLeft?: number;
  note?: TranslatedText;
  /** Replaces `words.noLimit`. Say the commercial rule if you know it — "Billed per send". */
  noLimitNote?: TranslatedText;
  /** Replaces `words.loading`, shown beside the period while `loading`. */
  loadingNote?: TranslatedText;
  /** Replaces `words.error`. It never quotes a figure, not even the last good one. */
  errorMessage?: TranslatedText;
  /** Draws the retry under `error`. No other state offers one. */
  onRetry?: () => void;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  /**
   * `unavailable`: this meter does not apply to this plan. No bar, no figure, no retry. Replaces
   * `words.unavailable`.
   */
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  density?: 'expressive' | 'functional';
}

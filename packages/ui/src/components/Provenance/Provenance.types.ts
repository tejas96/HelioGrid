import type { ProvenanceStanding as ContractStanding, ProvenanceTier } from '@heliogrid/contracts';
import type { EnergySource, Freshness, FreshnessWarning } from '@heliogrid/domain';

/**
 * A mark colour, named as a DS colour token rather than as a CSS colour string — the web half
 * resolves it to `var(--<token>)`, the native half to `theme.colors[<token>]`. One vocabulary,
 * both platforms, and no raw colour can enter through a caller's tier.
 */
export type ProvenanceMarkToken =
  | 'success'
  | 'success-text'
  | 'info'
  | 'info-text'
  | 'warning'
  | 'warning-text'
  | 'danger'
  | 'danger-text'
  | 'neutral'
  | 'neutral-text'
  | 'accent'
  | 'text-tertiary'
  | 'text-secondary'
  | 'mark-subtle';

/**
 * A tier: one of `contracts`' four (`F8-02`), or `"unmarked"` — which renders nothing and *records
 * that the absence is deliberate* (`M05-52`), as distinct from having forgotten.
 *
 * **CLOSED** (`F8-03`: no screen invents a fifth tier). A caller's own word — the catalog's
 * *verified datasheet* (`M01-35`), a usage screen's *actual usage* — is prose beside the tier, so it
 * goes in `source`.
 */
export type ProvenanceTierSpec = ProvenanceTier | 'unmarked';

/**
 * The second axis: how far a figure can be relied on as **final**. Orthogonal to the tier — a
 * derived figure from a stale version is still derived, and still must not read as final.
 *
 * - `confirmed` — the account confirmed it (`M11-42`).
 * - `provisional` — a value is shown and is being superseded (`M06-41`, `F5-59`, `M05-06`).
 * - `reported` — a person says it happened; the system has not confirmed it (`M11-42`).
 * - `pending` — no value exists yet (`MS12-06`).
 *
 * Omit it and nothing renders. Set it — including `"confirmed"` — and the word renders, which is
 * how a ledger shows confirmed and reported money as visibly different things on one screen.
 *
 * The four names are `contracts`', derived from domain's `PROVENANCE_STANDINGS` — the same list
 * the format layer binds to a figure (`F3-24`), so a standing drawn here and a standing carried
 * with an amount cannot drift apart.
 */
export type ProvenanceStanding = ContractStanding;

/**
 * The words a label prints, in the reader's language. The consumer builds them from
 * `@heliogrid/i18n`'s `tierLabel`, `standingLabel`, `energySourceLabel` and `freshnessLabel`, and
 * mounts them once with `ProvenanceWordsProvider`; this package holds no word of its own (`F3-12`).
 */
export interface ProvenanceWords {
  tier: (tier: ProvenanceTier) => string;
  standing: (standing: ProvenanceStanding) => string;
  energySource: (source: EnergySource) => string;
  /** Never handed `current`, which prints nothing. */
  freshness: (warning: FreshnessWarning) => string;
}

export type ProvenanceAlign = 'left' | 'right' | 'center';

export interface ProvenanceProps {
  tier?: ProvenanceTierSpec;
  standing?: ProvenanceStanding;
  /**
   * Whether the figure is still current (`F8-18`), as `QualifiedAmount` carries it — `null` for a
   * record. Every state but `current` prints its word, and a stale one names what moved.
   */
  freshness?: Freshness | null;
  /**
   * The energy data the figure was computed from (`F8-08`), as `QualifiedAmount` carries it —
   * printed `"Real · PVGIS (SARAH3)"` or `"Built-in estimate ±10%"` in the reader's language.
   */
  energySource?: EnergySource | null;
  /** Any word a caller needs beside the tier (`F8-03`) — the catalog's *verified datasheet*. */
  source?: string;
  /** The assumptions a multi-year figure rides on (`F8-23` / `F5-37`). */
  projection?: string;
  note?: string;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
  align?: ProvenanceAlign;
  inline?: boolean;
}

/** The tier alone — always its visible word, never a dot alone (`F8-07`). */
export interface ProvenanceTierProps {
  tier?: ProvenanceTierSpec;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
}

/**
 * The four canonical tiers. **Not a closed set** — any string is a valid tier, because three
 * surfaces need vocabularies these names don't contain and one screen forbids "measured" outright.
 */
export type ProvenanceTierName = 'measured' | 'derived' | 'estimated' | 'assumed';

/**
 * A mark colour, named as a DS colour token rather than as a CSS colour string — the web half
 * resolves it to `var(--<token>)`, the native half to `theme.colors[<token>]`. One vocabulary,
 * both platforms, and no raw colour can enter through a caller's tier object.
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

/** The object form of a tier: a caller's own word, optionally borrowing a canonical mark colour. */
export interface ProvenanceTierObject {
  label: string;
  tone?: ProvenanceTierName;
  color?: ProvenanceMarkToken;
}

/**
 * A tier. Either a canonical name, any free word (`"Verified datasheet"`), an object that borrows a
 * canonical mark colour, or the reserved `"unmarked"` — which renders nothing and *records that the
 * absence is deliberate* (`M05-52`), as distinct from having forgotten.
 */
export type ProvenanceTierSpec = ProvenanceTierName | 'unmarked' | string | ProvenanceTierObject;

/** What `resolveTier` hands back: the word a reader sees and the token its mark takes. */
export interface ResolvedTier {
  label: string;
  color: ProvenanceMarkToken;
}

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
 */
export type ProvenanceStanding = 'confirmed' | 'provisional' | 'reported' | 'pending';

export type ProvenanceAlign = 'left' | 'right' | 'center';

export interface ProvenanceProps {
  tier?: ProvenanceTierSpec;
  standing?: ProvenanceStanding;
  /** What data it came from — `"Real · PVGIS (SARAH3)"`, `"Built-in estimate ±10%"` (`M05-54`). */
  source?: string;
  /** The assumptions a multi-year figure rides on (`F8-23` / `F5-37`). */
  projection?: string;
  note?: string;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
  align?: ProvenanceAlign;
  inline?: boolean;
}

/** The tier alone. `withLabel` defaults to **true**: the visible word is the default. */
export interface ProvenanceTierProps {
  tier?: ProvenanceTierSpec;
  withLabel?: boolean;
  /** 12 (default) or 13. Never below 12 — the type floor. */
  size?: number;
}

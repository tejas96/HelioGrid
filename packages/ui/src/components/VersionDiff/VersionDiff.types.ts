import type { ReactNode } from 'react';
import type { ProvenanceTierSpec } from '../Provenance';

export type DiffState = 'changed' | 'unchanged' | 'added' | 'removed';

export interface DiffRow {
  key?: string;
  /** The field's name — "Capacity", "Payable", "Tranche 2". Held still at the top of the block. */
  label: string;
  /** Optional heading rows are grouped under, in the order given — "Step 3 · System", "Money". */
  group?: string;
  /** State it when you know it. Otherwise derived: absence on either side is `added` / `removed`. */
  state?: DiffState;
  /** The value in the earlier version. `null`/absent means the field did not exist there. */
  before?: ReactNode;
  /** The value in the later version. `null`/absent means it is gone from there. */
  after?: ReactNode;
  /**
   * **The tier the EARLIER version pinned** (`M06-42`: *"each figure shows at the provenance tier its
   * own version pinned"*). Separate from `afterTier` on purpose — a cell reads `estimated → derived`.
   */
  beforeTier?: ProvenanceTierSpec;
  /** The tier the later version pinned. */
  afterTier?: ProvenanceTierSpec;
  unit?: string;
  /** Overrides `removedLabel` for this row — what its absence is called. */
  gapLabel?: string;
  /** A quiet line under the pair. Per-field detail, not the version's change note. */
  note?: ReactNode;
}

export interface VersionSide {
  /** "v1", "v2", "Now", "Upgraded". */
  label?: string;
  /** A shorter stamp for the per-line prefix, if the label is long. Defaults to `label`. */
  stamp?: string;
  /** When it was taken, who took it — "12 Aug, Priya". */
  note?: string;
}

export type VersionDiffMode = 'versions' | 'upgrade';

export interface VersionDiffProps {
  /** Overline above the pair. */
  caption?: string;
  before?: VersionSide;
  after?: VersionSide;
  rows: DiffRow[];
  /** `M06-42`'s *"what changed and why"* — the version's own note, not a per-field one. */
  changeNote?: ReactNode;
  changeNoteLabel?: string;
  /**
   * Force unchanged rows visible (or hidden). Left undefined, the component renders the moved rows
   * and a real 44px control that **counts** the unchanged ones — they are never silently dropped.
   */
  showUnchanged?: boolean;
  /** What a removed field's absence is called on the later side. Default "Not in this version". */
  removedLabel?: string;
  /** A quiet line under every added row — "New in this version". */
  addedLabel?: ReactNode;
  /**
   * `versions` (default) — `SCR-M06-16`'s v1-vs-v2. `upgrade` — `SCR-M06-18`'s
   * `upgrade-offered-diff`, which only changes the default side labels to "Now" / "Upgraded".
   * **The component renders no commit control in either mode:** the accept and the cancel belong to
   * the surface that owns the write.
   */
  mode?: VersionDiffMode;
  emptyMessage?: ReactNode;
}

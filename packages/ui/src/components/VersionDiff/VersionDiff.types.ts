import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ProvenanceTierSpec } from '../Provenance';

export type DiffState = 'changed' | 'unchanged' | 'added' | 'removed';

export interface DiffRow {
  key?: string;
  /** The field's name — "Capacity", "Payable", "Tranche 2". Held still at the top of the block. */
  label: TranslatedText;
  /** Optional heading rows are grouped under, in the order given — "Step 3 · System", "Money". */
  group?: TranslatedText;
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
  gapLabel?: TranslatedText;
  /** A quiet line under the pair. Per-field detail, not the version's change note. */
  note?: ReactNode;
}

export interface VersionSide {
  /** "v1", "v2", "Now", "Upgraded". Default: `words.sides`, by `mode`. */
  label?: TranslatedText;
  /** A shorter stamp for the per-line prefix, if the label is long. Defaults to `label`. */
  stamp?: string;
  /** When it was taken, who took it — "12 Aug, Priya". */
  // biome-ignore lint/plugin/copy-prop-type: a version's facts — the date it was taken and who took it
  note?: string;
}

export type VersionDiffMode = 'versions' | 'upgrade';

export interface VersionDiffProps {
  /** Overline above the pair. */
  caption?: TranslatedText;
  before?: VersionSide;
  after?: VersionSide;
  rows: DiffRow[];
  /** `M06-42`'s *"what changed and why"* — the version's own note, not a per-field one. */
  changeNote?: ReactNode;
  /** The change note's overline. Default: `words.whatChanged`. */
  changeNoteLabel?: TranslatedText;
  /**
   * Force unchanged rows visible (or hidden). Left undefined, the component renders the moved rows
   * and a real 44px control that **counts** the unchanged ones — they are never silently dropped.
   */
  showUnchanged?: boolean;
  /** What a removed field's absence is called on the later side. Default: `words.notInThisVersion`. */
  removedLabel?: TranslatedText;
  /** A quiet line under every added row — "New in this version". */
  addedLabel?: ReactNode;
  /**
   * `versions` (default) — `SCR-M06-16`'s v1-vs-v2. `upgrade` — `SCR-M06-18`'s
   * `upgrade-offered-diff`, which only changes the default side labels to "Now" / "Upgraded".
   * **The component renders no commit control in either mode:** the accept and the cancel belong to
   * the surface that owns the write.
   */
  mode?: VersionDiffMode;
  /** What a pair with nothing moved says. Default: `words.nothingChanged`. */
  emptyMessage?: ReactNode;
  /** The diff's own words — its states, its counts, its side names, its toggle. */
  words: VersionDiffWords;
}

/** The two sides' names, when the caller names neither. */
export interface VersionDiffSideWords {
  before: TranslatedText;
  after: TranslatedText;
}

/** The words a diff says itself, in the reader's language (`@heliogrid/i18n`'s `versionDiffWords`). */
export interface VersionDiffWords {
  /** Each row's state, said in its pill — never colour alone (`F7-12`). */
  states: Readonly<Record<DiffState, TranslatedText>>;
  /** One part of the counts line — *3 changed*, *1 added*. */
  counted(state: DiffState, count: number): TranslatedText;
  /** The pair's name when it has no caption — *v1 compared with v2*. */
  compared(before: string, after: string): TranslatedText;
  /** One side's note, said with its side — *v1: 12 Aug, Priya*. */
  sideNote(side: string, note: string): TranslatedText;
  /** The unchanged rows' toggle — *Show 6 unchanged fields*, or *Hide* once shown. */
  unchangedToggle(shown: boolean, count: number): TranslatedText;
  /** The sides' names by mode — *v1* → *v2*, or *Now* → *Upgraded*. */
  sides: Readonly<Record<VersionDiffMode, VersionDiffSideWords>>;
  /** The change note's overline — *What changed and why*. */
  whatChanged: TranslatedText;
  /** A removed field's absence on the later side — *Not in this version*. */
  notInThisVersion: TranslatedText;
  /** A pair with nothing moved. */
  nothingChanged: TranslatedText;
}

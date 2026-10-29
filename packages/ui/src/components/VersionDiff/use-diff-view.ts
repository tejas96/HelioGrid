import { useState } from 'react';
import type { DiffGroup } from './VersionDiff.resolve';
import { diffSummary, groupDiffRows, resolveDiffEntries } from './VersionDiff.resolve';
import type { DiffRow, VersionDiffWords } from './VersionDiff.types';

export interface DiffView {
  /** The counts line over every row, unchanged ones included. */
  // biome-ignore lint/plugin/copy-prop-type: the catalog's counted words, joined by `diffSummary` — already in the reader's language
  summary: string;
  /** The moved rows under their headings — and the unchanged ones too while they are open. */
  groups: DiffGroup[];
  /** Whether the unchanged rows are on show. */
  showUnchanged: boolean;
  unchangedCount: number;
  /** Nothing moved and the unchanged rows are folded away: the empty line stands in for the list. */
  nothingShown: boolean;
  /** The counted collapse is drawn only while the caller leaves `showUnchanged` to the component. */
  collapsible: boolean;
  toggleUnchanged: () => void;
}

/**
 * **What the list shows, decided once for both halves.** Unchanged is a STATE: counted and reachable
 * behind the collapse, never silently dropped — unless the caller forces it open or shut.
 */
export function useDiffView(
  rows: DiffRow[],
  forcedUnchanged: boolean | undefined,
  words: VersionDiffWords,
): DiffView {
  const [openUnchanged, setOpenUnchanged] = useState(Boolean(forcedUnchanged));
  const showUnchanged = forcedUnchanged === undefined ? openUnchanged : forcedUnchanged;
  const resolved = resolveDiffEntries(rows);
  const moved = resolved.filter((r) => r.state !== 'unchanged');
  const unchangedCount = resolved.length - moved.length;
  return {
    summary: diffSummary(
      resolved.map((r) => r.state),
      words,
    ),
    groups: groupDiffRows(showUnchanged ? resolved : moved),
    showUnchanged,
    unchangedCount,
    nothingShown: moved.length === 0 && !showUnchanged,
    collapsible: unchangedCount > 0 && forcedUnchanged === undefined,
    toggleUnchanged: () => setOpenUnchanged((o) => !o),
  };
}

/* VersionDiff (web) — ONE THING AT TWO TIMES: two immutable snapshots of the same record, field by
   field (M06-42 P0 / SCR-M06-16; M06-47 P0 / SCR-M06-18).

   It renders no commit control in either mode: "showing the differences before anything commits"
   means the accept and the cancel belong to the surface that owns the write.

   Unchanged is a STATE, so it is counted and reachable behind a real 44px control — never silently
   dropped.

   This file composes. Who the two versions are is `VersionDiffHeader`, one heading's rows are
   `VersionDiffGroup`, one field's four states are `VersionDiffRow`, and the naming, keying and
   grouping are `VersionDiff.resolve` — shared with the native half so both agree. */

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import {
  diffSummary,
  groupDiffRows,
  resolveDiffEntries,
  resolveDiffRow,
  resolveDiffSides,
} from './VersionDiff.resolve';
import type { VersionDiffProps } from './VersionDiff.types';
import { VersionDiffGroup } from './VersionDiffGroup';
import { VersionDiffHeader } from './VersionDiffHeader';

interface WebVersionDiffProps extends VersionDiffProps {
  className?: string;
  style?: CSSProperties;
}

export function VersionDiff({
  caption,
  before = {},
  after = {},
  rows = [],
  changeNote,
  changeNoteLabel = 'What changed and why',
  showUnchanged: showUnchangedProp,
  removedLabel = 'Not in this version',
  addedLabel,
  mode = 'versions',
  emptyMessage = 'Nothing changed between these two versions.',
  className,
  style,
}: WebVersionDiffProps) {
  const sides = resolveDiffSides(before, after, mode);
  const resolved = resolveDiffEntries(rows);
  const [openUnchanged, setOpenUnchanged] = useState(Boolean(showUnchangedProp));
  const show = showUnchangedProp === undefined ? openUnchanged : showUnchangedProp;
  const moved = resolved.filter((r) => r.state !== 'unchanged');
  const unchanged = resolved.filter((r) => r.state === 'unchanged');
  const groups = groupDiffRows(show ? resolved : moved);

  return (
    <section
      aria-label={caption || `${sides.beforeLabel} compared with ${sides.afterLabel}`}
      className={classNames('hg-version-diff', className)}
      style={style}
    >
      <VersionDiffHeader
        caption={caption}
        sides={sides}
        summary={diffSummary(resolved.map((r) => r.state))}
      />

      {/* The change note is M06-42's own requirement — a version without one is not a version. */}
      {changeNote ? (
        <div className="hg-version-diff-change-note">
          <span className="hg-version-diff-caption">{changeNoteLabel}</span>
          <p className="hg-version-diff-change-note-body">{changeNote}</p>
        </div>
      ) : null}

      {moved.length === 0 && !show ? (
        <p className="hg-version-diff-empty">{emptyMessage}</p>
      ) : (
        groups.map((g) => (
          <VersionDiffGroup
            key={g.name || g.rows[0]?.id}
            group={g}
            beforeStamp={sides.beforeStamp}
            afterStamp={sides.afterStamp}
            removedLabel={removedLabel}
            addedLabel={addedLabel}
          />
        ))
      )}

      {/* Unchanged is a state, so it is counted and reachable — never silently dropped. */}
      {unchanged.length > 0 && showUnchangedProp === undefined ? (
        <div className="hg-version-diff-toggle-row">
          {/* A collapse that does not say whether it is open is not reachable, so the expanded
              state goes through the primitive — `aria-expanded` here, `accessibilityState.expanded`
              on the native half, one declaration — and the 44px floor comes with it. */}
          <Pressable
            className="hg-version-diff-toggle"
            accessibilityState={{ expanded: show }}
            onPress={() => setOpenUnchanged((o) => !o)}
          >
            {`${show ? 'Hide' : 'Show'} ${unchanged.length} unchanged field${
              unchanged.length === 1 ? '' : 's'
            }`}
          </Pressable>
        </div>
      ) : null}
    </section>
  );
}

VersionDiff.resolveRow = resolveDiffRow;

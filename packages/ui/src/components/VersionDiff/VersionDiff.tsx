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
import { classNames } from '../../primitives/class-names';
import { Pressable } from '../../primitives/Pressable';
import { useDiffView } from './use-diff-view';
import { resolveDiffRow, resolveDiffSides } from './VersionDiff.resolve';
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
  words,
  changeNoteLabel = words.whatChanged,
  showUnchanged: showUnchangedProp,
  removedLabel = words.notInThisVersion,
  addedLabel,
  mode = 'versions',
  emptyMessage = words.nothingChanged,
  className,
  style,
}: WebVersionDiffProps) {
  const sides = resolveDiffSides(before, after, mode, words);
  const view = useDiffView(rows, showUnchangedProp, words);

  return (
    <section
      aria-label={caption || words.compared(sides.beforeLabel, sides.afterLabel)}
      className={classNames('hg-version-diff', className)}
      style={style}
    >
      <VersionDiffHeader caption={caption} sides={sides} summary={view.summary} />

      {/* The change note is M06-42's own requirement — a version without one is not a version. */}
      {changeNote ? (
        <div className="hg-version-diff-change-note">
          <span className="hg-version-diff-caption">{changeNoteLabel}</span>
          <p className="hg-version-diff-change-note-body">{changeNote}</p>
        </div>
      ) : null}

      {view.nothingShown ? (
        <p className="hg-version-diff-empty">{emptyMessage}</p>
      ) : (
        view.groups.map((g) => (
          <VersionDiffGroup
            key={g.name || g.rows[0]?.id}
            group={g}
            beforeStamp={sides.beforeStamp}
            afterStamp={sides.afterStamp}
            removedLabel={removedLabel}
            addedLabel={addedLabel}
            words={words}
          />
        ))
      )}

      {/* Unchanged is a state, so it is counted and reachable — never silently dropped. */}
      {view.collapsible ? (
        <div className="hg-version-diff-toggle-row">
          {/* A collapse that does not say whether it is open is not reachable, so the expanded
              state goes through the primitive — `aria-expanded` here, `accessibilityState.expanded`
              on the native half, one declaration — and the 44px floor comes with it. */}
          <Pressable
            className="hg-version-diff-toggle"
            accessibilityState={{ expanded: view.showUnchanged }}
            onPress={view.toggleUnchanged}
          >
            {words.unchangedToggle(view.showUnchanged, view.unchangedCount)}
          </Pressable>
        </div>
      ) : null}
    </section>
  );
}

VersionDiff.resolveRow = resolveDiffRow;

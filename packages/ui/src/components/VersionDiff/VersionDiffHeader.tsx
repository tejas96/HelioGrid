/* Which two versions these are (web) — the caption, the `before → after` pair, each side's own
   note, and the counts line. Identity only: it renders no row and no control. */

import type { DiffSides } from './VersionDiff.resolve';

export function VersionDiffHeader({
  caption,
  sides,
  summary,
}: {
  caption?: string;
  sides: DiffSides;
  summary: string;
}) {
  return (
    <div className="hg-version-diff-header">
      {caption ? <p className="hg-version-diff-caption">{caption}</p> : null}
      <h3 className="hg-version-diff-title">
        {sides.beforeLabel} <span className="hg-version-diff-to">→</span> {sides.afterLabel}
      </h3>
      {sides.notes ? <p className="hg-version-diff-sides">{sides.notes}</p> : null}
      {summary ? <p className="hg-version-diff-summary">{summary}</p> : null}
    </div>
  );
}

/* One group of fields (web) — its heading, when it has one, and the rows under it. The grouping
   itself is `groupDiffRows`; a row's four states are `VersionDiffRow`. */

import type { DiffGroup, DiffRowFrame } from './VersionDiff.resolve';
import { VersionDiffRow } from './VersionDiffRow';

export function VersionDiffGroup({ group, ...frame }: DiffRowFrame & { group: DiffGroup }) {
  return (
    <div className="hg-version-diff-group">
      {group.name ? <p className="hg-version-diff-group-name">{group.name}</p> : null}
      <ul className="hg-version-diff-rows">
        {group.rows.map((entry) => (
          <VersionDiffRow key={entry.id} row={entry.row} {...frame} />
        ))}
      </ul>
    </div>
  );
}

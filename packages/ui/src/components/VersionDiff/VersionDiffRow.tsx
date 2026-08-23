/* VersionDiff's row (web) — one block per field, the before line above the after line, each line
   stamped with its own version. PHONE WIDTH IS THE DESIGN, NOT A FALLBACK: there are no columns at
   any width, because two columns are not available at 375px on a full eleven-step field set.

   Each state is a WORD in its own pill (F7-12: never colour alone). */

import type { ReactNode } from 'react';
import { NamedGap } from '../NamedGap';
import type { ProvenanceTierSpec } from '../Provenance';
import { ProvenanceTier } from '../Provenance';
import { isTierOnly, resolveDiffRow } from './VersionDiff.resolve';
import type { DiffRow, DiffState } from './VersionDiff.types';

const STATE_WORD: Record<DiffState, string> = {
  changed: 'Changed',
  unchanged: 'Unchanged',
  added: 'Added',
  removed: 'Removed',
};

function StatePill({ state }: { state: DiffState }) {
  return (
    <span className="hg-version-diff-pill" data-state={state}>
      <span aria-hidden="true" className="hg-version-diff-pill-dot" />
      {STATE_WORD[state]}
    </span>
  );
}

function Figure({ value, unit, strong }: { value: ReactNode; unit?: string; strong?: boolean }) {
  return (
    <span className="hg-version-diff-figure" data-strong={strong ? 'true' : undefined}>
      {value}
      {unit ? <span className="hg-version-diff-unit"> {unit}</span> : null}
    </span>
  );
}

/** One side of a pair: the version's own short label, its figure, and the tier THAT version pinned. */
function Side({
  stamp,
  value,
  unit,
  tier,
  strong,
  gap,
}: {
  stamp: string;
  value?: ReactNode;
  unit?: string;
  tier?: ProvenanceTierSpec;
  strong?: boolean;
  gap?: string;
}) {
  return (
    <div className="hg-version-diff-side">
      <span className="hg-version-diff-stamp">{stamp}</span>
      {gap ? (
        <NamedGap gap={gap} scale="cell" />
      ) : (
        <Figure value={value} unit={unit} strong={strong} />
      )}
      {tier ? <ProvenanceTier tier={tier} size={12} /> : null}
    </div>
  );
}

export function VersionDiffRow({
  row,
  beforeStamp,
  afterStamp,
  removedLabel,
  addedLabel,
}: {
  row: DiffRow;
  beforeStamp: string;
  afterStamp: string;
  removedLabel: string;
  addedLabel?: ReactNode;
}) {
  const st = resolveDiffRow(row);
  const tierOnly = isTierOnly(row, st);
  return (
    <li className="hg-version-diff-row">
      <div className="hg-version-diff-head">
        <span className="hg-version-diff-label">{row.label}</span>
        <StatePill state={st} />
      </div>

      {tierOnly ? (
        /* The value did not move; the TIER did — and on SCR-M06-18 that tier change is the content. */
        <div className="hg-version-diff-tier-only">
          <Figure value={row.after} unit={row.unit} strong />
          <div className="hg-version-diff-tier-pair">
            <ProvenanceTier tier={row.beforeTier} size={12} />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="hg-version-diff-arrow"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <ProvenanceTier tier={row.afterTier} size={12} />
          </div>
        </div>
      ) : null}

      {!tierOnly && st === 'added' ? (
        <Side stamp={afterStamp} value={row.after} unit={row.unit} tier={row.afterTier} strong />
      ) : null}

      {!tierOnly && st === 'removed' ? (
        <>
          <Side stamp={beforeStamp} value={row.before} unit={row.unit} tier={row.beforeTier} />
          <Side stamp={afterStamp} gap={row.gapLabel || removedLabel} />
        </>
      ) : null}

      {!tierOnly && st === 'unchanged' ? (
        <Side
          stamp={`${beforeStamp} · ${afterStamp}`}
          value={row.after ?? row.before}
          unit={row.unit}
          tier={row.afterTier || row.beforeTier}
        />
      ) : null}

      {!tierOnly && st === 'changed' ? (
        <>
          <Side stamp={beforeStamp} value={row.before} unit={row.unit} tier={row.beforeTier} />
          <div className="hg-version-diff-moved">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="hg-version-diff-arrow hg-version-diff-arrow-down"
            >
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
            <div className="hg-version-diff-moved-side">
              <Side
                stamp={afterStamp}
                value={row.after}
                unit={row.unit}
                tier={row.afterTier}
                strong
              />
            </div>
          </div>
        </>
      ) : null}

      {row.note ? <p className="hg-version-diff-note">{row.note}</p> : null}
      {st === 'added' && addedLabel ? <p className="hg-version-diff-note">{addedLabel}</p> : null}
    </li>
  );
}

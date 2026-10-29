/* VersionDiff's row (web) — one block per field, the before line above the after line, each line
   stamped with its own version. PHONE WIDTH IS THE DESIGN, NOT A FALLBACK: there are no columns at
   any width, because two columns are not available at 375px on a full eleven-step field set.

   Each state is a WORD in its own pill (F7-12: never colour alone). */

import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { NamedGap } from '../NamedGap';
import { ProvenanceTier } from '../Provenance';
import type { DiffRowFrame, DiffSideSpec } from './VersionDiff.resolve';
import { diffRowBodyOf, resolveDiffRow } from './VersionDiff.resolve';
import type { DiffRow, DiffState } from './VersionDiff.types';

function StatePill({ state, word }: { state: DiffState; word: TranslatedText }) {
  return (
    <span className="hg-version-diff-pill" data-state={state}>
      <span aria-hidden="true" className="hg-version-diff-pill-dot" />
      {word}
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
function Side({ stamp, value, unit, tier, strong, gap }: DiffSideSpec) {
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
  words,
}: DiffRowFrame & { row: DiffRow }) {
  const st = resolveDiffRow(row);
  const body = diffRowBodyOf(row, st, { beforeStamp, afterStamp, removedLabel });
  return (
    <li className="hg-version-diff-row">
      <div className="hg-version-diff-head">
        <span className="hg-version-diff-label">{row.label}</span>
        <StatePill state={st} word={words.states[st]} />
      </div>

      {body.kind === 'tier-only' ? (
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
              <ShellGlyphMarks name="arrow-right-full" />
            </svg>
            <ProvenanceTier tier={row.afterTier} size={12} />
          </div>
        </div>
      ) : null}

      {body.kind === 'sides' ? body.sides.map((side) => <Side key={side.side} {...side} />) : null}

      {body.kind === 'moved' ? (
        <>
          <Side {...body.from} />
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
              <ShellGlyphMarks name="arrow-down" />
            </svg>
            <div className="hg-version-diff-moved-side">
              <Side {...body.to} />
            </div>
          </div>
        </>
      ) : null}

      {row.note ? <p className="hg-version-diff-note">{row.note}</p> : null}
      {st === 'added' && addedLabel ? <p className="hg-version-diff-note">{addedLabel}</p> : null}
    </li>
  );
}
